chrome.runtime.onInstalled.addListener(data => {
    if (data.reason !== 'install' && data.reason !== 'update') {
        return
    }

    chrome.storage.sync.get(data => {
        chrome.storage.sync.clear(async () => {
            chrome.storage.sync.set(await setDefaultData(data), () => {
                chrome.runtime.getManifest().content_scripts.forEach(({ css = [], js = [], matches = [], run_at: runAt }) => {
                    chrome.tabs.query({ url: matches }, tabs => {
                        tabs.forEach(tab => {
                            chrome.tabs.executeScript(tab.id, { file: 'scripts/installed.js' }, () => {
                                css.forEach(file => chrome.tabs.insertCSS(tab.id, { file, runAt }));
                                js.forEach(file => chrome.tabs.executeScript(tab.id, { file, runAt }));
                            });
                        });
                    });
                });
            });
        });
    });
});