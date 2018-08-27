/// <reference path="grafana-sdk.d.ts" />
import { Datasource, QueryOptions, QueryResults, MetricFindQueryResults } from "app/plugins/sdk";
import * as Q from 'q';
/**
 * Target spec
 */
export declare class TargetSpec {
    /** target string */
    target: string;
    /** bucket name */
    bucketName: string;
    /** field name */
    fieldName: string;
    /** timestamp field name */
    tsField: string;
    constructor(target: string);
}
/**
 * BaaS Datasource
 */
export declare class BaasDatasource implements Datasource {
    name: string;
    baseUri: string;
    tenantId: string;
    headers: any;
    backendSrv: any;
    templateSrv: any;
    q: any;
    /** Candidates of time stamp field name */
    static TimeStampFields: string[];
    private log;
    /**
     * Constructor
     * @param instanceSettings, configured by partials/config.html.
     * @param backendSrv BackendSrv of Grafana.
     * @param $q $q service of AngularJS 1.x.
     * @param templateSrv TemplateSrv of Grafana.
     */
    /** @ngInject */
    constructor(instanceSettings: any, backendSrv: any, $q: any, templateSrv: any);
    /**
     * Query metrics from data source.
     * @param {module:app/plugins/sdk.QueryOptions} options
     * @return {Q.Promise<QueryResults>} results
     */
    query(options: QueryOptions): Q.Promise<QueryResults>;
    /**
     * Convert http response of baas server to QueryResults.
     * @param {TargetSpec[]} targets
     * @param data response data
     * @return {module:app/plugins/sdk.QueryResults}
     */
    convertResponse(targets: TargetSpec[], data: any): QueryResults;
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
     * note: no authentication is tested.
     */
    testDatasource(): Q.Promise<any>;
    /**
     * Annotation query. Not supported.
     * @param options
     * @return {Q.Promise<any>}
     */
    annotationQuery(options: any): Q.Promise<any>;
    /**
     * Metric find query. Not implemented.
     * @param options
     * @return {Q.Promise<any>}
     */
    metricFindQuery(options: string): Q.Promise<MetricFindQueryResults>;
    private resolved;
    private rejected;
    private doRequest;
    private buildQueryParameters;
}
