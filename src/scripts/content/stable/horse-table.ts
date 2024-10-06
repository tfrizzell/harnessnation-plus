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
        mutations.filter((mutation: MutationRecord): boolean =>
            mutation.target.nodeType === Node.ELEMENT_NODE
            && (<HTMLElement>mutation.target).tagName === 'SCRIPT'
            && !!(<HTMLElement>mutation.target).textContent?.match(/\bfunction loadHorses\b/)
        ).forEach((mutation: MutationRecord): void => {
            mutation.addedNodes?.forEach(async (script: Node): Promise<void> => {
                if (!script?.textContent?.match(/\bfunction loadHorses\b/))
                    return;

                script.textContent = await DataTables.extend(
                    `'#${page === 'breeding' ? 'breedingHorse' : 'horse'}Table_' + i`,
                    script.textContent,
                    settings
                );
            });
        });
    });

    observer.observe(window.document, { childList: true, subtree: true });
    onInstalled((): void => observer.disconnect());
})();