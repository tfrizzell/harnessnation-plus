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

chrome.runtime.onStartup.addListener(async (): Promise<void> => {
    await chrome.storage.local.clear();
});

chrome.runtime.onInstalled.addListener(async (details: chrome.runtime.InstalledDetails): Promise<void> => {
    await chrome.storage.local.clear();

    if (details.reason === chrome.runtime.OnInstalledReason.INSTALL)
        await chrome.storage.sync.set(settings);

    if (details.reason !== chrome.runtime.OnInstalledReason.UPDATE)
        return;

    chrome.runtime.getManifest().content_scripts?.forEach(async ({ css = [], js = [], matches = [] }: ContentScript): Promise<void> => {
        const tabs: chrome.tabs.Tab[] = await chrome.tabs.query({ url: matches });

        for (const tab of tabs) {
            setTimeout(async () => {
                await chrome.scripting.executeScript({
                    target: { tabId: tab.id! },
                    func: () => {
                        import(chrome.runtime.getURL('scripts/installed.js'));
                    },
                });

                await Promise.all([
                    !css?.length ? null : chrome.scripting.insertCSS({
                        target: { tabId: tab.id! },
                        files: css
                    }),
                    !js?.length ? null : chrome.scripting.executeScript({
                        target: { tabId: tab.id! },
                        files: js
                    })
                ]);
            });
        }
    });
});