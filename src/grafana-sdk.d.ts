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

    /**
     * Datasource
     */
    export interface Datasource {
        query(options: QueryOptions): Q.Promise<QueryResults>;
        testDatasource(): Q.Promise<any>;
        annotationQuery(options: any): Q.Promise<any>;
        metricFindQuery(query: string): Q.Promise<MetricFindQueryResults>;
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
    }

    // Datasource.query response
    export interface QueryResults {
        data: TimeSerieQueryResult[];
    }
    export interface TimeSerieQueryResult {
        target: string,
        datapoints: any[]; // array of [value, epoch]
    }

    // Datasource.metricFindQuery response
    export interface MetricFindQueryResults {
        data: Metric[];
    }
    export interface Metric {
        text?: string;
        value?: any;
    }
}
