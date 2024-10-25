import { ActionType, sendAction } from '../lib/actions.js';
import { onLoad } from '../lib/events.js';
import { Settings } from '../lib/settings.js';
import { HNPlusStateDurationElement } from '../components/state-duration.js';

function alertAsync(message?: any): Promise<void> {
    return new Promise((resolve: (value: void | PromiseLike<void>) => void) => {
        setTimeout((): void => {
            alert(message);
            resolve();
        }, 1);
    });
}

function confirmAsync(message?: any): Promise<boolean> {
    return new Promise((resolve: (value: boolean | PromiseLike<boolean>) => void): void => {
        resolve(confirm(message));
    });
}

async function clearStallionCache() {
    if (await confirmAsync('You are about to clear your local cache of horse data. The data will be repopulated the next time you access the stallion registry page. Would you like to continue?')) {
        await sendAction(ActionType.ClearHorseCache);
        return true;
    }

    return false;
}

async function loadSettings(): Promise<void> {
    const data: Settings = await chrome.storage.sync.get() as Settings;
    const form: HTMLFormElement = (document.forms as any).settings;

    for (const input of <HTMLInputElement[]>[].filter.call(form.elements, (el: HTMLInputElement): boolean => !!el.name)) {
        const value: any = input.name.split('.').reduce((obj: Record<string | number | symbol, any>, key: string) => obj?.[key], data);
        if (value == null) continue;

        if (input.type === 'checkbox')
            input.checked = value;
        else if (input.type === 'radio')
            input.checked = (input.value == value);
        else
            input.value = value;

        input.addEventListener('input', (e: Event): void => { saveInput(e.target as HTMLInputElement); });
    }

    for (const custom of form.querySelectorAll<HNPlusStateDurationElement>('hn-plus-state-duration[name]')) {
        const value: any = custom.name!.split('.').reduce((obj: Record<string | number | symbol, any>, key: string) => obj?.[key], data);
        if (value == null) continue;

        custom.value = value;
        custom.addEventListener('input', (e: Event): void => { saveInput(e.target as HNPlusStateDurationElement); });
    }
}

async function resetSettings(): Promise<void> {
    if (await confirmAsync('You are about to reset all settings to their default values. Are you sure you want to do this?')) {
        await chrome.storage.sync.clear();
        await chrome.storage.sync.set({});
    }
}

async function saveInput(input: HTMLInputElement | HNPlusStateDurationElement): Promise<void> {
    const data: Settings = await chrome.storage.sync.get() as Settings;
    const [key, ...keys]: string[] = input.name!.split('.').reverse();
    const obj: Record<string | number | symbol, any> = keys.reverse().reduce((obj: Record<string | number | symbol, any>, key: string) => obj[key] ?? (obj[key] = {}), data);

    if (input instanceof HTMLInputElement) {
        if (input.type === 'checkbox')
            obj[key] = input.checked;
        else if (input.type === 'radio')
            input.checked && (obj[key] = input.value);
        else
            obj[key] = input.value;
    } else
        obj[key] = input.value;

    await chrome.storage.sync.set(data);
}

async function saveSettings(): Promise<void> {
    const data: Settings = await chrome.storage.sync.get() as Settings;
    const form: HTMLFormElement = (document.forms as any).settings;

    for (const custom of form.querySelectorAll<HNPlusStateDurationElement>('hn-plus-dt-state-duration[name]')) {
        const [key, ...keys]: string[] = custom.name!.split('.').reverse();
        const obj: Record<string | number | symbol, any> = keys.reverse().reduce((obj: Record<string | number | symbol, any>, key: string) => obj[key] ?? (obj[key] = {}), data);
        obj[key] = custom.value;
    }

    for (const input of <HTMLInputElement[]>[].filter.call(form.elements, (el: HTMLInputElement): boolean => !!el.name)) {
        const [key, ...keys]: string[] = input.name.split('.').reverse();
        const obj: Record<string | number | symbol, any> = keys.reverse().reduce((obj: Record<string | number | symbol, any>, key: string) => obj[key] ?? (obj[key] = {}), data);

        if (input.type === 'checkbox')
            obj[key] = input.checked;
        else if (input.type === 'radio')
            input.checked && (obj[key] = input.value);
        else
            obj[key] = input.value;
    }

    await chrome.storage.sync.set(data);
}

onLoad(async () => {
    const form: HTMLFormElement = (document.forms as any).settings;
    form.style.setProperty('visibility', 'hidden');

    await loadSettings();

    document.querySelector('#clear-stallion-cache')?.addEventListener('click', async (e: Event): Promise<void> => {
        e.preventDefault();

        try {
            if (await clearStallionCache())
                await alertAsync('The stallion bloodline cache has been cleared!');
        } catch (e: any) {
            if (e) {
                console.error(`%coptions.ts%c     ${e.message}`, 'color:#406e8e;font-weight:bold;', '');
                await alertAsync(`An unexpected error has occurred: ${e.message}`);
            }
        }
    });

    form.addEventListener('reset', async (e: Event): Promise<void> => {
        e.preventDefault();

        try {
            await resetSettings();
            await alertAsync('Your settings have been reset to the defaults!');
        } catch (e: any) {
            if (e) {
                console.error(`%coptions.ts%c     ${e.message}`, 'color:#406e8e;font-weight:bold;', '');
                await alertAsync(`An unexpected error has occurred: ${e.message}`);
            }
        }
    });

    form.addEventListener('submit', async (e: Event): Promise<void> => {
        e.preventDefault();

        try {
            await saveSettings();
            await alertAsync('Your settings have been saved!');
        } catch (e: any) {
            if (e) {
                console.error(`%coptions.ts%c     ${e.message}`, 'color:#406e8e;font-weight:bold;', '');
                await alertAsync(`An unexpected error has occurred: ${e.message}`);
            }
        }
    });

    form.style.removeProperty('visibility');
});