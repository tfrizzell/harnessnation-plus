// jest.setup.js
require('fake-indexeddb/auto');

Object.assign(global, require('jest-chrome'));
global.Blob = require('node:buffer').Blob;
global.console.debug = () => { }
global.structuredClone = value => JSON.parse(JSON.stringify(value));