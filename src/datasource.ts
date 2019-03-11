/// <reference path="./grafana-sdk.d.ts" />

import {Datasource, BackendSrv, TemplateSrv, InstanceSettings, QueryOptions, QueryOptionsTarget,
        BackendSrvRequest, BackendSrvResponse, TimeSeriesQueryResult, QueryResults,
        TestDatasourceResult, MetricFindQueryResult} from "app/plugins/sdk";
import TableModel from 'app/core/table_model';
import * as Q from 'q';

/**
 * BaaS Datasource
 */
export class BaasDatasource implements Datasource {
    name: string;
    baseUri: string;
    tenantId: string;
    headers: any;
    withCredentials: boolean;

    cacheBuckets: MetricFindQueryResult[];
    deferredBuckets: Q.Deferred<MetricFindQueryResult[]>[];

    private log(msg: string) {
        //console.log(msg);
    }

    /**
     * Constructor
     * @param instanceSettings, configured by partials/config.html.
     * @param backendSrv BackendSrv of Grafana.
     * @param $q $q service of AngularJS 1.x.
     * @param templateSrv TemplateSrv of Grafana.
     */
    /** @ngInject */
    constructor(instanceSettings: InstanceSettings, private backendSrv: BackendSrv, private $q: any, private templateSrv: TemplateSrv) {
        this.log("baas datasource: constructor");
        this.name = instanceSettings.name;

        this.baseUri = instanceSettings.url;

        this.tenantId = instanceSettings.jsonData.tenantId;
        this.headers = {
            "Content-Type": "application/json",
            "X-Application-Id": instanceSettings.jsonData.appId,
            "X-Application-Key": instanceSettings.jsonData.appKey
        };
        if (typeof instanceSettings.basicAuth === 'string' && instanceSettings.basicAuth.length > 0) {
            this.headers['Authorization'] = instanceSettings.basicAuth;
        }

        this.withCredentials = instanceSettings.withCredentials;

        this.cacheBuckets = null;
        this.deferredBuckets = null;
    }

    /**
     * Query metrics from data source.
     * @param {module:app/plugins/sdk.QueryOptions} options
     * @return {Promise<QueryResults>} results
     */
    query(options: QueryOptions): Promise<QueryResults> {
        this.log("query: " + JSON.stringify(options));
        const targets = this.buildQueryParameters(options)
            .filter(t => !t.hide && t.bucket)
            .filter(t => {
                if (t.createDataWith === 'series_name_value_key') {
                    return t.seriesNameKey && t.seriesValueKey;
                } else {
                    t.dataField = t.dataField.filter(f => f.fieldName);
                    return t.dataField.length != 0;
                }
            });

        if (targets.length <= 0) {
            return Promise.resolve({data: []}); // no targets
        }

        const reqTargets = this.filterSameRequest(targets);

        const promises = this.doRequestTargets(reqTargets, options);
        return Promise.all(promises)
            .then(responses => {
                const results = [];

                for (let target of targets) {
                    const data = responses[target.reqIndex].data;

                    if (target.format === 'table') {
                        if (target.createDataWith === 'series_name_value_key') {
                            results.push(...this.convertResponseToTableWithSeries(target, data));
                        } else {
                            results.push(...this.convertResponseToTableWithDataField(target, data));
                        }
                    } else {
                        target.format = 'time_series';
                        if (target.createDataWith === 'series_name_value_key') {
                            results.push(...this.convertResponseWithSeries(target, data, options));
                        } else {
                            results.push(...this.convertResponseWithDataField(target, data, options));
                        }
                    }
                }

                return {data: results};
            });
    }

    private buildQueryParameters(options: QueryOptions): QueryOptionsTarget[] {
        const targets = [];

        for (let target of options.targets) {
            let dataField = target.dataField;
            if (!dataField) {
                // 旧バージョンのTarget型を変換する
                if (target.fieldName) {
                    dataField = [{fieldName: target.fieldName, alias: target.alias}];
                } else {
                    dataField = [];
                }
            }

            dataField = dataField.map(f => {
                return {fieldName: this.templateSrv.replace(f.fieldName), alias: f.alias};
            });

            targets.push({
                bucket: this.templateSrv.replace(target.bucket),
                format: target.format || "time_series",
                dataField: dataField,
                tsField: this.templateSrv.replace(target.tsField) || "updatedAt",
                aggr: target.aggr,
                hide: target.hide,
                createDataWith: target.createDataWith || "data_field",
                seriesNameKey: this.templateSrv.replace(target.seriesNameKey),
                seriesValueKey: this.templateSrv.replace(target.seriesValueKey)
            });
        }
        return targets;
    }

