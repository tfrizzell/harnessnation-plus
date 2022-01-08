(() => {
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

    const handleSearch = (() => {
        async function doSearch(e) {
            window.dispatchEvent(new CustomEvent(`search.${chrome.runtime.id}`, {
                detail: {
                    pattern: await new Promise(resolve => {
                        chrome.runtime.sendMessage({ action: 'SEARCH_STALLIONS', data: { term: e.target.value } }, resolve);
                    }),
                },
            }));
        }

        let debounce;

        return (...args) => {
            clearTimeout(debounce);
            debounce = setTimeout(doSearch, 200, ...args);
        }
    })();

    function bindSearch() {
        const unbind = document.createElement('script');
        unbind.setAttribute('type', 'text/javascript');
        unbind.textContent = `(() => { $('#saleTable_filter input[type="search"]').unbind(); })();`
        document.body.appendChild(unbind);

        const search = document.querySelector('#saleTable_filter input[type="search"]');
        search.addEventListener('input', handleSearch);

        window.addEventListener(`installed.${chrome.runtime.id}`, () => {
            search.removeEventListener('input', handleSearch);
        }, { once: true });
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
        const script = document.createElement('script');
        script.setAttribute('type', 'text/javascript');
        script.textContent = `(() => {
            function bloodlineSearch(e) {
                $('#saleTable').DataTable().search(e.detail.pattern, true, false).draw();
            }

            window.removeEventListener('search.${chrome.runtime.id}', bloodlineSearch);
            window.addEventListener('search.${chrome.runtime.id}', bloodlineSearch);
        })();`
        document.body.appendChild(script);
    });

    if (document.querySelector('#saleTable_wrapper')) {
        bindSearch();
        updateHorses(document.querySelector('#saleTable_wrapper'));
    }
})();