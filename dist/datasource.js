/// <reference path="./grafana-sdk.d.ts" />
System.register(["app/core/table_model"], function (exports_1, context_1) {
    "use strict";
    var table_model_1, BaasDatasource;
    var __moduleName = context_1 && context_1.id;
    return {
        setters: [
            function (table_model_1_1) {
                table_model_1 = table_model_1_1;
            }
        ],
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
                        .filter(function (t) { return !t.hide && t.bucket; })
                        .filter(function (t) {
                        if (t.createDataWith === 'series_name_value_key') {
                            return t.seriesNameKey && t.seriesValueKey;
                        }
                        else {
                            t.dataField = t.dataField.filter(function (f) { return f.fieldName; });
                            return t.dataField.length != 0;
                        }
                    });
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
                            if (target.format === 'table') {
                                if (target.createDataWith === 'series_name_value_key') {
                                    results.push.apply(results, _this.convertResponseToTableWithSeries(target, data));
                                }
                                else {
                                    results.push.apply(results, _this.convertResponseToTableWithDataField(target, data));
                                }
                            }
                            else {
                                target.format = 'time_series';
                                if (target.createDataWith === 'series_name_value_key') {
                                    results.push.apply(results, _this.convertResponseWithSeries(target, data, options));
                                }
                                else {
                                    results.push.apply(results, _this.convertResponseWithDataField(target, data, options));
                                }
                            }
                        }
                        return { data: results };
                    });
                };
                BaasDatasource.prototype.buildQueryParameters = function (options) {
                    var _this = this;
                    var targets = [];
                    for (var _i = 0, _a = options.targets; _i < _a.length; _i++) {
                        var target = _a[_i];
                        var dataField = target.dataField;
                        if (!dataField) {
                            // 旧バージョンのTarget型を変換する
                            if (target.fieldName) {
                                dataField = [{ fieldName: target.fieldName, alias: target.alias }];
                            }
                            else {
                                dataField = [];
                            }
                        }
                        dataField = dataField.map(function (f) {
                            return { fieldName: _this.templateSrv.replace(f.fieldName), alias: f.alias };
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
                };
                BaasDatasource.prototype.filterSameRequest = function (targets) {
                    var reqTargets = [];
                    for (var _i = 0, targets_2 = targets; _i < targets_2.length; _i++) {
                        var target = targets_2[_i];
                        target.reqIndex = null;
                        var targetAggrObj = {};
                        if (target.aggr) {
                            targetAggrObj = JSON.parse(target.aggr);
                        }
                        for (var i = 0; i < reqTargets.length; i++) {
                            var reqTarget = reqTargets[i];
                            var reqTargetAggrObj = {};
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
                 * Convert http response of baas server to QueryResults with DataField.
                 * @param target
                 * @param data response data
                 * @return {module:app/plugins/sdk.TimeSeriesQueryResult[]}
                 */
                BaasDatasource.prototype.convertResponseWithDataField = function (target, data, options) {
                    var results = [];
                    for (var _i = 0, _a = target.dataField; _i < _a.length; _i++) {
                        var field = _a[_i];
                        var alias = field.alias || target.bucket + '.' + field.fieldName;
                        // convert to datapoint
                        var datapoints = [];
                        for (var _b = 0, _c = data.results; _b < _c.length; _b++) {
                            var e = _c[_b];
                            var datapoint = this.convertToDataPoint(e, field.fieldName, target.tsField, options);
                            if (datapoint) {
                                datapoints.push(datapoint);
                            }
                        }
                        results.push({
                            target: alias,
                            datapoints: datapoints
                        });
                    }
                    return results;
                };
                /**
                 * Convert http response of baas server to QueryResults with Series Name/Value.
                 * @param target
                 * @param data response data
                 * @return {module:app/plugins/sdk.TimeSeriesQueryResult[]}
                 */
                BaasDatasource.prototype.convertResponseWithSeries = function (target, data, options) {
                    var results = [];
                    var _loop_1 = function (e) {
                        var name_1 = this_1.extractValue(e, target.seriesNameKey);
                        if (name_1 == null) {
                            return "continue";
                        }
                        // convert to datapoint
                        var datapoint = this_1.convertToDataPoint(e, target.seriesValueKey, target.tsField, options);
                        if (datapoint) {
                            var findIndex = results.findIndex(function (result) { return result.target === name_1; });
                            if (findIndex < 0) {
                                results.push({
                                    target: name_1,
                                    datapoints: [datapoint]
                                });
                            }
                            else {
                                results[findIndex].datapoints.push(datapoint);
                            }
                        }
                    };
                    var this_1 = this;
                    for (var _i = 0, _a = data.results; _i < _a.length; _i++) {
                        var e = _a[_i];
                        _loop_1(e);
                    }
                    return results;
                };
                /**
                 * Convert http response of baas server to DataPoint.
                 * @param {*} element response object
                 * @param {string} valueKey
                 * @param {string} tsField
                 * @param {QueryOptions} options
                 * @returns {any[]} array of [value, epoch]
                 */
                BaasDatasource.prototype.convertToDataPoint = function (element, valueKey, tsField, options) {
                    var value = this.extractValue(element, valueKey);
                    var ts = this.extractTimestamp(element, tsField);
                    if (value == null) {
                        return null;
                    }
                    var datapoint = [];
                    if (ts != null) {
                        datapoint = [value, ts.getTime()];
                    }
                    else {
                        datapoint = [value, Date.parse(options.range.to)];
                    }
                    return datapoint;
                };
                /**
                 *Convert http response of baas server to TableModel with DataField.
                 * @param {QueryOptionsTarget} target
                 * @param {*} data response data
                 * @param {TableModel} tableModel for test
                 * @returns {TableModel[]}
                 */
                BaasDatasource.prototype.convertResponseToTableWithDataField = function (target, data, table) {
                    var labels = [];
                    table = table || new table_model_1.default();
                    //Columns
                    for (var _i = 0, _a = data.results; _i < _a.length; _i++) {
                        var e = _a[_i];
                        var ts = this.extractValue(e, target.tsField);
                        if (ts != null) {
                            table.addColumn({ text: 'Time' });
                            labels.push(target.tsField);
                            break;
                        }
                    }
                    var _loop_2 = function (field) {
                        var fieldName = field.fieldName;
                        if (fieldName != null) {
                            var alias_1 = field.alias || target.bucket + '.' + fieldName;
                            var findIndex = table.columns.findIndex(function (column) { return column.text === alias_1; });
                            if (findIndex < 0) {
                                table.addColumn({ text: alias_1 });
                                labels.push(fieldName);
                            }
                        }
                    };
                    for (var _b = 0, _c = target.dataField; _b < _c.length; _b++) {
                        var field = _c[_b];
                        _loop_2(field);
                    }
                    // Rows
                    for (var _d = 0, _e = data.results; _d < _e.length; _d++) {
                        var e = _e[_d];
                        var row = [];
                        var hasData = false;
                        for (var i = 0; i < labels.length; i++) {
                            if (i === 0 && labels[i] === target.tsField && table.columns[i].text === 'Time') {
                                var ts = this.extractTimestamp(e, target.tsField);
                                if (ts != null) {
                                    row.push(ts.getTime());
                                }
                                else {
                                    row.push(null);
                                }
                            }
                            else {
                                var value = this.extractValue(e, labels[i]);
                                if (value != null) {
                                    row.push(value);
                                    hasData = true;
                                }
                                else {
                                    row.push(null);
                                }
                            }
                        }
                        if (hasData) {
                            table.addRow(row);
                        }
                    }
                    return [table];
                };
                /**
                 *Convert http response of baas server to TableModel with Series Name/Value.
                 * @param {QueryOptionsTarget} target
                 * @param {*} data response data
                 * @param {TableModel} tableModel for test
                 * @returns {TableModel[]}
                 */
                BaasDatasource.prototype.convertResponseToTableWithSeries = function (target, data, table) {
                    table = table || new table_model_1.default();
                    //Columns
                    for (var _i = 0, _a = data.results; _i < _a.length; _i++) {
                        var e = _a[_i];
                        var ts = this.extractValue(e, target.tsField);
                        if (ts != null) {
                            table.addColumn({ text: 'Time' });
                            break;
                        }
                    }
                    table.addColumn({ text: target.seriesNameKey });
                    table.addColumn({ text: target.seriesValueKey });
                    var _loop_3 = function (e) {
                        var row = [];
                        var name_2 = this_2.extractValue(e, target.seriesNameKey);
                        var value = this_2.extractValue(e, target.seriesValueKey);
                        if (name_2 == null || value == null) {
                            return "continue";
                        }
                        if (table.columns[0].text === 'Time' && table.columns.length >= 3) {
                            var ts = this_2.extractTimestamp(e, target.tsField);
                            if (ts != null) {
                                row.push(ts.getTime());
                            }
                            else {
                                row.push(null);
                            }
                        }
                        row.push(name_2);
                        row.push(value);
                        var findIndex = table.rows.findIndex(function (findRow) { return findRow[table.columns.length - 2] === name_2; });
                        if (findIndex < 0) {
                            table.addRow(row);
                        }
                        else {
                            table.rows[findIndex] = row;
                        }
                    };
                    var this_2 = this;
                    // Rows
                    for (var _b = 0, _c = data.results; _b < _c.length; _b++) {
                        var e = _c[_b];
                        _loop_3(e);
                    }
                    return [table];
                };
                /**
                 * Extract value of specified field from JSON.
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
