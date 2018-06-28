declare class QueryCtrl {
    constructor($scope: any, $injector: any);
    target: any;
    panelCtrl: any;
    panel: any;
    datasource: any;
    hasRawMode: boolean;
    error: string;

    refresh(): void;
}

export class BaasDatasourceQueryCtrl extends QueryCtrl {

}