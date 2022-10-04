(async (): Promise<void> => {
    const DataTables = window.DataTables;
    const { onInstalled } = window.Events;
    const settings = await DataTables.getSettings('progeny');

    const observer: MutationObserver = new MutationObserver((mutations: MutationRecord[]): void => {
        mutations.filter((mutation: MutationRecord): boolean =>
            mutation.target.nodeType === Node.ELEMENT_NODE
            && (<HTMLElement>mutation.target).tagName === 'SCRIPT'
            && !!(<HTMLElement>mutation.target).textContent?.match(/\bfunction updateProgenyTableData\b/)
        ).forEach((mutation: MutationRecord): void => {
            mutation.addedNodes?.forEach(async (node: Node): Promise<void> => {
                if (!node?.textContent?.match(/\bfunction updateProgenyTableData\b/))
                    return;

                node.textContent = await DataTables.extend(
                    '#progenyListTable',
                    node.textContent.replace(/\bsaleTable\b/g, 'progenyListTable'),
                    { ...settings, saveSearch: false }
                );
            });
        });
    });

    observer.observe(window.document, { childList: true, subtree: true });
    onInstalled((): void => observer.disconnect());
})();