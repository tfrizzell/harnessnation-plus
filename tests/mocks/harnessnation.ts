import { beforeEach, vi } from 'vitest';
import 'tests/mocks/fetch';

import { api } from 'src/lib/harnessnation';

beforeEach(() => {
    const internals = api as unknown as {
        _getBearerToken(): Promise<string | undefined>;
        _getCSRFToken(): Promise<string | undefined>;
    };

    vi.spyOn(internals, '_getBearerToken')
        .mockResolvedValue('bearer-token');

    vi.spyOn(internals, '_getCSRFToken')
        .mockResolvedValue('csrf-token');
});