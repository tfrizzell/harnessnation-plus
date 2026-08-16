import { ActionType, sendAction } from '../../lib/actions.js';
import { DataTablesMode } from '../../lib/data-tables.js';
import api from '../../lib/harnessnation.js';
import { DataTablesDisplayUnits, StudFeeFormula } from '../../lib/settings.js';
import { Paths, ValueAt } from '../../types/paths.js';
import { bindDialogEventListeners } from './dialogs.js';

const settings = await chrome.storage.sync.get<Settings>();

function getSetting<P extends Paths<Settings>>(path: P): ValueAt<Settings, P> {
    if (/^dt\..*?\.duration$/.test(path)) {
        const data = getSettingValue(path.split('.').slice(0, -1).join('.') as Paths<Settings>) as DataTablesSettings;
        return (data.duration / data.displayUnits) as ValueAt<Settings, P>;
    }

    return getSettingValue(path);
}

function getSettingValue<P extends Paths<Settings>>(path: P): ValueAt<Settings, P> {
    return path
        .split('.')
        .reduce<unknown>(
            (obj, key) =>
                typeof obj === 'object' && obj !== null
                    ? (obj as Record<string, unknown>)[key]
                    : undefined,
            settings,
        ) as ValueAt<Settings, P>;
}

async function handleButtonClick(button: HTMLButtonElement): Promise<void> {
    button.disabled = true;

    let closeTimeout = 5000;
    const dialog = document.createElement('dialog');
    bindDialogEventListeners(dialog);
    dialog.addEventListener('close', () => dialog.remove());

    try {
        // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
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
    } catch (e: unknown) {
        console.groupCollapsed(`%csettings.ts%c     An unexpected error has occurred`, 'color:#406e8e;font-weight:bold;', '')

        if (e instanceof Error) {
            console.error('Message:', e.message);
            console.error('Stack Trace:', e);
            dialog.innerHTML = `<p style="align-items:center;display:flex;gap:0.3em"><span class="material-symbols-outlined" style="color:red">error</span> An unexpected error has occurred: ${e.message}</p>`;
        } else {
            console.error('Unknown Error:', e);
            dialog.innerHTML = `<p style="align-items:center;display:flex;gap:0.3em"><span class="material-symbols-outlined" style="color:red">error</span> An unexpected error has occurred: ${String(e)}</p>`;
        }

        console.groupEnd();
        closeTimeout = 10000;
    }


    if (dialog.innerHTML) {
        document.body.append(dialog);
        dialog.showModal();
        setTimeout(() => dialog.close(), closeTimeout);
    }

    button.disabled = false;
}

function populateOptions(select: HTMLSelectElement): void {
    const options: Array<
        { value: string | number, label: string, default?: boolean }
        | string
        | number
    > = [];

    // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
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
                .filter(([name, _value]) => Number.isNaN(parseInt(name)))
                .map(([name, value]) => ({
                    value: value,
                    label: `${name} Formula`,
                })));
            break;

        default:
            return;
    }

    while (select.firstChild != null)
        select.firstChild.remove();

    for (let option of options) {
        if (typeof option !== 'object')
            option = { value: option, label: option.toString() };

        const opt = document.createElement('option');
        opt.setAttribute('value', option.value.toString());
        opt.innerHTML = option.label;
        select.append(opt);

        if (option.default)
            opt.toggleAttribute('selected', true);
    }
}

function setSetting<P extends Paths<Settings>>(path: P, value: ValueAt<Settings, P>): void {
    const keys = path.split('.');
    const lastKey = keys.pop() as string;

    let obj = settings as unknown as Record<string, unknown>;

    for (const key of keys) {
        if (typeof obj[key] !== 'object' || obj[key] == null)
            obj[key] = {};

        obj = obj[key] as Record<string, unknown>;
    }

    const prevValue: unknown = obj[lastKey];
    const valueString = typeof value === 'object' ? JSON.stringify(value) : String(value);

    // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
    switch (typeof prevValue) {
        case 'boolean':
            if (typeof value === 'object')
                throw new TypeError(`Expected boolean-like value for '${path}', got ${typeof value}`);

            if (!/^(true|false|1|0|yes|no)$/i.test(valueString))
                throw TypeError(`${valueString} is not a valid boolean value`);

            obj[lastKey] = /^(true|1|yes)$/i.test(valueString);
            break;

        case 'number': {
            let numeric: number;

            // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
            switch (typeof value) {
                case 'bigint':
                case 'boolean':
                    numeric = Number(value)
                    break;

                case 'number':
                    numeric = value;
                    break;

                case 'string':
                    numeric = parseFloat(value);
                    break;


                default:
                    throw new TypeError(`Expected number-like value for '${path}', got ${typeof value}`);
            }

            if (Number.isNaN(numeric))
                throw TypeError(`${valueString} is not a valid numeric value`);

            obj[lastKey] = numeric;
            break;
        }

        default:
            obj[lastKey] = value;
    }

    if (path.match(/^dt\..*?\.duration$/)) {
        const data = obj as unknown as DataTablesSettings;
        data.duration = data.duration * data.displayUnits;
    } else if (path.match(/^dt\..*?\.displayUnits$/)) {
        const data = obj as unknown as DataTablesSettings;
        data.duration = data.duration * data.displayUnits / (prevValue as number);
    }

    void chrome.storage.sync.set(settings);
}

document.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input[name^="settings."], select[name^="settings."]').forEach(input => {
    const key = input.getAttribute('name')?.replace(/^settings\./, '');

    if (!key)
        return;

    input.dataset.initializing = ''
    const validOptions: Array<string> = [];

    if (input instanceof HTMLSelectElement) {
        populateOptions(input);

        for (const option of input.options)
            validOptions.push(option.value)
    }

    if (input instanceof HTMLInputElement && (input.type === 'checkbox' || input.type === 'radio'))
        input.checked = getSetting(key as Paths<Settings>) as boolean;
    else
        input.value = getSetting(key as Paths<Settings>) as string;

    input.addEventListener('change', () => {
        const value = input instanceof HTMLInputElement && (input.type === 'checkbox' || input.type === 'radio')
            ? input.checked
            : input.value;

        if (validOptions.length > 0 && !validOptions.includes(value.toString()))
            throw ReferenceError(`${value} is not a valid option`)

        setSetting(key as Paths<Settings>, value as ValueAt<Settings, Paths<Settings>>);
    });

    setTimeout(() => {
        delete input.dataset.initializing;
    }, 400);
});

document.querySelectorAll<HTMLButtonElement>('button[name]').forEach(button => {
    button.addEventListener('click', e => {
        e.preventDefault();
        void handleButtonClick(button);
    });
});