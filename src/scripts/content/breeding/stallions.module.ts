import { ActionType, sendAction } from '../../../lib/actions.js';
import { EventType, onInstalled, onLoad } from '../../../lib/events.js';
import { Horse } from '../../../lib/horses.js';
import { Settings } from '../../../lib/settings.js';
import { createStallionScoreBadge } from '../../../lib/stallion-scores.js';
import { removeAll, sleep } from '../../../lib/utils.js';
import '../common/tooltip.js';

const searchScriptUrl = chrome.runtime.getURL('/scripts/content/breeding/stallions.search.js');
let controller: AbortController | undefined;

async function addExportButtons(): Promise<void> {
    const exportRunning = (await chrome.storage.local.get({
        'running.exports.breeding': false,
    }))['running.exports.breeding'] as boolean;

    document.querySelectorAll('.buyHorsePagination .pagination').forEach(el => {
        const wrapper = document.createElement('div');
        wrapper.classList.add('hn-plus-button-wrapper', 'hn-plus-breeding-report-button-wrapper');
        el.parentNode?.insertBefore(wrapper, el);

        const button = document.createElement('button');
        button.classList.add('hn-plus-button', 'hn-plus-breeding-report-button');
        button.disabled = exportRunning;
        button.textContent = 'Report (CSV)';
        button.type = 'button';

        button.addEventListener('click', e => {
            e.preventDefault();

            const message = setTimeout(() => {
                alert('Your stallion report is being generated in the background and will be downloaded automatically upon completion. You are free to continue browsing without impacting this process.');
            }, 50);

            void (async () => {
                try {
                    await exportReport(document.querySelector('#saleTable_wrapper')?.innerHTML ?? '');
                } catch (e: unknown) {
                    clearTimeout(message);
                    console.groupCollapsed(`%cbreeding.module.ts%c     Error while generating breeding report`, 'color:#406e8e;font-weight:bold;', '');

                    if (e instanceof Error) {
                        console.error('Message:', e.message);
                        console.error('Stack Trace:', e);
                    } else
                        console.error('Unknown Error:', e);

                    console.groupEnd();
                    alert('An unexpected error has occurred while generating your stallion report. Please try again, and if the issue persists file a bug with the developer.');
                }
            })();
        });

        const tooltip = document.createElement('hn-plus-tooltip');
        tooltip.textContent = 'Generate a CSV export of all stallions listed in this table. This report includes data from their progeny report and may take several minutes to generate.';
        wrapper.append(button, tooltip);
    });
}

function addScripts(): void {
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

    if (horses.length === 0)
        return;

    for (const cell of cells) {
        const id = cell.innerHTML.match(/\/horse\/(\d+)/)?.slice(1).map(parseInt)[0];
        const horse = horses.find(horse => horse.id === id);

        if (horse?.stallionScore?.value == null)
            continue;

        const badge = createStallionScoreBadge(horse.stallionScore);
        cell.insertBefore(badge, cell.firstElementChild);
    }
}

function bindBloodlineSearch(): void {
    document.querySelector('#saleTable_filter input[type="search"]')?.addEventListener('input', handleSearch);
}

async function exportReport(html: string): Promise<void> {
    const pattern = />\s*<a[^>]*horse\/(\d+)[^>]*>/gs;
    const ids: Array<number> = [];
    let id: string | undefined;

    while ((id = pattern.exec(html)?.[1]))
        ids.push(+id);

    await sendAction(ActionType.GenerateStallionReport, { ids, headers: { 1: 'Stallion' } });
}

function handleSearch(e: Event): void {
    const search = e.target as HTMLInputElement;

    void (async () => {
        try {
            controller?.abort();
            controller = new AbortController();

            await sleep(200, controller.signal);
            const settings = (await chrome.storage.sync.get<Partial<Settings>>('stallions')).stallions?.registry;

            window.dispatchEvent(new CustomEvent(EventType.BloodlineSearch, {
                detail: settings?.bloodlineSearch
                    ? (await sendAction(ActionType.SearchHorses, {
                        term: search.value,
                        maxGenerations: settings.maxGenerations,
                    })).data
                    : search.value,
            }));
        } catch (e: unknown) {
            if (!(e instanceof Error) || e.message !== 'Aborted by the user')
                throw e;
        }
    })();
}

    function handleStateChange(
        changes: { [key: string]: chrome.storage.StorageChange },
        areaName: chrome.storage.AreaName
    ): void {
        if (areaName !== 'local' || !('running.exports.breeding' in changes))
            return;

        const isRunning = Boolean(changes['running.exports.breeding'].newValue)
        document.querySelectorAll<HTMLButtonElement>('.hn-plus-breeding-report-button').forEach(el => { el.disabled = isRunning; });
    }


function removeExportButtons(): void {
    removeAll('.hn-plus-breeding-report-button-wrapper');
}

function removeScripts(): void {
    removeAll(`script[src*="${searchScriptUrl}"]`)
}

function removeStallionScores(): void {
    removeAll('.hn-plus-stallion-score');
}

function unbindBloodlineSearch(): void {
    document.querySelector('#saleTable_filter input[type="search"]')
        ?.removeEventListener('input', handleSearch);
}

async function updateHorses(html: string): Promise<void> {
    // eslint-disable-next-line @stylistic/max-len
    const pattern = /<a[^>]*horse\/(\d+)[^>]*>(.*?)<\/a[^>]*>.*?(?:Unknown\s*x\s*Unknown|<a[^>]*horse\/(\d+)[^>]*>(.*?)<\/a[^>]*>\s*x\s*<a[^>]*horse\/(\d+)[^>]*>(.*?)<\/a[^>]*>)/gs;
    const horses: { [key: string]: Horse } = {};
    let data;

    while ((data = pattern.exec(html))) {
        const [id, name, sireId, sireName, damId] = data.slice(1);

        horses[id] = {
            id: +id,
            name,
            sireId: +sireId || null,
            damId: +damId || null,
            retired: false,
        };

        if (sireId) {
            horses[sireId] ??= {
                id: +sireId,
                name: sireName,
            };
        }
    }

    await sendAction(ActionType.SaveHorses, Object.values(horses));
}

const observer: MutationObserver = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
        [].forEach.call(mutation.addedNodes, (node: Element) => {
            if (node.id === 'saleTable_wrapper') {
                void addExportButtons();
                void addStallionScores();
                bindBloodlineSearch();
                void updateHorses((mutation.target as HTMLElement).innerHTML);
            }
        });
    });
});

observer.observe(document, { childList: true, subtree: true });
chrome.storage.onChanged.addListener(handleStateChange);

onInstalled(() => {
    chrome.storage.onChanged.removeListener(handleStateChange);
    observer.disconnect();
    unbindBloodlineSearch();
});

onLoad(() => {
    const wrapper = document.querySelector('#saleTable_wrapper');
    unbindBloodlineSearch();
    removeStallionScores();
    removeExportButtons();
    removeScripts();
    addScripts();

    if (wrapper) {
        void addExportButtons();
        void addStallionScores();
        bindBloodlineSearch();
        void updateHorses(wrapper.innerHTML);
    }
});