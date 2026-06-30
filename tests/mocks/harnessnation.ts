import { HarnessNationAPI } from '@src/lib/harnessnation';
import '@mocks/fetch';

let getCSRFTokenSpy: jest.SpyInstance;

beforeAll(() => {
    getCSRFTokenSpy = jest.spyOn(HarnessNationAPI.prototype, "getCSRFToken")
        .mockResolvedValue('csrf-token');
});

afterAll(() => {
    getCSRFTokenSpy.mockRestore();
});
