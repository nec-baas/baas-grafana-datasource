// grafana sdk type decl (mock)

declare module 'app/core/table_model' {
    //app/core/table_model.ts
    export default class TableModel {
        columns: Column[];
        rows: any[];
        type: string;
        columnMap: any;

        constructor(table?: any);
        addColumn(col: Column);
        addRow(row: any);
    }

    export interface Column {
        text: string;
        title?: string;
        type?: string;
        sort?: boolean;
        desc?: boolean;
        filterable?: boolean;
        unit?: string;
    }
}

declare module 'app/plugins/sdk' {
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
        datasourceRequest(option: BackendSrvRequest): Promise<BackendSrvResponse>;
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
        query(options: QueryOptions): Promise<QueryResults>;
        testDatasource(): Promise<TestDatasourceResult>;
        annotationQuery(options: any): Promise<any>;
        metricFindQuery(query: string): Promise<MetricFindQueryResult[]>;
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
        format?: string; // Required since v7.5.1
        dataField?: DataField[]; // Required since v7.5.1
        fieldName?: string; // Ignored since v7.5.1
        tsField?: string;
        aggr?: string;
        alias?: string; // Ignored since v7.5.1
        hide?: boolean;
        type?: string;
        reqIndex?: number;
        createDataWith?: string; // Required since v7.5.1
        seriesNameKey?: string; // Required since v7.5.1
        seriesValueKey?: string; // Required since v7.5.1
    }
    export interface DataField {
        fieldName: string;
        alias: string;
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
        data: TimeSeriesQueryResult[];
    }
    export interface TimeSeriesQueryResult {
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
