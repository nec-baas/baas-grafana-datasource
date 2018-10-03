// datasource specs

import {describe, it} from "mocha";
import {assert, expect} from "chai";
import * as sinon from "sinon";

import {BaasDatasource} from "../datasource";
import {TargetSpec} from "../target_spec";

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
            }
        }
    };

    const createInstance = () => {
        const instanceSettings = createInstanceSettings();
        const backendSrv = {};
        const templateSrv = {
            replace: (s) => { return s; }
        };
        const $q = createQ();

        const ds = new BaasDatasource(instanceSettings, backendSrv, $q, templateSrv);
        return ds;
    };

    it('constructor', () => {
        const ds = new BaasDatasource(createInstanceSettings(), null, null, null);
        assert.equal(ds.tenantId, 'tenant1');
        assert.equal(ds.headers["X-Application-Id"], 'app1');
        assert.equal(ds.headers["X-Application-Key"], 'key1');
        assert.equal(ds.headers["Content-Type"], 'application/json');
    });

    it('should query with empty targets', (done) => {
        const ds = createInstance();

        const options = {
            targets: []
        };

        const promise = ds.query(options);
        promise.then((resp) => {
            assert.equal(resp.data.length, 0);
            done();
        });
    });

    it('should query with one target', (done) => {
        const ds = createInstance();
        ds.backendSrv.datasourceRequest = sinon.fake.returns(
            new Promise((resolve, reject) => {
                resolve({
                    status: 200,
                    data: {
                        results: [
                            {payload: {field1: 90.0, timestamp: "2018-01-01T00:00:00.000Z"}}
                        ]
                    }
                })
            })
        );

        const target = "bucket1.payload.field1@payload.timestamp";
        const options = {
            range: {
                from: "2018-01-01T00:00:00.000Z",
                to: "2018-02-01T00:00:00.000Z"
            },
            targets: [{
                target: target
            }]
        };

        const promise = ds.query(options);
        promise.then((resp) => {
            assert.equal(resp.data.length, 1); // TBD
            assert.equal(resp.data[0].target, target);
            const datapoints = resp.data[0].datapoints;
            assert.deepEqual(datapoints, [[90.0, 1514764800000]])
            done();
        });
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
                    temperature: 21,
                    payload: [
                        {humidity: 61}
                    ],
                    createdAt: "2018-01-01T00:00:00.001Z"
                }
            ]
        };

        const t1 = "b1.temperature";
        const t2 = "b1.payload.0.humidity@createdAt";

        const res = ds.convertResponse(
            [
                new TargetSpec(t1),
                new TargetSpec(t2)
            ],
            response);

        const results = res.data;
        assert.equal(results.length, 2);

        const temperature = results[0];
        assert.equal(temperature.target, t1);
        assert.deepEqual(temperature.datapoints, [[20, 1514764800000], [21, 1514764800001]]);

        const humidity = results[1];
        assert.equal(humidity.target, t2);
        assert.deepEqual(humidity.datapoints, [[60, 1514764800000], [61, 1514764800001]]);
    });
});