    private filterSameRequest(targets: QueryOptionsTarget[]): QueryOptionsTarget[] {
        const reqTargets = [];

        for (let target of targets) {
            target.reqIndex = null;

            let targetAggrObj = {};
            if (target.aggr) {
                targetAggrObj = JSON.parse(target.aggr);
            }

            for (let i = 0; i < reqTargets.length; i++) {
                const reqTarget = reqTargets[i];
                let reqTargetAggrObj = {};
                if (reqTarget.aggr) {
                    reqTargetAggrObj = JSON.parse(reqTarget.aggr);
                }

                if (target.bucket == reqTarget.bucket && target.tsField == reqTarget.tsField &&
                    JSON.stringify(targetAggrObj) === JSON.stringify(reqTargetAggrObj)) {
                    target.reqIndex = i;
                    break;
                }
            }

            if (target.reqIndex == null) {
                target.reqIndex = reqTargets.length;
                reqTargets.push(target);
            }
        }
        return reqTargets;
    }

    private doRequest(req: BackendSrvRequest): Promise<BackendSrvResponse> {
        req.headers = this.headers;
        req.withCredentials = this.withCredentials;
        this.log("doRequest: " + JSON.stringify(req));
        return this.backendSrv.datasourceRequest(req);
    }

    private doRequestTargets(targets: QueryOptionsTarget[], options: QueryOptions): Promise<BackendSrvResponse>[] {
        const promises = [];

        for (let target of targets) {
            // get parameters from head of targets
            const bucketName = target.bucket;
            const aggr = target.aggr;
            const mainTsField = target.tsField;

            // 検索条件
            const gte = {};
            gte[mainTsField] = {"$gte": options.range.from};
            const lte = {};
            lte[mainTsField] = {"$lte": options.range.to};

            const whereAnd = [gte, lte];

            let req: BackendSrvRequest;
            if (!aggr) {
                // long query API
                req = {
                    url: this.baseUri + "/1/" + this.tenantId + "/objects/" + bucketName + "/_query",
                    data: {
                        where: {"$and": whereAnd},
                        order: mainTsField,
                        limit: options.maxDataPoints
                    },
                    method: "POST"
                };
            } else {
                // aggregation API
                const pipeline: [any] = JSON.parse(aggr);
                pipeline.unshift({"$match": {"$and": whereAnd }});
                pipeline.push({"$limit": options.maxDataPoints})
                req = {
                    url: this.baseUri + "/1/" + this.tenantId + "/objects/" + bucketName + "/_aggregate",
                    data: {pipeline: pipeline},
                    method: "POST"
                };
            }

            promises.push(this.doRequest(req));
        }

        return promises;
    }

    /**
     * Convert http response of baas server to QueryResults with DataField.
     * @param target
     * @param data response data
     * @return {module:app/plugins/sdk.TimeSeriesQueryResult[]}
     */
    convertResponseWithDataField(target: QueryOptionsTarget, data: any, options: QueryOptions): TimeSeriesQueryResult[] {
        let results = [];
        for (let field of target.dataField) {
            const alias = field.alias || target.bucket + '.' + field.fieldName;

            // convert to datapoint
            const datapoints = [];
            for (let e of data.results) {
                const datapoint = this.convertToDataPoint(e, field.fieldName, target.tsField, options);
                if(datapoint){
                    datapoints.push(datapoint);
                }
            }

            results.push({
                target: alias,
                datapoints: datapoints
            });
        }
        return results;
    }

