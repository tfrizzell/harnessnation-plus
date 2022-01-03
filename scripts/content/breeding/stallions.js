'use strict';

function createSearchRegex(search) {
    return new Promise(resolve => {
        chrome.storage.sync.get('stallions', ({ stallions: settings }) => {
            if (!settings.registry.bloodlineSearch) return resolve(null);

            chrome.storage.local.get(async ({ stallions }) => {
                const name = search.toLowerCase();
                const studs = stallions.data.filter(s => s.name.toLowerCase().includes(name));
                if (!studs.length) return;

                for (const stud of studs)
                    studs.push(...stallions.data.filter(s => s.sireId == stud.id && !studs.includes(s)));

                const names = studs.map(stud => stud.name);
                resolve(`(${names.map(Regex.escape).join('|')})`);
            });
        });
    });
}

function getStallionList(html) {
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
            sireId: null,
        });
    }

    return Object.values(stallions);
}

async function loadStallionList() {
    const csrf = document.querySelector('input[name="_token"]').value;

    const data = new FormData();
    data.append('_token', csrf);
    data.append('filterGait', 'all');
    data.append('filterTrackSize', 'all');
    data.append('filterGrade', 'all');
    data.append('filterConference', 'all');
    data.append('filterPrice', 'all');
    data.append('premiumOnly', 0);
    data.append('buySort', 'buyHorseName');
    data.append('inputPage', 1);
    data.append('inputPerPage', 'all');
    data.append('sponsoredOnly', 0);
    data.append('sortOrder', 0);

    const res = await fetch('/breeding/stallions/api', {
        method: 'POST',
        headers: {
            'X-CSRF-TOKEN': csrf
        },
        body: data,
    });

    return getStallionList(await res.text());
}

chrome.storage.local.get('stallions', async ({ stallions }) => {
    if (!stallions?.data || stallions?.expiresAt <= Date.now()) {
        stallions = {
            data: await loadStallionList(),
            expiresAt: Date.now() + 900000
        };

        chrome.storage.local.set({ stallions });
    }

    async function handleSearch(e) {
        if (typeof e?.data !== 'object' || !('search' in e.data && 'id' in e.data) || 'regex' in e.data) return;

        window.postMessage({
            ...e.data,
            regex: await createSearchRegex(e.data.search),
        });
    }

    window.addEventListener('message', handleSearch);

    window.addEventListener('plus:installed', function handleInstalled() {
        window.removeEventListener('plus:installed', handleInstalled);
        window.removeEventListener('message', handleSearch);
    });
});

const script = document.createElement('script');
script.type = 'text/javascript';
script.innerHTML = `(() => {
    const dt = $('#saleTable').DataTable();
    const search = document.querySelector('#saleTable_filter input[type="search"]');
    let debounce;

    search.addEventListener('keyup', e => {
        clearTimeout(debounce);
        if (!e.target.value?.trim()) return;

        debounce = setTimeout(() => {
            const id = parseInt(performance.now()).toString();

            window.addEventListener('message', function _search(e) {
                if (typeof e?.data !== 'object' || !('regex' in e.data && 'id' in e.data) || e.data.id !== id) return;

                window.removeEventListener('message', _search);
                e.data.regex && dt.search(e.data.regex, true, false).draw();
            });

            window.postMessage({ id, search: e.target.value });
        }, 150);
    });
})();`

const observer = new MutationObserver(mutations => {
    mutations.filter(m => m.target.classList.contains('table-responsive') && m.target.querySelector('#saleTable_filter input[type="search"]')).forEach(mutation => {
        script.remove();
        document.body.appendChild(script);
    });
});

observer.observe(document, {
    childList: true,
    subtree: true
});

window.addEventListener('plus:installed', function handleInstalled() {
    window.removeEventListener('plus:installed', handleInstalled);
    observer.disconnect();

    if (script.parentNode) {
        script.remove();
        document.body.appendChild(script);
    }
});