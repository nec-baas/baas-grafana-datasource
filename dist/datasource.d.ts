export default class BaasDatasource {
    name: string;
    baseUri: string;
    tenantId: string;
    headers: any;
    backendSrv: any;
    templateSrv: any;
    q: any;
    static TimeStampFields: string[];
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
    convertResponse(targets: any[], fieldNames: string[], tsFields: string[], data: any): any;
    /**
     * JSON から特定フィールドの値を取得する
     * @param obj JSON Object
     * @param {string} key フィールド指定
     * @returns {any} 値
     */
    extractValue(obj: any, key: string): any;
    /**
     * JSON からタイムスタンプ値を取り出す
     * @param obj JSON Object
     * @param {string} tsField タイムスタンプフィールド名。null は自動推定。
     * @returns {Date} タイムスタンプ
     */
    extractTimestamp(obj: any, tsField: string): Date;
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
