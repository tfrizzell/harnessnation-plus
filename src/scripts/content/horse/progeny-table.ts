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

    function addPagedProgenyLoader(node: Node): void {
        const totalFoals = parseInt(document.body.textContent?.match(/Total\s*Foals\s*:\s*([\d,]+)/)?.[1]?.replace(/\D/g, '') ?? '0');

        if (!node?.textContent?.match(/\bfunction updateProgenyTableData\b/) || totalFoals < 600)
            return;

        const gaits = [null];
        const ageGroups = [0, 1, 2, 3, 4];
        const genders = [0, 1, 2, 3, 4];
        const stables = [null];
        const delay = 500;

        node.textContent = node.textContent.replace(
            /(function updateProgenyTableData\(filterGait,filterAgeGroup,filterGender,filterStable, horseId\) \{)/,
            `
async function updateProgenyTableDataPaged(horseId) {
        const loader = $('#progenyModalLoadingContainer');
        const container = $('#progenyModalContainer');

        const filters = ${JSON.stringify([
                gaits,
                ageGroups,
                genders,
                stables,
            ])}.reduce((a, b) => a.flatMap(d => b.map(e => [d, e].flat())));

        const promises = filters.map(() => {
            let _resolve, _reject;
            const promise = new Promise((resolve, reject) => { _resolve = resolve; _reject = reject; });
            Object.assign(promise, { resolve: _resolve, reject: _reject });
            return promise;
        });

        const observer = new MutationObserver(mutations => {
            loader.show();
            container.hide();

            mutations.forEach(mutation => {
                if (promises.length === 0) {
                    observer.disconnect();
                    return;
                }

                const table = Array.from(mutation.addedNodes ?? [])
                    .find(node => node?.id === 'progenyListTable' || node?.querySelector?.('#progenyListTable'))
                    ?.closest('.table-responsive')
                    ?.querySelector('#progenyListTable');

                if (table) {
                    const promise = promises.shift();

                    if (promises.length > 0) {
                        $(table).DataTable().destroy();
                        promise.resolve(table?.querySelectorAll('tbody>tr:has(.horseLink)'));
                    } else
                        promise.resolve([]);
                }
            });
        });

        observer.observe(container.get(0), { childList: true });
        const pages = [];

        for (let i = 0; i < filters.length; i += 4) {
            const page = filters.slice(i, i + 4);
            page.forEach(filters => setTimeout(updateProgenyTableData, 0, ...filters, horseId));
            pages.push(...await Promise.all(promises.slice(0, page.length)));
            await new Promise(resolve => setTimeout(resolve, ${delay}));
        }

        observer.disconnect();
        const dt = $('#progenyListTable', container).DataTable();

        pages.reduce((rows, page) => [...rows, ...page], [])
            .sort((a, b) => parseInt(b.children[2].textContent) - parseInt(a.children[2].textContent))
            .forEach(row => dt.row.add(row).draw(false));

        setTimeout(() => {
            const form = container.get(0).querySelector('form');
            form?.querySelectorAll('input[id^="filter"]').forEach(el => el.value = '');
            form?.querySelectorAll('select[id^="progenyFilter"]').forEach(el => el.value = 'all');
        });

        container.show();
        loader.hide();
        bindHorseInfoPopovers();
    }

    $1
        if ([filterGait, filterAgeGroup, filterGender, filterStable].every(filter => filter == null))
            return updateProgenyTableDataPaged(horseId);
`.replace(/^[\r\n]+/g, '')
        );
    }

    async function updateDataTablesSettings(node: Node): Promise<void> {
        if (!node?.textContent?.match(/\bfunction updateProgenyTableData\b/))
            return;

        node.textContent = await DataTables.extend(
            '#progenyListTable',
            node.textContent.replace(/\bsaleTable\b/g, 'progenyListTable'),
            { ...settings, saveSearch: false }
        );
    }

    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (
                mutation.target.nodeType !== Node.ELEMENT_NODE
                || (<HTMLElement>mutation.target).tagName !== 'SCRIPT'
                || !(<HTMLElement>mutation.target).textContent?.match(/\bfunction updateProgenyTableData\b/)
            )
                return;

            mutation.addedNodes?.forEach(async node => {
                await updateDataTablesSettings(node);
                await addPagedProgenyLoader(node);
            });
        });
    });

    observer.observe(document, { childList: true, subtree: true });
    onInstalled(() => observer.disconnect());
})();