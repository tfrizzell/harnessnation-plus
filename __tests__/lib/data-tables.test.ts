import { chrome } from 'jest-chrome';
import DataTables, { DataTablesMode, DataTablesOptions } from '../../src/lib/data-tables';
import { DataTablesSettings } from '../../src/lib/settings';

describe(`DataTables`, () => {
    it(`exists`, () => {
        expect(DataTables).not.toBeUndefined();
    });

    it(`is an object`, () => {
        expect(typeof DataTables).toEqual('object');
    });

    describe(`extend`, () => {
        it(`exists`, () => {
            expect(DataTables).toHaveProperty('extend');
        });

        it(`is a function`, () => {
            expect(typeof DataTables.extend).toEqual('function');
        });

        it(`resolves with the same script if the table isn't found`, async () => {
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

            await expect(DataTables.extend('#test-1', script, { saveState: true, stateDuration: 31557600, saveSearch: false })).resolves.toEqual(script);
        });

        it(`resolves with an extended data table configuration when the default options are used`, async () => {
            await expect(DataTables.extend('#test', `
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
            `)).resolves.toEqual(`
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

        it(`resolves with an extended data table configuration when custom options are used`, async () => {
            await expect(DataTables.extend('#test', `
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
            `, <DataTablesOptions>{ saveState: true, stateDuration: 31557600 })).resolves.toEqual(`
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

        it(`resolves with an extended data table when custom options with with search saving disabled configuration are used`, async () => {
            await expect(DataTables.extend('#test', `
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
            `, <DataTablesOptions>{ saveState: true, stateDuration: 31557600, saveSearch: false })).resolves.toEqual(`
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

        beforeAll(() => {
            chrome.storage.sync.get.mockImplementation((
                keys: string | Array<string> | Partial<{ [key: string]: any }> | null | ((items: { [key: string]: any }) => void),
                callback?: (items: { [key: string]: any }) => void
            ) => {
                if (keys instanceof Function)
                    return chrome.storage.sync.get(null, keys);

                if (!callback)
                    return new Promise(resolve => chrome.storage.sync.get(keys, resolve));

                if (typeof keys === 'string')
                    return callback(keys in mockData ? { [keys]: mockData[keys] } : {});

                if (Array.isArray(keys))
                    return callback(keys.reduce((data, key) => key in mockData ? { ...data, [key]: mockData[key] } : data, {}));

                if (typeof keys === 'object' && keys != null)
                    return callback(Object.keys(keys).reduce((data, key) => key in mockData ? { ...data, [key]: mockData[key] } : data, {}));

                callback(mockData);
            });
        });

        afterAll(() => {
            chrome.storage.sync.get.mockRestore();
        });

        it(`exists`, () => {
            expect(DataTables).toHaveProperty('getSettings');
        });

        it(`is a function`, () => {
            expect(typeof DataTables.getSettings).toEqual('function');
        });

        it(`resolves with an object containing saveState if enabled is true and mode is DataTablesMode.Default`, async () => {
            await expect(DataTables.getSettings('test1')).resolves.toEqual({ saveState: true });
        });

        it(`resolves with an object containing saveState and stateDuration if enabled is true and mode is DataTablesMode.Custom`, async () => {
            await expect(DataTables.getSettings('test2')).resolves.toEqual({ saveState: true, stateDuration: mockData.dt.test2.duration });
        });

        it(`resolves with undefined if the key isn't found`, async () => {
            await expect(DataTables.getSettings('test3')).resolves.toBeUndefined();
        });
    });
});