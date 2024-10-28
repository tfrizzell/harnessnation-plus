/***************************************************************************************************
 *                                                                                                 *
 * This file duplicates horse-table.module.ts. When using `import('progeny-table.module.ts')`, the *
 * target script element is loaded before the script module, thus the functionality doesn't work.  *
 *                                                                                                 *
 ***************************************************************************************************/
(async () => {
    const DataTables = window.DataTables;
    const { onInstalled } = window.Events;
    const settings = await DataTables.getSettings('progeny');

    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (
                mutation.target.nodeType !== Node.ELEMENT_NODE
                || (<HTMLElement>mutation.target).tagName !== 'SCRIPT'
                || !(<HTMLElement>mutation.target).textContent?.match(/\bfunction updateProgenyTableData\b/)
            )
                return;

            mutation.addedNodes?.forEach(async node => {
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

    observer.observe(document, { childList: true, subtree: true });
    onInstalled(() => observer.disconnect());
})();