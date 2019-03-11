/// <reference path="grafana-sdk.d.ts" />
import { QueryCtrl, MetricFindQueryResult } from 'app/plugins/sdk';
import { FieldCompleter } from './field_completer';
export interface DataField {
    fieldName: string;
    alias: string;
}
export interface Target {
    bucket: string;
    format: string;
    dataField: DataField[];
    tsField: string;
    aggr: string;
    createDataWith: string;
    seriesNameKey: string;
    seriesValueKey: string;
}
/**
 * BaaS Datasource Query Controller
 */
export declare class BaasDatasourceQueryCtrl extends QueryCtrl {
    static templateUrl: string;
    /** Datasource format */
    FORMATS: ReadonlyArray<any>;
    /** Create Data Method */
    CREATE_DATA_WITH: ReadonlyArray<any>;
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
     * @return {Promise<MetricFindQueryResult[]>} bucket list
     */
    getBuckets(): Promise<MetricFindQueryResult[]>;
    /**
     * onChange event (bucket name)
     */
    onChangeBucket(): void;
    /**
     * Add data field
     */
    addField(): void;
    /**
     * Remove data field
     * @param index index of data field
     */
    removeField(index: any): void;
    /**
     * onChange event (field name)
     * @param index index of data field
     */
    onChangeFieldName(index: any): void;
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
    /**
     * Get default datasource format
     */
    getDefaultFormat(): "table" | "time_series";
    onChangeCreateDataWith(): void;
    onChangeSeriesNameKey(): void;
    onChangeSeriesValueKey(): void;
}
