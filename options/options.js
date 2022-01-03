'use strict';

(() => {
    function loadSettings() {
        return new Promise(resolve => {
            chrome.storage.sync.get((data = {}) => {
                const form = document.forms.settings;
    
                for (const input of [].filter.call(form.elements, el => el.name)) {
                    const value = input.name.split('.').reduce((obj, key) => obj?.[key], data);
                    if (value == null) continue;
    
                    if (input.type === 'checkbox')
                        input.checked = value;
                    else if (input.type === 'radio')
                        input.checked = (input.value == value);
                    else
                        input.value = value;

                    input.addEventListener('input', e => saveInput(e.target));
                }

                for (const custom of form.querySelectorAll('plus-dt-state-duration[name]')) {
                    const value = custom.name.split('.').reduce((obj, key) => obj?.[key], data);
                    if (value == null) continue;

                    custom.value = value;
                    custom.addEventListener('input', e => saveInput(e.target));
                }
    
                resolve();
            });
        });
    }

    function resetSettings() {
        return new Promise((resolve, reject) => {
            if (confirm('You are about to reset all settings to their default values. Are you sure you want to do this?')) {
                chrome.storage.sync.onChanged.addListener(async function waitForDefaults(data) {
                    if (!Object.values(data).find(d => !d.oldValue && d.newValue)) return;

                    chrome.storage.sync.onChanged.removeListener(waitForDefaults);
                    await loadSettings();
                    resolve();
                });

                chrome.storage.sync.clear();
            } else
                reject();
        });
    }

    function saveInput(input) {
        return new Promise(resolve => {
            const data = {};
            const [key, ...keys] = input.name.split('.').reverse();
            const obj = keys.reverse().reduce((obj, key) => obj[key] ?? (obj[key] = {}), data);

            if (input.type === 'checkbox')
                obj[key] = input.checked;
            else if (input.type === 'radio')
                input.checked && (obj[key] = input.value);
            else
                obj[key] = input.value;

            chrome.storage.sync.set(data, () => {
                resolve();
            });
        });
    }

    function saveSettings() {
        return new Promise(resolve => {
            const form = document.forms.settings;
            const data = {};

            for (const custom of form.querySelectorAll('plus-dt-state-duration[name]')) {
                const [key, ...keys] = custom.name.split('.').reverse();
                const obj = keys.reverse().reduce((obj, key) => obj[key] ?? (obj[key] = {}), data);

                obj[key] = custom.value;
            }

            for (const input of [].filter.call(form.elements, el => el.name)) {
                const [key, ...keys] = input.name.split('.').reverse();
                const obj = keys.reverse().reduce((obj, key) => obj[key] ?? (obj[key] = {}), data);

                if (input.type === 'checkbox')
                    obj[key] = input.checked;
                else if (input.type === 'radio')
                    input.checked && (obj[key] = input.value);
                else
                obj[key] = input.value;
            }

            chrome.storage.sync.set(data, () => {
                resolve();
            });
        });
    }

    window.addEventListener('DOMContentLoaded', async () => {
        document.forms.settings.style.visibility = 'hidden';

        await loadSettings();

        document.forms.settings.addEventListener('reset', async e => {
            e.preventDefault();
            await resetSettings(e);
            setTimeout(() => alert('Your settings have been reset to the defaults!'), 1);
        });

        document.forms.settings.addEventListener('submit', async e => {
            e.preventDefault();
            // await saveSettings(e);
            // setTimeout(() => alert('Your settings have been saved successfully!'), 1);
        });

        document.forms.settings.style.visibility = '';
    });
})();