// jest.setup.js
require('fake-indexeddb/auto');

Object.assign(global, require('jest-chrome'));
global.Blob = require('node:buffer').Blob;
global.chrome.runtime.getPlatformInfo = (callback) => Promise.resolve({ os: 'linux' }).then(callback);
global.console.debug = () => { }
global.structuredClone = value => JSON.parse(JSON.stringify(value));