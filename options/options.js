'use strict';

(() => {
    const inputs = {};

    const bindInputs = () => {
        document.querySelectorAll('[name^="setting:"]').forEach(el => {
            inputs[el.name.replace(/^setting:/, '')] = el;
        });

        document.querySelectorAll('.time-setting-input').forEach(el => {
            const control = el.querySelector('[role=control]');
            const value = el.querySelector('[role=value]');
            const units = el.querySelector('[role=units]');

            control.addEventListener('change', function (e) {
                if (+e.target.value === 1) {
                    value.offsetParent || el.appendChild(value);
                    units.offsetParent || el.appendChild(units);
                } else {
                    units.offsetParent && el.removeChild(units);
                    value.offsetParent && el.removeChild(value);
                }
            });

            el.removeChild(units);
            el.removeChild(value);
        });
    };

    const loadSettings = () => {
        chrome.storage.sync.get(data => {
            Object.entries(data).forEach(([key, value]) => {
                if (inputs[key]) {
                    inputs[key].value = value;
                    inputs[key].dispatchEvent(new Event('change'));
                }
            });

            document.forms.settings.style.visibility = '';
        });
    };

    const renderTemplates = () => {
        document.querySelectorAll(':not(template) [template-id]').forEach(el => {
            const node = document.importNode(document.querySelector(`template#${el.getAttribute('template-id')}`).content, true);

            [].forEach.call(node.children, child => {
                child.innerHTML = child.innerHTML.replace(/\{\{(.*?)\}\}/g, (_, attr) => el.getAttribute(attr) ?? '');
            });

            el.parentNode.replaceChild(node, el);
        });
    };

    const resetSettings = e => {
        e.preventDefault();

        if (confirm('You are about to reset all settings to their default values. Are you sure you want to do this?')) {
            chrome.storage.sync.clear(() => {
                loadSettings();
                alert('Your settings have been reset successfully!');
            });
        }
    };

    const saveSettings = e => {
        e.preventDefault();

        chrome.storage.sync.set(Object.entries(inputs).reduce((data, [key, el]) => ({ ...data, [key]: el.value }), {}), () => {
            alert('Your settings have been saved successfully!');
        });
    };

    const setActive = () => {
        const anchors = document.querySelectorAll('.settings-form a[name]');
        const target = `#${([].find.call(anchors, el => el.offsetTop >= window.scrollY) ?? anchors[0]).getAttribute('name')}`;

        document.querySelectorAll('.navigation > a').forEach(el => {
            el.classList.remove('active');
            (el.getAttribute('href') === target) && el.classList.add('active');
        });
    };

    const showPage = (page) => {
        document.querySelectorAll('.navigation > a').forEach((el, i) => {
            el.classList[((el.getAttribute('href') === `#${page}`) || (!page && i === 0)) ? 'add' : 'remove']('active');
        });

        document.forms.settings.querySelectorAll('.form-page').forEach((el, i) => {
            el.style.display = ((el.id === page) || (!page && i === 0)) ? '' : 'none';
        });
    };

    window.addEventListener('DOMContentLoaded', () => {
        document.forms.settings.style.visibility = 'hidden';

        showPage(window.location.hash?.replace(/^#/, ''));
        renderTemplates();
        bindInputs();
        loadSettings();

        document.forms.settings.addEventListener('reset', resetSettings);
        document.forms.settings.addEventListener('submit', saveSettings);
    });

    window.addEventListener('hashchange', setActive);
    window.addEventListener('scroll', setActive);
    setActive();
})();