export class BaasDatasource {
    name: string;
    baseUri: string;
    tenantId: string;
    appId: string;
    appKey: string;
    user: string;
    password: string;

    /**
     * コンストラクタ
     * @param instanceSettings 設定値。config.html で設定したもの。
     * @param backendSrv Grafana の BackendSrv。本 plugin では使用しない。
     * @param $q Angular非同期サービス($q service)
     * @param templateSrv Grafana の TemplateSrv。本 plugin では使用しない。
     */
    constructor(instanceSettings: any, backendSrv: any, $q: any, templateSrv: any) {
        this.name = instanceSettings.name;

        this.baseUri = instanceSettings.baseUri;
        this.tenantId = instanceSettings.tenantId;
        this.appId = instanceSettings.appId;
        this.appKey = instanceSettings.appKey;
        this.user = instanceSettings.user;
        this.password = instanceSettings.password;
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

    }

    annotationQuery(options: any) {

    }

    metricFindQuery(options: any) {

    }
}