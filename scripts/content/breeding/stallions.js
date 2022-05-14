(() => {
    function addExportButton() {
        chrome.storage.local.get('breeding.export', ({ 'breeding.export': exportRunning }) => {
            document.querySelectorAll('.buyHorsePagination .pagination').forEach(p => {
                const wrapper = document.createElement('div');
                wrapper.classList.add('hn-plus-button-wrapper');
                p.parentNode.insertBefore(wrapper, p);

                const button = document.createElement('button');
                button.classList.add('hn-plus-button');
                button.disabled = exportRunning;
                button.textContent = 'Report (CSV)';
                button.type = 'button';

                button.addEventListener('click', async e => {
                    e.preventDefault();
                    const message = setTimeout(() => alert('Your stallion report is being generated in the background and will be downloaded automatically upon completion. You are free to continue browsing without impacting this process.'), 50);

                    try {
                        await exportReport(document.querySelector('#saleTable_wrapper').innerHTML);
                    } catch (error) {
                        clearTimeout(message);
                        alert(error);
                    }
                });

                const tooltip = document.createElement('hn-plus-tooltip');
                tooltip.textContent = 'Generate a CSV export of all stallions listed on this page. This report includes data from their progeny report and may take several minutes to generate.';
                wrapper.append(button, tooltip);

                function handleStateChange(changes, areaName) {
                    if (areaName !== 'local' || !('breeding.export' in changes)) return;

                    if (changes['breeding.export']?.newValue)
                        document.querySelectorAll('.hn-plus-button').forEach(el => el.disabled = true);
                    else
                        document.querySelectorAll('.hn-plus-button').forEach(el => el.disabled = false);
                }

                chrome.storage.onChanged.addListener(handleStateChange);

                window.addEventListener('installed.harnessnation-plus', () => {
                    chrome.storage.onChanged.removeListener(handleStateChange);
                }, { once: true });
            });
        });
    }

    function bindBloodlineSearch() {
        const unbind = document.createElement('script');
        unbind.setAttribute('type', 'module');
        unbind.textContent = `$('#saleTable_filter input[type="search"]').unbind()`
        document.body.append(unbind);

        const filter = document.querySelector('#saleTable_filter');
        const search = filter.querySelector('input[type="search"]');
        let debounce;

        function handleSearch() {
            clearTimeout(debounce);
            debounce = setTimeout(doSearch, 200, search.value);
        }

        search.addEventListener('input', handleSearch);

        window.addEventListener('installed.harnessnation-plus', () => {
            search.removeEventListener('input', handleSearch);
        }, { once: true });
    }

    function doSearch(term) {
        chrome.storage.sync.get('stallions', async ({ stallions: settings }) => {
            window.dispatchEvent(new CustomEvent('search.harnessnation-plus', {
                detail: {
                    pattern: await new Promise(resolve => {
                        settings.registry.bloodlineSearch
                            ? chrome.runtime.sendMessage({ action: 'SEARCH_STALLIONS', data: { term, maxGenerations: settings.registry.maxGenerations } }, resolve)
                            : resolve(term);
                    }),
                },
            }));
        });
    }

    function exportReport(html) {
        return new Promise((resolve, reject) => {
            const pattern = />\s*<a[^>]*horse\/(\d+)[^>]*>/gs;
            const ids = [];
            let id;

            while (id = pattern.exec(html)?.[1])
                ids.push(+id);

            chrome.runtime.sendMessage({
                action: 'BREEDING_REPORT', data: {
                    ids,
                    headers: { 1: 'Stallion' },
                    filename: 'hn-plus-stallion-report-${timestamp}',
                }
            }, response => {
                if (response['@type'] === '\u2063error')
                    reject(response.message);
                else
                    resolve(response);
            });
        });
    }

    function getHorses(html) {
        const pattern = /<a[^>]*horse\/(\d+)[^>]*>(.*?)<\/a[^>]*>.*?(?:Unknown\s*x\s*Unknown|<a[^>]*horse\/(\d+)[^>]*>(.*?)<\/a[^>]*>\s*x\s*<a[^>]*horse\/(\d+)[^>]*>(.*?)<\/a[^>]*>)/gs;
        const horses = {};
        let data;

        while (data = pattern.exec(html)) {
            const [id, name, sireId, sireName] = data.slice(1);

            horses[id] = {
                id: +id,
                name,
                sireId: +sireId || null,
                retired: false,
            };

            sireId && (horses[sireId] ??= {
                id: +sireId,
                name: sireName,
            });
        }

        return Object.values(horses);
    }

    function updateHorses(dom) {
        chrome.runtime.sendMessage({
            action: 'SAVE_HORSES',
            data: {
                horses: getHorses(dom.innerHTML),
            },
        });
    }

    const observer = new MutationObserver(mutations => {
        mutations.forEach(m => {
            if ([].find.call(m.addedNodes, n => n.id === 'saleTable_wrapper')) {
                addExportButton();
                bindBloodlineSearch();
                updateHorses(m.target);
            }
        });
    });

    observer.observe(document, {
        childList: true,
        subtree: true
    });

    window.addEventListener('installed.harnessnation-plus', () => {
        observer.disconnect();
        document.querySelectorAll('.hn-plus-button-wrapper').forEach(el => el.remove());
    }, { once: true });

    window.addEventListener('DOMContentLoaded', () => {
        const tooltip = document.createElement('script');
        tooltip.setAttribute('type', 'module');
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
            function bloodlineSearch(e, retries = 10) {
                try {
                    console.debug('Executing bloodline search...');
                    $('#saleTable').DataTable().search(e.detail.pattern, true, false).draw();
                } catch (e) {
                    console.error('Error while executing bloodline search:', e.message);
                    console.error(e);

                    if (retries > 1) {
                        setTimeout(() => bloodlineSearch.call(this, e, retries - 1), 100);
                        console.debug('Retrying in 100ms...');
                    }
                }
            }

            window.removeEventListener('search.harnessnation-plus', bloodlineSearch);
            window.addEventListener('search.harnessnation-plus', bloodlineSearch);
        `.trim();
        document.body.append(script);
    });

    if (document.querySelector('#saleTable_wrapper')) {
        addExportButton();
        bindBloodlineSearch();
        updateHorses(document.querySelector('#saleTable_wrapper'));
    }
})();