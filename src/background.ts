import { AlarmType } from './lib/alarms.js';
import api from './lib/harnessnation.js';
import { isMobileOS } from './lib/utils.js';

import './scripts/background/settings.js';
import './scripts/background/runtime.js';
import './scripts/background/horses.js';



chrome.alarms.onAlarm.addListener(async alarm => {
    switch (alarm.name) {
        case AlarmType.PruneAPICache: {
            await api.pruneCache();
            break;
        }

        case AlarmType.UpdateStallionScores: {
            const next = new Date(alarm.scheduledTime);
            await chrome.alarms.clear(alarm.name);
            await register__updateStallionScores(next);
            break;
        }
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

async function register__pruneAPICache(from: Date | number = new Date()) {
    await chrome.alarms.clear(AlarmType.PruneAPICache);

    if (api.cacheTTL > 0)
        await chrome.alarms.create(AlarmType.PruneAPICache, {
            when: Date.now(),
            periodInMinutes: api.cacheTTL / 60_000,
        });
}

async function register__updateStallionScores(from: Date | number = new Date()): Promise<void> {
    await chrome.alarms.clear(AlarmType.UpdateStallionScores);

    if (await isMobileOS()) {
        console.debug(`%cbackground.ts%c     Mobile OS Detected: skipping stallion score update task`, 'color:#406e8e;font-weight:bold;', '');
        return;
    }

    await chrome.alarms.create(AlarmType.UpdateStallionScores, {
        when: getNext__updateStallionScores(new Date(from?.valueOf?.() ?? from)).valueOf(),
    });
}

register__pruneAPICache();
register__updateStallionScores();