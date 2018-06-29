export default class BaasDatasource {
    name: string;
    baseUri: string;
    tenantId: string;
    headers: any;

    backendSrv: any;
    templateSrv: any;
    q: any;

    // TimeStamp が格納されたフィールド名の候補
    static TimeStampFields = ["createdAt", "updatedAt"];

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
        const tsFields: string[] = [];
        let mainTsField = null;

        for (let i = 0; i < query.targets.length; i++) {
            // metric target: バケット名.field名
            let target = query.targets[i].target;
            if (target == null) {
                continue;
            }

            // timestamp フィールド指定を取り出す
            let tsField = null;
            let t = target.split("@", 2);
            if (t.length == 2) {
                target = t[0];
                tsField = t[1];
                if (mainTsField == null) {
                    mainTsField = tsField;
                }
            }
            tsFields.push(tsField);

            // bucket名、フィールド名を分割
            t = target.split(".")
            if (t.length < 2) {
                return this.rejected(new Error("Bad target."));
            }
            if (bucketName == null) {
                bucketName = t[0];
            } else if (bucketName !== t[0]) {
                return this.rejected(new Error("bucket names mismatch."));
            }
            t.shift();
            const fieldName = t.join(".");
            fieldNames.push(fieldName);
        }
        if (bucketName == null) {
            return this.resolved({data: []}) // no targets
        }

        // URI for long query
        const uri = this.baseUri + "/1/" + this.tenantId + "/objects/" + bucketName + "/_query";

        // 主タイムスタンプフィールド名
        if (mainTsField == null) {
            mainTsField = "createdAt";
        }

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
                order: "createdAt",
                limit: options.maxDataPoints
            },
            method: "POST"
        };
        return this.doRequest(req)
            .then(response => {
                const status = response.status;
                const data = response.data;

                return this.convertResponse(query.targets, fieldNames, tsFields, data);
            });
    }

    convertResponse(targets: any[], fieldNames: string[], tsFields: string[], data: any): any {
        const results = [];

        for (let i = 0; i < targets.length; i++) {
            const key = fieldNames[i];
            const tsField = tsFields[i];

            // datapoints に変換
            const datapoints = [];
            for (let j = 0; j < data.results.length; j++) {
                const e = data.results[j];
                const value = this.extractValue(e, key);
                const ts = this.extractTimestamp(e, tsField);

                datapoints.push([value, ts.getTime()]);
            }
            results.push({
                target: targets[i].target,
                datapoints: datapoints
            });
        }

        return {"data": results};
    }

    /**
     * JSON から特定フィールドの値を取得する
     * @param obj JSON Object
     * @param {string} key フィールド指定
     * @returns {any} 値
     */
    extractValue(obj: any, key: string): any {
        const keys = key.split('.');
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            obj = obj[key];
        }
        return obj;
    }

    /**
     * JSON からタイムスタンプ値を取り出す
     * @param obj JSON Object
     * @param {string} tsField タイムスタンプフィールド名。null は自動推定。
     * @returns {Date} タイムスタンプ
     */
    extractTimestamp(obj: any, tsField: string): Date {
        if (tsField != null) {
            return new Date(this.extractValue(obj, tsField));
        }

        for (let i = 0; i < BaasDatasource.TimeStampFields.length; i++) {
            const key = BaasDatasource.TimeStampFields[i];
            if (key in obj) {
                // 値は文字列(dateString)または Unix epoch millis
                return new Date(obj[key]);
            }
        }
        return null;
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