/**************************************************************************************************
 *                                                                                                *
 * This file duplicates horse-table.module.ts. When using `import('horse-table.module.ts')`, the  *
 * target script element is loaded before the script module, thus the functionality doesn't work. *
 *                                                                                                *
 **************************************************************************************************/
(async (): Promise<void> => {
    const DataTables = window.DataTables;
    const { onInstalled } = window.Events;

    const page: string = window.location.pathname.split('/').pop() ?? '';
    const settings = await DataTables.getSettings(page);

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