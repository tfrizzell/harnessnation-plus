import { default as settings, Settings } from '../../lib/settings.js';
import { reduceChanges } from '../../lib/utils.js';

chrome.storage.onChanged.addListener(async (changes, areaName) => {
    if (areaName !== 'sync')
        return;

    const typedChanges = changes as {
        [K in keyof Settings]?: Omit<chrome.storage.StorageChange, 'newValue' | 'oldValue'> & {
            oldValue?: Settings[K];
            newValue?: Settings[K];
        };
    };

    await chrome.storage.sync.set(<Settings>{
        ...settings,
        ...Object.entries(changes).reduce(reduceChanges, {}),
        dt: {
            ...settings.dt,
            ...typedChanges?.dt?.newValue,
            breeding: {
                ...settings.dt.breeding,
                ...typedChanges?.dt?.newValue?.breeding,
            },
            main: {
                ...settings.dt.main,
                ...typedChanges?.dt?.newValue?.main,
            },
            progeny: {
                ...settings.dt.progeny,
                ...typedChanges?.dt?.newValue?.progeny,
            }
        },
        stallions: {
            ...settings.stallions,
            ...typedChanges?.stallions?.newValue,
            management: {
                ...settings.stallions.management,
                ...typedChanges?.stallions?.newValue?.management,
            },
            registry: {
                ...settings.stallions.registry,
                ...typedChanges?.stallions?.newValue?.registry,
            },
        },
    });
});