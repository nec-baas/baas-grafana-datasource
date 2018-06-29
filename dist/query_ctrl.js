/// <reference path="./grafana-sdk.d.ts" />
System.register(["app/plugins/sdk"], function (exports_1, context_1) {
    "use strict";
    var __extends = (this && this.__extends) || (function () {
        var extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return function (d, b) {
            extendStatics(d, b);
            function __() { this.constructor = d; }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
    })();
    var sdk_1, BaasDatasourceQueryCtrl;
    var __moduleName = context_1 && context_1.id;
    return {
        setters: [
            function (sdk_1_1) {
                sdk_1 = sdk_1_1;
            }
        ],
        execute: function () {/// <reference path="./grafana-sdk.d.ts" />
            BaasDatasourceQueryCtrl = /** @class */ (function (_super) {
                __extends(BaasDatasourceQueryCtrl, _super);
                function BaasDatasourceQueryCtrl($scope, $injector) {
                    return _super.call(this, $scope, $injector) || this;
                }
                BaasDatasourceQueryCtrl.prototype.getOptions = function (query) {
                    return this.datasource.metricFindQuery('');
                };
                BaasDatasourceQueryCtrl.prototype.toggleEditorMode = function () {
                    this.target.rawQuery = !this.target.rawQuery;
                };
                BaasDatasourceQueryCtrl.prototype.onChangeInternal = function () {
                    this.panelCtrl.refresh();
                };
                BaasDatasourceQueryCtrl.templateUrl = 'partials/query.editor.html';
                return BaasDatasourceQueryCtrl;
            }(sdk_1.QueryCtrl));
            exports_1("BaasDatasourceQueryCtrl", BaasDatasourceQueryCtrl);
        }
    };
});
