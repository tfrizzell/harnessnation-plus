import { generateBreedingReport } from '../../src/lib/reporting.js';
import '../fetch.mock';

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
});