    /**
     * Convert http response of baas server to QueryResults with Series Name/Value.
     * @param target
     * @param data response data
     * @return {module:app/plugins/sdk.TimeSeriesQueryResult[]}
     */
    convertResponseWithSeries(target: QueryOptionsTarget, data: any, options: QueryOptions): TimeSeriesQueryResult[] {
        let results = [];
        for (let e of data.results) {
            const name = this.extractValue(e, target.seriesNameKey);
            if (name == null) {
                continue;
            }

            // convert to datapoint
            const datapoint = this.convertToDataPoint(e, target.seriesValueKey, target.tsField, options);
            if (datapoint) {
                const findIndex = results.findIndex(result => result.target === name);
                if (findIndex < 0) {
                    results.push({
                        target: name,
                        datapoints: [datapoint]
                    });
                } else {
                    results[findIndex].datapoints.push(datapoint);
                }
            }
        }
        return results;
    }

    /**
     * Convert http response of baas server to DataPoint.
     * @param {*} element response object
     * @param {string} valueKey
     * @param {string} tsField
     * @param {QueryOptions} options
     * @returns {any[]} array of [value, epoch]
     */
    convertToDataPoint(element: any, valueKey: string, tsField: string, options: QueryOptions): any[] {
        const value = this.extractValue(element, valueKey);
        const ts = this.extractTimestamp(element, tsField);

        if (value == null) {
            return null;
        }

        let datapoint = [];
        if (ts != null) {
            datapoint = [value, ts.getTime()];
        } else {
            datapoint = [value, Date.parse(options.range.to)];
        }
        return datapoint;
    }

    /**
     *Convert http response of baas server to TableModel with DataField.
     * @param {QueryOptionsTarget} target
     * @param {*} data response data
     * @param {TableModel} tableModel for test
     * @returns {TableModel[]}
     */
    convertResponseToTableWithDataField(target: QueryOptionsTarget, data: any, table?: TableModel): TableModel[] {
        const labels = [];
        table = table || new TableModel();

        //Columns
        for (let e of data.results) {
            const ts = this.extractValue(e, target.tsField);
            if (ts != null) {
                table.addColumn({ text: 'Time' });
                labels.push(target.tsField);
                break;
            }
        }

        for (let field of target.dataField) {
            const fieldName = field.fieldName;
            if (fieldName != null) {
                const alias = field.alias || target.bucket + '.' + fieldName;
                const findIndex = table.columns.findIndex(column => column.text === alias);
                if (findIndex < 0) {
                    table.addColumn({ text: alias });
                    labels.push(fieldName);
                }
            }
        }

        // Rows
        for (let e of data.results) {
            const row = [];
            let hasData = false;
            for (let i = 0; i < labels.length; i++) {
                if (i === 0 && labels[i] === target.tsField && table.columns[i].text === 'Time') {
                    const ts = this.extractTimestamp(e, target.tsField);
                    if (ts != null) {
                        row.push(ts.getTime());
                    } else {
                        row.push(null);
                    }
                } else {
                    const value = this.extractValue(e, labels[i]);
                    if (value != null) {
                        row.push(value);
                        hasData = true;
                    } else {
                        row.push(null);
                    }
                }
            }
            if (hasData) {
                table.addRow(row);
            }
        }
        return [table];
    }

    /**
     *Convert http response of baas server to TableModel with Series Name/Value.
     * @param {QueryOptionsTarget} target
     * @param {*} data response data
     * @param {TableModel} tableModel for test
     * @returns {TableModel[]}
     */
    convertResponseToTableWithSeries(target: QueryOptionsTarget, data: any, table?: TableModel): TableModel[] {
        table = table || new TableModel();

        //Columns
        for (let e of data.results) {
            const ts = this.extractValue(e, target.tsField);
            if (ts != null) {
                table.addColumn({ text: 'Time' });
                break;
            }
        }
        table.addColumn({ text: target.seriesNameKey });
        table.addColumn({ text: target.seriesValueKey });

        // Rows
        for (let e of data.results) {
            const row = [];
            const name = this.extractValue(e, target.seriesNameKey);
            const value = this.extractValue(e, target.seriesValueKey);

            if (name == null || value == null) {
                continue;
            }

            if (table.columns[0].text === 'Time' && table.columns.length >= 3) {
                const ts = this.extractTimestamp(e, target.tsField);
                if (ts != null) {
                    row.push(ts.getTime());
                } else {
                    row.push(null);
                }
            }
            row.push(name);
            row.push(value);
            const findIndex = table.rows.findIndex(findRow => findRow[table.columns.length - 2] === name);

            if (findIndex < 0) {
                table.addRow(row);
            } else {
                table.rows[findIndex] = row;
            }
        }
        return [table];
    }

