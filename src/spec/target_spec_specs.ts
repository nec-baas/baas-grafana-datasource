// datasource specs

import {describe, it} from "mocha";
import {assert, expect} from "chai";
//import * as sinon from "sinon";
import * as _ from "underscore";

import {TargetSpec} from "../target_spec";

describe('TargetSpec', () => {
    it("normal target", () => {
        const t = new TargetSpec("bucket.field");
        assert.equal(t.bucketName, "bucket");
        assert.equal(t.fieldName, "field");
    });

    it("deep field", () => {
        const t = new TargetSpec("bucket.a.b.c.d.e");
        assert.equal(t.bucketName, "bucket");
        assert.equal(t.fieldName, "a.b.c.d.e");
    });

    it("full options", () => {
        const t = new TargetSpec("bucket.a.b.c%{\"pipeline\": []}?{\"key\":1}@ts");
        assert.equal(t.bucketName, "bucket");
        assert.equal(t.fieldName, "a.b.c");
        assert.isOk(_.isEqual(t.aggr, {"pipeline": []}));
        assert.isOk(_.isEqual(t.where, {"key": 1}));
        assert.equal(t.tsField, "ts");
    });
});