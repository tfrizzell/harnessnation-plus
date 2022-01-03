function createSearchPattern(search) {
    return new Promise(resolve => {
        chrome.storage.sync.get('stallions', async ({ stallions: settings }) => {
            if (!settings.registry.bloodlineSearch) return resolve(null);

            function addGeneration(stallion, generation = 1) {
                stallion.generation = generation;
                return stallion;
            }

            const stallions = (await getStallions()).data;
            const pattern = new RegExp(search.replace(/\s+/g, '\\s*'), 'i')

            const matches = stallions.filter(s => pattern.test(s.name)).map(s => addGeneration(s));
            if (!matches.length) return resolve(null);

            for (const match of matches) {
                if (match.generation < settings.registry.maxGenerations)
                    matches.push(...stallions.filter(s => s.sireId == match.id && !matches.includes(s)).map(s => addGeneration(s, match.generation + 1)));
            }

            const names = matches.map(stud => stud.name);
            resolve(`(${names.map(Regex.escape).join('|')})`);
        });
    });
}

function getStallions() {
    return new Promise(resolve => {
        chrome.storage.local.get('stallions', async ({ stallions }) => {
            stallions?.data || (stallions = {
                data: await fetch(chrome.extension.getURL('/data/stallions.json')).then(res => res.json()),
                expiresAt: 0,
            });

            if (!stallions?.data || stallions?.expiresAt <= Date.now()) {
                stallions = {
                    data: Object.values({
                        ...stallions.data.reduce((map, stallion) => ({ ...map, [stallion.id]: stallion }), {}),
                        ...await loadStallionList(),
                    }),
                    expiresAt: Date.now() + 3600000
                };

                chrome.storage.local.set({ stallions });
            }

            resolve(stallions);
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

    return stallions;
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

(async () => await getStallions())();

async function handleSearch(e) {
    if (typeof e?.data !== 'object' || !('search' in e.data && 'id' in e.data) || 'pattern' in e.data) return;

    window.postMessage({
        ...e.data,
        pattern: await createSearchPattern(e.data.search),
    });
}

window.addEventListener('message', handleSearch);

window.addEventListener('plus:installed', function handleInstalled() {
    window.removeEventListener('plus:installed', handleInstalled);
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
        if (!e.target.value?.trim()) return;

        debounce = setTimeout(() => {
            const id = parseInt(performance.now()).toString();

            window.addEventListener('message', function _search(e) {
                if (typeof e?.data !== 'object' || !('pattern' in e.data && 'id' in e.data) || e.data.id !== id) return;

                window.removeEventListener('message', _search);
                e.data.pattern && dt.search(e.data.pattern, true, false).draw();
            });

            window.postMessage({ id, search: e.target.value });
        }, 200);
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