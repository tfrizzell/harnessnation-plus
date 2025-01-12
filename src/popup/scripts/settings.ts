import { ActionType, sendAction } from '../../lib/actions.js';
import { DataTablesMode } from '../../lib/data-tables.js';
import api from '../../lib/harnessnation.js';
import { DataTablesDisplayUnits, StudFeeFormula } from '../../lib/settings.js';
import { bindDialogEventListeners } from './dialogs.js';

const settings = await chrome.storage.sync.get();

function getSetting(name: string): any {
    const [key, ...keys] = name.split('.').reverse();
    let obj: any = settings;

    for (const key of keys.reverse())
        obj = obj?.[key];

    if (name.match(/^dt\..*?\.duration$/))
        return obj[key] / obj['displayUnits'];

    return obj[key];
}


async function handleButtonClick(button: HTMLButtonElement, e: MouseEvent): Promise<void> {
    button.disabled = true;

    let closeTimeout = 5000;
    const dialog = document.createElement('dialog');
    bindDialogEventListeners(dialog);
    dialog.addEventListener('close', () => dialog.remove());

    try {
        switch (button.getAttribute('name')) {
            case 'clear-response-cache':
                if (!confirm('You are about to clear the API cache. This may cause delays in subsequent feature use, such as pedigree page generation, as the data is repopulated. Are you sure you want to do this?'))
                    break;

                await api.pruneCache();
                dialog.innerHTML = '<p style="align-items:center;display:flex;gap:0.3em"><span class="material-symbols-outlined" style="color:green">check_circle</span> The API cache has been cleared!</p>';
                break;

            case 'clear-stallion-cache':
                if (!confirm('You are about to clear the stallion cache. This may cause a delay the next time you view stallion scores or execute a bloodline search while the cache is rebuilt. Are you sure you want to do this?'))
                    break;

                await sendAction(ActionType.ClearHorseCache);
                dialog.innerHTML = '<p style="align-items:center;display:flex;gap:0.3em"><span class="material-symbols-outlined" style="color:green">check_circle</span> The stallion bloodline cache has been cleared!</p>';
                break;

            case 'reset-settings':
                if (!confirm('You are about to reset all settings to their default values. This will also clear all caches. Are you sure you want to do this?'))
                    break;

                await Promise.all([
                    api.pruneCache(),
                    sendAction(ActionType.ClearHorseCache),
                    chrome.storage.sync.clear().then(() => chrome.storage.sync.set({})),
                ]);

                dialog.innerHTML = '<p style="align-items:center;display:flex;gap:0.3em"><span class="material-symbols-outlined" style="color:green">check_circle</span> Your settings have been reset to the defaults!</p>';
                break;
        }
    } catch (e: any) {
        if (e) {
            console.error(`%cpopup.ts%c     ${e.message}`, 'color:#406e8e;font-weight:bold;', '');
            dialog.innerHTML = `<p style="align-items:center;display:flex;gap:0.3em"><span class="material-symbols-outlined" style="color:red">error</span> An unexpected error has occurred: ${e.message}</p>`;
            closeTimeout = 10000;
        }
    }

    if (dialog.innerHTML) {
        document.body.append(dialog);
        dialog.showModal();
        setTimeout(() => dialog.close(), closeTimeout);
    }

    button.disabled = false;
}

function populateOptions(select: HTMLSelectElement) {
    const options: { value: any, label: string, default?: boolean } | any = [];

    switch (select.getAttribute('name')?.replace(/^settings\./, '')) {
        case 'dt.breeding.displayUnits':
        case 'dt.main.displayUnits':
        case 'dt.progeny.displayUnits':
            options.push(
                { value: DataTablesDisplayUnits.Minutes, label: 'Minute(s)' },
                { value: DataTablesDisplayUnits.Hours, label: 'Hour(s)' },
                { value: DataTablesDisplayUnits.Days, label: 'Day(s)', default: true },
                { value: DataTablesDisplayUnits.Weeks, label: 'Week(s)' },
                { value: DataTablesDisplayUnits.Years, label: 'Year(s)' },
            );
            break;

        case 'dt.breeding.mode':
        case 'dt.main.mode':
        case 'dt.progeny.mode':
            options.push(
                { value: DataTablesMode.Default, label: 'Site Default', default: true },
                { value: DataTablesMode.Custom, label: 'Custom' },
            );
            break;

        case 'stallions.registry.maxGenerations':
            options.push(2, 3, 4, 5);
            break;

        case 'stallions.management.formula':
            options.push(...Object.entries(StudFeeFormula)
                .filter(([name, value]) => Number.isNaN(parseInt(name)))
                .map(([name, value]) => <any>{
                    value: value,
                    label: `${name} Formula`,
                }));
            break;

        default:
            return;
    }

    while (select.firstChild != null)
        select.firstChild.remove();

    for (let option of options) {
        if (typeof option !== 'object')
            option = { value: option, label: option };

        const opt = document.createElement('option');
        opt.setAttribute('value', option.value);
        opt.innerHTML = option.label;
        select.append(opt);

        if (option.default)
            opt.toggleAttribute('selected', true);
    }
}

function setSetting(name: string, value: any): void {
    const [key, ...keys] = name.split('.').reverse();
    let obj: any = settings;

    for (const key of keys.reverse())
        obj = (obj[key] ??= {});

    const prev_value: any = obj[key];

    switch (typeof obj[key]) {
        case 'boolean':
            if (!/^(true|false|1|0|yes|no)$/i.test(value?.toString()))
                throw TypeError(`${value} is not a valid boolean value`);

            obj[key] = /^(true|1|yes)$/i.test(value?.toString());
            break;

        case 'number':
            if (Number.isNaN(parseFloat(value)))
                throw TypeError(`${value} is not a valid integer value`);

            obj[key] = parseFloat(value);
            break;

        default:
            obj[key] = value;
    }

    if (name.match(/^dt\..*?\.duration$/))
        obj['duration'] = obj['duration'] * obj['displayUnits'];
    else if (name.match(/^dt\..*?\.displayUnits$/))
        obj['duration'] = obj['duration'] * obj['displayUnits'] / prev_value;

    chrome.storage.sync.set(settings);
}

document.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input[name^="settings."], select[name^="settings."]').forEach(input => {
    input.dataset.initializing = ''
    const key = input.getAttribute('name')!.replace(/^settings\./, '');
    const validOptions: string[] = [];

    if (input instanceof HTMLSelectElement) {
        populateOptions(input);

        for (const option of input.options)
            validOptions.push(option.value)
    }

    if (input instanceof HTMLInputElement && (input.type === 'checkbox' || input.type === 'radio'))
        input.checked = getSetting(key);
    else
        input.value = getSetting(key);

    input.addEventListener('change', () => {
        const value: any = input instanceof HTMLInputElement && (input.type === 'checkbox' || input.type === 'radio')
            ? input.checked
            : input.value;

        if (validOptions.length > 0 && !validOptions.includes(value))
            throw ReferenceError(`${value} is not a valid option`)

        setSetting(key, value);
    });

    setTimeout(() => delete input.dataset.initializing, 400);
});

document.querySelectorAll<HTMLButtonElement>('button[name]').forEach(button => {
    button.addEventListener('click', e => {
        e.preventDefault();
        handleButtonClick(button, e);
    });
});