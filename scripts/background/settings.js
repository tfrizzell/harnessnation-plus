import { setDefaultData } from '../modules/settings.js';

chrome.storage.onChanged.addListener(() => {
    chrome.storage.sync.get(async data => {
        chrome.storage.sync.set(await setDefaultData(data));
    });
});
