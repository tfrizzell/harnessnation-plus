(() => {
    async function bindSearch() {
        const unbind = document.createElement('script');
        unbind.setAttribute('type', 'module');
        unbind.textContent = `$('#saleTable_filter input[type="search"]').unbind()`
        document.body.append(unbind);

        const filter = document.querySelector('#saleTable_filter');
        const search = filter.querySelector('input[type="search"]');

        const [wrapper, toggle] = await injectLocalToggle();
        filter.parentNode.previousSibling.append(wrapper);

        let debounce;

        function handleSearch() {
            clearTimeout(debounce);
            debounce = setTimeout(doSearch, 200, search.value, toggle.checked);
        }

        async function toggleSearch() {
            const term = search.value;
            window.addEventListener(`search.${chrome.runtime.id}`, () => search.value = term, { once: true });
            await doSearch(search.value, toggle.checked);
        }

        search.addEventListener('input', handleSearch);
        toggle.addEventListener('input', toggleSearch);

        window.addEventListener(`installed.${chrome.runtime.id}`, () => {
            toggle.removeEventListener('input', toggleSearch);
            search.removeEventListener('input', handleSearch);
        }, { once: true });
    }

    async function doSearch(term, useBloodlineSearch = true) {
        chrome.storage.sync.get('stallions', async ({ stallions: settings }) => {
            window.dispatchEvent(new CustomEvent(`search.${chrome.runtime.id}`, {
                detail: {
                    pattern: await new Promise(resolve => {
                        useBloodlineSearch
                        ? chrome.runtime.sendMessage({ action: 'SEARCH_STALLIONS', data: { term, maxGenerations: settings.registry.maxGenerations } }, resolve)
                        : resolve(term);
                    }),
                },
            }));
        });
    }

    function getStallions(html) {
        const pattern = /<a[^>]*horse\/(\d+)[^>]*>(.*?)<\/a[^>]*>.*?(?:Unknown\s*x\s*Unknown|<a[^>]*horse\/(\d+)[^>]*>(.*?)<\/a[^>]*>\s*x\s*<a[^>]*horse\/(\d+)[^>]*>(.*?)<\/a[^>]*>)/gs;
        const stallions = {};
        let data;

        while (data = pattern.exec(html)) {
            const [id, name, sireId, sireName] = data.slice(1);

            stallions[id] = {
                id: +id,
                name,
                sireId: +sireId || null,
                reited: false,
            };

            sireId && (stallions[sireId] ??= {
                id: +sireId,
                name: sireName,
            });
        }

        return Object.values(stallions);
    }

    function injectLocalToggle() {
        return new Promise(resolve => {
            chrome.storage.sync.get('stallions', async ({ stallions: settings }) => {
                document.querySelector('#hn-plus-bloodline-search')?.remove();

                const wrapper = document.createElement('div');
                wrapper.setAttribute('id', 'hn-plus-bloodline-search');

                const label = document.createElement('label');
                label.textContent = 'Bloodline Search:';
                wrapper.append(label);

                const toggle = document.createElement('input', { is: 'hn-plus-toggle', type: 'checkbox' });
                toggle.type = 'checkbox';
                toggle.setAttribute('type', 'checkbox');
                toggle.setAttribute('is', 'hn-plus-toggle');
                settings.registry.bloodlineSearch && toggle.toggleAttribute('checked');
                label.append(toggle);

                const tooltip = document.createElement('hn-plus-tooltip');
                wrapper.append(tooltip);

                const p = document.createElement('p');
                tooltip.innerHTML = 'Temporarily toggle bloodline search on or off. To toggle this permanently, or to change the depth of the search, go to the HarnessNation+ options page.';
                tooltip.append(p);

                window.addEventListener(`installed.${chrome.runtime.id}`, () => {
                    wrapper.remove();
                }, { once: true });

                resolve([wrapper, toggle]);
            });
        });
    }

    function updateHorses(dom) {
        chrome.runtime.sendMessage({
            action: 'SAVE_HORSES',
            data: {
                horses: getStallions(dom.innerHTML),
            },
        });
    }

    const observer = new MutationObserver(mutations => {
        mutations.forEach(m => {
            if ([].find.call(m.addedNodes, n => n.id === 'saleTable_wrapper')) {
                bindSearch();
                updateHorses(m.target);
            }
        });
    });

    observer.observe(document, {
        childList: true,
        subtree: true
    });

    window.addEventListener(`installed.${chrome.runtime.id}`, () => {
        observer.disconnect();
    }, { once: true });

    window.addEventListener('DOMContentLoaded', () => {
        const toggle = document.createElement('script');
        toggle.setAttribute('type', 'module');
        toggle.setAttribute('src', chrome.runtime.getURL('/public/components/toggle.js'));
        document.body.append(toggle);

        const tooltip = document.createElement('script');
        toggle.setAttribute('type', 'module');
        tooltip.setAttribute('src', chrome.runtime.getURL('/public/components/tooltip.js'));
        document.body.append(tooltip);

        const style = document.createElement('style');
        style.textContent = `
            #hn-plus-bloodline-search {
                align-items: center;
                column-gap: 0.5em;
                display: flex;
            }
            
            #hn-plus-bloodline-search label {
                display: contents;
            }

            #hn-plus-bloodline-search .hn-plus-toggle {
                background-color: var(--theme-tertiary, #8ea8c3);
                display: inline-flex;
                opacity: 1;
                pointer-events: initial;
                position: relative;
                width: var(--toggle-width);
                vertical-align: middle;
            }

            #hn-plus-bloodline-search .hn-plus-toggle:checked {
                background-color: var(--theme-secondary, #406e8e);
            }

            #hn-plus-bloodline-search hn-plus-tooltip {
                font-size: 0.8em;
            }
        `.trim();
        document.body.append(style);

        const script = document.createElement('script');
        script.setAttribute('type', 'module');
        script.textContent = `
            function bloodlineSearch(e) {
                $('#saleTable').DataTable().search(e.detail.pattern, true, false).draw();
            }

            window.removeEventListener('search.${chrome.runtime.id}', bloodlineSearch);
            window.addEventListener('search.${chrome.runtime.id}', bloodlineSearch);
        `.trim();
        document.body.append(script);
    });

    if (document.querySelector('#saleTable_wrapper')) {
        bindSearch();
        updateHorses(document.querySelector('#saleTable_wrapper'));
    }
})();