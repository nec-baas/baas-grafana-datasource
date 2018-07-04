/// <reference path="./grafana-sdk.d.ts" />

import {Datasource, QueryOptions, QueryResult, QueryResults} from "app/plugins/sdk";
import * as Q from 'q';

/**
 * Target spec
 */
export class TargetSpec {
    /** target string */
    target: string;
    /** bucket name */
    bucketName: string;
    /** field name */
    fieldName: string;
    /** timestamp field name */
    tsField: string;

    constructor(target: string) {
        this.target = target;

        // Get timestamp field spec.
        let t = target.split("@", 2);
        if (t.length == 2) {
            target = t[0];
            this.tsField = t[1];
        }

        // Split bucket name and field spec.
        t = target.split(".")
        if (t.length < 2) {
            throw new Error("Bad target.");
        }
        this.bucketName = t[0];
        t.shift();
        this.fieldName = t.join(".");
    }
}

/**
 * BaaS Datasource
 */
export class BaasDatasource implements Datasource {
    name: string;
    baseUri: string;
    tenantId: string;
    headers: any;

    backendSrv: any;
    templateSrv: any;
    q: any;

    /** Candidates of time stamp field name */
    static TimeStampFields = ["updatedAt", "createdAt"];

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
    constructor(instanceSettings: any, backendSrv: any, $q: any, templateSrv: any) {
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

        this.backendSrv = backendSrv;
        this.templateSrv = templateSrv;
        this.q = $q;
    }

    /**
     * Query metrics from data source.
     * @param {module:app/plugins/sdk.QueryOptions} options
     * @return {Q.Promise<QueryResults>} results
     */
    query(options: QueryOptions): Q.Promise<QueryResults> {
        this.log("query: " + JSON.stringify(options));
        const query = this.buildQueryParameters(options);
        query.targets = query.targets
            .filter(t => !t.hide)
            .filter(t => t.target != null);

        if (query.targets.length <= 0) {
            return this.resolved({data: []}) // no targets
        }

        let targets: TargetSpec[];
        try {
            targets = query.targets
                .map(t => new TargetSpec(t.target));
        } catch (e) {
            return this.rejected(e);
        }
        const mainTsField = targets[0].tsField || "updatedAt";
        const bucketName = targets[0].bucketName;

        // URI for long query
        const uri = this.baseUri + "/1/" + this.tenantId + "/objects/" + bucketName + "/_query";

        // 検索条件
        const gte = {};
        gte[mainTsField] = {"$gte": options.range.from};
        const lte = {};
        lte[mainTsField] = {"$lte": options.range.to}

        const where = {
            "$and": [ gte, lte ]
        };

        const req = {
            url: uri,
            data: {
                where: where,
                order: "updatedAt",
                limit: options.maxDataPoints
            },
            method: "POST"
        };
        return this.doRequest(req)
            .then(response => {
                const status = response.status;
                const data = response.data;

                return this.convertResponse(targets, data);
            });
    }

    /**
     * Convert http response of baas server to QueryResults.
     * @param {TargetSpec[]} targets
     * @param data response data
     * @return {module:app/plugins/sdk.QueryResults}
     */
    convertResponse(targets: TargetSpec[], data: any): QueryResults {
        const results: QueryResult[] = [];

        for (let target of targets) {
            const key = target.fieldName;
            const tsField = target.tsField;

            // convert to datapoint
            const datapoints = [];
            for (let e of data.results) {
                const value = this.extractValue(e, key);
                const ts = this.extractTimestamp(e, tsField);

                datapoints.push([value, ts.getTime()]);
            }
            results.push({
                target: target.target,
                datapoints: datapoints
            });
        }

        return {"data": results};
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
            obj = obj[key];
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
            return new Date(this.extractValue(obj, tsField));
        }

        for (let key of BaasDatasource.TimeStampFields) {
            if (key in obj) {
                // 値は文字列(dateString)または Unix epoch millis
                return new Date(obj[key]);
            }
        }
        return null;
    }

    /**
     * Test datasource connection.
     * note: no authentication is tested.
     */
    testDatasource(): Q.Promise<any> {
        this.log("testDatasource");
        return this.doRequest({
            url: this.baseUri + "/1/_health",
            method: "GET"
        }).then(response => {
            if (response.status == 200) {
                return {status: "success", message: "Server connected", title: "Success"};
            }
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
     * Metric find query. Not implemented.
     * @param options
     * @return {Q.Promise<any>}
     */
    metricFindQuery(options: any): Q.Promise<any> {
        this.log("metricFindQuery");
        return this.resolved([]);
    }

    private resolved(data: any): Q.Promise<any> {
        this.log("resolved");
        const deferred: Q.Deferred<any> = this.q.defer();
        deferred.resolve(data);
        return deferred.promise;
    }

    private rejected(data: any): Q.Promise<any> {
        this.log("rejected");
        const deferred: Q.Deferred<any> = this.q.defer();
        deferred.reject(data);
        return deferred.promise;
    }

    private doRequest(options: any): Q.Promise<any> {
        this.log("doRequest");
        options.headers = this.headers;
        return this.backendSrv.datasourceRequest(options);
    }

    private buildQueryParameters(options: QueryOptions): any {
        const targets = [];

        for (let target of options.targets) {
            if (target.target === 'select metric') {
                continue;
            }
            targets.push({
                target: this.templateSrv.replace(target.target, options.scopedVars, 'regex'),
                refId: target.refId,
                hide: target.hide,
                type: target.type || 'timeserie'
            });
        }
        options.targets = targets;
        return options;
    }
}

