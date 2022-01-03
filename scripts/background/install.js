'use strict';

const setDefaultData = (data) => ({
    dt: {
        breeding: {
            displayUnits: 'YEARS',
            duration: 31557600,
            enabled: true,
            mode: 0,
            ...data?.dt?.breeding,
        },
        main: {
            displayUnits: 'YEARS',
            duration: 31557600,
            enabled: true,
            mode: 0,
            ...data?.dt?.main,
        },
        progeny: {
            displayUnits: 'YEARS',
            duration: 31557600,
            enabled: true,
            mode: 0,
            ...data?.dt?.progeny,
        },
        ...data?.dt,
    },
    stallions: {
        management: {
            formula: data?.studFee?.formula ?? FORMULA_APEX,
            ...data?.stallions?.management,
        },
        registry: {
            bloodlineSearch: data?.stallions?.bloodlineSearch ?? true,
            ...data?.stallions?.registry,
        },
        ...data?.stallions,
    },
    ...data,
});

chrome.runtime.onInstalled.addListener(data => {
    if (data.reason !== 'install' && data.reason !== 'update') {
        return;
    }

    chrome.storage.sync.get(data => {
        chrome.storage.sync.clear(() => {
            chrome.storage.sync.set(setDefaultData(data), () => {
                chrome.storage.onChanged.addListener(() => {
                    chrome.storage.sync.get(data => {
                        chrome.storage.sync.set(setDefaultData(data));
                    });
                });

                chrome.runtime.getManifest().content_scripts.forEach(({ css = [], js = [], matches = [], run_at: runAt }) => {
                    chrome.tabs.query({ url: matches }, tabs => {
                        tabs.forEach(tab => {
                            chrome.tabs.executeScript(tab.id, { file: 'scripts/installed.js' }, () => {;
                                css.forEach(file => chrome.tabs.insertCSS(tab.id, { file, runAt }));
                                js.forEach(file => chrome.tabs.executeScript(tab.id, { file, runAt }));
                            });
                        });
                    })
                });
            });
        });
    });
});