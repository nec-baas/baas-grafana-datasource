/// <reference path="./grafana-sdk.d.ts" />

import {Datasource, BackendSrv, TemplateSrv, InstanceSettings, QueryOptions, QueryOptionsTarget,
        BackendSrvRequest, BackendSrvResponse, TimeSerieQueryResult, QueryResults,
        TestDatasourceResult, MetricFindQueryResult} from "app/plugins/sdk";

/**
 * BaaS Datasource
 */
export class BaasDatasource implements Datasource {
    name: string;
    baseUri: string;
    tenantId: string;
    headers: any;
    withCredentials: boolean;

    cacheBuckets: string[];
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
     * @return {Q.Promise<QueryResults>} results
     */
    query(options: QueryOptions): Q.Promise<QueryResults> {
        this.log("query: " + JSON.stringify(options));
        const targets = this.buildQueryParameters(options)
            .filter(t => !t.hide)
            .filter(t => t.bucket && t.fieldName);

        if (targets.length <= 0) {
            return this.$q.when({data: []}); // no targets
        }

        const reqTargets = this.filterSameRequest(targets);

        const promises = this.doRequestTargets(reqTargets, options);
        return this.$q.all(promises)
            .then(responses => {
                const results = [];

                for (let target of targets) {
                    const data = responses[target.reqIndex].data;

                    results.push(this.convertResponse(target, data));
                }

                return {data: results};
            });
    }

    private buildQueryParameters(options: QueryOptions): QueryOptionsTarget[] {
        const targets = [];

        for (let target of options.targets) {
            targets.push({
                bucket: this.templateSrv.replace(target.bucket),
                fieldName: this.templateSrv.replace(target.fieldName),
                tsField: this.templateSrv.replace(target.tsField) || "updatedAt",
                aggr: target.aggr,
                alias: target.alias,
                hide: target.hide
            });
        }
        return targets;
    }

    private filterSameRequest(targets: QueryOptionsTarget[]): QueryOptionsTarget[] {
        const reqTargets = [];

        for (let target of targets) {
            target.reqIndex = null;

            for (let i = 0; i < reqTargets.length; i++) {
                const reqTarget = reqTargets[i];
                if (target.bucket == reqTarget.bucket && target.tsField == reqTarget.tsField && target.aggr == reqTarget.aggr) {
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

    private doRequest(req: BackendSrvRequest): Q.Promise<BackendSrvResponse> {
        req.headers = this.headers;
        req.withCredentials = this.withCredentials;
        this.log("doRequest: " + JSON.stringify(req));
        return this.backendSrv.datasourceRequest(req);
    }

    private doRequestTargets(targets: QueryOptionsTarget[], options: QueryOptions): Q.Promise<BackendSrvResponse>[] {
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
     * Convert http response of baas server to QueryResults.
     * @param target
     * @param data response data
     * @return {module:app/plugins/sdk.TimeSerieQueryResult}
     */
    convertResponse(target: QueryOptionsTarget, data: any): TimeSerieQueryResult {
        const key = target.fieldName;
        const tsField = target.tsField;
        const alias = target.alias || target.bucket + '.' + target.fieldName;

        // convert to datapoint
        const datapoints = [];
        for (let e of data.results) {
            const value = this.extractValue(e, key);
            const ts = this.extractTimestamp(e, tsField);

            if (value == null || ts == null) {
                continue;
            }

            datapoints.push([value, ts.getTime()]);
        }

        return {
            target: alias,
            datapoints: datapoints
        };
    }

    /**
     * Extract value of specified filed from JSON.
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
     * @return {Q.Promise<TestDatasourceResult>} result
     */
    testDatasource(): Q.Promise<TestDatasourceResult> {
        this.log("testDatasource");
        return this.doRequest({
            url: this.baseUri + "/1/" + this.tenantId + "/buckets/object",
            method: "GET"
        }).then((response) => {
            this.log("status: " + response.status);
            return {status: "success", message: "Server connected"};
        }, (error) => {
            let message: string;

            if (error.data && error.data.error) {
                message = error.data.error
            } else if (error.statusText) {
                message = `HTTP Error (${error.status}) ${error.statusText}`;
            } else {
                message = "Connection failed"
            }

            return {status: "error", message: message};
        });
    }

    /**
     * Annotation query. Not supported.
     * @param options
     * @return {Q.Promise<any>}
     */
    annotationQuery(options: any): Q.Promise<any> {
        // nop
        return null;
    }

    /**
     * Metric find query.
     * @param {string} query condition
     * @return {Q.Promise<MetricFindQueryResult[]>} results
     */
    metricFindQuery(query: string): Q.Promise<MetricFindQueryResult[]> {
        this.log("metricFindQuery: " + query);
        if (query == 'buckets') {   // Get bucket list
            if (this.cacheBuckets != null) {
                return this.$q.when(this.cacheBuckets);
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

        return this.$q.when([]);
    }

    /**
     * Get latest object.
     * @param {string} bucket name
     * @return {Q.Promise<object>} result
     */
    getLatestObject(bucket: string): Q.Promise<object> {
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

