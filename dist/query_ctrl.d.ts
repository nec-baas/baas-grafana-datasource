/// <reference path="grafana-sdk.d.ts" />
import { QueryCtrl, MetricFindQueryResult } from 'app/plugins/sdk';
import { FieldCompleter } from './field_completer';
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
export declare class BaasDatasourceQueryCtrl extends QueryCtrl {
    static templateUrl: string;
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
    constructor($scope: any, $injector: any);
    /**
     * Get bucket list
     * @return {Q.Promise<any>} bucket list
     */
    getBuckets(): Q.Promise<MetricFindQueryResult[]>;
    /**
     * onChange event (bucket name)
     */
    onChangeBucket(): void;
    /**
     * onChange event (field name)
     */
    onChangeFieldName(): void;
    /**
     * onChange event (timestamp field)
     */
    onChangeTsField(): void;
    /**
     * onChange event (aggregation pipeline)
     */
    onChangeAggregate(): void;
    private onChangeInternal;
    /**
     * Get completer
     */
    getCompleter(): FieldCompleter;
}
