import { ActionType, sendAction } from '../../../lib/actions.js';
import { EventType, onInstalled, onLoad } from '../../../lib/events.js';
import { createStallionScoreBadge, Horse } from '../../../lib/horses.js';
import { StallionRegistrySettings } from '../../../lib/settings.js';
import { sleep } from '../../../lib/utils.js';

((): void => {
    async function addExportButton(): Promise<void> {
        const exportRunning: boolean = (await chrome.storage.local.get('breeding.export'))?.['breeding.export'] ?? false;

        document.querySelectorAll('.buyHorsePagination .pagination').forEach((el: Element): void => {
            const wrapper: HTMLDivElement = document.createElement('div');
            wrapper.classList.add('hn-plus-button-wrapper');
            el.parentNode?.insertBefore(wrapper, el);

            const button: HTMLButtonElement = document.createElement('button');
            button.classList.add('hn-plus-button');
            button.disabled = exportRunning;
            button.textContent = 'Report (CSV)';
            button.type = 'button';

            button.addEventListener('click', async (e: Event): Promise<void> => {
                e.preventDefault();
                const message: NodeJS.Timeout = setTimeout(() => alert('Your stallion report is being generated in the background and will be downloaded automatically upon completion. You are free to continue browsing without impacting this process.'), 50);

                try {
                    await exportReport(document.querySelector('#saleTable_wrapper')?.innerHTML ?? '');
                } catch (e: any) {
                    clearTimeout(message);
                    console.error(`%cstallions.module.ts%c     Error while generating breeding report: ${e.message}`, 'color:#406e8e;font-weight:bold;', '');
                    console.error(e);
                    alert('An unexpected error has occurred while generating your stallion report. Please try again, and if the issue persists file a bug with the developer.');
                }
            });

            const tooltip: HNPlusTooltipElement = document.createElement('hn-plus-tooltip') as HNPlusTooltipElement;
            tooltip.textContent = 'Generate a CSV export of all stallions listed in this table. This report includes data from their progeny report and may take several minutes to generate.';
            wrapper.append(button, tooltip);
        });

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
            document.querySelectorAll('.hn-plus-button-wrapper').forEach((el: Element): void => { el.remove(); });
        });
    }

    async function addStallionScores(): Promise<void> {
        const cells: HTMLAnchorElement[] = Array.from(document.querySelectorAll('#saleTable > tbody > tr > td:nth-child(1)'));
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

    async function bindBloodlineSearch(): Promise<void> {
        const script: HTMLScriptElement = document.createElement('script');
        script.setAttribute('type', 'module');
        script.setAttribute('src', `${chrome.runtime.getURL('/scripts/content/breeding/stallions.search.js')}?t=${Date.now()}`);
        document.body.append(script);

        const filter: HTMLElement = document.querySelector('#saleTable_filter')!;
        const search: HTMLInputElement = filter.querySelector('input[type="search"]')!;
        let controller: AbortController;

        async function handleSearch(): Promise<void> {
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

        search.addEventListener('input', handleSearch);

        onInstalled(() => {
            search.removeEventListener('input', handleSearch);
            script.remove();
        });
    }

    async function exportReport(html: string): Promise<void> {
        const pattern: RegExp = />\s*<a[^>]*horse\/(\d+)[^>]*>/gs;
        const ids: number[] = [];
        let id: string | undefined;

        while (id = pattern.exec(html)?.[1])
            ids.push(+id);

        await sendAction(ActionType.ExportStallionReport, { ids, headers: { 1: 'Stallion' } });
    }

    async function updateHorses(html: string): Promise<void> {
        const pattern: RegExp = /<a[^>]*horse\/(\d+)[^>]*>(.*?)<\/a[^>]*>.*?(?:Unknown\s*x\s*Unknown|<a[^>]*horse\/(\d+)[^>]*>(.*?)<\/a[^>]*>\s*x\s*<a[^>]*horse\/(\d+)[^>]*>(.*?)<\/a[^>]*>)/gs;
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

    const observer: MutationObserver = new MutationObserver((mutations: MutationRecord[]): void => {
        mutations.forEach((mutation: MutationRecord): void => {
            if ([].find.call(mutation.addedNodes, (node: HTMLElement): boolean => node.id === 'saleTable_wrapper')) {
                addExportButton();
                addStallionScores();
                bindBloodlineSearch();
                updateHorses((mutation.target as HTMLElement).innerHTML);
            }
        });
    });

    observer.observe(window.document, { childList: true, subtree: true });

    onInstalled((): void => {
        observer.disconnect();
        document.querySelectorAll('.hn-plus-button-wrapper, .hn-plus-stallion-score').forEach(el => el.remove());
    });

    onLoad((): void => {
        const tooltip: HTMLScriptElement = document.createElement('script');
        tooltip.setAttribute('type', 'module');
        tooltip.setAttribute('src', `${chrome.runtime.getURL('/public/components/tooltip.js')}?t=${Date.now()}`);
        document.body.append(tooltip);
    });

    if (document.querySelector('#saleTable_wrapper')) {
        addExportButton();
        addStallionScores();
        bindBloodlineSearch();
        updateHorses(document.querySelector('#saleTable_wrapper')!.innerHTML);
    }
})();