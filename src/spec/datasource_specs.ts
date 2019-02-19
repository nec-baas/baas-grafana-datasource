// datasource specs

import {describe, it} from "mocha";
import {assert, expect} from "chai";
import * as sinon from "sinon";
import * as prunk from 'prunk';

export default class TableModel {
    columns: Column[];
    rows: any[];
    type: string;
    columnMap: any;

    constructor(table?: any) {
        this.columns = [];
        this.columnMap = {};
        this.rows = [];
        this.type = 'table';
    };

    addColumn(col: Column) {
        if (!this.columnMap[col.text]) {
            this.columns.push(col);
            this.columnMap[col.text] = col;
        }
    };

    addRow(row: any) {
        this.rows.push(row);
    };
}

export interface Column {
    text: string;
    title?: string;
    type?: string;
    sort?: boolean;
    desc?: boolean;
    filterable?: boolean;
    unit?: string;
}

prunk.mock('app/core/table_model', {});

import {BaasDatasource} from "../datasource";
import { QueryOptions } from "app/plugins/sdk";

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
                dataField: [{fieldName: "payload.field1", alias: ""}],
                tsField: "payload.timestamp",
                aggr: ""
            }]
        };

        const promise = ds.query(options);
        return promise.then((resp) => {
            assert.isTrue(stub.notCalled);
            assert.equal(resp.data.length, 0);
        });
    });

    it('should query with invalid targets: data field is empty', () => {
        const ds = createInstance();
        const stub = createDatasourceRequestStub(backendSrv);

        const options = {
            range: {
                from: "2018-01-01T00:00:00.000Z",
                to: "2018-02-01T00:00:00.000Z"
            },
            targets: [{
                bucket: "bucket1",
                dataField: [],
                tsField: "payload.timestamp",
                aggr: ""
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
                dataField: [{fieldName: "", alias: ""}],
                tsField: "payload.timestamp",
                aggr: ""
            }]
        };

        const promise = ds.query(options);
        return promise.then((resp) => {
            assert.isTrue(stub.notCalled);
            assert.equal(resp.data.length, 0);
        });
    });

    it('should query with invalid targets: Series Name key is empty', () => {
        const ds = createInstance();
        const stub = createDatasourceRequestStub(backendSrv);

        const options = {
            range: {
                from: "2018-01-01T00:00:00.000Z",
                to: "2018-02-01T00:00:00.000Z"
            },
            targets: [{
                bucket: "bucket1",
                createDataWith: "series_name_value_key",
                seriesNameKey: "",
                seriesValueKey: "value",
                tsField: "payload.timestamp",
                aggr: ""
            }]
        };

        const promise = ds.query(options);
        return promise.then((resp) => {
            assert.isTrue(stub.notCalled);
            assert.equal(resp.data.length, 0);
        });
    });

    it('should query with invalid targets: Series Value key is empty', () => {
        const ds = createInstance();
        const stub = createDatasourceRequestStub(backendSrv);

        const options = {
            range: {
                from: "2018-01-01T00:00:00.000Z",
                to: "2018-02-01T00:00:00.000Z"
            },
            targets: [{
                bucket: "bucket1",
                createDataWith: "series_name_value_key",
                seriesNameKey: "Name",
                seriesValueKey: "",
                tsField: "payload.timestamp",
                aggr: ""
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
                dataField: [{fieldName: "payload.field1", alias: ""}],
                tsField: "payload.timestamp",
                aggr: "",
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
                format: "time_series",
                createDataWith: "data_field",
                dataField: [{fieldName: "payload.field1", alias: ""}],
                tsField: "payload.timestamp",
                aggr: ""
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

    it('should query with one target (old targets)', () => {
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
                format: "time_series",
                createDataWith: "data_field",
                dataField: [{fieldName: "payload.field1", alias: ""}],
                tsField: "payload.timestamp",
                aggr: ""
            },
            {
                bucket: "bucket2",
                format: "time_series",
                createDataWith: "data_field",
                dataField: [{fieldName: "payload.field1", alias: "aggregate2"}],
                fieldName: "payload.field1",
                tsField: "",
                aggr: "[]"
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
                format: "time_series",
                createDataWith: "data_field",
                dataField: [{fieldName: "payload.field1", alias: ""}],
                tsField: "payload.timestamp",
                aggr: ""
            },
            {
                bucket: "bucket2",
                format: "time_series",
                createDataWith: "data_field",
                dataField: [{fieldName: "payload.field1", alias: "aggregate2"}],
                tsField: "",
                aggr: "[]"
            },
            {
                bucket: "bucket1",
                format: "time_series",
                createDataWith: "data_field",
                dataField: [{fieldName: "payload.field2", alias: ""}],
                tsField: "payload.timestamp",
                aggr: ""
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
                format: "time_series",
                createDataWith: "data_field",
                dataField: [{fieldName: "payload.field1", alias: ""}],
                tsField: "payload.timestamp",
                aggr: ""
            },
            {
                bucket: "bucket1",
                format: "time_series",
                createDataWith: "data_field",
                dataField: [{fieldName: "payload.field2", alias: "aggregate1"}],
                tsField: "payload.timestamp",
                aggr: ""
            },
            {
                bucket: "bucket2",
                format: "time_series",
                createDataWith: "data_field",
                dataField: [{fieldName: "payload.field1", alias: "aggregate2"}],
                tsField: "",
                aggr: "[]"
            },
            {
                bucket: "bucket2",
                format: "time_series",
                createDataWith: "data_field",
                dataField: [{fieldName: "payload.field2", alias: ""}],
                tsField: "",
                aggr: "[ \n]"
            }]
        };

        const promise = ds.query(options);
        return promise.then((resp) => {
            assert.equal(stub.callCount, 2);
            assert.equal(resp.data.length, 4);
            assert.equal(resp.data[0].target, "bucket1.payload.field1");
            assert.deepEqual(resp.data[0].datapoints, [[111.1, 1514764800001]]);
            assert.equal(resp.data[1].target, "aggregate1");
            assert.deepEqual(resp.data[1].datapoints, [[123.4, 1514764800001]]);
            assert.equal(resp.data[2].target, "aggregate2");
            assert.deepEqual(resp.data[2].datapoints, [[222.2, 1514764800022]]);
            assert.equal(resp.data[3].target, "bucket2.payload.field2");
            assert.deepEqual(resp.data[3].datapoints, [[234.5, 1514764800022]]);
        });
    });

    it('should query with three targets: multi fields', () => {
        const ds = createInstance();
        const stub = createDatasourceRequestStub(backendSrv);

        const options = {
            range: {
                from: "2018-01-01T00:00:00.000Z",
                to: "2018-02-01T00:00:00.000Z"
            },
            targets: [{
                bucket: "bucket1",
                dataField: [{fieldName: "payload.field1", alias: ""}],
                tsField: "payload.timestamp",
                aggr: ""
            },
            {
                bucket: "bucket2",
                dataField: [
                    {fieldName: "payload.field1", alias: "aggregate2"},
                    {fieldName: "payload.field2", alias: ""}
                ],
                tsField: "",
                aggr: "[]"
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

    it('should convertResponseWithDataField works with empry response', () => {
        const ds = createInstance();

        const options = {
            range: { from: "2018-01-01T00:00:00.000Z", to: "2018-01-01T00:00:00.999Z" },
            targets: []
        };

        const response = {
            results: []
        };

        const target = {
            bucket: "b1",
            dataField: [{fieldName: "temperature", alias: ""}],
            tsField: "createdAt"
        };

        const result = ds.convertResponseWithDataField(target, response, options);

        assert.equal(result[0].target, "b1.temperature");
        assert.deepEqual(result[0].datapoints, []);
    });

    it('should convertResponseWithDataField works', () => {
        const ds = createInstance();

        const options = {
            range: { from: "2018-01-01T00:00:00.000Z", to: "2018-01-01T00:00:00.999Z" },
            targets: []
        };

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
                        {humidity: 61}
                    ]
                },
                {
                    other: 1,
                    createdAt: "2018-01-01T00:00:00.000Z"
                },
                {
                    temperature: 21,
                    payload: [
                        {humidity: 62}
                    ],
                    createdAt: "2018-01-01T00:00:00.002Z"
                }
            ]
        };

        let target = {
            bucket: "b1",
            format: "time_series",
            createDataWith: "data_field",
            dataField: [
                {fieldName: "temperature", alias: ""},
                {fieldName: "payload.0.humidity", alias: "humidity"}
            ],
            tsField: "createdAt"
        };

        const results = ds.convertResponseWithDataField(target, response, options);
        assert.equal(results[0].target, "b1.temperature");
        assert.deepEqual(results[0].datapoints, [[20, 1514764800000], [21, 1514764800002]]);
        assert.equal(results[1].target, "humidity");
        assert.deepEqual(results[1].datapoints, [[60, 1514764800000], [61, 1514764800999], [62, 1514764800002]]);
    });

    it('should convertResponseWithDataField works: No Timestamp', () => {
        const ds = createInstance();

        const options = {
            range: { from: "2018-01-01T00:00:00.000Z", to: "2018-01-01T00:00:00.999Z" },
            targets: []
        };

        const response = {
            results: [
                {
                    temperature: 20,
                    payload: [
                        { humidity: 60 }
                    ]
                },
                {
                    payload: [
                        { humidity: 60 }
                    ]
                },
                {
                    temperature: 21,
                    payload: [
                        { humidity: 61 }
                    ]
                }
            ]
        };

        let target = {
            bucket: "b1",
            format: "time_series",
            createDataWith: "data_field",
            dataField: [
                { fieldName: "temperature", alias: "" },
                { fieldName: "payload.0.humidity", alias: "humidity" }
            ],
            tsField: "createdAt"
        };

        const results = ds.convertResponseWithDataField(target, response, options);
        assert.equal(results[0].target, "b1.temperature");
        assert.deepEqual(results[0].datapoints, [[20, 1514764800999], [21, 1514764800999]]);
        assert.equal(results[1].target, "humidity");
        assert.deepEqual(results[1].datapoints, [[60, 1514764800999], [60, 1514764800999], [61, 1514764800999]]);
    });

    it('should convertResponseWithSeries works with empry response', () => {
        const ds = createInstance();

        const options = {
            range: { from: "2018-01-01T00:00:00.000Z", to: "2018-01-01T00:00:00.999Z" },
            targets: []
        };

        const response = {
            results: []
        };

        const target = {
            bucket: "b1",
            format: "time_series",
            createDataWith: "series_name_value_key",
            tsField: "createdAt",
            seriesNameKey: "type",
            seriesValueKey: "average"
        };

        const result = ds.convertResponseWithSeries(target, response, options);

        assert.deepEqual(result, []);
    });

    it('should convertResponseWithSeries works', () => {
        const ds = createInstance();

        const options = {
            range: { from: "2018-01-01T00:00:00.000Z", to: "2018-01-01T00:00:00.999Z" },
            targets: []
        };

        const response = {
            results: [
                {
                    type: "temperature",
                    average: 20,
                    createdAt: "2018-01-01T00:00:00.000Z"
                },
                {
                    average: 99
                },
                {
                    type: "humidity",
                },
                {
                    type: "humidity",
                    average: 60,
                    createdAt: "2018-01-01T00:00:00.001Z"
                },
                {
                    type: "temperature",
                    average: 21,
                    createdAt: "2018-01-01T00:00:00.002Z"
                }
            ]
        };

        let target = {
            bucket: "b1",
            format: "time_series",
            createDataWith: "series_name_value_key",
            tsField: "createdAt",
            seriesNameKey: "type",
            seriesValueKey: "average"
        };

        const results = ds.convertResponseWithSeries(target, response, options);
        assert.equal(results[0].target, "temperature");
        assert.deepEqual(results[0].datapoints, [[20, 1514764800000], [21, 1514764800002]]);
        assert.equal(results[1].target, "humidity");
        assert.deepEqual(results[1].datapoints, [[60, 1514764800001]]);
    });

    it('should convertResponseWithSeries works: No Timestamp', () => {
        const ds = createInstance();

        const options = {
            range: { from: "2018-01-01T00:00:00.000Z", to: "2018-01-01T00:00:00.999Z" },
            targets: []
        };

        const response = {
            results: [
                {
                    type: "temperature",
                    average: 20
                },
                {
                    average: 99
                },
                {
                    type: "humidity",
                },
                {
                    type: "humidity",
                    average: 60
                }
            ]
        };

        let target = {
            bucket: "b1",
            format: "time_series",
            createDataWith: "series_name_value_key",
            tsField: "createdAt",
            seriesNameKey: "type",
            seriesValueKey: "average"
        };

        const results = ds.convertResponseWithSeries(target, response, options);
        assert.equal(results[0].target, "temperature");
        assert.deepEqual(results[0].datapoints, [[20, 1514764800999]]);
        assert.equal(results[1].target, "humidity");
        assert.deepEqual(results[1].datapoints, [[60, 1514764800999]]);
    });

    it('should convertResponseToTableWithDataField works with empry response', () => {
        const ds = createInstance();

        const response = {
            results: []
        };

        let target = {
            bucket: "b1",
            format: "table",
            createDataWith: "data_field",
            dataField: [
                { fieldName: "temperature", alias: "" },
                { fieldName: "payload.0.humidity", alias: "humidity" }
            ],
            tsField: "createdAt"
        };

        let tableModel = new TableModel();
        const results = ds.convertResponseToTableWithDataField(target, response, tableModel);

        assert.equal(results[0].columns[0].text, "b1.temperature");
        assert.equal(results[0].columns[1].text, "humidity");
        assert.deepEqual(results[0].rows, []);
    });

    it('should convertResponseToTableWithDataField works', () => {
        const ds = createInstance();

        const response = {
            results: [
                {
                    temperature: 20,
                    payload: [
                        { humidity: 60 }
                    ],
                    createdAt: "2018-01-01T00:00:00.000Z"
                },
                {
                    other: 1,
                    updatedAt: "2018-01-01T00:00:00.001Z"
                },
                {
                    payload: [
                        { humidity: 61 }
                    ]
                },
                {
                    temperature: 21,
                    payload: [
                        { humidity: 62 }
                    ],
                    createdAt: "2018-01-01T00:00:00.002Z"
                }
            ]
        };

        let target = {
            bucket: "b1",
            format: "table",
            createDataWith: "data_field",
            dataField: [
                { fieldName: "temperature", alias: "" },
                { fieldName: "payload.0.humidity", alias: "humidity" },
                { fieldName: "createdAt", alias: "" }
            ],
            tsField: "createdAt"
        };

        let tableModel = new TableModel();
        const results = ds.convertResponseToTableWithDataField(target, response, tableModel);

        assert.equal(results[0].columns[0].text, "Time");
        assert.equal(results[0].columns[1].text, "b1.temperature");
        assert.equal(results[0].columns[2].text, "humidity");
        assert.equal(results[0].columns[3].text, "b1.createdAt");
        assert.deepEqual(results[0].rows,
            [[1514764800000, 20, 60, "2018-01-01T00:00:00.000Z"], [null, null, 61, null], [1514764800002, 21, 62, "2018-01-01T00:00:00.002Z"]]);
    });

    it('should convertResponseToTableWithDataField works: No Timestamp', () => {
        const ds = createInstance();

        const response = {
            results: [
                {
                    temperature: 20,
                    payload: [
                        { humidity: 60 }
                    ]
                },
                {
                    payload: [
                        { humidity: 60 }
                    ]
                },
                {
                    temperature: 21,
                    payload: [
                        { humidity: 61 }
                    ]
                }
            ]
        };

        let target = {
            bucket: "b1",
            format: "table",
            createDataWith: "data_field",
            dataField: [
                { fieldName: "temperature", alias: "" },
                { fieldName: "payload.0.humidity", alias: "humidity" }
            ],
            tsField: "createdAt"
        };

        let tableModel = new TableModel();
        const results = ds.convertResponseToTableWithDataField(target, response, tableModel);

        assert.equal(results[0].columns[0].text, "b1.temperature");
        assert.equal(results[0].columns[1].text, "humidity");
        assert.deepEqual(results[0].rows, [[20, 60], [null, 60], [21, 61]]);
    });

    it('should convertResponseToTableWithSeries works with empry response', () => {
        const ds = createInstance();

        const response = {
            results: []
        };

        let target = {
            bucket: "b1",
            format: "table",
            createDataWith: "series_name_value_key",
            seriesNameKey: "type",
            seriesValueKey: "payload.0.value",
            tsField: "createdAt"
        };

        let tableModel = new TableModel();
        const results = ds.convertResponseToTableWithSeries(target, response, tableModel);

        assert.equal(results[0].columns[0].text, "type");
        assert.equal(results[0].columns[1].text, "payload.0.value");
        assert.deepEqual(results[0].rows, []);
    });

    it('should convertResponseToTableWithSeries works', () => {
        const ds = createInstance();

        const response = {
            results: [
                {
                    type: "temperature",
                    payload: [
                        { value: 20 }
                    ],
                    createdAt: "2018-01-01T00:00:00.000Z"
                },
                {
                    type: "temperature",
                    createdAt: "2018-01-01T00:00:00.000Z"
                },
                {
                    payload: [
                        { value: 60 }
                    ]
                },
                {
                    type: "humidity",
                    payload: [
                        { value: 61 }
                    ],
                    createdAt: "2018-01-01T00:00:00.002Z"
                },
                {
                    type: "temperature",
                    payload: [
                        { value: 21 }
                    ],
                    createdAt: "2018-01-01T00:00:00.099Z"
                }
            ]
        };

        let target = {
            bucket: "b1",
            format: "table",
            createDataWith: "series_name_value_key",
            seriesNameKey: "type",
            seriesValueKey: "payload.0.value",
            tsField: "createdAt"
        };

        let tableModel = new TableModel();
        const results = ds.convertResponseToTableWithSeries(target, response, tableModel);

        assert.equal(results[0].columns[0].text, "Time");
        assert.equal(results[0].columns[1].text, "type");
        assert.equal(results[0].columns[2].text, "payload.0.value");
        assert.deepEqual(results[0].rows, [[1514764800099, "temperature", 21], [1514764800002, "humidity", 61]]);
    });

    it('should convertResponseToTableWithSeries works: No Timestamp', () => {
        const ds = createInstance();

        const response = {
            results: [
                {
                    type: "temperature",
                    payload: [
                        { value: 20 }
                    ]
                },
                {
                    payload: [
                        { value: 60 }
                    ]
                },
                {
                    type: "humidity",
                    payload: [
                        { value: 61 }
                    ]
                }
            ]
        };

        let target = {
            bucket: "b1",
            format: "table",
            createDataWith: "series_name_value_key",
            seriesNameKey: "type",
            seriesValueKey: "payload.0.value",
            tsField: "createdAt"
        };

        let tableModel = new TableModel();
        const results = ds.convertResponseToTableWithSeries(target, response, tableModel);

        assert.equal(results[0].columns[0].text, "type");
        assert.equal(results[0].columns[1].text, "payload.0.value");
        assert.deepEqual(results[0].rows, [["temperature", 20], ["humidity", 61]]);
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
                assert.deepEqual(resp, {status: "success", message: "Server connected"});
            });
    });

    it('should testDatasource works: error response with body', () => {
        const ds = createInstance();
        const stub = sinon.stub(backendSrv, 'datasourceRequest');

        stub.onCall(0).returns(
            new Promise((resolve, reject) => {
                reject({
                    status: 401,
                    statusText: "Unauthorized",
                    data: {
                        error: "Authentication failed"
                    }
                })
            })
        );

        return ds.testDatasource()
            .then((resp) => {
                assert.equal(stub.callCount, 1);
                assert.deepEqual(resp, {status: "error", message: "Authentication failed"});
            });
    });

    it('should testDatasource works: error response without body', () => {
        const ds = createInstance();
        const stub = sinon.stub(backendSrv, 'datasourceRequest');

        stub.onCall(0).returns(
            new Promise((resolve, reject) => {
                reject({
                    status: 401,
                    statusText: "Unauthorized",
                })
            })
        );

        return ds.testDatasource()
            .then((resp) => {
                assert.equal(stub.callCount, 1);
                assert.deepEqual(resp, {status: "error", message: "HTTP Error (401) Unauthorized"});
            });
    });

    it('should testDatasource works: without statusText', () => {
        const ds = createInstance();
        const stub = sinon.stub(backendSrv, 'datasourceRequest');

        stub.onCall(0).returns(
            new Promise((resolve, reject) => {
                reject({
                    status: -1
                })
            })
        );

        return ds.testDatasource()
            .then((resp) => {
                assert.equal(stub.callCount, 1);
                assert.deepEqual(resp, {status: "error", message: "Connection failed"});
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

                return ds.metricFindQuery("buckets");
            }).then((buckets) => {
                // use cache
                assert.equal(stub.callCount, 1);
                assert.deepEqual(buckets,
                         [{text: "bucket1", value: "bucket1"}, {text: "bucket2", value: "bucket2"}]);

                return ds.metricFindQuery("noQuery");
            }).then((buckets) => {
                assert.equal(stub.callCount, 1);
                assert.deepEqual(buckets, []);
            });
    });

    it('should metricFindQuery works: Concurrent requests', () => {
        const ds = createInstance();
        const stub = sinon.stub(backendSrv, 'datasourceRequest');

        stub.onCall(0).returns(
            new Promise((resolve, reject) => {
                setTimeout(() => {
                    resolve({
                        status: 200,
                        data: {
                            results: [{name: "bucket1"}, {name: "bucket2"}]
                        }
                    });
                }, 10);
            })
        );

        return Promise.all([ds.metricFindQuery("buckets"), ds.metricFindQuery("buckets"), ds.metricFindQuery("buckets")])
            .then((results) => {
                assert.equal(stub.callCount, 1);
                assert.equal(results.length, 3)
                for (let buckets of results) {
                    assert.deepEqual(buckets,
                             [{text: "bucket1", value: "bucket1"}, {text: "bucket2", value: "bucket2"}]);
                }
            });
    });

    it('should metricFindQuery works: Concurrent requests: error response', () => {
        const ds = createInstance();
        const stub = sinon.stub(backendSrv, 'datasourceRequest');

        stub.onCall(0).returns(
            new Promise((resolve, reject) => {
                setTimeout(() => {
                    reject({
                        status: 401,
                    });
                }, 10);
            })
        );

        return Promise.all([ds.metricFindQuery("buckets"), ds.metricFindQuery("buckets"), ds.metricFindQuery("buckets")])
            .then((results) => {
                assert.equal(stub.callCount, 1);
                assert.equal(results.length, 3)
                for (let buckets of results) {
                    assert.deepEqual(buckets, []);
                }
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
