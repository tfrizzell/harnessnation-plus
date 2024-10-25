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

document.querySelectorAll<HTMLDialogElement>('dialog').forEach(dialog => {
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
});

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

        return obj[key];
    }

    function setSetting(name: string, value: any): void {
        const [key, ...keys] = name.split('.').reverse();
        let obj: any = settings;

        for (const key of keys.reverse())
            obj = (obj[key] ??= {});

        const valueType = typeof obj[key];

        switch (typeof obj[key]) {
            case 'boolean':
                if (!/^(true|false|1|0|yes|no)$/i.test(value?.toString()))
                    throw TypeError(`${value} is not a valid boolean value`);

                obj[key] = /^(true|1|yes)$/i.test(value?.toString());
                break;

            case 'number':
                if (Number.isNaN(parseInt(value)))
                    throw TypeError(`${value} is not a valid integer value`);

                obj[key] = parseInt(value);
                break;

            default:
                obj[key] = value;
        }

        chrome.storage.sync.set(settings);
        console.log(settings);
    }

    document.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input[name], select[name]').forEach(input => {
        const key: string = input.getAttribute('name')!;
        const validOptions: string[] = [];

        if (input instanceof HTMLSelectElement) {
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
    });
});
// const data = await chrome.storage.sync.get();
// const form = document.forms.settings;
// for (const input of [].filter.call(form.elements, (el) => !!el.name)) {
//     const value = input.name.split('.').reduce((obj, key) => obj?.[key], data);
//     if (value == null)
//         continue;
//     if (input.type === 'checkbox')
//         input.checked = value;
//     else if (input.type === 'radio')
//         input.checked = (input.value == value);
//     else
//         input.value = value;
//     input.addEventListener('input', (e) => { saveInput(e.target); });
// }
// for (const custom of form.querySelectorAll('hn-plus-state-duration[name]')) {
//     const value = custom.name.split('.').reduce((obj, key) => obj?.[key], data);
//     if (value == null)
//         continue;
//     custom.value = value;
//     custom.addEventListener('input', (e) => { saveInput(e.target); });
// }