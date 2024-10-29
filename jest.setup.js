// jest.setup.js
Object.assign(global, require('jest-chrome'));
global.Blob = require('node:buffer').Blob;