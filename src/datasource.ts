//import {Promise} from 'es6-promise';
declare var Promise: any;

import * as _ from 'lodash';

export class BaasDatasource {
    name: string;
    baseUri: string;
    tenantId: string;
    headers: any;

    backendSrv: any;
    templateSrv: any;

    /**
     * コンストラクタ
     * @param instanceSettings 設定値。config.html で設定したもの。
     * @param backendSrv Grafana の BackendSrv。
     * @param $q Angular非同期サービス($q service)
     * @param templateSrv Grafana の TemplateSrv。
     */
    constructor(instanceSettings: any, backendSrv: any, $q: any, templateSrv: any) {
        this.name = instanceSettings.name;

        this.baseUri = instanceSettings.baseUri;
        this.tenantId = instanceSettings.tenantId;
        this.headers = {
            "Content-Type": "application/json",
            "X-Application-Id": instanceSettings.appId,
            "X-Application-Key": instanceSettings.appKey
        };
        if (typeof instanceSettings.basicAuth === 'string' && instanceSettings.basicAuth.length > 0) {
            this.headers['Authorization'] = instanceSettings.basicAuth;
        }

        this.backendSrv = backendSrv;
    }

    /**
     * データ取得
     * @param options
     */
    query(options: any) {
        const query = this.buildQueryParameters(options);
        query.targets = query.targets.filter(t => !t.hide);

        if (query.targets.length <= 0) {
            return Promise.resolve({data: []}); // no targets
        }

        //const allResults = [];
        //const promises = [];

        let bucketName: string = null;
        const fieldNames: [string] = [] as [string];

        for (let i = 0; i < query.targets.lengh; i++) {
            // metric target: バケット名, field名
            const target = query.targets[i].target;
            const a = target.split(":", 2);
            if (i == 0) {
                bucketName = a[0];
            } if (i > 0 && bucketName != a[0]) {
                return Promise.reject(new Error("bucket names mismatch."))
            }
            const fieldName = a[1];
            fieldNames.push(fieldName);
        }

        // URI for long query
        const uri = this.baseUri + "/1/" + this.tenantId + "/objects/" + bucketName + "/_query";

        const where = {
            "$and": [
                {"createdAt": {"$gte": options.range.from}},
                {"createdAt": {"$lte": options.range.to}},
            ]
        };

        const promise = this.doRequest({
            "url": uri,
            "data": {
                "where": where,
                "order": "createdAt",
                "limit": options.maxDataPoints
            },
            "method": "POST"
        }).then(response => {
            const status = response.status;
            const data = response.data;

            return this.convertResponse(query.targets, fieldNames, data);
        });
    }

    private convertResponse(targets: [string], fieldNames: [string], data: any): any {
        const results = [];

        for (let i = 0; i < targets.length; i++) {
            // datapoints に変換
            const datapoints = _.map(data.results, e => {
                const value = e[fieldNames[i]]; // TBD
                const ts = new Date(e["createdAt"]);
                return [value, ts.getTime()];
            });

            results.push({
                "target": targets[i],
                "datapoints": datapoints
            });
        }

        return results;
    }


    /**
     * Datasource接続テスト
     */
    testDatasource() {
        return Promise.resolve({
            status: "success",
            title: "Success",
            message: "Not implemented yet..."
        });
    }

    annotationQuery(options: any) {
        // nop
    }

    /**
     * Metric検索。本 plugin では NOP。
     * @param options
     */
    metricFindQuery(options: any) {
        return Promise.resolve([]);
    }

    private doRequest(options: any): any {
        options.headers = this.headers;
        return this.backendSrv.datasourceRequest(options);
    }

    private buildQueryParameters(options: any): any {
        options.targets = _.filter(options.targets, target => {
            return target.target !== 'select metric';
        });

        const targets = _.map(options.targets, target => {
            return {
                target: this.templateSrv.replace(target.target, options.scopedVars, 'regex'),
                refId: target.refId,
                hide: target.hide,
                type: target.type || 'timeserie'
            }
        });
        options.targets = targets;
        return options;
    }
}