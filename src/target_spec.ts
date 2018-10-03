/// <reference path="./grafana-sdk.d.ts" />

function parseJson(json: string): object {
    if (json == null) return null;
    return JSON.parse(json);
}

/**
 * Target spec
 */
export class TargetSpec {
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

    constructor(target: string) {
        this.target = target;

        // regexp: matches "target%aggr?where@ts"
        const res = target.match(/^(.*?)(?:%(.*?))?(?:\?(.*?))?(?:@(.*))?$/);
        target = res[1];
        this.aggr = parseJson(res[2]);
        this.where = parseJson(res[3]);
        this.tsField = res[4];

        // Split bucket name and field spec.
        let t = target.split(".");
        if (t.length < 2) {
            throw new Error("Bad target.");
        }
        this.bucketName = t[0];
        t.shift();
        this.fieldName = t.join(".");
    }
}
