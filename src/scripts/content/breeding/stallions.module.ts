import { ActionType, sendAction } from '../../../lib/actions.js';
import { EventType, onInstalled, onLoad } from '../../../lib/events.js';
import { createStallionScoreBadge, Horse } from '../../../lib/horses.js';
import { StallionRegistrySettings } from '../../../lib/settings.js';
import { removeAll, sleep } from '../../../lib/utils.js';
import '../common/tooltip.js';

const searchScriptUrl = chrome.runtime.getURL('/scripts/content/breeding/stallions.search.js');
let controller: AbortController;

async function addExportButtons(): Promise<void> {
    const exportRunning = (await chrome.storage.local.get('running.exports.breeding'))?.['running.exports.breeding'] ?? false;

    document.querySelectorAll('.buyHorsePagination .pagination').forEach(el => {
        const wrapper = document.createElement('div');
        wrapper.classList.add('hn-plus-button-wrapper');
        el.parentNode?.insertBefore(wrapper, el);

        const button = document.createElement('button');
        button.classList.add('hn-plus-button');
        button.disabled = exportRunning;
        button.textContent = 'Report (CSV)';
        button.type = 'button';

        button.addEventListener('click', async e => {
            e.preventDefault();
            const message = setTimeout(() => alert('Your stallion report is being generated in the background and will be downloaded automatically upon completion. You are free to continue browsing without impacting this process.'), 50);

            try {
                await exportReport(document.querySelector('#saleTable_wrapper')?.innerHTML ?? '');
            } catch (e: any) {
                clearTimeout(message);
                console.error(`%cstallions.module.ts%c     Error while generating breeding report: ${e.message}`, 'color:#406e8e;font-weight:bold;', '');
                console.error(e);
                alert('An unexpected error has occurred while generating your stallion report. Please try again, and if the issue persists file a bug with the developer.');
            }
        });

        const tooltip = document.createElement('hn-plus-tooltip');
        tooltip.textContent = 'Generate a CSV export of all stallions listed in this table. This report includes data from their progeny report and may take several minutes to generate.';
        wrapper.append(button, tooltip);
    });

    function handleStateChange(changes: { [key: string]: chrome.storage.StorageChange }, areaName: chrome.storage.AreaName): void {
        if (areaName !== 'local' || !changes['running.exports.breeding'])
            return;

        if (changes['running.exports.breeding']?.newValue)
            document.querySelectorAll<HTMLButtonElement>('.hn-plus-button').forEach(el => { el.disabled = true; });
        else
            document.querySelectorAll<HTMLButtonElement>('.hn-plus-button').forEach(el => { el.disabled = true; });
    }

    chrome.storage.onChanged.addListener(handleStateChange);
    onInstalled(() => chrome.storage.onChanged.removeListener(handleStateChange));
}

async function addScripts(): Promise<void> {
    if (document.querySelector(`script[src*="${searchScriptUrl}"]`))
        return;

    const script = document.createElement('script');
    script.setAttribute('type', 'module');
    script.setAttribute('src', `${searchScriptUrl}?t=${Date.now()}`);
    document.body.append(script);
}

async function addStallionScores(): Promise<void> {
    const cells = Array.from(document.querySelectorAll<HTMLTableCellElement>('#saleTable > tbody > tr > td:nth-child(1)'));
    const horses = (await sendAction(ActionType.GetHorses)).data;

    if (horses == null)
        return;

    for (const cell of cells) {
        const id = cell.innerHTML.match(/\/horse\/(\d+)/)?.slice(1)?.map(parseInt)?.[0];
        const horse = horses.find(horse => horse.id === id);

        if (horse?.stallionScore?.value == null)
            continue;

        const badge = createStallionScoreBadge(horse.stallionScore);
        cell.insertBefore(badge, cell.firstElementChild);
    }
}

async function bindBloodlineSearch(): Promise<void> {
    document.querySelector('#saleTable_filter input[type="search"]')?.addEventListener('input', handleSearch);
}

async function exportReport(html: string): Promise<void> {
    const pattern = />\s*<a[^>]*horse\/(\d+)[^>]*>/gs;
    const ids: number[] = [];
    let id: string | undefined;

    while (id = pattern.exec(html)?.[1])
        ids.push(+id);

    await sendAction(ActionType.GenerateStallionReport, { ids, headers: { 1: 'Stallion' } });
}

async function handleSearch(e: Event): Promise<void> {
    const search = <HTMLInputElement>e.target;

    try {
        controller?.abort();
        controller = new AbortController();

        await sleep(200, controller.signal);
        const settings: StallionRegistrySettings = (await chrome.storage.sync.get('stallions'))?.stallions?.registry ?? {};

        window.dispatchEvent(new CustomEvent(EventType.BloodlineSearch, {
            detail: settings.bloodlineSearch
                ? (await sendAction(ActionType.SearchHorses, { term: search.value, maxGenerations: settings.maxGenerations })).data
                : search.value,
        }));
    } catch (e: any) {
        if (e !== 'Aborted by the user')
            throw e;
    }
}

async function removeExportButtons(): Promise<void> {
    removeAll('.hn-plus-button-wrapper');
}

async function removeScripts(): Promise<void> {
    removeAll(`script[src*="${searchScriptUrl}"]`)
}

async function removeStallionScores(): Promise<void> {
    removeAll('.hn-plus-stallion-score');
}

async function unbindBloodlineSearch(): Promise<void> {
    document.querySelector('#saleTable_filter input[type="search"]')?.removeEventListener('input', handleSearch);
}

async function updateHorses(html: string): Promise<void> {
    const pattern = /<a[^>]*horse\/(\d+)[^>]*>(.*?)<\/a[^>]*>.*?(?:Unknown\s*x\s*Unknown|<a[^>]*horse\/(\d+)[^>]*>(.*?)<\/a[^>]*>\s*x\s*<a[^>]*horse\/(\d+)[^>]*>(.*?)<\/a[^>]*>)/gs;
    const horses: { [key: string]: Horse } = {};
    let data;

    while (data = pattern.exec(html)) {
        const [id, name, sireId, sireName, damId] = data.slice(1);

        horses[id] = {
            id: +id,
            name,
            sireId: +sireId || null,
            damId: +damId || null,
            retired: false,
        };

        sireId && (horses[sireId] ??= {
            id: +sireId,
            name: sireName,
        });
    }

    await sendAction(ActionType.SaveHorses, Object.values(horses));
}

const observer: MutationObserver = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
        [].forEach.call(mutation.addedNodes, (node: Element) => {
            if (node.id === 'saleTable_wrapper') {
                addExportButtons();
                addStallionScores();
                bindBloodlineSearch();
                updateHorses((<HTMLElement>mutation.target).innerHTML);
            }
        });
    });
});

observer.observe(document, { childList: true, subtree: true });

onInstalled(() => {
    observer.disconnect();
    unbindBloodlineSearch();
});

onLoad(() => {
    unbindBloodlineSearch();
    removeStallionScores();
    removeExportButtons();
    removeScripts();
    addScripts();

    if (document.querySelector('#saleTable_wrapper')) {
        addExportButtons();
        addStallionScores();
        bindBloodlineSearch();
        updateHorses(document.querySelector('#saleTable_wrapper')!.innerHTML);
    }
});