import { beforeEach, vi } from 'vitest';
import 'tests/mocks/fetch';

import { api } from 'src/lib/harnessnation';

beforeEach(() => {
    vi.spyOn(api, '_getBearerToken')
        .mockResolvedValue('bearer-token');

    vi.spyOn(api, '_getCSRFToken')
        .mockResolvedValue('csrf-token');
});