import { merge } from 'https://cdn.jsdelivr.net/npm/lodash-es@4.17.21/lodash.min.js';
const defaultSettings = await fetch(chrome.runtime.getURL('/data/settings.json')).then(res => res.json());

chrome.storage.onChanged.addListener(() => {
    chrome.storage.sync.get(async data => {
        chrome.storage.sync.set(merge(defaultSettings, data));
    });
});
