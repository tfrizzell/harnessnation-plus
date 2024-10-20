import { ActionType, sendAction } from '../../../lib/actions.js';
import { onInstalled, onLoad } from '../../../lib/events.js';
import { createStallionScoreBadge, Horse } from '../../../lib/horses.js';

async function addExportButton(): Promise<void> {
    const exportRunning: boolean = (await chrome.storage.local.get('breeding.export'))?.['breeding.export'] ?? false;

    document.querySelectorAll('#breedingHorseTable_3_wrapper').forEach((el: Element): void => {
        [el.parentNode, el.parentNode?.parentNode].forEach((node: ParentNode | null | undefined): void => {
            if (node == null)
                return;

            const wrapper: HTMLDivElement = document.createElement('div');
            wrapper.classList.add('hn-plus-button-wrapper');

            if (node === el.parentNode)
                node.insertBefore(wrapper, el);
            else
                node.append(wrapper);

            const button: HTMLButtonElement = document.createElement('button');
            button.classList.add('hn-plus-button');
            button.disabled = exportRunning;
            button.textContent = 'Report (CSV)';
            button.type = 'button';

            button.addEventListener('click', async (e: Event): Promise<void> => {
                e.preventDefault();
                const message: NodeJS.Timeout = setTimeout(() => alert('Your broodmare report is being generated in the background and will be downloaded automatically upon completion. You are free to continue browsing without impacting this process.'), 50);

                try {
                    await exportReport(el.innerHTML);
                } catch (e: any) {
                    clearTimeout(message);
                    console.error(`%cbreeding.module.ts%c     Error while generating breeding report: ${e.message}`, 'color:#406e8e;font-weight:bold;', '');
                    console.error(e);
                    alert('An unexpected error has occurred while generating your broodmare report. Please try again, and if the issue persists file a bug with the developer.');
                }
            });

            const tooltip: HNPlusTooltipElement = document.createElement('hn-plus-tooltip') as HNPlusTooltipElement;
            tooltip.textContent = 'Generate a CSV export of all broodmares listed in this table. This report includes data from their progeny report and may take several minutes to generate.';
            wrapper.append(tooltip, button);

            function handleStateChange(changes: { [key: string]: chrome.storage.StorageChange }, areaName: chrome.storage.AreaName): void {
                if (areaName !== 'local' || !changes['breeding.export'])
                    return;

                if (changes['breeding.export']?.newValue)
                    document.querySelectorAll('.hn-plus-button').forEach((el: Element): void => { (<HTMLButtonElement>el).disabled = true; });
                else
                    document.querySelectorAll('.hn-plus-button').forEach((el: Element): void => { (<HTMLButtonElement>el).disabled = false; });
            }

            chrome.storage.onChanged.addListener(handleStateChange);

            onInstalled((): void => {
                chrome.storage.onChanged.removeListener(handleStateChange);
            });
        });
    });
}

async function addStallionScores(): Promise<void> {
    const cells: HTMLAnchorElement[] = Array.from(document.querySelectorAll('#breedingHorseTable_4 > tbody > tr > td:nth-child(2)'));
    const horses: Horse[] | undefined = (await sendAction(ActionType.GetHorses)).data;

    if (horses == null)
        return;

    for (const cell of cells) {
        const id: number | undefined = cell.innerHTML.match(/\/horse\/(\d+)/)?.slice(1)?.map(parseInt)?.[0];
        const horse: Horse | undefined = horses.find(horse => horse.id === id);

        if (horse?.stallionScore?.value == null)
            continue;

        const badge = createStallionScoreBadge(horse.stallionScore);
        cell.insertBefore(badge, cell.firstElementChild);
    }
}

async function exportReport(html: string): Promise<void> {
    const pattern: RegExp = /<tr[^>]*>\s*<td[^>]*>.*?<\/td[^>]*>\s*<td[^>]*>\s*<a[^>]*horse\/(\d+)[^>]*>/gs;
    const ids: number[] = [];
    let id: string | undefined;

    while (id = pattern.exec(html)?.[1])
        ids.push(+id);

    await sendAction(ActionType.ExportBroodmareReport, { ids });
}

const observer: MutationObserver = new MutationObserver((mutations: MutationRecord[]): void => {
    mutations.forEach((mutation: MutationRecord): void => {
        [].forEach.call(mutation.addedNodes, (node: HTMLElement) => {
            if (node.id === 'breedingHorseTable_3_wrapper')
                addExportButton();

            if (node.id === 'breedingHorseTable_4_wrapper')
                addStallionScores();
        });
    });
});

observer.observe(window.document, { childList: true, subtree: true });

const tooltip: HTMLScriptElement = document.createElement('script');
tooltip.setAttribute('type', 'module');
tooltip.setAttribute('src', `${chrome.runtime.getURL('/public/components/tooltip.js')}?t=${Date.now()}`);

onInstalled((): void => {
    observer.disconnect();
    tooltip.remove();
    document.querySelectorAll('.hn-plus-button-wrapper, .hn-plus-stallion-score').forEach(el => el.remove());
});

onLoad((): void => {
    document.body.append(tooltip);

    if (document.querySelector('.horseContentContainer_3'))
        addExportButton();

    if (document.querySelector('.horseContentContainer_4'))
        addStallionScores();
});
