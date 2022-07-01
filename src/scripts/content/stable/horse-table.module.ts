import DataTables, { DataTablesOptions } from '../../../lib/data-tables.js';
import { onInstalled } from '../../../lib/events.js';

(async (): Promise<void> => {
    const page: string | undefined = window.location.pathname.split('/').pop();

    if (page == undefined)
        return;

    async function updateScript(script: Node | undefined, observer: boolean = false): Promise<void> {
        if (!script?.textContent?.match(/\bfunction loadHorses\b/))
            return;

        const settings: DataTablesOptions | undefined = await DataTables.getSettings(page!);

        script.textContent = await DataTables.extend(
            `'#${page === 'breeding' ? 'breedingHorse' : 'horse'}Table_' + i`,
            script.textContent,
            settings
        );
    }

    await updateScript(Array.from(document.querySelectorAll('script')).find((el: HTMLScriptElement) => !!el.textContent?.match(/\bfunction loadHorses\b/)));

    const observer: MutationObserver = new MutationObserver((mutations: MutationRecord[]): void => {
        mutations.filter((mutation: MutationRecord): boolean =>
            mutation.target.nodeType === Node.ELEMENT_NODE
            && (<HTMLElement>mutation.target).tagName === 'SCRIPT'
            && !!(<HTMLElement>mutation.target).textContent?.match(/\bfunction loadHorses\b/)
        ).forEach((mutation: MutationRecord): void => {
            mutation.addedNodes?.forEach((el: Node) => updateScript(el, true));
        });
    });

    observer.observe(window.document, { childList: true, subtree: true });
    onInstalled((): void => observer.disconnect());
})();