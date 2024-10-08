/***************************************************************************************************
 *                                                                                                 *
 * This file duplicates horse-table.module.ts. When using `import('progeny-table.module.ts')`, the *
 * target script element is loaded before the script module, thus the functionality doesn't work.  *
 *                                                                                                 *
 ***************************************************************************************************/
(async (): Promise<void> => {
    const DataTables = window.DataTables;
    const { onInstalled } = window.Events;
    const settings = await DataTables.getSettings('progeny');

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