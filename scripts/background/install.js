import '../../lib/enums.js';
const defaultSettings = await fetch(chrome.runtime.getURL('/data/settings.json')).then(res => res.json());

chrome.runtime.onInstalled.addListener(data => {
    if (data.reason !== 'install' && data.reason !== 'update') {
        return
    }

    chrome.storage.local.clear();

    chrome.storage.sync.get(data => {
        chrome.storage.sync.clear(async () => {
            chrome.storage.sync.set({
                ...defaultSettings,
                dt: {
                    ...defaultSettings?.dt,
                    breeding: {
                        ...defaultSettings?.dt?.breeding,
                        ...data?.dt?.breeding,
                    },
                    main: {
                        ...defaultSettings?.dt?.main,
                        ...data?.dt?.main,
                    },
                    progeny: {
                        ...defaultSettings?.dt?.progeny,
                        ...data?.dt?.progeny,
                    },
                    ...data?.dt,
                },
                stallions: {
                    ...defaultSettings?.stallions,
                    management: {
                        ...defaultSettings?.stallions?.management,
                        formula: data?.studFee?.formula ?? defaultSettings?.stallions?.management?.formula ?? Formula.Apex,
                        ...data?.stallions?.management,
                    },
                    registry: {
                        ...defaultSettings?.stallions?.registry,
                        bloodlineSearch: data?.stallions?.bloodlineSearch ?? defaultSettings?.stallions?.registry?.bloodlineSearch ?? true,
                        ...data?.stallions?.registry,
                    },
                    ...data?.stallions,
                },
                ...data,
            }, () => {
                chrome.runtime.getManifest().content_scripts.forEach(({ css = [], js = [], matches = [], run_at: runAt }) => {
                    chrome.tabs.query({ url: matches }, tabs => {
                        tabs.forEach(tab => {
                            chrome.tabs.executeScript(tab.id, { file: 'scripts/installed.js' }, () => {
                                setTimeout(() => {
                                    css.forEach(file => chrome.tabs.insertCSS(tab.id, { file, runAt }));
                                    js.forEach(file => chrome.tabs.executeScript(tab.id, { file, runAt }));
                                }, 1);
                            });
                        });
                    });
                });
            });
        });
    });
});
