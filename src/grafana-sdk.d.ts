// grafana sdk type decl (mock)

declare module 'app/plugins/sdk' {
    import * as Q from 'q';

    // app/features/panel/query_ctrl.ts
    export class QueryCtrl {
        constructor($scope: any, $injector: any);

        target: any;
        panelCtrl: any;
        panel: any;
        datasource: any;
        hasRawMode: boolean;
        error: string;

        refresh(): void;
    }

    // app/core/services/backend_srv.ts
    export class BackendSrv {
        datasourceRequest(option: BackendSrvRequest): Q.Promise<BackendSrvResponse>;
    }

    // app/core/services/backend_srv.ts
    export class TemplateSrv {
        replace(target: string, scopedVars?: any, format?: any): string;
    }

    // Datasource settings
    export interface InstanceSettings {
        name: string;
        url: string;
        jsonData?: BaasSettings;
        basicAuth?: string;
        withCredentials?: boolean;
    }
    export interface BaasSettings {
        tenantId: string;
        appId: string;
        appKey: string;
    }

    /**
     * Datasource
     */
    export interface Datasource {
        query(options: QueryOptions): Q.Promise<QueryResults>;
        testDatasource(): Q.Promise<any>;
        annotationQuery(options: any): Q.Promise<any>;
        metricFindQuery(query: string): Q.Promise<MetricFindQueryResult[]>;
    }

    // Datasource query options
    export interface QueryOptions {
        range?: QueryRange;
        interval?: string;
        targets: QueryOptionsTarget[];
        format?: string;
        maxDataPoints?: number;
        scopedVars?: any;
    }
    export interface QueryRange {
        from: string;
        to: string;
    }
    export interface QueryOptionsTarget {
        refId?: string;
        bucket: string;
        fieldName: string;
        tsField?: string;
        aggr?: string;
        alias?: string;
        hide?: boolean;
        type?: string;
        reqIndex?: number;
    }

    // BackendSrv.datasourceRequest request
    export interface BackendSrvRequest {
        url: string;
        method: string;
        data?: any;
        headers?: any;
        withCredentials?: boolean;
    }

    // BackendSrv.datasourceRequest response
    export interface BackendSrvResponse {
        status:  number;
        statusText: string;
        data: any;
    }

    // Datasource.query response
    export interface QueryResults {
        data: TimeSerieQueryResult[];
    }
    export interface TimeSerieQueryResult {
        target: string,
        datapoints: any[]; // array of [value, epoch]
    }

    // Datasource.testDatasource response
    export interface TestDatasourceResult {
        status: string;
        message: string;
    }

    // Datasource.metricFindQuery response
    export interface MetricFindQueryResult {
        text: string;
        value: any;
    }

    /**
     * Completer of Code Editor
     */
    export interface Completion {
        caption: string;
        value: string;
        meta: string;
    }

    export interface CursorPosition {
        column: number;
        row: number;
    }
}
