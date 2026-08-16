import { AlarmType } from './lib/alarms.js';
import { api } from './lib/harnessnation.js';
import { isMobileOS } from './lib/utils.js';

import './scripts/background/settings.js';
import './scripts/background/runtime.js';
import './scripts/background/horses.js';

chrome.alarms.onAlarm.addListener(alarm => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
    if (alarm.name === AlarmType.PruneAPICache) {
        void api.pruneCache();
        return;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
    if (alarm.name === AlarmType.UpdateStallionScores) {
        const next = new Date(alarm.scheduledTime);
        void chrome.alarms.clear(alarm.name).then(() => register__updateStallionScores(next));
        return;
    }
});

function getNext__updateStallionScores(from: Date): Date {
    const next = new Date(from.valueOf());
    next.setMonth(next.getMonth() + 1);
    next.setDate(1);
    next.setUTCHours(7);
    next.setUTCMinutes(0);
    next.setUTCSeconds(0);
    next.setUTCMilliseconds(0);

    if (next.getMonth() % 3 !== 0)
        next.setMonth(next.getMonth() + (3 - next.getMonth() % 3));

    return next;
}

async function register__pruneAPICache(): Promise<void> {
    await chrome.alarms.clear(AlarmType.PruneAPICache);

    if (await isMobileOS()) {
        console.debug(`%cbackground.ts%c     Mobile OS Detected: skipping response cache prune task`, 'color:#406e8e;font-weight:bold;', '');
        return;
    }

    if (api.cacheTTL > 0) {
        await chrome.alarms.create(AlarmType.PruneAPICache, {
            when: Date.now(),
            periodInMinutes: api.cacheTTL / 60_000,
        });
    }
}

async function register__updateStallionScores(from: Date | number = new Date()): Promise<void> {
    await chrome.alarms.clear(AlarmType.UpdateStallionScores);

    if (await isMobileOS()) {
        console.debug(`%cbackground.ts%c     Mobile OS Detected: skipping stallion score update task`, 'color:#406e8e;font-weight:bold;', '');
        return;
    }

    await chrome.alarms.create(AlarmType.UpdateStallionScores, {
        when: getNext__updateStallionScores(new Date(from.valueOf())).valueOf(),
    });
}

void register__pruneAPICache();
void register__updateStallionScores();