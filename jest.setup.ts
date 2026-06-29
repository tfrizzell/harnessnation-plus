// jest.setup.ts
import 'fake-indexeddb/auto';
import * as jestChrome from 'jest-chrome';
import { Blob } from 'node:buffer';
import { deserialize, serialize } from 'node:v8';
import { TextDecoder, TextEncoder } from 'util';

Object.assign(global, jestChrome);
global.Blob = Blob as any;
global.chrome.runtime.getPlatformInfo = getPlatformInfo;
global.console.debug = () => { }
global.structuredClone = (obj: any) => deserialize(serialize(obj));
global.TextDecoder = TextDecoder
global.TextEncoder = TextEncoder


function getPlatformInfo(callback: (platformInfo: chrome.runtime.PlatformInfo) => void): void;
function getPlatformInfo(): Promise<chrome.runtime.PlatformInfo>;
function getPlatformInfo(callback?: (platformInfo: chrome.runtime.PlatformInfo) => void): void | Promise<chrome.runtime.PlatformInfo> {
    const platformInfo: chrome.runtime.PlatformInfo = { os: 'linux', arch: 'x86-64', nacl_arch: 'x86-64' };

    if (callback)
        return callback(platformInfo);

    return Promise.resolve(platformInfo);
}