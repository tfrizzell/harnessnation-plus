import { default as settings } from '../../lib/settings.js';

async function clearLocalStorage(clearTelemetry: boolean = false): Promise<void> {
    if (clearTelemetry)
        return await chrome.storage.local.clear();

    const data = await chrome.storage.local.get();

    for (const key of Object.keys(data))
        if (!key.startsWith('telemetry.'))
            await chrome.storage.local.remove(key);
}

chrome.runtime.onStartup.addListener(async () => {
    await clearLocalStorage();
});

chrome.runtime.onInstalled.addListener(async details => {
    if (details.reason === chrome.runtime.OnInstalledReason.INSTALL || await chrome.storage.sync.getBytesInUse() < 1)
        await chrome.storage.sync.set(settings);

    await clearLocalStorage(details.reason === chrome.runtime.OnInstalledReason.UPDATE);

    if (details.reason !== chrome.runtime.OnInstalledReason.UPDATE)
        return;

    chrome.runtime.getManifest().content_scripts?.forEach(async ({ css = [], js = [], matches = [] }) => {
        const tabs = await chrome.tabs.query({ url: matches });

        for (const tab of tabs) {
            setTimeout(async () => {
                await chrome.scripting.executeScript({
                    target: { tabId: tab.id! },
                    func: () => {
                        import(chrome.runtime.getURL('/scripts/installed.js'));
                    },
                });

                if (css.length > 0)
                    await chrome.scripting.insertCSS({
                        target: { tabId: tab.id! },
                        files: css
                    });

                if (js.length > 0)
                    await chrome.scripting.executeScript({
                        target: { tabId: tab.id! },
                        files: js
                    });
            });
        }
    });
});