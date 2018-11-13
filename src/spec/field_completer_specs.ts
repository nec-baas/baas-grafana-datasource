// datasource specs

import {describe, it} from "mocha";
import {assert, expect} from "chai";
import * as sinon from "sinon";

import {BaasDatasource} from "../datasource";
import {FieldCompleter} from "../field_completer";

describe('FieldCompleter', () => {
    const testObject = {
        _id: "123456789012345678901234",
        payload: {
            field1: 111.1,
            field2: 222.2,
            field3: {
                field31: 31.1,
                field32: 32.1,
                field33: 33.1
            }
        },
        array: [
            {
                array1: 1,
                array2: 2
            },
            "array2",
            1234
        ],
        nul: null,
        updatedAt: "2018-01-01T00:00:00.011Z"
    }

    const createDatasource = () => {
        const setting = {
            name: 'name',
            url: '/api',
            jsonData: {
                tenantId: 'tenant1',
                appId: 'app1',
                appKey: 'key1'
            }
        };
        return new BaasDatasource(setting, null, null, null);
    }

    const createGetLatestObjectStub = (ds, obj) => {
        const stub = sinon.stub(ds, 'getLatestObject');

        stub.returns(
            new Promise((resolve, reject) => {
                resolve(obj);
            })
        );

        return stub;
    };

    const buildCompleter = (keys) => {
        const completer = [];
        for (let key of keys) {
            completer.push({
                "caption": key,
                "value": key,
                "meta": "field name"
            });
        }
        return completer;
    }

    it('should getCompletions works: empty bucket', (done) => {
        const ds = createDatasource();
        const fc = new FieldCompleter(ds, "");
        const stub = createGetLatestObjectStub(ds, testObject);

        const session = "a";
        const pos = {row: 0, column: 1};
        const callback = (error, completions) => {
            try {
                assert.isNull(error);
                assert.isArray(completions);
                assert.isEmpty(completions);
                assert.isTrue(stub.notCalled);
                done();
            } catch (e) {
                done(e);
            } 
        }

        fc.getCompletions(null, session, pos, null, callback);
    });

    it('should getCompletions works: cursor is not first line', (done) => {
        const ds = createDatasource();
        const fc = new FieldCompleter(ds, "bucket1");
        const stub = createGetLatestObjectStub(ds, testObject);

        const session = "a";
        const pos = {row: 1, column: 1};
        const callback = (error, completions) => {
            try {
                assert.isNull(error);
                assert.isArray(completions);
                assert.isEmpty(completions);
                assert.isTrue(stub.notCalled);
                done();
            } catch (e) {
                done(e);
            }
        }

        fc.getCompletions(null, session, pos, null, callback);
    });

    it('should getCompletions works: no object', (done) => {
        const ds = createDatasource();
        const fc = new FieldCompleter(ds, "bucket1");
        const stub = createGetLatestObjectStub(ds, {});

        const session = "a";
        const pos = {row: 0, column: 1};
        const callback = (error, completions) => {
            try {
                assert.isNull(error);
                assert.isArray(completions);
                assert.isEmpty(completions);
                assert.equal(stub.callCount, 1);
                done();
            } catch (e) {
                done(e);
            }
        }

        fc.getCompletions(null, session, pos, null, callback);
    });

    it('should getCompletions works: top level', (done) => {
        const ds = createDatasource();
        const fc = new FieldCompleter(ds, "bucket1");
        const stub = createGetLatestObjectStub(ds, testObject);

        const session = "a";
        const pos = {row: 0, column: 1};

        const callback2 = (error, completions) => {
            try {
                assert.isNull(error);
                assert.deepEqual(completions, buildCompleter(["_id", "payload", "array", "nul", "updatedAt"]));
                assert.equal(stub.callCount, 1);
                done();
            } catch (e) {
                done(e);
            }
        }

        const callback = (error, completions) => {
            try {
                assert.isNull(error);
                assert.deepEqual(completions, buildCompleter(["_id", "payload", "array", "nul", "updatedAt"]));
                assert.equal(stub.callCount, 1);

                fc.getCompletions(null, session, pos, null, callback2); // use cache
            } catch (e) {
                done(e);
            }
        }

        fc.getCompletions(null, session, pos, null, callback);
    });

    it('should getCompletions works: array', (done) => {
        const ds = createDatasource();
        const fc = new FieldCompleter(ds, "bucket1");
        const stub = createGetLatestObjectStub(ds, testObject);

        const session = "array.0";
        const pos = {row: 0, column: 6};

        const callback2 = (error, completions) => {
            try {
                assert.isNull(error);
                assert.deepEqual(completions, buildCompleter(["0", "1", "2"]));
                assert.equal(stub.callCount, 2);
                done();
            } catch (e) {
                done(e);
            }
        }

        const callback = (error, completions) => {
            try {
                assert.isNull(error);
                assert.deepEqual(completions, buildCompleter(["0", "1", "2"]));
                assert.equal(stub.callCount, 1);

                fc.clearCache()
                fc.getCompletions(null, session, pos, null, callback2);
            } catch (e) {
                done(e);
            }
        }

        fc.getCompletions(null, session, pos, null, callback);
    });

    it('should getCompletions works: nested object', (done) => {
        const ds = createDatasource();
        const fc = new FieldCompleter(ds, "bucket1");
        const stub = createGetLatestObjectStub(ds, testObject);

        const session = "payload.field3.f";
        const pos = {row: 0, column: 15};
        const callback = (error, completions) => {
            try {
                assert.isNull(error);
                assert.deepEqual(completions, buildCompleter(["field31", "field32", "field33"]));
                assert.equal(stub.callCount, 1);
                done();
            } catch (e) {
                done(e);
            }
        }

        fc.getCompletions(null, session, pos, null, callback);
    });

    it('should getCompletions works: cursor position', (done) => {
        const ds = createDatasource();
        const fc = new FieldCompleter(ds, "bucket1");
        const stub = createGetLatestObjectStub(ds, testObject);

        const session = "payload.field3.f";
        const pos = {row: 0, column: 10};
        const callback = (error, completions) => {
            try {
                assert.isNull(error);
                assert.deepEqual(completions, buildCompleter(["field1", "field2", "field3"]));
                assert.equal(stub.callCount, 1);
                done();
            } catch (e) {
                done(e);
            }
        }

        fc.getCompletions(null, session, pos, null, callback);
    });

    it('should getCompletions works: not object', (done) => {
        const ds = createDatasource();
        const fc = new FieldCompleter(ds, "bucket1");
        const stub = createGetLatestObjectStub(ds, testObject);

        const session = "updatedAt.a";
        const pos = {row: 0, column: 10};
        const callback = (error, completions) => {
            try {
                assert.isNull(error);
                assert.isArray(completions);
                assert.isEmpty(completions);
                assert.equal(stub.callCount, 1);
                done();
            } catch (e) {
                done(e);
            }
        }

        fc.getCompletions(null, session, pos, null, callback);
    });

    it('should getCompletions works: unnkown field', (done) => {
        const ds = createDatasource();
        const fc = new FieldCompleter(ds, "bucket1");
        const stub = createGetLatestObjectStub(ds, testObject);

        const session = "unknown.field.a";
        const pos = {row: 0, column: 14};
        const callback = (error, completions) => {
            try {
                assert.isNull(error);
                assert.isArray(completions);
                assert.isEmpty(completions);
                assert.equal(stub.callCount, 1);
                done();
            } catch (e) {
                done(e);
            }
        }

        fc.getCompletions(null, session, pos, null, callback);
    });

    it('should getCompletions works: null value', (done) => {
        const ds = createDatasource();
        const fc = new FieldCompleter(ds, "bucket1");
        const stub = createGetLatestObjectStub(ds, testObject);

        const session = "nul.field";
        const pos = {row: 0, column: 8};
        const callback = (error, completions) => {
            try {
                assert.isNull(error);
                assert.isArray(completions);
                assert.isEmpty(completions);
                assert.equal(stub.callCount, 1);
                done();
            } catch (e) {
                done(e);
            }
        }

        fc.getCompletions(null, session, pos, null, callback);
    });

    it('should getCompletions works: out of array', (done) => {
        const ds = createDatasource();
        const fc = new FieldCompleter(ds, "bucket1");
        const stub = createGetLatestObjectStub(ds, testObject);

        const session = "array.3.a";
        const pos = {row: 0, column: 8};
        const callback = (error, completions) => {
            try {
                assert.isNull(error);
                assert.isArray(completions);
                assert.isEmpty(completions);
                assert.equal(stub.callCount, 1);
                done();
            } catch (e) {
                done(e);
            }
        }

        fc.getCompletions(null, session, pos, null, callback);
    });
});
