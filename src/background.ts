import { AlarmType } from './lib/alarms.js';

import './scripts/background/settings.js';
import './scripts/background/runtime.js';
import './scripts/background/horses.js';



chrome.alarms.onAlarm.addListener(async (alarm: chrome.alarms.Alarm) => {
    switch (alarm.name) {
        case AlarmType.UpdateStallionScores: {
            const next = getNext__updateStallionScores(new Date(alarm.scheduledTime));
            await chrome.alarms.clear(alarm.name);
            await register__updateStallionScores(next);
        }
    }
});

function getNext__updateStallionScores(from: Date) {
    const next = new Date(from.valueOf());
    next.setDate(1);
    next.setUTCHours(7);
    next.setUTCMinutes(0);
    next.setUTCSeconds(0);
    next.setUTCMilliseconds(0);

    if (next.getMonth() % 4 !== 0)
        next.setMonth(next.getMonth() + (3 - next.getMonth() % 3));

    return next;
}

async function register__updateStallionScores(from: Date | number = new Date()) {
    (await chrome.alarms.get(AlarmType.UpdateStallionScores))
        || (await chrome.alarms.create(AlarmType.UpdateStallionScores, {
            when: getNext__updateStallionScores(new Date(from?.valueOf?.() ?? from)).valueOf(),
        }));
}

register__updateStallionScores();