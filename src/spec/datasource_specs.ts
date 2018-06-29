// datasource specs

import {describe, it} from "mocha";
import {assert, expect} from "chai";
import * as sinon from "sinon";

import BaasDatasource from "../datasource";

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
            }
        }
    };

    const createInstance = () => {
        const instanceSettings = createInstanceSettings();
        const backendSrv = {};
        const templateSrv = {};
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

        const res = ds.convertResponse([{target: "t1"}, {target: "t2"}],
            ["temperature", "payload.0.humidity"], response);

        const results = res.data;
        assert.equal(results.length, 2);

        const temperature = results[0];
        assert.equal(temperature.target, "t1");
        assert.deepEqual(temperature.datapoints, [[20, 1514764800000], [21, 1514764800001]]);

        const humidity = results[1];
        assert.equal(humidity.target, "t2");
        assert.deepEqual(humidity.datapoints, [[60, 1514764800000], [61, 1514764800001]]);
    });
});