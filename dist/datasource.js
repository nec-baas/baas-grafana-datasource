/// <reference path="./grafana-sdk.d.ts" />
System.register([], function (exports_1, context_1) {
    "use strict";
    var BaasDatasource;
    var __moduleName = context_1 && context_1.id;
    return {
        setters: [],
        execute: function () {/// <reference path="./grafana-sdk.d.ts" />
            /**
             * BaaS Datasource
             */
            BaasDatasource = /** @class */ (function () {
                /**
                 * Constructor
                 * @param instanceSettings, configured by partials/config.html.
                 * @param backendSrv BackendSrv of Grafana.
                 * @param $q $q service of AngularJS 1.x.
                 * @param templateSrv TemplateSrv of Grafana.
                 */
                /** @ngInject */
                function BaasDatasource(instanceSettings, backendSrv, $q, templateSrv) {
                    this.backendSrv = backendSrv;
                    this.$q = $q;
                    this.templateSrv = templateSrv;
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
                BaasDatasource.prototype.log = function (msg) {
                    //console.log(msg);
                };
                /**
                 * Query metrics from data source.
                 * @param {module:app/plugins/sdk.QueryOptions} options
                 * @return {Promise<QueryResults>} results
                 */
                BaasDatasource.prototype.query = function (options) {
                    var _this = this;
                    this.log("query: " + JSON.stringify(options));
                    var targets = this.buildQueryParameters(options)
                        .filter(function (t) { return !t.hide; })
                        .filter(function (t) { return t.bucket && t.fieldName; });
                    if (targets.length <= 0) {
                        return Promise.resolve({ data: [] }); // no targets
                    }
                    var reqTargets = this.filterSameRequest(targets);
                    var promises = this.doRequestTargets(reqTargets, options);
                    return Promise.all(promises)
                        .then(function (responses) {
                        var results = [];
                        for (var _i = 0, targets_1 = targets; _i < targets_1.length; _i++) {
                            var target = targets_1[_i];
                            var data = responses[target.reqIndex].data;
                            results.push(_this.convertResponse(target, data));
                        }
                        return { data: results };
                    });
                };
                BaasDatasource.prototype.buildQueryParameters = function (options) {
                    var targets = [];
                    for (var _i = 0, _a = options.targets; _i < _a.length; _i++) {
                        var target = _a[_i];
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
                };
                BaasDatasource.prototype.filterSameRequest = function (targets) {
                    var reqTargets = [];
                    for (var _i = 0, targets_2 = targets; _i < targets_2.length; _i++) {
                        var target = targets_2[_i];
                        target.reqIndex = null;
                        for (var i = 0; i < reqTargets.length; i++) {
                            var reqTarget = reqTargets[i];
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
                };
                BaasDatasource.prototype.doRequest = function (req) {
                    req.headers = this.headers;
                    req.withCredentials = this.withCredentials;
                    this.log("doRequest: " + JSON.stringify(req));
                    return this.backendSrv.datasourceRequest(req);
                };
                BaasDatasource.prototype.doRequestTargets = function (targets, options) {
                    var promises = [];
                    for (var _i = 0, targets_3 = targets; _i < targets_3.length; _i++) {
                        var target = targets_3[_i];
                        // get parameters from head of targets
                        var bucketName = target.bucket;
                        var aggr = target.aggr;
                        var mainTsField = target.tsField;
                        // 検索条件
                        var gte = {};
                        gte[mainTsField] = { "$gte": options.range.from };
                        var lte = {};
                        lte[mainTsField] = { "$lte": options.range.to };
                        var whereAnd = [gte, lte];
                        var req = void 0;
                        if (!aggr) {
                            // long query API
                            req = {
                                url: this.baseUri + "/1/" + this.tenantId + "/objects/" + bucketName + "/_query",
                                data: {
                                    where: { "$and": whereAnd },
                                    order: mainTsField,
                                    limit: options.maxDataPoints
                                },
                                method: "POST"
                            };
                        }
                        else {
                            // aggregation API
                            var pipeline = JSON.parse(aggr);
                            pipeline.unshift({ "$match": { "$and": whereAnd } });
                            pipeline.push({ "$limit": options.maxDataPoints });
                            req = {
                                url: this.baseUri + "/1/" + this.tenantId + "/objects/" + bucketName + "/_aggregate",
                                data: { pipeline: pipeline },
                                method: "POST"
                            };
                        }
                        promises.push(this.doRequest(req));
                    }
                    return promises;
                };
                /**
                 * Convert http response of baas server to QueryResults.
                 * @param target
                 * @param data response data
                 * @return {module:app/plugins/sdk.TimeSerieQueryResult}
                 */
                BaasDatasource.prototype.convertResponse = function (target, data) {
                    var key = target.fieldName;
                    var tsField = target.tsField;
                    var alias = target.alias || target.bucket + '.' + target.fieldName;
                    // convert to datapoint
                    var datapoints = [];
                    for (var _i = 0, _a = data.results; _i < _a.length; _i++) {
                        var e = _a[_i];
                        var value = this.extractValue(e, key);
                        var ts = this.extractTimestamp(e, tsField);
                        if (value == null || ts == null) {
                            continue;
                        }
                        datapoints.push([value, ts.getTime()]);
                    }
                    return {
                        target: alias,
                        datapoints: datapoints
                    };
                };
                /**
                 * Extract value of specified filed from JSON.
                 * @param obj JSON Object
                 * @param {string} key field name, separated with period.
                 * @returns {any} value
                 */
                BaasDatasource.prototype.extractValue = function (obj, key) {
                    var keys = key.split('.');
                    for (var _i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
                        var key_1 = keys_1[_i];
                        if (obj != null && typeof obj === 'object' && key_1 in obj) {
                            obj = obj[key_1];
                        }
                        else {
                            return null;
                        }
                    }
                    return obj;
                };
                /**
                 * Extract timestamp value from JSON.
                 * @param obj JSON Object
                 * @param {string} tsField time stamp field name, null for auto inference.
                 * @returns {Date} timestamp
                 */
                BaasDatasource.prototype.extractTimestamp = function (obj, tsField) {
                    if (tsField != null) {
                        var ts = this.extractValue(obj, tsField);
                        if (ts != null) {
                            return new Date(ts);
                        }
                        else {
                            return null;
                        }
                    }
                    return null;
                };
                /**
                 * Test datasource connection.
                 * @return {Promise<TestDatasourceResult>} result
                 */
                BaasDatasource.prototype.testDatasource = function () {
                    var _this = this;
                    this.log("testDatasource");
                    return this.doRequest({
                        url: this.baseUri + "/1/" + this.tenantId + "/buckets/object",
                        method: "GET"
                    }).then(function (response) {
                        _this.log("status: " + response.status);
                        var result = { status: "success", message: "Server connected" };
                        return result;
                    }, function (error) {
                        var message;
                        if (error.data && error.data.error) {
                            message = error.data.error;
                        }
                        else if (error.statusText) {
                            message = "HTTP Error (" + error.status + ") " + error.statusText;
                        }
                        else {
                            message = "Connection failed";
                        }
                        var result = { status: "error", message: message };
                        return result;
                    });
                };
                /**
                 * Annotation query. Not supported.
                 * @param options
                 * @return {Promise<any>}
                 */
                BaasDatasource.prototype.annotationQuery = function (options) {
                    // nop
                    return null;
                };
                /**
                 * Metric find query.
                 * @param {string} query condition
                 * @return {Promise<MetricFindQueryResult[]>} results
                 */
                BaasDatasource.prototype.metricFindQuery = function (query) {
                    var _this = this;
                    this.log("metricFindQuery: " + query);
                    if (query == 'buckets') { // Get bucket list
                        if (this.cacheBuckets != null) {
                            return Promise.resolve(this.cacheBuckets);
                        }
                        // 実行中のリクエストがある場合はレスポンスを待つ
                        if (this.deferredBuckets != null) {
                            this.log("metricFindQuery deferred");
                            var deferred = this.$q.defer();
                            this.deferredBuckets.push(deferred);
                            return deferred.promise;
                        }
                        this.deferredBuckets = [];
                        return this.doRequest({
                            url: this.baseUri + "/1/" + this.tenantId + "/buckets/object",
                            method: "GET"
                        }).then(function (response) {
                            var buckets = [];
                            for (var _i = 0, _a = response.data.results; _i < _a.length; _i++) {
                                var result = _a[_i];
                                var bucket = result.name;
                                buckets.push({ text: bucket, value: bucket });
                            }
                            _this.cacheBuckets = buckets;
                            // リクエスト実行中に受けた要求を全て返す
                            for (var _b = 0, _c = _this.deferredBuckets; _b < _c.length; _b++) {
                                var deferred = _c[_b];
                                deferred.resolve(buckets);
                            }
                            _this.deferredBuckets = null;
                            return buckets;
                        }, function (error) {
                            _this.log("metricFindQuery error");
                            // エラーの場合はバケットリスト空とする
                            var buckets = [];
                            for (var _i = 0, _a = _this.deferredBuckets; _i < _a.length; _i++) {
                                var deferred = _a[_i];
                                deferred.resolve(buckets);
                            }
                            _this.deferredBuckets = null;
                            return buckets;
                        });
                    }
                    return Promise.resolve([]);
                };
                /**
                 * Get latest object.
                 * @param {string} bucket name
                 * @return {Promise<any>} result
                 */
                BaasDatasource.prototype.getLatestObject = function (bucket) {
                    var _this = this;
                    this.log("getLatestObject: " + bucket);
                    return this.doRequest({
                        url: this.baseUri + "/1/" + this.tenantId + "/objects/" + bucket + "/_query",
                        data: {
                            order: "-updatedAt",
                            limit: 1
                        },
                        method: "POST"
                    }).then(function (response) {
                        if (response.data.results.length == 1) {
                            _this.log("latest object: " + JSON.stringify(response.data.results[0]));
                            return response.data.results[0];
                        }
                        else {
                            return {};
                        }
                    }).catch(function (e) {
                        return {};
                    });
                };
                return BaasDatasource;
            }());
            exports_1("BaasDatasource", BaasDatasource);
        }
    };
});
