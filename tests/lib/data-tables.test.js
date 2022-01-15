import { DataTables } from '../../lib/data-tables.js';
import { Mode } from '../../lib/enums.js';

describe(`DataTables`, () => {
    test(`exists`, () => {
        expect(DataTables).not.toBeUndefined();
        expect(window.DataTables).not.toBeUndefined();
    });

    test(`is a class`, () => {
        expect(typeof DataTables).toEqual('function');
        expect(typeof DataTables.constructor).toEqual('function');
    });

    test(`cannot be instantiated`, () => {
        expect(() => {
            class TestDataTables extends DataTables { }
            return new TestDataTables();
        }).toThrow(`${DataTables.name} is static and cannot be instantiated`);
    });

    describe(`function extend`, () => {
        test(`exists`, () => {
            expect(DataTables).toHaveProperty('extend');
            expect(typeof DataTables.extend).toEqual('function');
        });

        test(`returns the same script if the table isn't found`, () => {
            const script = `
                table = $('#test').DataTable({
                    "paging":   false,
                    "ordering": true,
                    "info":     false,
                    "searching": false,
                    "stateSave": true,
                    "lengthChange": false,
                    "autoWidth": false,
                    "order":[[1,'ASC']],
                });
            `;

            expect(DataTables.extend('#test-1', script, { saveState: true, stateDuration: 31557600, saveSearch: false })).toEqual(script);
        });

        test(`returns an extended data table configuration when the default options are used`, () => {
            expect(DataTables.extend('#test', `
                table = $('#test').DataTable({
                    "paging":   false,
                    "ordering": true,
                    "info":     false,
                    "searching": false,
                    "stateSave": true,
                    "lengthChange": false,
                    "autoWidth": false,
                    "order":[[1,'ASC']],
                });
            `)).toEqual(`
                table = $('#test').DataTable({
                    // HarnessNation
                    "paging":   false,
                    "ordering": true,
                    "info":     false,
                    "searching": false,
                    "stateSave": true,
                    "lengthChange": false,
                    "autoWidth": false,
                    "order":[[1,'ASC']],

                    // HarnessNation+
                });
            `);
        });

        test(`returns an extended data table configuration when custom options are used`, () => {
            expect(DataTables.extend('#test', `
                table = $('#test').DataTable({
                    "paging":   false,
                    "ordering": true,
                    "info":     false,
                    "searching": false,
                    "stateSave": true,
                    "lengthChange": false,
                    "autoWidth": false,
                    "order":[[1,'ASC']],
                });
            `, { saveState: true, stateDuration: 31557600 })).toEqual(`
                table = $('#test').DataTable({
                    // HarnessNation
                    "paging":   false,
                    "ordering": true,
                    "info":     false,
                    "searching": false,
                    "stateSave": true,
                    "lengthChange": false,
                    "autoWidth": false,
                    "order":[[1,'ASC']],

                    // HarnessNation+
                    "saveState": true,
                    "stateDuration": 31557600
                });
            `);
        });

        test(`returns an extended data table when custom options with with search saving disabled configuration are used`, () => {
            expect(DataTables.extend('#test', `
                table = $('#test').DataTable({
                    "paging":   false,
                    "ordering": true,
                    "info":     false,
                    "searching": false,
                    "stateSave": true,
                    "lengthChange": false,
                    "autoWidth": false,
                    "order":[[1,'ASC']],
                });
            `, { saveState: true, stateDuration: 31557600, saveSearch: false })).toEqual(`
                table = $('#test').DataTable({
                    // HarnessNation
                    "paging":   false,
                    "ordering": true,
                    "info":     false,
                    "searching": false,
                    "stateSave": true,
                    "lengthChange": false,
                    "autoWidth": false,
                    "order":[[1,'ASC']],

                    // HarnessNation+
                    "saveState": true,
                    "stateDuration": 31557600
                }).on('stateSaveParams.dt', (e, settings, data) => {
                    data.search.search = '';
                });
            `);
        });
    });

    describe(`getSettings`, () => {
        const mockData = {
            dt: {
                test1: { enabled: true, duration: 1, mode: Mode.Default },
                test2: { enabled: true, duration: 1, mode: Mode.Custom },
            }
        };

        global.chrome = {
            storage: {
                sync: {
                    // @ts-ignore
                    get(keys, callback) {
                        if (typeof keys === 'string')
                            return callback(keys in mockData ? { [keys]: mockData[keys] } : {});

                        if (Array.isArray(keys))
                            return callback(keys.reduce((data, key) => key in mockData ? { ...data, [key]: mockData[key] } : data, {}));

                        if (typeof keys === 'object')
                            return callback(Object.keys(keys).reduce((data, key) => key in mockData ? { ...data, [key]: mockData[key] } : data, {}));

                        callback(mockData);
                    },
                },
            },
        };

        test(`exists`, () => {
            expect(DataTables).toHaveProperty('getSettings');
            expect(typeof DataTables.getSettings).toEqual('function');
        });

        test(`returns an object containing saveState if enabled is true and mode is Mode.Default`, () => {
            chrome.storage.sync.get = jest.fn();

            DataTables.getSettings('test1').then(settings => {
                expect(settings).toEqual({ saveState: true });
            });
        });

        test(`returns an object containing saveState and stateDuration if enabled is true and mode is Mode.Default`, () => {
            chrome.storage.sync.get = jest.fn();

            DataTables.getSettings('test2').then(settings => {
                expect(settings).toEqual({ saveState: true, stateDuration: mockData.dt.test2.stateDuration });
            });
        });

        test(`returns undefined if the key isn't found`, () => {
            DataTables.getSettings('test3').then(settings => {
                expect(settings).toBeUndefined();
            });
        });
    });
});