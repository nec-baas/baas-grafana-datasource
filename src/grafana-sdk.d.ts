// grafana sdk type decl (mock)

declare module 'app/plugins/sdk' {
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
}
