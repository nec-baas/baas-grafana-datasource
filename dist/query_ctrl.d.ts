/// <reference path="grafana-sdk.d.ts" />
import { QueryCtrl } from 'app/plugins/sdk';
export interface Target {
    target: string;
    type: string;
    rawQuery: boolean;
}
export declare class BaasDatasourceQueryCtrl extends QueryCtrl {
    static templateUrl: string;
    /** angular scope object */
    scope: any;
    /** Target */
    target: Target;
    constructor($scope: any, $injector: any);
    getOptions(query: any): any;
    toggleEditorMode(): void;
    onChangeInternal(): void;
}
