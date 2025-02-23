import fs from 'fs';
import path from 'path';

import { generateBreedingReport } from '../../src/lib/reporting.js';
import { sleep } from '../../src/lib/utils.js';

jest.mock('../../src/lib/utils.js', () => {
    const originalModule = jest.requireActual('../../src/lib/utils.js');

    return {
        ...originalModule,
        sleep: jest.fn().mockImplementation((value: number, abortSignal: AbortSignal | null = null): Promise<void> => Promise.resolve()),
    };
});

beforeAll(() => {
    global.fetch = <jest.Mock>jest.fn((input: RequestInfo, init?: RequestInit): Promise<{ ok: boolean, text: () => Promise<string> }> => {
        const url = (input as Request).url ?? input;
        let file: fs.PathLike | undefined;

        if (url === 'https://www.harnessnation.com/api/progeny/report' && init?.method === 'POST') {
            const { horseId } = Object.fromEntries(new URLSearchParams(init!.body as string));
            file = path.join(__dirname, '../__files__', `api_progeny_report-${horseId}.html`);
        } else if (url.startsWith('https://www.harnessnation.com/horse/')) {
            const horseId = url.split('/').pop()!;
            file = path.join(__dirname, '../__files__', `horse_${horseId}.html`);
        }

        if (!file)
            return Promise.reject(`${url} not found`);

        return new Promise(resolve => {
            fs.access(file!, undefined, (err) => {
                if (err) {
                    return resolve({
                        ok: true,
                        text: (): Promise<string> => Promise.resolve('')
                    });
                }

                resolve({
                    ok: true,
                    text: (): Promise<string> => new Promise(resolve =>
                        fs.readFile(file!, { encoding: 'utf-8' }, (err: any, data: string) => resolve(err ? '' : data))),
                });
            });
        });
    });
});

afterAll(() => {
    jest.restoreAllMocks();
});

