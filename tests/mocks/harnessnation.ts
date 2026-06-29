import { HarnessNationAPI } from '@src/lib/harnessnation';
import '@mocks/fetch';

beforeAll(() => {
    HarnessNationAPI.prototype.getCSRFToken = jest.fn((): Promise<string | undefined> => Promise.resolve('csrf-token'));
});

afterAll(() => {
    (<jest.Mock>HarnessNationAPI.prototype.getCSRFToken).mockRestore();
});
