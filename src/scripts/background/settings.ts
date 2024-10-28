import { default as settings, Settings } from '../../lib/settings.js';
import { reduceChanges } from '../../lib/utils.js';

chrome.storage.onChanged.addListener(async (changes, areaName) => {
    if (areaName !== 'sync')
        return;

    await chrome.storage.sync.set(<Settings>{
        ...settings,
        ...Object.entries(changes).reduce(reduceChanges, {}),
        dt: {
            ...settings.dt,
            ...changes?.dt?.newValue,
            breeding: {
                ...settings.dt.breeding,
                ...changes?.dt?.newValue?.breeding,
            },
            main: {
                ...settings.dt.main,
                ...changes?.dt?.newValue?.main,
            },
            progeny: {
                ...settings.dt.progeny,
                ...changes?.dt?.newValue?.progeny,
            }
        },
        stallions: {
            ...settings.stallions,
            ...changes?.stallions?.newValue,
            management: {
                ...settings.stallions.management,
                ...changes?.stallions?.newValue?.management,
            },
            registry: {
                ...settings.stallions.registry,
                ...changes?.stallions?.newValue?.registry,
            },
        },
    });
});