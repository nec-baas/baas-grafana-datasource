/// <reference path="grafana-sdk.d.ts" />
import { QueryCtrl } from 'app/plugins/sdk';
export declare class BaasDatasourceQueryCtrl extends QueryCtrl {
    static templateUrl: string;
    constructor($scope: any, $injector: any);
    getOptions(query: any): any;
    toggleEditorMode(): void;
    onChangeInternal(): void;
}
