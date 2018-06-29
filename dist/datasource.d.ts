export default class BaasDatasource {
    name: string;
    baseUri: string;
    tenantId: string;
    headers: any;
    backendSrv: any;
    templateSrv: any;
    q: any;
    private log;
    /**
     * コンストラクタ
     * @param instanceSettings 設定値。config.html で設定したもの。
     * @param backendSrv Grafana の BackendSrv。
     * @param $q Angular非同期サービス($q service)
     * @param templateSrv Grafana の TemplateSrv。
     */
    /** @ngInject */
    constructor(instanceSettings: any, backendSrv: any, $q: any, templateSrv: any);
    /**
     * データ取得
     * @param options
     */
    query(options: any): any;
    convertResponse(targets: any[], fieldNames: string[], data: any): any;
    extractValue(obj: any, keys: string[]): any;
    /**
     * Datasource接続テスト
     */
    testDatasource(): any;
    annotationQuery(options: any): void;
    /**
     * Metric検索。本 plugin では NOP。
     * @param options
     */
    metricFindQuery(options: any): any;
    private resolved;
    private rejected;
    private doRequest;
    private buildQueryParameters;
}
