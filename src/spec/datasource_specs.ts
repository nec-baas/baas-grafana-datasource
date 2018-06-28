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

    it('constructor', () => {
        const ds = new BaasDatasource(createInstanceSettings(), null, null, null);
        assert.equal(ds.tenantId, 'tenant1');
        assert.equal(ds.headers["X-Application-Id"], 'app1');
        assert.equal(ds.headers["X-Application-Key"], 'key1');
        assert.equal(ds.headers["Content-Type"], 'application/json');
    });

    it('should query with empty targets', (done) => {
        const instanceSettings = createInstanceSettings();
        const backendSrv = {};
        const templateSrv = {};
        const $q = createQ();

        const ds = new BaasDatasource(instanceSettings, backendSrv, $q, templateSrv);

        const options = {
            targets: []
        };

        const promise = ds.query(options);
        promise.then((resp) => {
            assert.equal(resp.data.length, 0);
            done();
        });
    });
});