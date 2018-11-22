/// <reference path="grafana-sdk.d.ts" />
import { Datasource, BackendSrv, TemplateSrv, InstanceSettings, QueryOptions, QueryOptionsTarget, TimeSerieQueryResult, QueryResults, TestDatasourceResult, MetricFindQueryResult } from "app/plugins/sdk";
/**
 * BaaS Datasource
 */
export declare class BaasDatasource implements Datasource {
    private backendSrv;
    private $q;
    private templateSrv;
    name: string;
    baseUri: string;
    tenantId: string;
    headers: any;
    withCredentials: boolean;
    cacheBuckets: string[];
    deferredBuckets: Q.Deferred<MetricFindQueryResult[]>[];
    private log;
    /**
     * Constructor
     * @param instanceSettings, configured by partials/config.html.
     * @param backendSrv BackendSrv of Grafana.
     * @param $q $q service of AngularJS 1.x.
     * @param templateSrv TemplateSrv of Grafana.
     */
    /** @ngInject */
    constructor(instanceSettings: InstanceSettings, backendSrv: BackendSrv, $q: any, templateSrv: TemplateSrv);
    /**
     * Query metrics from data source.
     * @param {module:app/plugins/sdk.QueryOptions} options
     * @return {Q.Promise<QueryResults>} results
     */
    query(options: QueryOptions): Q.Promise<QueryResults>;
    private buildQueryParameters;
    private filterSameRequest;
    private doRequest;
    private doRequestTargets;
    /**
     * Convert http response of baas server to QueryResults.
     * @param target
     * @param data response data
     * @return {module:app/plugins/sdk.TimeSerieQueryResult}
     */
    convertResponse(target: QueryOptionsTarget, data: any): TimeSerieQueryResult;
    /**
     * Extract value of specified filed from JSON.
     * @param obj JSON Object
     * @param {string} key field name, separated with period.
     * @returns {any} value
     */
    extractValue(obj: any, key: string): any;
    /**
     * Extract timestamp value from JSON.
     * @param obj JSON Object
     * @param {string} tsField time stamp field name, null for auto inference.
     * @returns {Date} timestamp
     */
    extractTimestamp(obj: any, tsField: string): Date;
    /**
     * Test datasource connection.
     * @return {Q.Promise<TestDatasourceResult>} result
     */
    testDatasource(): Q.Promise<TestDatasourceResult>;
    /**
     * Annotation query. Not supported.
     * @param options
     * @return {Q.Promise<any>}
     */
    annotationQuery(options: any): Q.Promise<any>;
    /**
     * Metric find query.
     * @param {string} query condition
     * @return {Q.Promise<MetricFindQueryResult[]>} results
     */
    metricFindQuery(query: string): Q.Promise<MetricFindQueryResult[]>;
    /**
     * Get latest object.
     * @param {string} bucket name
     * @return {Q.Promise<object>} result
     */
    getLatestObject(bucket: string): Q.Promise<object>;
}
