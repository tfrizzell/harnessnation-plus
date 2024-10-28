import DataTables, { DataTablesMode, DataTablesOptions } from '../../src/lib/data-tables';
import { DataTablesSettings } from '../../src/lib/settings';

describe(`DataTables`, () => {
    test(`exists`, () => {
        expect(DataTables).not.toBeUndefined();
    });

    test(`is an object`, () => {
        expect(typeof DataTables).toEqual('object');
    });

    describe(`function extend`, () => {
        test(`exists`, () => {
            expect(DataTables).toHaveProperty('extend');
        });

        test(`is a function`, () => {
            expect(typeof DataTables.extend).toEqual('function');
        });

        test(`returns the same script if the table isn't found`, async () => {
            const script: string = `
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

            expect(await DataTables.extend('#test-1', script, { saveState: true, stateDuration: 31557600, saveSearch: false })).toEqual(script);
        });

        test(`returns an extended data table configuration when the default options are used`, async () => {
            expect(await DataTables.extend('#test', `
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

        test(`returns an extended data table configuration when custom options are used`, async () => {
            expect(await DataTables.extend('#test', `
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
            `, <DataTablesOptions>{ saveState: true, stateDuration: 31557600 })).toEqual(`
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

        test(`returns an extended data table when custom options with with search saving disabled configuration are used`, async () => {
            expect(await DataTables.extend('#test', `
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
            `, <DataTablesOptions>{ saveState: true, stateDuration: 31557600, saveSearch: false })).toEqual(`
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
        const mockData: any = {
            dt: {
                test1: <DataTablesSettings>{ enabled: true, duration: 1, mode: DataTablesMode.Default },
                test2: <DataTablesSettings>{ enabled: true, duration: 1, mode: DataTablesMode.Custom },
            }
        };

        global.chrome = {
            storage: {
                sync: {
                    // @ts-ignore
                    get(keys: string | string[] | { [key: string]: any } | null, callback?: (items: { [key: string]: any }) => void): Promise<{ [key: string]: any }> | void {
                        if (!callback)
                            return new Promise(resolve => chrome.storage.sync.get(keys, resolve));

                        if (typeof keys === 'string')
                            return callback(keys in mockData ? { [keys]: mockData[keys] } : {});

                        if (Array.isArray(keys))
                            return callback(keys.reduce((data, key) => key in mockData ? { ...data, [key]: mockData[key] } : data, {}));

                        if (typeof keys === 'object' && keys != null)
                            return callback(Object.keys(keys).reduce((data, key) => key in mockData ? { ...data, [key]: mockData[key] } : data, {}));

                        callback(mockData);
                    },
                },
            },
        };

        test(`exists`, () => {
            expect(DataTables).toHaveProperty('getSettings');
        });

        test(`is a function`, () => {
            expect(typeof DataTables.getSettings).toEqual('function');
        });

        test(`returns an object containing saveState if enabled is true and mode is DataTablesMode.Default`, () => {
            expect(DataTables.getSettings('test1')).resolves.toEqual({ saveState: true });
        });

        test(`returns an object containing saveState and stateDuration if enabled is true and mode is DataTablesMode.Custom`, () => {
            expect(DataTables.getSettings('test2')).resolves.toEqual({ saveState: true, stateDuration: mockData.dt.test2.duration });
        });

        test(`returns undefined if the key isn't found`, () => {
            expect(DataTables.getSettings('test3')).resolves.toBeUndefined();
        });
    });
});