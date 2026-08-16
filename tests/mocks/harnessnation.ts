import { beforeEach, vi } from 'vitest';
import 'tests/mocks/fetch';

import { api } from 'src/lib/harnessnation';

beforeEach(() => {
    vi.spyOn(api, 'getCSRFToken')
        .mockResolvedValue('csrf-token');
});