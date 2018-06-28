/// <reference path="./grafana-sdk.d.ts" />

import {QueryCtrl} from 'app/plugins/sdk';

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
