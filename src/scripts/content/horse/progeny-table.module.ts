import DataTables, { DataTablesOptions } from '../../../lib/data-tables.js';
import { onInstalled } from '../../../lib/events.js';

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