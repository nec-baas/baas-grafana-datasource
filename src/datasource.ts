//import {Promise} from 'es6-promise';
declare var Promise: any;

export class BaasDatasource {
    name: string;
    baseUri: string;
    headers: any;

    backendSrv: any;

    /**
     * コンストラクタ
     * @param instanceSettings 設定値。config.html で設定したもの。
     * @param backendSrv Grafana の BackendSrv。
     * @param $q Angular非同期サービス($q service)
     * @param templateSrv Grafana の TemplateSrv。本 plugin では使用しない。
     */
    constructor(instanceSettings: any, backendSrv: any, $q: any, templateSrv: any) {
        this.name = instanceSettings.name;

        this.baseUri = instanceSettings.baseUri;
        this.headers = {
            "Content-Type": "application/json",
            "X-Tenant-Id": instanceSettings.tenantId,
            "X-Application-Id": instanceSettings.appId,
            "X-Application-Key": instanceSettings.appKey
        };
        if (typeof instanceSettings.basicAuth === 'string' && instanceSettings.basicAuth.length > 0) {
            this.headers['Authorization'] = instanceSettings.basicAuth;
        }

        this.backendSrv = backendSrv;
    }

    /**
     * データ取得
     * @param options
     */
    query(options: any) {

    }

    /**
     * Datasource接続テスト
     */
    testDatasource() {
        return Promise.resolve({
            status: "success",
            title: "Success",
            message: "Not implemented yet..."
        });
    }

    annotationQuery(options: any) {
        // nop
    }

    /**
     * Metric検索。本 plugin では NOP。
     * @param options
     */
    metricFindQuery(options: any) {
        return Promise.resolve([]);
    }

    private doRequest(options: any) {
        options.headers = this.headers;
        return this.backendSrv.datasourceRequest(options);
    }
}