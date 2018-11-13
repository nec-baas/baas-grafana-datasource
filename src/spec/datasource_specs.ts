// datasource specs

import {describe, it} from "mocha";
import {assert, expect} from "chai";
import * as sinon from "sinon";

import {BaasDatasource} from "../datasource";

describe('Datasource', () => {
    const createInstanceSettings = () => {
        return {
            name: 'name',
            url: '/api',
            jsonData: {
                tenantId: 'tenant1',
                appId: 'app1',
                appKey: 'key1'
            }
        };
    };

    const createQ = () => {
        return {
            defer: () => {
                const deferred: any = {};
                const promise = new Promise((resolve, reject) => {
                    deferred.resolve = resolve;
                    deferred.reject = reject;
                });
                deferred.promise = promise;
                return deferred;
            },
            when: (vl) => {
                return Promise.resolve(vl);
            },
            all: (promises) => {
                return Promise.all(promises);
            }
        }
    };

    let backendSrv;
    let templateSrv;
    let $q;

    const createInstance = () => {
        const instanceSettings = createInstanceSettings();
        backendSrv = {
            datasourceRequest: (req) => { return {}; }
        };

        templateSrv = {
            replace: (s) => { return s; }
        };

        $q = createQ();

        const ds = new BaasDatasource(instanceSettings, backendSrv, $q, templateSrv);
        return ds;
    };

    const createDatasourceRequestStub = (bs) => {
        const stub = sinon.stub(bs, 'datasourceRequest');

        stub.onCall(0).returns(
            new Promise((resolve, reject) => {
                resolve({
                    status: 200,
                    data: {
                        results: [{
                             payload: {field1: 111.1, field2: 123.4, timestamp: "2018-01-01T00:00:00.001Z"},
                             updatedAt: "2018-01-01T00:00:00.011Z"
                        }]
                    }
                })
            })
        );

        stub.onCall(1).returns(
            new Promise((resolve, reject) => {
                resolve({
                    status: 200,
                    data: {
                        results: [{
                            payload: {field1: 222.2, field2: 234.5, timestamp: "2018-01-01T00:00:00.002Z"},
                            updatedAt: "2018-01-01T00:00:00.022Z"
                        }]
                    }
                })
            })
        );

        return stub;
    };

    it('constructor', () => {
        const ds = new BaasDatasource(createInstanceSettings(), null, null, null);
        assert.equal(ds.tenantId, 'tenant1');
        assert.equal(ds.headers["X-Application-Id"], 'app1');
        assert.equal(ds.headers["X-Application-Key"], 'key1');
        assert.equal(ds.headers["Content-Type"], 'application/json');
    });

    it('should query with empty targets', () => {
        const ds = createInstance();
        const stub = createDatasourceRequestStub(backendSrv);

        const options = {
            targets: []
        };

        const promise = ds.query(options);
        return promise.then((resp) => {
            assert.isTrue(stub.notCalled);
            assert.equal(resp.data.length, 0);
        });
    });

    it('should query with invalid targets: bucket name is empty', () => {
        const ds = createInstance();
        const stub = createDatasourceRequestStub(backendSrv);

        const options = {
            range: {
                from: "2018-01-01T00:00:00.000Z",
                to: "2018-02-01T00:00:00.000Z"
            },
            targets: [{
                bucket: "",
                fieldName: "payload.field1",
                tsField: "payload.timestamp",
                aggr: "",
                alias: ""
            }]
        };

        const promise = ds.query(options);
        return promise.then((resp) => {
            assert.isTrue(stub.notCalled);
            assert.equal(resp.data.length, 0);
        });
    });

    it('should query with invalid targets: field name is empty', () => {
        const ds = createInstance();
        const stub = createDatasourceRequestStub(backendSrv);

        const options = {
            range: {
                from: "2018-01-01T00:00:00.000Z",
                to: "2018-02-01T00:00:00.000Z"
            },
            targets: [{
                bucket: "bucket1",
                fieldName: "",
                tsField: "payload.timestamp",
                aggr: "",
                alias: ""
            }]
        };

        const promise = ds.query(options);
        return promise.then((resp) => {
            assert.isTrue(stub.notCalled);
            assert.equal(resp.data.length, 0);
        });
    });

    it('should query with hidden targets', () => {
        const ds = createInstance();
        const stub = createDatasourceRequestStub(backendSrv);

        const options = {
            range: {
                from: "2018-01-01T00:00:00.000Z",
                to: "2018-02-01T00:00:00.000Z"
            },
            targets: [{
                bucket: "bucket1",
                fieldName: "payload.field1",
                tsField: "payload.timestamp",
                aggr: "",
                alias: "",
                hide: true
            }]
        };

        const promise = ds.query(options);
        return promise.then((resp) => {
            assert.isTrue(stub.notCalled);
            assert.equal(resp.data.length, 0);
        });
    });

    it('should query with one target', () => {
        const ds = createInstance();
        const stub = createDatasourceRequestStub(backendSrv);

        const options = {
            range: {
                from: "2018-01-01T00:00:00.000Z",
                to: "2018-02-01T00:00:00.000Z"
            },
            targets: [{
                bucket: "bucket1",
                fieldName: "payload.field1",
                tsField: "payload.timestamp",
                aggr: "",
                alias: ""
            }]
        };

        const promise = ds.query(options);
        return promise.then((resp) => {
            assert.equal(stub.callCount, 1);
            assert.equal(resp.data.length, 1);
            assert.equal(resp.data[0].target, "bucket1.payload.field1");
            assert.deepEqual(resp.data[0].datapoints, [[111.1, 1514764800001]]);
        });
    });

    it('should query with two targets', () => {
        const ds = createInstance();
        const stub = createDatasourceRequestStub(backendSrv);

        const options = {
            range: {
                from: "2018-01-01T00:00:00.000Z",
                to: "2018-02-01T00:00:00.000Z"
            },
            targets: [{
                bucket: "bucket1",
                fieldName: "payload.field1",
                tsField: "payload.timestamp",
                aggr: "",
                alias: ""
            },
            {
                bucket: "bucket2",
                fieldName: "payload.field1",
                tsField: "",
                aggr: "[]",
                alias: "aggregate2"
            }]
        };

        const promise = ds.query(options);
        return promise.then((resp) => {
            assert.equal(stub.callCount, 2);
            assert.equal(resp.data.length, 2);
            assert.equal(resp.data[0].target, "bucket1.payload.field1");
            assert.deepEqual(resp.data[0].datapoints, [[111.1, 1514764800001]]);
            assert.equal(resp.data[1].target, "aggregate2");
            assert.deepEqual(resp.data[1].datapoints, [[222.2, 1514764800022]]);

        });
    });

    it('should query with three targets: same query', () => {
        const ds = createInstance();
        const stub = createDatasourceRequestStub(backendSrv);

        const options = {
            range: {
                from: "2018-01-01T00:00:00.000Z",
                to: "2018-02-01T00:00:00.000Z"
            },
            targets: [{
                bucket: "bucket1",
                fieldName: "payload.field1",
                tsField: "payload.timestamp",
                aggr: "",
                alias: ""
            },
            {
                bucket: "bucket2",
                fieldName: "payload.field1",
                tsField: "",
                aggr: "[]",
                alias: "aggregate2"
            },
            {
                bucket: "bucket1",
                fieldName: "payload.field2",
                tsField: "payload.timestamp",
                aggr: "",
                alias: ""
            }]
        };

        const promise = ds.query(options);
        return promise.then((resp) => {
            assert.equal(stub.callCount, 2);
            assert.equal(resp.data.length, 3);
            assert.equal(resp.data[0].target, "bucket1.payload.field1");
            assert.deepEqual(resp.data[0].datapoints, [[111.1, 1514764800001]]);
            assert.equal(resp.data[1].target, "aggregate2");
            assert.deepEqual(resp.data[1].datapoints, [[222.2, 1514764800022]]);
            assert.equal(resp.data[2].target, "bucket1.payload.field2");
            assert.deepEqual(resp.data[2].datapoints, [[123.4, 1514764800001]]);
        });
    });

    it('should query with three targets: same aggregate', () => {
        const ds = createInstance();
        const stub = createDatasourceRequestStub(backendSrv);

        const options = {
            range: {
                from: "2018-01-01T00:00:00.000Z",
                to: "2018-02-01T00:00:00.000Z"
            },
            targets: [{
                bucket: "bucket1",
                fieldName: "payload.field1",
                tsField: "payload.timestamp",
                aggr: "",
                alias: ""
            },
            {
                bucket: "bucket2",
                fieldName: "payload.field1",
                tsField: "",
                aggr: "[]",
                alias: "aggregate2"
            },
            {
                bucket: "bucket2",
                fieldName: "payload.field2",
                tsField: "",
                aggr: "[]",
                alias: ""
            }]
        };

        const promise = ds.query(options);
        return promise.then((resp) => {
            assert.equal(stub.callCount, 2);
            assert.equal(resp.data.length, 3);
            assert.equal(resp.data[0].target, "bucket1.payload.field1");
            assert.deepEqual(resp.data[0].datapoints, [[111.1, 1514764800001]]);
            assert.equal(resp.data[1].target, "aggregate2");
            assert.deepEqual(resp.data[1].datapoints, [[222.2, 1514764800022]]);
            assert.equal(resp.data[2].target, "bucket2.payload.field2");
            assert.deepEqual(resp.data[2].datapoints, [[234.5, 1514764800022]]);
        });
    });

    it('should convertResponse works with empry response', () => {
        const ds = createInstance();

        const response = {
            results: []
        };

        const target = {
            bucket: "b1",
            fieldName: "temperature",
            tsField: "createdAt",
            alias: ""
        };

        const result = ds.convertResponse(target, response);

        assert.equal(result.target, "b1.temperature");
        assert.deepEqual(result.datapoints, []);
    });

    it('should convertResponse works', () => {
        const ds = createInstance();

        const response = {
            results: [
                {
                    temperature: 20,
                    payload: [
                        {humidity: 60}
                    ],
                    createdAt: "2018-01-01T00:00:00.000Z"
                },
                {
                    payload: [
                        {humidity: 60}
                    ]
                },
                {
                    temperature: 21,
                    payload: [
                        {humidity: 61}
                    ],
                    createdAt: "2018-01-01T00:00:00.002Z"
                }
            ]
        };

        let target = {
            bucket: "b1",
            fieldName: "temperature",
            tsField: "createdAt",
            alias: ""
        };

        const temperature = ds.convertResponse(target, response);
        assert.equal(temperature.target, "b1.temperature");
        assert.deepEqual(temperature.datapoints, [[20, 1514764800000], [21, 1514764800002]]);

        target = {
            bucket: "b1",
            fieldName: "payload.0.humidity",
            tsField: "createdAt",
            alias: "humidity"
        };

        const humidity = ds.convertResponse(target, response);
        assert.equal(humidity.target, "humidity");
        assert.deepEqual(humidity.datapoints, [[60, 1514764800000], [61, 1514764800002]]);
    });

    it('should extractValue works', () => {
        const ds = createInstance();

        const obj = {
            array: [
                {
                    array1: 111,
                    array2: 222
                },
                777
            ],
            nest: {
                child1: {
                    child2: 12.3
                }
            }
        };

        assert.equal(ds.extractValue(1234, "key"), null);
        assert.equal(ds.extractValue("string", "key"), null);
        assert.deepEqual(ds.extractValue(obj, "array.0.array2"), 222);
        assert.deepEqual(ds.extractValue(obj, "array.1"), 777);
        assert.equal(ds.extractValue(true, "key"), null);
        assert.equal(ds.extractValue(null, "key"), null);
        assert.equal(ds.extractValue(obj, "nest.child1.child2"), 12.3);
    });

    it('should testDatasource works', () => {
        const ds = createInstance();
        const stub = sinon.stub(backendSrv, 'datasourceRequest');

        stub.onCall(0).returns(
            new Promise((resolve, reject) => {
                resolve({
                    status: 200,
                    data: {
                        results: [{name: "bucket1"}, {name: "bucket2"}]
                    }
                })
            })
        );

        return ds.testDatasource()
            .then((resp) => {
                assert.equal(stub.callCount, 1);
                assert.deepEqual(resp, {status: "success", message: "Server connected", title: "Success"});
            });
    });

    it('should metricFindQuery works', () => {
        const ds = createInstance();
        const stub = sinon.stub(backendSrv, 'datasourceRequest');

        stub.onCall(0).returns(
            new Promise((resolve, reject) => {
                resolve({
                    status: 200,
                    data: {
                        results: [{name: "bucket1"}, {name: "bucket2"}]
                    }
                })
            })
        );

        return ds.metricFindQuery("buckets")
            .then((buckets) => {
                assert.equal(stub.callCount, 1);
                assert.deepEqual(buckets,
                         [{text: "bucket1", value: "bucket1"}, {text: "bucket2", value: "bucket2"}]);

                return ds.metricFindQuery("buckets")
            }).then((buckets) => {
                // use cache
                assert.equal(stub.callCount, 1);
                assert.deepEqual(buckets,
                         [{text: "bucket1", value: "bucket1"}, {text: "bucket2", value: "bucket2"}]);

                return ds.metricFindQuery("noQuery")
            }).then((buckets) => {
                assert.equal(stub.callCount, 1);
                assert.deepEqual(buckets, []);
            });
    });

    it('should getLatestObject works', () => {
        const ds = createInstance();
        const stub = createDatasourceRequestStub(backendSrv);

        stub.onCall(1).returns(
            new Promise((resolve, reject) => {
                resolve({
                    status: 200,
                    data: {results: []}
                })
            })
        );

        return ds.getLatestObject("bucket1")
            .then((resp) => {
                assert.equal(stub.callCount, 1);
                assert.deepEqual(resp, {
                    payload: {field1: 111.1, field2: 123.4, timestamp: "2018-01-01T00:00:00.001Z"},
                    updatedAt: "2018-01-01T00:00:00.011Z"});

                return ds.getLatestObject("bucket1");
            }).then((resp) => {
                assert.equal(stub.callCount, 2);
                assert.deepEqual(resp, {});
            });
    });
});
