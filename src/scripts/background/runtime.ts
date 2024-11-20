import { default as settings, Settings } from '../../lib/settings.js';

declare type ContentScript = {
    matches?: string[] | undefined;
    exclude_matches?: string[] | undefined;
    css?: string[] | undefined;
    js?: string[] | undefined;
    run_at?: string | undefined;
    all_frames?: boolean | undefined;
    match_about_blank?: boolean | undefined;
    include_globs?: string[] | undefined;
    exclude_globs?: string[] | undefined;
}

chrome.runtime.onStartup.addListener(async () => {
    // await chrome.storage.local.clear();
});

chrome.runtime.onInstalled.addListener(async details => {
    // await chrome.storage.local.clear();

    if (details.reason === chrome.runtime.OnInstalledReason.INSTALL || await chrome.storage.sync.getBytesInUse() < 1)
        await chrome.storage.sync.set(settings);

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