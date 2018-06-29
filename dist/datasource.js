System.register([], function (exports_1, context_1) {
    "use strict";
    var BaasDatasource;
    var __moduleName = context_1 && context_1.id;
    return {
        setters: [],
        execute: function () {
            BaasDatasource = /** @class */ (function () {
                /**
                 * コンストラクタ
                 * @param instanceSettings 設定値。config.html で設定したもの。
                 * @param backendSrv Grafana の BackendSrv。
                 * @param $q Angular非同期サービス($q service)
                 * @param templateSrv Grafana の TemplateSrv。
                 */
                /** @ngInject */
                function BaasDatasource(instanceSettings, backendSrv, $q, templateSrv) {
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
                BaasDatasource.prototype.log = function (msg) {
                    //console.log(msg);
                };
                /**
                 * データ取得
                 * @param options
                 */
                BaasDatasource.prototype.query = function (options) {
                    var _this = this;
                    this.log("query: " + JSON.stringify(options));
                    var query = this.buildQueryParameters(options);
                    query.targets = query.targets.filter(function (t) { return !t.hide; });
                    if (query.targets.length <= 0) {
                        return this.resolved({ data: [] }); // no targets
                    }
                    var bucketName = null;
                    var fieldNames = [];
                    for (var i = 0; i < query.targets.length; i++) {
                        // metric target: バケット名, field名
                        var target = query.targets[i].target;
                        var a = target.split(".", 2);
                        if (a.length !== 2) {
                            return this.rejected(new Error("Bad target."));
                        }
                        if (i == 0) {
                            bucketName = a[0];
                        }
                        else if (bucketName !== a[0]) {
                            return this.rejected(new Error("bucket names mismatch."));
                        }
                        var fieldName = a[1];
                        fieldNames.push(fieldName);
                    }
                    // URI for long query
                    var uri = this.baseUri + "/1/" + this.tenantId + "/objects/" + bucketName + "/_query";
                    var where = {
                        "$and": [
                            { createdAt: { "$gte": options.range.from } },
                            { createdAt: { "$lte": options.range.to } }
                        ]
                    };
                    var req = {
                        url: uri,
                        data: {
                            where: where,
                            order: "createdAt",
                            limit: options.maxDataPoints
                        },
                        method: "POST"
                    };
                    return this.doRequest(req)
                        .then(function (response) {
                        var status = response.status;
                        var data = response.data;
                        return _this.convertResponse(query.targets, fieldNames, data);
                    });
                };
                BaasDatasource.prototype.convertResponse = function (targets, fieldNames, data) {
                    var results = [];
                    for (var i = 0; i < targets.length; i++) {
                        var keys = fieldNames[i].split(".");
                        // datapoints に変換
                        var datapoints = [];
                        for (var j = 0; j < data.results.length; j++) {
                            var e = data.results[j];
                            var value = this.extractValue(e, keys);
                            var ts = new Date(e["createdAt"]);
                            datapoints.push([value, ts.getTime()]);
                        }
                        results.push({
                            target: targets[i].target,
                            datapoints: datapoints
                        });
                    }
                    return { "data": results };
                };
                BaasDatasource.prototype.extractValue = function (obj, keys) {
                    for (var i = 0; i < keys.length; i++) {
                        var key = keys[i];
                        obj = obj[key];
                    }
                    return obj;
                };
                /**
                 * Datasource接続テスト
                 */
                BaasDatasource.prototype.testDatasource = function () {
                    this.log("testDatasource");
                    return this.doRequest({
                        url: this.baseUri + "/1/_health",
                        method: "GET"
                    }).then(function (response) {
                        if (response.status == 200) {
                            return { status: "success", message: "Server connected", title: "Success" };
                        }
                    });
                };
                BaasDatasource.prototype.annotationQuery = function (options) {
                    // nop
                };
                /**
                 * Metric検索。本 plugin では NOP。
                 * @param options
                 */
                BaasDatasource.prototype.metricFindQuery = function (options) {
                    this.log("metricFindQuery");
                    return this.resolved([]);
                };
                BaasDatasource.prototype.resolved = function (data) {
                    this.log("resolved");
                    var deferred = this.q.defer();
                    deferred.resolve(data);
                    return deferred.promise;
                };
                BaasDatasource.prototype.rejected = function (data) {
                    this.log("rejected");
                    var deferred = this.q.defer();
                    deferred.reject(data);
                    return deferred.promise;
                };
                BaasDatasource.prototype.doRequest = function (options) {
                    this.log("doRequest");
                    options.headers = this.headers;
                    return this.backendSrv.datasourceRequest(options);
                };
                BaasDatasource.prototype.buildQueryParameters = function (options) {
                    var targets = [];
                    for (var i = 0; i < options.targets.length; i++) {
                        var target = options.targets[i];
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
                };
                return BaasDatasource;
            }());
            exports_1("default", BaasDatasource);
        }
    };
});
