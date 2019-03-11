/// <reference path="grafana-sdk.d.ts" />
import { Datasource, BackendSrv, TemplateSrv, InstanceSettings, QueryOptions, QueryOptionsTarget, TimeSeriesQueryResult, QueryResults, TestDatasourceResult, MetricFindQueryResult } from "app/plugins/sdk";
import TableModel from 'app/core/table_model';
import * as Q from 'q';
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
    cacheBuckets: MetricFindQueryResult[];
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
     * @return {Promise<QueryResults>} results
     */
    query(options: QueryOptions): Promise<QueryResults>;
    private buildQueryParameters;
    private filterSameRequest;
    private doRequest;
    private doRequestTargets;
    /**
     * Convert http response of baas server to QueryResults with DataField.
     * @param target
     * @param data response data
     * @return {module:app/plugins/sdk.TimeSeriesQueryResult[]}
     */
    convertResponseWithDataField(target: QueryOptionsTarget, data: any, options: QueryOptions): TimeSeriesQueryResult[];
    /**
     * Convert http response of baas server to QueryResults with Series Name/Value.
     * @param target
     * @param data response data
     * @return {module:app/plugins/sdk.TimeSeriesQueryResult[]}
     */
    convertResponseWithSeries(target: QueryOptionsTarget, data: any, options: QueryOptions): TimeSeriesQueryResult[];
    /**
     * Convert http response of baas server to DataPoint.
     * @param {*} element response object
     * @param {string} valueKey
     * @param {string} tsField
     * @param {QueryOptions} options
     * @returns {any[]} array of [value, epoch]
     */
    convertToDataPoint(element: any, valueKey: string, tsField: string, options: QueryOptions): any[];
    /**
     *Convert http response of baas server to TableModel with DataField.
     * @param {QueryOptionsTarget} target
     * @param {*} data response data
     * @param {TableModel} tableModel for test
     * @returns {TableModel[]}
     */
    convertResponseToTableWithDataField(target: QueryOptionsTarget, data: any, table?: TableModel): TableModel[];
    /**
     *Convert http response of baas server to TableModel with Series Name/Value.
     * @param {QueryOptionsTarget} target
     * @param {*} data response data
     * @param {TableModel} tableModel for test
     * @returns {TableModel[]}
     */
    convertResponseToTableWithSeries(target: QueryOptionsTarget, data: any, table?: TableModel): TableModel[];
    /**
     * Extract value of specified field from JSON.
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
     * @return {Promise<TestDatasourceResult>} result
     */
    testDatasource(): Promise<TestDatasourceResult>;
    /**
     * Annotation query. Not supported.
     * @param options
     * @return {Promise<any>}
     */
    annotationQuery(options: any): Promise<any>;
    /**
     * Metric find query.
     * @param {string} query condition
     * @return {Promise<MetricFindQueryResult[]>} results
     */
    metricFindQuery(query: string): Promise<MetricFindQueryResult[]>;
    /**
     * Get latest object.
     * @param {string} bucket name
     * @return {Promise<any>} result
     */
    getLatestObject(bucket: string): Promise<any>;
}
