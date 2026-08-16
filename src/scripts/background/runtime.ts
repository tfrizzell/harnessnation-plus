import { default as settings } from '../../lib/settings.js';

async function clearLocalStorage(clearTelemetry: boolean = false): Promise<void> {
    if (clearTelemetry) {
        await chrome.storage.local.clear();
        return;
    }

    const data = await chrome.storage.local.get();

    for (const key of Object.keys(data))
        if (!key.startsWith('telemetry.'))
            await chrome.storage.local.remove(key);
}

chrome.runtime.onStartup.addListener(() => {
    void clearLocalStorage();
});

chrome.runtime.onInstalled.addListener(details => {
    void (async () => {
        if (
            // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
            details.reason === chrome.runtime.OnInstalledReason.INSTALL
            || await chrome.storage.sync.getBytesInUse() < 1
        )
            await chrome.storage.sync.set(settings);

        // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
        await clearLocalStorage(details.reason === chrome.runtime.OnInstalledReason.UPDATE);

        // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
        if (details.reason !== chrome.runtime.OnInstalledReason.UPDATE)
            return;

        chrome.runtime.getManifest()
            .content_scripts
            ?.forEach(({ css = [], js = [], matches = [] }) => {
                void (async () => {
                    const tabs = await chrome.tabs.query({ url: matches });

                    for (const tab of tabs) {
                        setTimeout(() => {
                            void (async () => {
                                if (!tab.id)
                                    return;

                                await chrome.scripting.executeScript({
                                    target: { tabId: tab.id },
                                    func: () => {
                                        void import(chrome.runtime.getURL('/scripts/installed.js'));
                                    },
                                });

                                if (css.length > 0)
                                    await chrome.scripting.insertCSS({
                                        target: { tabId: tab.id },
                                        files: css
                                    });

                                if (js.length > 0)
                                    await chrome.scripting.executeScript({
                                        target: { tabId: tab.id },
                                        files: js
                                    });
                            })();
                        });
                    }
                })();
            });
    })();
});