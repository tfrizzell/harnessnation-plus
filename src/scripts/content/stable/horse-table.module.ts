import DataTables, { DataTablesOptions } from '../../../lib/data-tables.js';
import { onInstalled } from '../../../lib/events.js';

(async (): Promise<void> => {
    const page: string = window.location.pathname.split('/').pop() ?? '';
    const settings: DataTablesOptions | undefined = await DataTables.getSettings(page);

    if (null == settings)
        return;

    const observer: MutationObserver = new MutationObserver((mutations: MutationRecord[]): void => {
        mutations.forEach((mutation: MutationRecord): void => {
            if (
                mutation.target.nodeType !== Node.ELEMENT_NODE
                || (<HTMLElement>mutation.target).tagName !== 'SCRIPT'
                || !(<HTMLElement>mutation.target).textContent?.match(/\bfunction loadHorses\b/)
            )
                return;

            mutation.addedNodes?.forEach(async (node: Node): Promise<void> => {
                if (node?.textContent?.match(/\bfunction loadHorses\b/)) {
                    node.textContent = await DataTables.extend(
                        `'#${page === 'breeding' ? 'breedingHorse' : 'horse'}Table_' + i`,
                        node.textContent,
                        settings
                    );
                }
            });
        });
    });

    observer.observe(window.document, { childList: true, subtree: true });
    onInstalled((): void => observer.disconnect());
})();