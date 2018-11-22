System.register([], function (exports_1, context_1) {
    "use strict";
    var BaasConfigCtrl;
    var __moduleName = context_1 && context_1.id;
    return {
        setters: [],
        execute: function () {
            BaasConfigCtrl = /** @class */ (function () {
                function BaasConfigCtrl($scope) {
                    this.current.jsonData.tenantId = this.current.jsonData.tenantId || "";
                    this.current.jsonData.appId = this.current.jsonData.appId || "";
                    this.current.jsonData.appKey = this.current.jsonData.appKey || "";
                }
                BaasConfigCtrl.templateUrl = 'partials/config.html';
                return BaasConfigCtrl;
            }());
            exports_1("BaasConfigCtrl", BaasConfigCtrl);
        }
    };
});
