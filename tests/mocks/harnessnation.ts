import { type MockInstance, beforeEach, vi } from 'vitest';
import '@mocks/fetch';

import { api } from '@src/lib/harnessnation';

let getCSRFTokenSpy: MockInstance;

beforeEach(() => {
    getCSRFTokenSpy = vi.spyOn(api, 'getCSRFToken')
        .mockResolvedValue('csrf-token');
});