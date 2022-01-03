(() => {
    function $alert(...args) {
        return new Promise(resolve => {
            setTimeout(() => {
                alert(...args);
                resolve();
            }, 1);
        });
    }

    async function clearStallionCache() {
        return new Promise((resolve, reject) => {
            if (confirm('You are about to clear your local cache of stallion bloodline data. The data will be repopulated the next time you access the stallion registry page. Would you like to continue?'))
                chrome.storage.local.remove('stallions', () => resolve());
            else
                reject();
        });
    }

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
            if (confirm('You are about to reset all settings to their default values. Are you sure you want to do this?'))
                fetch(chrome.extension.getURL('/data/settings.json'))
                    .then(res => res.json())
                    .then(defaultSettings => {
                        chrome.storage.sync.clear(() => {
                            chrome.storage.sync.set(defaultSettings, async () => {
                                await loadSettings();
                                resolve()
                            });
                        });
                    })
                    .catch(reject);
            else
                reject();
        });
    }

    function saveInput(input) {
        return new Promise(resolve => {
            chrome.storage.sync.get(data => {
                const [key, ...keys] = input.name.split('.').reverse();
                const obj = keys.reverse().reduce((obj, key) => obj[key] ?? (obj[key] = {}), data);

                if (input.type === 'checkbox')
                    obj[key] = input.checked;
                else if (input.type === 'radio')
                    input.checked && (obj[key] = input.value);
                else
                    obj[key] = input.value;

                chrome.storage.sync.set(data, () => resolve());
            });
        });
    }

    function saveSettings() {
        return new Promise(resolve => {
            chrome.storage.sync.get(data => {
                const form = document.forms.settings;

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

                chrome.storage.sync.set(data, () => resolve());
            });
        });
    }

    window.addEventListener('DOMContentLoaded', async () => {
        document.forms.settings.style.visibility = 'hidden';

        await loadSettings();

        document.querySelector('#clear-stallion-cache').addEventListener('click', async e => {
            e.preventDefault();

            try {
                await clearStallionCache();
                $alert('The stallion bloodline cache has been cleared!');
            } catch (error) {
                if (error) {
                    console.error(error);
                    $alert(`An unexpected error has occurred: ${error}`);
                }
            }
        });

        document.forms.settings.addEventListener('reset', async e => {
            e.preventDefault();

            try {
                await resetSettings();
                $alert('Your settings have been reset to the defaults!');
            } catch (error) {
                if (error) {
                    console.error(error);
                    $alert(`An unexpected error has occurred: ${error}`);
                }
            }
        });

        document.forms.settings.addEventListener('submit', async e => {
            e.preventDefault();

            try {
                await saveSettings();
                $alert('Your settings have been saved!');
            } catch (error) {
                if (error) {
                    console.error(error);
                    $alert(`An unexpected error has occurred: ${error}`);
                }
            }
        });

        document.forms.settings.style.visibility = '';
    });
})();