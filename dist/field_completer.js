/// <reference path="./grafana-sdk.d.ts" />
System.register([], function (exports_1, context_1) {
    "use strict";
    var FieldCompleter;
    var __moduleName = context_1 && context_1.id;
    return {
        setters: [],
        execute: function () {/// <reference path="./grafana-sdk.d.ts" />
            /**
             * Field Completer
             */
            FieldCompleter = /** @class */ (function () {
                function FieldCompleter(datasource, bucket) {
                    this.datasource = datasource;
                    this.bucket = bucket;
                    this.objCache = null;
                }
                /**
                 * Get completions.
                 * @param editor
                 * @param session
                 * @param pos cursor position
                 * @param prefix
                 * @param callback
                 */
                FieldCompleter.prototype.getCompletions = function (editor, session, pos, prefix, callback) {
                    var _this = this;
                    if (!this.bucket || pos.row != 0) {
                        callback(null, []);
                        return;
                    }
                    if (this.objCache != null) {
                        var completions = this.buildCompletions(this.objCache, session.toString(), pos.column);
                        callback(null, completions);
                    }
                    else {
                        this.datasource.getLatestObject(this.bucket)
                            .then(function (obj) {
                            _this.objCache = obj;
                            var completions = _this.buildCompletions(obj, session.toString(), pos.column);
                            callback(null, completions);
                        });
                    }
                };
                /**
                 * Set bucket
                 * @param {string} bucket name
                 */
                FieldCompleter.prototype.setBucket = function (bucket) {
                    this.bucket = bucket;
                    this.clearCache();
                };
                /**
                 * Clear cache
                 */
                FieldCompleter.prototype.clearCache = function () {
                    this.objCache = null;
                };
                FieldCompleter.prototype.buildCompletions = function (obj, inputStr, cursor) {
                    var inputFields = inputStr.split('.');
                    // カーソルが何番目のフィールドを指しているか特定
                    var pos = inputStr.substring(0, cursor).split('.').length - 1;
                    // 現在位置のオブジェクトを抽出しキーリストを作成
                    for (var i = 0; i < pos; i++) {
                        if (obj == null || typeof obj !== 'object') {
                            break;
                        }
                        obj = obj[inputFields[i]];
                    }
                    var completions = [];
                    if (obj != null && typeof obj === 'object') {
                        for (var _i = 0, _a = Object.keys(obj); _i < _a.length; _i++) {
                            var key = _a[_i];
                            completions.push({
                                caption: key,
                                value: key,
                                meta: 'field name'
                            });
                        }
                    }
                    return completions;
                };
                return FieldCompleter;
            }());
            exports_1("FieldCompleter", FieldCompleter);
        }
    };
});
