/// <reference path="./grafana-sdk.d.ts" />

import {QueryCtrl, MetricFindQueryResult} from 'app/plugins/sdk';
import {FieldCompleter} from './field_completer';

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
export class BaasDatasourceQueryCtrl extends QueryCtrl {
    static templateUrl = 'partials/query.editor.html';

    /** Datasource format */
    FORMATS: ReadonlyArray<any> = [
        { text: 'Time series', value: 'time_series' },
        { text: 'Table', value: 'table' },
    ];

    /** Create Data Method */
    CREATE_DATA_WITH: ReadonlyArray<any> = [
        { text: 'Data field', value: 'data_field' },
        { text: 'Series Name/Value key', value: 'series_name_value_key' },
    ];

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
        this.target.tsField = this.target.tsField || '';
        this.target.aggr = this.target.aggr || '';
        this.target.dataField = this.target.dataField || [];

        // 旧バージョンのTarget型を変換する
        if (this.target.fieldName) {
            this.target.dataField.push({
                fieldName: this.target.fieldName,
                alias: this.target.alias || ''
            });
        }

        if (this.target.dataField.length == 0) {
            this.target.dataField.push({ "fieldName": "", "alias": "" });
        }

        this.target.fieldName = undefined;
        this.target.alias = undefined;
        this.target.format = this.target.format || this.getDefaultFormat();

        this.oldTarget = JSON.parse(JSON.stringify(this.target)); // deep copy
        this.fieldCompleter = new FieldCompleter(this.datasource, this.target.bucket);

        this.target.createDataWith = this.target.createDataWith || 'data_field';
        this.target.seriesNameKey = this.target.seriesNameKey || '';
        this.target.seriesValueKey = this.target.seriesValueKey || '';
    }

    /**
     * Get bucket list
     * @return {Promise<MetricFindQueryResult[]>} bucket list
     */
    getBuckets(): Promise<MetricFindQueryResult[]> {
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
     * Add data field
     */
    addField() {
        this.target.dataField.push({"fieldName": "", "alias": ""});
        this.oldTarget.dataField.push({"fieldName": "", "alias": ""});
    }

    /**
     * Remove data field
     * @param index index of data field
     */
    removeField(index) {
        this.target.dataField.splice(index, 1);
        this.oldTarget.dataField.splice(index, 1);
        if (this.target.dataField.length == 0) {
            this.addField();
        }
        this.panelCtrl.refresh();
    }

    /**
     * onChange event (field name)
     * @param index index of data field
     */
    onChangeFieldName(index) {
        if (this.target.dataField[index].fieldName !== this.oldTarget.dataField[index].fieldName) {
            this.oldTarget.dataField[index].fieldName = this.target.dataField[index].fieldName;
            this.panelCtrl.refresh();
        }
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

    /**
     * Get default datasource format
     */
    getDefaultFormat() {
        if (this.panelCtrl.panel.type === 'table') {
            return 'table';
        }
        return 'time_series';
    }

    onChangeCreateDataWith() {
        this.onChangeInternal("createDataWith");
    }

    onChangeSeriesNameKey() {
        this.onChangeInternal("seriesNameKey");
    }

    onChangeSeriesValueKey() {
        this.onChangeInternal("seriesValueKey");
    }
}
