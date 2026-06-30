// jest.setup.ts
import 'fake-indexeddb/auto';
import { Blob } from 'node:buffer';
import { deserialize, serialize } from 'node:v8';
import { TextDecoder, TextEncoder } from 'util';

function getPlatformInfo(callback: (platformInfo: chrome.runtime.PlatformInfo) => void): void;
function getPlatformInfo(): Promise<chrome.runtime.PlatformInfo>;
function getPlatformInfo(callback?: (platformInfo: chrome.runtime.PlatformInfo) => void): void | Promise<chrome.runtime.PlatformInfo> {
    const platformInfo: chrome.runtime.PlatformInfo = { os: 'linux', arch: 'x86-64', nacl_arch: 'x86-64' };

    if (callback)
        return callback(platformInfo);

    return Promise.resolve(platformInfo);
}

global.Blob = Blob as any;
global.chrome = {
    alarms: {
        onAlarm: {
            addListener: jest.fn(),
            removeListener: jest.fn(),
            hasListener: jest.fn(),
        },
    },
    downloads: {
        download: jest.fn(),
    },
    runtime: {
        id: 'test-hn-plus',
        getPlatformInfo,
        onMessage: {
            addListener: jest.fn(),
            removeListener: jest.fn(),
            hasListener: jest.fn(),
        },
        sendMessage: jest.fn(),
    },
    storage: {
        local: {
            get: jest.fn(),
            set: jest.fn(),
        },
        sync: {
            get: jest.fn(),
            set: jest.fn(),
        },
    },
} as unknown as typeof chrome;
global.console.debug = () => { }
global.structuredClone = (obj: any) => deserialize(serialize(obj));
global.TextDecoder = TextDecoder
global.TextEncoder = TextEncoder