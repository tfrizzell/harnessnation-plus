function handleSearch(e) {
    if (typeof e?.data !== 'object' || !('term' in e.data && 'id' in e.data) || 'pattern' in e.data)
        return;

    chrome.runtime.sendMessage({ action: 'SEARCH_STALLIONS', data: { term: e.data.term } }, pattern => {
        window.postMessage({ ...e.data, pattern, });
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
        };

        sireId && (stallions[sireId] ??= {
            id: +sireId,
            name: sireName,
        });
    }

    return Object.values(stallions);
}

window.addEventListener('message', handleSearch);

window.addEventListener(`${chrome.runtime.id}.installed`, function handleInstalled() {
    window.removeEventListener(`${chrome.runtime.id}.installed`, handleInstalled);
    window.removeEventListener('message', handleSearch);
});

const script = document.createElement('script');
script.type = 'text/javascript';
script.innerHTML = `(() => {
    const dt = $('#saleTable').DataTable();
    const search = document.querySelector('#saleTable_filter input[type="search"]');
    let debounce;

    search.addEventListener('keyup', e => {
        clearTimeout(debounce);

        if (!e.target.value?.trim())
            return;

        debounce = setTimeout(() => {
            const id = parseInt(performance.now()).toString();

            window.addEventListener('message', function _search(e) {
                if (typeof e?.data !== 'object' || !('pattern' in e.data && 'id' in e.data) || e.data.id !== id)
                    return;

                window.removeEventListener('message', _search);
                e.data.pattern && dt.search(e.data.pattern, true, false).draw();
            });

            window.postMessage({ id, term: e.target.value });
        }, 200);
    });
})();`

const observer = new MutationObserver(mutations => {
    mutations.forEach(m => {
        if ([].find.call(m.addedNodes, n => n.id === 'saleTable_wrapper')) {
            script.remove();
            document.body.appendChild(script);

            chrome.runtime.sendMessage({
                action: 'SAVE_HORSES',
                data: {
                    horses: getStallions(m.target.innerHTML),
                },
            });
        }
    });
});

observer.observe(document, {
    childList: true,
    subtree: true
});

window.addEventListener(`${chrome.runtime.id}.installed`, function handleInstalled() {
    window.removeEventListener(`${chrome.runtime.id}.installed`, handleInstalled);
    observer.disconnect();

    if (script.parentNode) {
        script.remove();
        document.body.appendChild(script);
    }
});
