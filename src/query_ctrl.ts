/// <reference path="./grafana-sdk.d.ts" />

import {QueryCtrl, MetricFindQueryResult} from 'app/plugins/sdk';
import {BaasDatasource} from './datasource';
import {FieldCompleter} from './field_completer';

export interface Target {
    bucket: string;
    fieldName: string;
    tsField: string;
    aggr: string;
    alias: string;
}

/**
 * BaaS Datasource Query Controller
 */
export class BaasDatasourceQueryCtrl extends QueryCtrl {
    static templateUrl = 'partials/query.editor.html';

    /** Old target */
    oldTarget: Target;

    /** Field completer */
    fieldCompleter: FieldCompleter;

    /**
     * Constructor
     * @param $scope scope of AngularJS 1.x.
     * @param $injector $injector service of AngularJS 1.x.
     */
    /** @ngInject */
    constructor($scope: any, $injector: any) {
        super($scope, $injector);
        this.target.bucket = this.target.bucket || '';
        this.target.fieldName = this.target.fieldName || '';
        this.target.tsField = this.target.tsField || '';
        this.target.aggr = this.target.aggr || '';
        this.target.alias = this.target.alias || '';
        this.oldTarget = JSON.parse(JSON.stringify(this.target)); // deep copy
        this.fieldCompleter = new FieldCompleter(this.datasource, this.target.bucket);
    }

    /**
     * Get bucket list
     * @return {Q.Promise<any>} bucket list
     */
    getBuckets(): Q.Promise<MetricFindQueryResult[]> {
        return this.datasource.metricFindQuery("buckets");
    }

    /**
     * onChange event (bucket name)
     */
    onChangeBucket() {
        if (this.onChangeInternal("bucket")) {
            this.fieldCompleter.setBucket(this.target.bucket);
        }
    }

    /**
     * onChange event (field name)
     */
    onChangeFieldName() {
        this.onChangeInternal("fieldName");
        this.fieldCompleter.clearCache()
    }

    /**
     * onChange event (timestamp field)
     */
    onChangeTsField() {
        this.onChangeInternal("tsField");
        this.fieldCompleter.clearCache()
    }

    /**
     * onChange event (aggregation pipeline)
     */
    onChangeAggregate() {
        this.onChangeInternal("aggr");
    }

    private onChangeInternal(key: string): boolean {
        if (this.target[key] === this.oldTarget[key]) {
            return false;
        }

        this.oldTarget[key] = this.target[key];
        this.panelCtrl.refresh();
        return true;
    }

    /**
     * Get completer
     */
    getCompleter(): FieldCompleter {
        return this.fieldCompleter;
    }
}
