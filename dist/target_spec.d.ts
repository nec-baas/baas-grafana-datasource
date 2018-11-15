/// <reference path="grafana-sdk.d.ts" />
/**
 * Target spec
 */
export declare class TargetSpec {
    /** target string */
    target: string;
    /** bucket name */
    bucketName: string;
    /** field name */
    fieldName: string;
    /** aggregation */
    aggr: any;
    /** query(where) */
    where: any;
    /** timestamp field name */
    tsField: string;
    constructor(target: string);
}
