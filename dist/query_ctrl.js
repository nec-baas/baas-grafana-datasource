/// <reference path="./grafana-sdk.d.ts" />
System.register(["app/plugins/sdk", "./field_completer"], function (exports_1, context_1) {
    "use strict";
    var __extends = (this && this.__extends) || (function () {
        var extendStatics = function (d, b) {
            extendStatics = Object.setPrototypeOf ||
                ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
                function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
            return extendStatics(d, b);
        };
        return function (d, b) {
            extendStatics(d, b);
            function __() { this.constructor = d; }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
    })();
    var sdk_1, field_completer_1, BaasDatasourceQueryCtrl;
    var __moduleName = context_1 && context_1.id;
    return {
        setters: [
            function (sdk_1_1) {
                sdk_1 = sdk_1_1;
            },
            function (field_completer_1_1) {
                field_completer_1 = field_completer_1_1;
            }
        ],
        execute: function () {/// <reference path="./grafana-sdk.d.ts" />
            BaasDatasourceQueryCtrl = /** @class */ (function (_super) {
                __extends(BaasDatasourceQueryCtrl, _super);
                /**
                 * Constructor
                 * @param $scope scope of AngularJS 1.x.
                 * @param $injector $injector service of AngularJS 1.x.
                 */
                /** @ngInject */
                function BaasDatasourceQueryCtrl($scope, $injector) {
                    var _this = _super.call(this, $scope, $injector) || this;
                    /** Datasource format */
                    _this.FORMATS = [
                        { text: 'Time series', value: 'time_series' },
                        { text: 'Table', value: 'table' },
                    ];
                    /** Create Data Method */
                    _this.CREATE_DATA_WITH = [
                        { text: 'Data field', value: 'data_field' },
                        { text: 'Series Name/Value key', value: 'series_name_value_key' },
                    ];
                    _this.target.bucket = _this.target.bucket || '';
                    _this.target.tsField = _this.target.tsField || '';
                    _this.target.aggr = _this.target.aggr || '';
                    _this.target.dataField = _this.target.dataField || [];
                    // 旧バージョンのTarget型を変換する
                    if (_this.target.fieldName) {
                        _this.target.dataField.push({
                            fieldName: _this.target.fieldName,
                            alias: _this.target.alias || ''
                        });
                    }
                    if (_this.target.dataField.length == 0) {
                        _this.target.dataField.push({ "fieldName": "", "alias": "" });
                    }
                    _this.target.fieldName = undefined;
                    _this.target.alias = undefined;
                    _this.target.format = _this.target.format || _this.getDefaultFormat();
                    _this.oldTarget = JSON.parse(JSON.stringify(_this.target)); // deep copy
                    _this.fieldCompleter = new field_completer_1.FieldCompleter(_this.datasource, _this.target.bucket);
                    _this.target.createDataWith = _this.target.createDataWith || 'data_field';
                    _this.target.seriesNameKey = _this.target.seriesNameKey || '';
                    _this.target.seriesValueKey = _this.target.seriesValueKey || '';
                    return _this;
                }
                /**
                 * Get bucket list
                 * @return {Promise<MetricFindQueryResult[]>} bucket list
                 */
                BaasDatasourceQueryCtrl.prototype.getBuckets = function () {
                    return this.datasource.metricFindQuery("buckets");
                };
                /**
                 * onChange event (bucket name)
                 */
                BaasDatasourceQueryCtrl.prototype.onChangeBucket = function () {
                    if (this.onChangeInternal("bucket")) {
                        this.fieldCompleter.setBucket(this.target.bucket);
                    }
                };
                /**
                 * Add data field
                 */
                BaasDatasourceQueryCtrl.prototype.addField = function () {
                    this.target.dataField.push({ "fieldName": "", "alias": "" });
                    this.oldTarget.dataField.push({ "fieldName": "", "alias": "" });
                };
                /**
                 * Remove data field
                 * @param index index of data field
                 */
                BaasDatasourceQueryCtrl.prototype.removeField = function (index) {
                    this.target.dataField.splice(index, 1);
                    this.oldTarget.dataField.splice(index, 1);
                    if (this.target.dataField.length == 0) {
                        this.addField();
                    }
                    this.panelCtrl.refresh();
                };
                /**
                 * onChange event (field name)
                 * @param index index of data field
                 */
                BaasDatasourceQueryCtrl.prototype.onChangeFieldName = function (index) {
                    if (this.target.dataField[index].fieldName !== this.oldTarget.dataField[index].fieldName) {
                        this.oldTarget.dataField[index].fieldName = this.target.dataField[index].fieldName;
                        this.panelCtrl.refresh();
                    }
                    this.fieldCompleter.clearCache();
                };
                /**
                 * onChange event (timestamp field)
                 */
                BaasDatasourceQueryCtrl.prototype.onChangeTsField = function () {
                    this.onChangeInternal("tsField");
                    this.fieldCompleter.clearCache();
                };
                /**
                 * onChange event (aggregation pipeline)
                 */
                BaasDatasourceQueryCtrl.prototype.onChangeAggregate = function () {
                    this.onChangeInternal("aggr");
                };
                BaasDatasourceQueryCtrl.prototype.onChangeInternal = function (key) {
                    if (this.target[key] === this.oldTarget[key]) {
                        return false;
                    }
                    this.oldTarget[key] = this.target[key];
                    this.panelCtrl.refresh();
                    return true;
                };
                /**
                 * Get completer
                 */
                BaasDatasourceQueryCtrl.prototype.getCompleter = function () {
                    return this.fieldCompleter;
                };
                /**
                 * Get default datasource format
                 */
                BaasDatasourceQueryCtrl.prototype.getDefaultFormat = function () {
                    if (this.panelCtrl.panel.type === 'table') {
                        return 'table';
                    }
                    return 'time_series';
                };
                BaasDatasourceQueryCtrl.prototype.onChangeCreateDataWith = function () {
                    this.onChangeInternal("createDataWith");
                };
                BaasDatasourceQueryCtrl.prototype.onChangeSeriesNameKey = function () {
                    this.onChangeInternal("seriesNameKey");
                };
                BaasDatasourceQueryCtrl.prototype.onChangeSeriesValueKey = function () {
                    this.onChangeInternal("seriesValueKey");
                };
                BaasDatasourceQueryCtrl.templateUrl = 'partials/query.editor.html';
                return BaasDatasourceQueryCtrl;
            }(sdk_1.QueryCtrl));
            exports_1("BaasDatasourceQueryCtrl", BaasDatasourceQueryCtrl);
        }
    };
});
