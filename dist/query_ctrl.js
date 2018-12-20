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
                    _this.target.bucket = _this.target.bucket || '';
                    _this.target.fieldName = _this.target.fieldName || '';
                    _this.target.tsField = _this.target.tsField || '';
                    _this.target.aggr = _this.target.aggr || '';
                    _this.target.alias = _this.target.alias || '';
                    _this.oldTarget = JSON.parse(JSON.stringify(_this.target)); // deep copy
                    _this.fieldCompleter = new field_completer_1.FieldCompleter(_this.datasource, _this.target.bucket);
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
                 * onChange event (field name)
                 */
                BaasDatasourceQueryCtrl.prototype.onChangeFieldName = function () {
                    this.onChangeInternal("fieldName");
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
                BaasDatasourceQueryCtrl.templateUrl = 'partials/query.editor.html';
                return BaasDatasourceQueryCtrl;
            }(sdk_1.QueryCtrl));
            exports_1("BaasDatasourceQueryCtrl", BaasDatasourceQueryCtrl);
        }
    };
});
