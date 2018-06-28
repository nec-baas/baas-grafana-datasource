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
    static templateUrl = 'partials/query.editor.html';

    constructor($scope: any, $injector: any) {
        super($scope, $injector);
    }

    getOptions(query: any) {
        return this.datasource.metricFindQuery('');
    }

    toggleEditorMode() {
        this.target.rawQuery = !this.target.rawQuery;
    }

    onChangeInternal() {
        this.panelCtrl.refresh();
    }
}
