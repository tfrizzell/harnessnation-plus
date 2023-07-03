import { AlarmType } from './lib/alarms.js';

import './scripts/background/settings.js';
import './scripts/background/runtime.js';
import './scripts/background/horses.js';



chrome.alarms.onAlarm.addListener(async (alarm: chrome.alarms.Alarm) => {
    switch (alarm.name) {
        case AlarmType.UpdateStallionScores: {
            const next = new Date(alarm.scheduledTime);
            await chrome.alarms.clear(alarm.name);
            await register__updateStallionScores(next);
        }
    }
});

function getNext__updateStallionScores(from: Date) {
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

async function register__updateStallionScores(from: Date | number = new Date()) {
    const alarm: chrome.alarms.Alarm = await chrome.alarms.get(AlarmType.UpdateStallionScores);

    if (alarm == null) {
        const next: Date = getNext__updateStallionScores(new Date(from?.valueOf?.() ?? from));
        console.info(`background.ts%c     Scheduling 'updateStallionScores' to run at ${next.toISOString()}`, 'color:#406e8e;font-weight:bold;', '');

        await chrome.alarms.create(AlarmType.UpdateStallionScores, {
            when: next.valueOf(),
        });
    } else {
        const next: Date = new Date(alarm.scheduledTime);
        console.debug(`background.ts%c     'updateStallionScores' scheduled to run at ${next.toISOString()}`, 'color:#406e8e;font-weight:bold;', '');
    }
}

register__updateStallionScores();