    /**
     * Extract value of specified field from JSON.
     * @param obj JSON Object
     * @param {string} key field name, separated with period.
     * @returns {any} value
     */
    extractValue(obj: any, key: string): any {
        const keys = key.split('.');
        for (let key of keys) {
            if (obj != null && typeof obj === 'object' && key in obj) {
                obj = obj[key];
            } else {
                return null;
            }
        }
        return obj;
    }

    /**
     * Extract timestamp value from JSON.
     * @param obj JSON Object
     * @param {string} tsField time stamp field name, null for auto inference.
     * @returns {Date} timestamp
     */
    extractTimestamp(obj: any, tsField: string): Date {
        if (tsField != null) {
            const ts = this.extractValue(obj, tsField);
            if (ts != null) {
                return new Date(ts);
            } else {
                return null;
            }
        }

        return null;
    }

    /**
     * Test datasource connection.
     * @return {Promise<TestDatasourceResult>} result
     */
    testDatasource(): Promise<TestDatasourceResult> {
        this.log("testDatasource");
        return this.doRequest({
            url: this.baseUri + "/1/" + this.tenantId + "/buckets/object",
            method: "GET"
        }).then((response) => {
            this.log("status: " + response.status);
            let result: TestDatasourceResult = {status: "success", message: "Server connected"};
            return result;
        }, (error) => {
            let message: string;

            if (error.data && error.data.error) {
                message = error.data.error
            } else if (error.statusText) {
                message = `HTTP Error (${error.status}) ${error.statusText}`;
            } else {
                message = "Connection failed"
            }

            let result: TestDatasourceResult = {status: "error", message: message};
            return result;
        });
    }

    /**
     * Annotation query. Not supported.
     * @param options
     * @return {Promise<any>}
     */
    annotationQuery(options: any): Promise<any> {
        // nop
        return null;
    }

    /**
     * Metric find query.
     * @param {string} query condition
     * @return {Promise<MetricFindQueryResult[]>} results
     */
    metricFindQuery(query: string): Promise<MetricFindQueryResult[]> {
        this.log("metricFindQuery: " + query);
        if (query == 'buckets') {   // Get bucket list
            if (this.cacheBuckets != null) {
                return Promise.resolve(this.cacheBuckets);
            }

            // 実行中のリクエストがある場合はレスポンスを待つ
            if (this.deferredBuckets != null) {
                this.log("metricFindQuery deferred");
                let deferred = this.$q.defer();
                this.deferredBuckets.push(deferred);
                return deferred.promise;
            }

            this.deferredBuckets = [];

            return this.doRequest({
                url: this.baseUri + "/1/" + this.tenantId + "/buckets/object",
                method: "GET"
            }).then((response) => {
                const buckets = [];
                for (let result of response.data.results) {
                    const bucket = result.name;
                    buckets.push({text: bucket, value: bucket});
                }
                this.cacheBuckets = buckets;

                // リクエスト実行中に受けた要求を全て返す
                for (let deferred of this.deferredBuckets) {
                    deferred.resolve(buckets);
                }

                this.deferredBuckets = null;
                return buckets;
            }, (error) => {
                this.log("metricFindQuery error");
                // エラーの場合はバケットリスト空とする
                const buckets = [];
                for (let deferred of this.deferredBuckets) {
                    deferred.resolve(buckets);
                }

                this.deferredBuckets = null;
                return buckets;
            });
        }

        return Promise.resolve([]);
    }

    /**
     * Get latest object.
     * @param {string} bucket name
     * @return {Promise<any>} result
     */
    getLatestObject(bucket: string): Promise<any> {
        this.log("getLatestObject: " + bucket);
        return this.doRequest({
            url: this.baseUri + "/1/" + this.tenantId + "/objects/" + bucket + "/_query",
            data: {
                order: "-updatedAt",
                limit: 1
            },
            method: "POST"
        }).then(response => {
            if (response.data.results.length == 1) {
                this.log("latest object: " + JSON.stringify(response.data.results[0]));
                return response.data.results[0];
            } else {
                return {};
            }
        }).catch(e => {
            return {};
        });
    }
}