describe(`generateBreedingReport`, () => {
    it(`exists`, () => {
        expect(generateBreedingReport).not.toBeUndefined();
    });

    it(`is a function`, () => {
        expect(typeof generateBreedingReport).toEqual('function');
    });

    it(`returns a promise`, () => {
        expect(generateBreedingReport({ ids: [] })).toBeInstanceOf(Promise);
    });

    it(`returns a breeding report with the requested horse info`, async () => {
        await expect(generateBreedingReport({
            ids: [14, 10474, 15729, 26326, 75756]
        })).resolves.toBe('data:text/csv;base64,IklEIiwiTmFtZSIsIkFnZSIsIkdhaXQiLCJUcmFjayBTaXplIiwiR3JhZGUiLCJTaXJlIiwiRGFtIiwiRGFtLVNpcmUiLCJSYWNlIFJlY29yZCIsIlN0YWtlIFJlY29yZCIsIlRvdGFsIEZvYWxzIiwiVG90YWwgU3RhcnRlcnMiLCJUb3RhbCBTdGFydGVycyAoJSkiLCJUb3RhbCBXaW5uZXJzIiwiVG90YWwgV2lubmVycyAoJSkiLCJUb3RhbCBFYXJuaW5ncyIsIkF2ZyBFYXJuaW5ncyBQZXIgU3RhcnRlciIsIlN0YWtlIFN0YXJ0ZXJzIiwiU3Rha2UgU3RhcnRlcnMgKCUpIiwiU3Rha2UgV2lubmVycyIsIlN0YWtlIFdpbm5lcnMgKCUpIiwiU3Rha2UgU3RhcnRzIiwiU3Rha2UgV2lucyIsIlN0YWtlIFBsYWNlIiwiU3Rha2UgU2hvdyIsIlN0YWtlIEVhcm5pbmdzIgoiMTQiLCJBc3Ryb25vbWljYWwiLCIyMSIsIlBhY2UiLCJIYWxmIE1pbGUiLCJBIiwiVW5rbm93biIsIlVua25vd24iLCJVbmtub3duIiwiMzUgLSAxNyAtIDUgLSA0ICgkNzY5LDQ3NCkiLCI3IC0gMSAtIDAgLSAxICgkMTkxLDUwMCkiLCI3NzgiLCI2NjAiLCI4NC44MyUiLCI2MDAiLCI5MC45MSUiLCIkMjMyLDkxMCwyMTQiLCIkMzUyLDg5NCIsIjE4NSIsIjI4LjAzJSIsIjM1IiwiNS4zMCUiLCI3MjMiLCI5NCIsIjYzIiwiNjgiLCIkMjQsNjAxLDAwMCIKIjEwNDc0IiwiUmVhZGx5IEV4cHJlc3MiLCIyMSIsIlRyb3QiLCJIYWxmIE1pbGUiLCJBKyIsIlVua25vd24iLCJVbmtub3duIiwiVW5rbm93biIsIjE1IC0gMTAgLSAzIC0gMiAoJDc3Miw4NzUpIiwiMyAtIDEgLSAxIC0gMSAoJDQyMiw1MDApIiwiMTIwOSIsIjEwNDYiLCI4Ni41MiUiLCI5NTYiLCI5MS40MCUiLCIkMzYwLDMyMywyOTMiLCIkMzQ0LDQ3NyIsIjI3NCIsIjI2LjIwJSIsIjQxIiwiMy45MiUiLCIxLDA4NyIsIjEyOCIsIjEwNCIsIjk3IiwiJDM4LDgwMSw4MDAiCiIxNTcyOSIsIkZpZ2h0ZXIgQXBleCIsIjIxIiwiUGFjZSIsIkZ1bGwgTWlsZSIsIkIiLCJTaGFkb3cgUGxheSIsIktpbnRzdWt1cm9pIiwiVW5rbm93biIsIjU3IC0gMjIgLSAxOSAtIDIgKCQxLDEyNSw2MzcpIiwiMTAgLSAwIC0gMiAtIDEgKCQyMjMsNzUwKSIsIjkxIiwiNzUiLCI4Mi40MiUiLCI2OCIsIjkwLjY3JSIsIiQyNiwwODMsNjU1IiwiJDM0Nyw3ODIiLCIxMCIsIjEzLjMzJSIsIjMiLCI0LjAwJSIsIjY5IiwiMTEiLCI5IiwiOCIsIiQzLDg0OCw2NTAiCiIyNjMyNiIsIkxlYWRlciBBcGV4IiwiMTkiLCJQYWNlIiwiRnVsbCBNaWxlIiwiRCsiLCJGaWdodGVyIEFwZXgiLCJTaW1wbGVTIEFubmllIiwiVW5rbm93biIsIjgxIC0gMjkgLSAxMiAtIDE0ICgkMiwwODEsNDEzKSIsIjIxIC0gMyAtIDMgLSAzICgkODk1LDQwMCkiLCI5OCIsIjcxIiwiNzIuNDUlIiwiNDYiLCI2NC43OSUiLCIkOSw3OTIsNzUwIiwiJDEzNyw5MjYiLCI0IiwiNS42MyUiLCIwIiwiMC4wMCUiLCI0IiwiMCIsIjAiLCIwIiwiJDAiCiI3NTc1NiIsIlphbmplcm8gQXBleCIsIjUiLCJUcm90IiwiRnVsbCBNaWxlIiwiQyIsIkNhbGxlZCBPdXQiLCJPYmxpcXVpdHkgQXBleCIsIkl3YW4gQXBleCIsIjM0IC0gMTUgLSAzIC0gNSAoJDk2MCwzMDApIiwiNiAtIDEgLSAxIC0gMCAoJDMyNyw1MDApIiwiMTIiLCIwIiwiMC4wMCUiLCIwIiwiMC4wMCUiLCIkMCIsIiQwIiwiMCIsIjAuMDAlIiwiMCIsIjAuMDAlIiwiMCIsIjAiLCIwIiwiMCIsIiQwIg==');
    });

    it(`accepts header modifications`, async () => {
        await expect(generateBreedingReport({
            ids: [14, 10474, 15729, 26326, 75756],
            headers: { 0: 'Stallion' }
        })).resolves.toBe('data:text/csv;base64,IlN0YWxsaW9uIiwiTmFtZSIsIkFnZSIsIkdhaXQiLCJUcmFjayBTaXplIiwiR3JhZGUiLCJTaXJlIiwiRGFtIiwiRGFtLVNpcmUiLCJSYWNlIFJlY29yZCIsIlN0YWtlIFJlY29yZCIsIlRvdGFsIEZvYWxzIiwiVG90YWwgU3RhcnRlcnMiLCJUb3RhbCBTdGFydGVycyAoJSkiLCJUb3RhbCBXaW5uZXJzIiwiVG90YWwgV2lubmVycyAoJSkiLCJUb3RhbCBFYXJuaW5ncyIsIkF2ZyBFYXJuaW5ncyBQZXIgU3RhcnRlciIsIlN0YWtlIFN0YXJ0ZXJzIiwiU3Rha2UgU3RhcnRlcnMgKCUpIiwiU3Rha2UgV2lubmVycyIsIlN0YWtlIFdpbm5lcnMgKCUpIiwiU3Rha2UgU3RhcnRzIiwiU3Rha2UgV2lucyIsIlN0YWtlIFBsYWNlIiwiU3Rha2UgU2hvdyIsIlN0YWtlIEVhcm5pbmdzIgoiMTQiLCJBc3Ryb25vbWljYWwiLCIyMSIsIlBhY2UiLCJIYWxmIE1pbGUiLCJBIiwiVW5rbm93biIsIlVua25vd24iLCJVbmtub3duIiwiMzUgLSAxNyAtIDUgLSA0ICgkNzY5LDQ3NCkiLCI3IC0gMSAtIDAgLSAxICgkMTkxLDUwMCkiLCI3NzgiLCI2NjAiLCI4NC44MyUiLCI2MDAiLCI5MC45MSUiLCIkMjMyLDkxMCwyMTQiLCIkMzUyLDg5NCIsIjE4NSIsIjI4LjAzJSIsIjM1IiwiNS4zMCUiLCI3MjMiLCI5NCIsIjYzIiwiNjgiLCIkMjQsNjAxLDAwMCIKIjEwNDc0IiwiUmVhZGx5IEV4cHJlc3MiLCIyMSIsIlRyb3QiLCJIYWxmIE1pbGUiLCJBKyIsIlVua25vd24iLCJVbmtub3duIiwiVW5rbm93biIsIjE1IC0gMTAgLSAzIC0gMiAoJDc3Miw4NzUpIiwiMyAtIDEgLSAxIC0gMSAoJDQyMiw1MDApIiwiMTIwOSIsIjEwNDYiLCI4Ni41MiUiLCI5NTYiLCI5MS40MCUiLCIkMzYwLDMyMywyOTMiLCIkMzQ0LDQ3NyIsIjI3NCIsIjI2LjIwJSIsIjQxIiwiMy45MiUiLCIxLDA4NyIsIjEyOCIsIjEwNCIsIjk3IiwiJDM4LDgwMSw4MDAiCiIxNTcyOSIsIkZpZ2h0ZXIgQXBleCIsIjIxIiwiUGFjZSIsIkZ1bGwgTWlsZSIsIkIiLCJTaGFkb3cgUGxheSIsIktpbnRzdWt1cm9pIiwiVW5rbm93biIsIjU3IC0gMjIgLSAxOSAtIDIgKCQxLDEyNSw2MzcpIiwiMTAgLSAwIC0gMiAtIDEgKCQyMjMsNzUwKSIsIjkxIiwiNzUiLCI4Mi40MiUiLCI2OCIsIjkwLjY3JSIsIiQyNiwwODMsNjU1IiwiJDM0Nyw3ODIiLCIxMCIsIjEzLjMzJSIsIjMiLCI0LjAwJSIsIjY5IiwiMTEiLCI5IiwiOCIsIiQzLDg0OCw2NTAiCiIyNjMyNiIsIkxlYWRlciBBcGV4IiwiMTkiLCJQYWNlIiwiRnVsbCBNaWxlIiwiRCsiLCJGaWdodGVyIEFwZXgiLCJTaW1wbGVTIEFubmllIiwiVW5rbm93biIsIjgxIC0gMjkgLSAxMiAtIDE0ICgkMiwwODEsNDEzKSIsIjIxIC0gMyAtIDMgLSAzICgkODk1LDQwMCkiLCI5OCIsIjcxIiwiNzIuNDUlIiwiNDYiLCI2NC43OSUiLCIkOSw3OTIsNzUwIiwiJDEzNyw5MjYiLCI0IiwiNS42MyUiLCIwIiwiMC4wMCUiLCI0IiwiMCIsIjAiLCIwIiwiJDAiCiI3NTc1NiIsIlphbmplcm8gQXBleCIsIjUiLCJUcm90IiwiRnVsbCBNaWxlIiwiQyIsIkNhbGxlZCBPdXQiLCJPYmxpcXVpdHkgQXBleCIsIkl3YW4gQXBleCIsIjM0IC0gMTUgLSAzIC0gNSAoJDk2MCwzMDApIiwiNiAtIDEgLSAxIC0gMCAoJDMyNyw1MDApIiwiMTIiLCIwIiwiMC4wMCUiLCIwIiwiMC4wMCUiLCIkMCIsIiQwIiwiMCIsIjAuMDAlIiwiMCIsIjAuMDAlIiwiMCIsIjAiLCIwIiwiMCIsIiQwIg==');
    });

    it(`sleeps for 15 seconds after every 7.5 rows`, async () => {
        await generateBreedingReport({ ids: Array(20).fill(0).map((_, i) => i + 1) });
        expect(sleep).toHaveBeenCalledTimes(2);
        expect(sleep).toHaveBeenCalledWith(15000);
    });
});