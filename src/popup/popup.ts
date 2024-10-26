import { ActionType, sendAction } from '../lib/actions.js';
import { DataTablesMode } from '../lib/data-tables.js';
import { DataTablesDisplayUnits, StudFeeFormula } from '../lib/settings.js';

document.querySelectorAll<HTMLAnchorElement>('#page-footer > nav > a').forEach(a => {
    const sectionName = a.getAttribute('href')?.replace(/^#/, '');

    a.addEventListener('click', (e: MouseEvent) => {
        e.preventDefault();

        if (a.classList.contains('active'))
            return;

        document.querySelector('#page-content > section.active')?.classList.remove('active');
        document.querySelector(`#page-content > section:has(> a[name="${sectionName}" i])`)?.classList.add('active');

        document.querySelector('#page-footer > nav > a.active')?.classList.remove('active');
        a.classList.add('active');
    });
});

function bindDialogEventListeners(dialog: HTMLDialogElement): void {
    dialog.addEventListener('click', (e: MouseEvent) => {
        if (dialog == e.target)
            dialog.close();
    });

    dialog.addEventListener('keydown', (e: KeyboardEvent) => {
        e.preventDefault();
    });

    dialog.addEventListener('keyup', (e: KeyboardEvent) => {
        e.preventDefault();
        dialog.close();
    });
}

document.querySelectorAll<HTMLDialogElement>('dialog').forEach(bindDialogEventListeners);

document.querySelectorAll<HTMLAnchorElement>('a[role="dialog" i]').forEach(a => {
    const dialogName = a.getAttribute('href')?.replace(/^#/, '');

    a.addEventListener('click', (e: MouseEvent) => {
        e.preventDefault();
        document.querySelector<HTMLDialogElement>(`dialog#${dialogName}`)?.showModal();
    });
});

chrome.storage.sync.get().then(settings => {
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

        const dialog: HTMLDialogElement = document.createElement('dialog');
        bindDialogEventListeners(dialog);
        dialog.addEventListener('close', () => dialog.remove());

        try {
            switch (button.getAttribute('name')) {
                case 'clear-stallion-cache':
                    if (!confirm('You are about to clear the stallion cache. This may cause a delay the next time you view stallion scores or execute a bloodline search while the cache is rebuilt. Are you sure you want to do this?'))
                        return;

                    await sendAction(ActionType.ClearHorseCache);
                    dialog.innerHTML = '<p style="align-items:center;display:flex;gap:0.3em"><span class="material-symbols-outlined" style="color:green">check_circle</span> The stallion bloodline cache has been cleared!</p>';
                    break;

                case 'reset-settings':
                    if (!confirm('You are about to reset all settings to their default values. Are you sure you want to do this?'))
                        return;

                    await chrome.storage.sync.clear();
                    await chrome.storage.sync.set({});
                    dialog.innerHTML = '<p style="align-items:center;display:flex;gap:0.3em"><span class="material-symbols-outlined" style="color:green">check_circle</span> Your settings have been reset to the defaults!</p>';
                    break;
            }
        } catch (e: any) {
            if (e) {
                console.error(`%cpopup.ts%c     ${e.message}`, 'color:#406e8e;font-weight:bold;', '');
                dialog.innerHTML = `<p style="align-items:center;display:flex;gap:0.3em"><span class="material-symbols-outlined" style="color:red">error</span> An unexpected error has occurred: ${e.message}</p>`;
            }
        }

        if (dialog.innerHTML) {
            document.body.append(dialog);
            dialog.showModal();
            setTimeout(() => dialog.close(), 2000);
        }

        button.disabled = false;
    }

    function populateOptions(select: HTMLSelectElement) {
        const options: { value: any, label: string, default?: boolean } | any = [];

        switch (select.getAttribute('name')) {
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

        while (null != select.firstChild)
            select.firstChild.remove();

        for (let option of options) {
            if (typeof option !== 'object')
                option = { value: option, label: option } as any;

            const opt: HTMLOptionElement = document.createElement('option');
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

        const prev_value = obj[key];

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

    document.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input[name], select[name]').forEach(input => {
        input.dataset.initializing = ''
        const key: string = input.getAttribute('name')!;
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
        button.addEventListener('click', (e: MouseEvent) => {
            e.preventDefault();
            handleButtonClick(button, e);
        });
    });
});