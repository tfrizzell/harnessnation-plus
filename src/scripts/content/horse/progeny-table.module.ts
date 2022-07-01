import * as DataTables from '../../../lib/data-tables.js';
import { onInstalled } from '../../../lib/events.js';

(async (): Promise<void> => {
    async function updateScript(script: Node | undefined): Promise<void> {
        if (!script?.textContent?.match(/\bfunction updateProgenyTableData\b/))
            return;

        const settings: DataTables.DataTablesOptions | undefined = await DataTables.getSettings('progeny');

        script.textContent = await DataTables.extend(
            '#progenyListTable',
            script.textContent.replace(/\bsaleTable\b/g, 'progenyListTable'),
            { ...settings, saveSearch: false }
        );
    }

    await updateScript(Array.from(document.querySelectorAll('script')).find((el: HTMLScriptElement) => !!el.textContent?.match(/\bfunction updateProgenyTableData\b/)));

    const observer: MutationObserver = new MutationObserver((mutations: MutationRecord[]): void => {
        mutations.filter((mutation: MutationRecord): boolean =>
            mutation.target.nodeType === Node.ELEMENT_NODE
            && (<HTMLElement>mutation.target).tagName === 'SCRIPT'
            && !!(<HTMLElement>mutation.target).textContent?.match(/\bfunction updateProgenyTableData\b/)
        ).forEach((mutation: MutationRecord): void => {
            mutation.addedNodes?.forEach(updateScript);
        });
    });

    observer.observe(window.document, { childList: true, subtree: true });
    onInstalled((): void => observer.disconnect());
})();