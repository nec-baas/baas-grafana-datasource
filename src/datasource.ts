export default class BaasDatasource {
    name: string;
    baseUri: string;
    tenantId: string;
    headers: any;

    backendSrv: any;
    templateSrv: any;
    q: any;

    private log(msg: string) {
        //console.log(msg);
    }

    /**
     * コンストラクタ
     * @param instanceSettings 設定値。config.html で設定したもの。
     * @param backendSrv Grafana の BackendSrv。
     * @param $q Angular非同期サービス($q service)
     * @param templateSrv Grafana の TemplateSrv。
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
     * データ取得
     * @param options
     */
    query(options: any) {
        this.log("query: " + JSON.stringify(options));
        const query = this.buildQueryParameters(options);
        query.targets = query.targets.filter(t => !t.hide);

        if (query.targets.length <= 0) {
            return this.resolved({data: []}) // no targets
        }

        let bucketName: string = null;
        const fieldNames: string[] = [];

        for (let i = 0; i < query.targets.length; i++) {
            // metric target: バケット名, field名
            const target = query.targets[i].target;
            const a = target.split(".", 2);
            if (a.length !== 2) {
                return this.rejected(new Error("Bad target."));
            }
            if (i == 0) {
                bucketName = a[0];
            } else if (bucketName !== a[0]) {
                return this.rejected(new Error("bucket names mismatch."));
            }
            const fieldName = a[1];
            fieldNames.push(fieldName);
        }

        // URI for long query
        const uri = this.baseUri + "/1/" + this.tenantId + "/objects/" + bucketName + "/_query";

        const where = {
            "$and": [
                {createdAt: {"$gte": options.range.from}},
                {createdAt: {"$lte": options.range.to}}
            ]
        };

        const req = {
            url: uri,
            data: {
                where: where,
                order: "createdAt",
                limit: options.maxDataPoints
            },
            method: "POST"
        };
        return this.doRequest(req)
            .then(response => {
                const status = response.status;
                const data = response.data;

                return this.convertResponse(query.targets, fieldNames, data);
            });
    }

    convertResponse(targets: any[], fieldNames: string[], data: any): any {
        const results = [];

        for (let i = 0; i < targets.length; i++) {
            const keys: string[] = fieldNames[i].split(".");

            // datapoints に変換
            const datapoints = [];
            for (let j = 0; j < data.results.length; j++) {
                const e = data.results[j];
                const value = this.extractValue(e, keys);
                const ts = new Date(e["createdAt"]);

                datapoints.push([value, ts.getTime()]);
            }
            results.push({
                target: targets[i].target,
                datapoints: datapoints
            });
        }

        return {"data": results};
    }

    extractValue(obj: any, keys: string[]): any {
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            obj = obj[key];
        }
        return obj;
    }

    /**
     * Datasource接続テスト
     */
    testDatasource() {
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

    annotationQuery(options: any) {
        // nop
    }

    /**
     * Metric検索。本 plugin では NOP。
     * @param options
     */
    metricFindQuery(options: any) {
        this.log("metricFindQuery");
        return this.resolved([]);
    }

    private resolved(data: any): any {
        this.log("resolved");
        const deferred = this.q.defer();
        deferred.resolve(data);
        return deferred.promise;
    }

    private rejected(data: any): any {
        this.log("rejected");
        const deferred = this.q.defer();
        deferred.reject(data);
        return deferred.promise;
    }

    private doRequest(options: any): any {
        this.log("doRequest");
        options.headers = this.headers;
        return this.backendSrv.datasourceRequest(options);
    }

    private buildQueryParameters(options: any): any {
        const targets = [];

        for (let i = 0; i < options.targets.length; i++) {
            const target = options.targets[i];
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