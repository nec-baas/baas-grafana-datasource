/// <reference path="./grafana-sdk.d.ts" />
System.register(["./target_spec"], function (exports_1, context_1) {
    "use strict";
    var target_spec_1, BaasDatasource;
    var __moduleName = context_1 && context_1.id;
    return {
        setters: [
            function (target_spec_1_1) {
                target_spec_1 = target_spec_1_1;
            }
        ],
        execute: function () {/// <reference path="./grafana-sdk.d.ts" />
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
                 * Query metrics from data source.
                 * @param {module:app/plugins/sdk.QueryOptions} options
                 * @return {Q.Promise<QueryResults>} results
                 */
                BaasDatasource.prototype.query = function (options) {
                    var _this = this;
                    this.log("query: " + JSON.stringify(options));
                    var query = this.buildQueryParameters(options);
                    query.targets = query.targets
                        .filter(function (t) { return !t.hide; })
                        .filter(function (t) { return t.target != null; });
                    if (query.targets.length <= 0) {
                        return this.resolved({ data: [] }); // no targets
                    }
                    var targets;
                    try {
                        targets = query.targets
                            .map(function (t) { return new target_spec_1.TargetSpec(t.target); });
                    }
                    catch (e) {
                        return this.rejected(e);
                    }
                    // get parameters from head of targets
                    var bucketName = targets[0].bucketName;
                    var aggr = targets[0].aggr;
                    var where = targets[0].where;
                    var mainTsField = targets[0].tsField || "updatedAt";
                    // 検索条件
                    var gte = {};
                    gte[mainTsField] = { "$gte": options.range.from };
                    var lte = {};
                    lte[mainTsField] = { "$lte": options.range.to };
                    var whereAnd = [gte, lte];
                    if (where != null) {
                        whereAnd.push(where);
                    }
                    var req;
                    if (aggr == null) {
                        // long query API
                        req = {
                            url: this.baseUri + "/1/" + this.tenantId + "/objects/" + bucketName + "/_query",
                            data: {
                                where: { "$and": whereAnd },
                                order: "updatedAt",
                                limit: options.maxDataPoints
                            },
                            method: "POST"
                        };
                    }
                    else {
                        // aggregation API
                        var pipeline = aggr.pipeline;
                        pipeline.unshift({ "$match": { "$and": whereAnd } });
                        req = {
                            url: this.baseUri + "/1/" + this.tenantId + "/objects/" + bucketName + "/_aggregate",
                            data: aggr,
                            method: "POST"
                        };
                    }
                    return this.doRequest(req)
                        .then(function (response) {
                        var status = response.status;
                        var data = response.data;
                        return _this.convertResponse(targets, data);
                    });
                };
                /**
                 * Convert http response of baas server to QueryResults.
                 * @param {TargetSpec[]} targets
                 * @param data response data
                 * @return {module:app/plugins/sdk.QueryResults}
                 */
                BaasDatasource.prototype.convertResponse = function (targets, data) {
                    var results = [];
                    for (var _i = 0, targets_1 = targets; _i < targets_1.length; _i++) {
                        var target = targets_1[_i];
                        var key = target.fieldName;
                        var tsField = target.tsField;
                        // convert to datapoint
                        var datapoints = [];
                        for (var _a = 0, _b = data.results; _a < _b.length; _a++) {
                            var e = _b[_a];
                            var value = this.extractValue(e, key);
                            var ts = this.extractTimestamp(e, tsField);
                            datapoints.push([value, ts.getTime()]);
                        }
                        results.push({
                            target: target.target,
                            datapoints: datapoints
                        });
                    }
                    return { "data": results };
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
                        obj = obj[key_1];
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
                        return new Date(this.extractValue(obj, tsField));
                    }
                    for (var _i = 0, _a = BaasDatasource.TimeStampFields; _i < _a.length; _i++) {
                        var key = _a[_i];
                        if (key in obj) {
                            // 値は文字列(dateString)または Unix epoch millis
                            return new Date(obj[key]);
                        }
                    }
                    return null;
                };
                /**
                 * Test datasource connection.
                 * note: no authentication is tested.
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
                /**
                 * Annotation query. Not supported.
                 * @param options
                 * @return {Q.Promise<any>}
                 */
                BaasDatasource.prototype.annotationQuery = function (options) {
                    // nop
                    return null;
                };
                /**
                 * Metric find query. Not implemented.
                 * @param options
                 * @return {Q.Promise<any>}
                 */
                BaasDatasource.prototype.metricFindQuery = function (options) {
                    this.log("metricFindQuery");
                    return this.q.when({ data: [] });
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
                    for (var _i = 0, _a = options.targets; _i < _a.length; _i++) {
                        var target = _a[_i];
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
                /** Candidates of time stamp field name */
                BaasDatasource.TimeStampFields = ["updatedAt", "createdAt"];
                return BaasDatasource;
            }());
            exports_1("BaasDatasource", BaasDatasource);
        }
    };
});
