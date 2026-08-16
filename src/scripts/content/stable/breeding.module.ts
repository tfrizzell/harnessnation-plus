import { ActionType, sendAction } from '../../../lib/actions.js';
import { onInstalled, onLoad } from '../../../lib/events.js';
import { createStallionScoreBadge } from '../../../lib/stallion-scores.js';
import { removeAll } from '../../../lib/utils.js';
import '../common/tooltip.js';

async function addExportButtons(): Promise<void> {
    const exportRunning = (await chrome.storage.local.get({
        'running.exports.breeding': false,
    }))['running.exports.breeding'] as boolean;

    document.querySelectorAll('#breedingHorseTable_3_wrapper').forEach(el => {
        [el.parentNode, el.parentNode?.parentNode].forEach(node => {
            if (node == null)
                return;

            const wrapper = document.createElement('div');
            wrapper.classList.add('hn-plus-button-wrapper', 'hn-plus-export-button');

            if (node === el.parentNode)
                node.insertBefore(wrapper, el);
            else
                node.append(wrapper);

            const button = document.createElement('button');
            button.classList.add('hn-plus-button', 'hn-plus-breeding-report-button');
            button.disabled = exportRunning;
            button.textContent = 'Report (CSV)';
            button.type = 'button';

            button.addEventListener('click', e => {
                e.preventDefault();

                const message = setTimeout(() => {
                    alert('Your broodmare report is being generated in the background and will be downloaded automatically upon completion. You are free to continue browsing without impacting this process.');
                }, 50);

                void (async () => {
                    try {
                        await exportReport(el.innerHTML);
                    } catch (e: unknown) {
                        clearTimeout(message);
                        console.groupCollapsed(`%cbreeding.module.ts%c     Error while generating breeding report`, 'color:#406e8e;font-weight:bold;', '');

                        if (e instanceof Error) {
                            console.error('Message:', e.message);
                            console.error('Stack Trace:', e);
                        } else
                            console.error('Unknown Error:', e);

                        console.groupEnd();
                        alert('An unexpected error has occurred while generating your broodmare report. Please try again, and if the issue persists file a bug with the developer.');
                    }
                })();
            });

            const tooltip = document.createElement('hn-plus-tooltip');
            tooltip.textContent = 'Generate a CSV export of all broodmares listed in this table. This report includes data from their progeny report and may take several minutes to generate.';
            wrapper.append(tooltip, button);
        });
    });
}

async function addStallionScores(): Promise<void> {
    const cells = Array.from(document.querySelectorAll<HTMLTableCellElement>('#breedingHorseTable_4 > tbody > tr > td:nth-child(2)'));
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

async function exportReport(html: string): Promise<void> {
    const pattern = /<tr[^>]*>\s*<td[^>]*>.*?<\/td[^>]*>\s*<td[^>]*>\s*<a[^>]*horse\/(\d+)[^>]*>/gs;
    const ids: Array<number> = [];
    let id: string | undefined;

    while ((id = pattern.exec(html)?.[1]))
        ids.push(+id);

    await sendAction(ActionType.GenerateBroodmareReport, { ids });
}
function handleStateChange(
    changes: { [key: string]: chrome.storage.StorageChange },
    areaName: chrome.storage.AreaName
): void {
    if (areaName !== 'local' || !('running.exports.breeding' in changes))
        return;

    const isRunning = Boolean(changes['running.exports.breeding'].newValue);

    document.querySelectorAll<HTMLButtonElement>('.hn-plus-breeding-report-button')
        .forEach(el => { el.disabled = isRunning; });
}

function removeExportButtons(): void {
    removeAll('.horseContentContainer_3 .hn-plus-export-button');
}

function removeStallionScores(): void {
    removeAll('.horseContentContainer_4 .hn-plus-stallion-score');
}

const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
        [].forEach.call(mutation.addedNodes, (node: HTMLElement) => {
            if (node.id === 'breedingHorseTable_3_wrapper')
                void addExportButtons();

            if (node.id === 'breedingHorseTable_4_wrapper')
                void addStallionScores();
        });
    });
});

observer.observe(document, { childList: true, subtree: true });
chrome.storage.onChanged.addListener(handleStateChange);

onInstalled(() => {
    chrome.storage.onChanged.removeListener(handleStateChange);
    observer.disconnect();
});

onLoad(() => {
    removeStallionScores();
    removeExportButtons();

    if (document.querySelector('.horseContentContainer_3'))
        void addExportButtons();

    if (document.querySelector('.horseContentContainer_4'))
        void addStallionScores();
});
