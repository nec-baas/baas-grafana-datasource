/// <reference path="./grafana-sdk.d.ts" />

import {QueryCtrl} from 'app/plugins/sdk';

export interface Target {
    target: string;
    type: string; // timeserie or table
    rawQuery: boolean;
}

export class BaasDatasourceQueryCtrl extends QueryCtrl {
    static templateUrl = 'partials/query.editor.html';

    /** angular scope object */
    scope: any;

    /** Target */
    target: Target;

    constructor($scope: any, $injector: any) {
        super($scope, $injector);
        this.scope = $scope;
        this.target.target = this.target.target || 'select metric';
        this.target.type = 'timeserie';
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
