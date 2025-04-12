// jest.setup.ts
require('fake-indexeddb/auto');

Object.assign(global, require('jest-chrome'));
global.Blob = require('node:buffer').Blob;
global.chrome.runtime.getPlatformInfo = getPlatformInfo;
global.console.debug = () => { }
global.structuredClone = value => JSON.parse(JSON.stringify(value));

function getPlatformInfo(callback: (platformInfo: chrome.runtime.PlatformInfo) => void): void;
function getPlatformInfo(): Promise<chrome.runtime.PlatformInfo>;
function getPlatformInfo(callback?: (platformInfo: chrome.runtime.PlatformInfo) => void): void | Promise<chrome.runtime.PlatformInfo> {
    const platformInfo: chrome.runtime.PlatformInfo = { os: 'linux', arch: 'x86-64', nacl_arch: 'x86-64' };

    if (callback)
        return callback(platformInfo);

    return Promise.resolve(platformInfo);
}
