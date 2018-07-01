// grafana sdk type decl (mock)

declare module 'app/plugins/sdk' {
    import * as Q from 'q';

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
        metricFindQuery(options: any): Q.Promise<any>;
    }

    // Datasource query options
    export interface QueryOptions {
        scopedVars?: any;
        range?: QueryRange;
        targets: QueryOptionsTarget[];
        maxDataPoints?: number;
    }
    export interface QueryRange {
        from: string;
        to: string;
    }
    export interface QueryOptionsTarget {
        target: string;
        refId?: string;
        hide?: boolean;
        type?: string;
    }

    // Datasource.query response
    export interface QueryResults {
        data: QueryResult[];
    }
    export interface QueryResult {
        target: string,
        datapoints: any[]; // array of [value, epoch]
    }
}
