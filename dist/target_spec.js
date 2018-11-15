/// <reference path="./grafana-sdk.d.ts" />
System.register([], function (exports_1, context_1) {
    "use strict";
    var TargetSpec;
    var __moduleName = context_1 && context_1.id;
    function parseJson(json) {
        if (json == null)
            return null;
        return JSON.parse(json);
    }
    return {
        setters: [],
        execute: function () {/// <reference path="./grafana-sdk.d.ts" />
            /**
             * Target spec
             */
            TargetSpec = /** @class */ (function () {
                function TargetSpec(target) {
                    this.target = target;
                    // regexp: matches "target%aggr?where@ts"
                    var res = target.match(/^(.*?)(?:%(.*?))?(?:\?(.*?))?(?:@(.*))?$/);
                    target = res[1];
                    this.aggr = parseJson(res[2]);
                    this.where = parseJson(res[3]);
                    this.tsField = res[4];
                    // Split bucket name and field spec.
                    var t = target.split(".");
                    if (t.length < 2) {
                        throw new Error("Bad target.");
                    }
                    this.bucketName = t[0];
                    t.shift();
                    this.fieldName = t.join(".");
                }
                return TargetSpec;
            }());
            exports_1("TargetSpec", TargetSpec);
        }
    };
});
