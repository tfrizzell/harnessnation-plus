import DataTables, { DataTablesOptions } from '../../../lib/data-tables.js';
import { onInstalled } from '../../../lib/events.js';

(async (): Promise<void> => {
    const settings: DataTablesOptions | undefined = await DataTables.getSettings('progeny');

    const observer: MutationObserver = new MutationObserver((mutations: MutationRecord[]): void => {
        mutations.forEach((mutation: MutationRecord): void => {
            if (
                mutation.target.nodeType !== Node.ELEMENT_NODE
                || (<HTMLElement>mutation.target).tagName !== 'SCRIPT'
                || !(<HTMLElement>mutation.target).textContent?.match(/\bfunction updateProgenyTableData\b/)
            )
                return;

            mutation.addedNodes?.forEach(async (node: Node): Promise<void> => {
                if (node?.textContent?.match(/\bfunction updateProgenyTableData\b/)) {
                    node.textContent = await DataTables.extend(
                        '#progenyListTable',
                        node.textContent.replace(/\bsaleTable\b/g, 'progenyListTable'),
                        { ...settings, saveSearch: false }
                    );
                }
            });
        });
    });

    observer.observe(window.document, { childList: true, subtree: true });
    onInstalled((): void => observer.disconnect());
})();