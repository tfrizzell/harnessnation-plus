// vitest.setup.ts
import { vi } from 'vitest';

import 'fake-indexeddb/auto';

vi.stubGlobal('chrome', {
    alarms: {
        onAlarm: {
            addListener: vi.fn(),
            removeListener: vi.fn(),
            hasListener: vi.fn(),
        },
    },
    downloads: {
        download: vi.fn(),
    },
    runtime: {
        id: 'test-hn-plus',
        getPlatformInfo: (): Promise<chrome.runtime.PlatformInfo> =>
            Promise.resolve({ os: 'linux', arch: 'x86-64', nacl_arch: 'x86-64' }),
        onMessage: {
            addListener: vi.fn(),
            removeListener: vi.fn(),
            hasListener: vi.fn(),
        },
        sendMessage: vi.fn(),
    },
    storage: {
        local: {
            get: vi.fn(),
            set: vi.fn(),
        },
        sync: {
            get: vi.fn(),
            set: vi.fn(),
        },
    },
});

console.debug = () => { }