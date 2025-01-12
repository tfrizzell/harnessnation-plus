import DataTables from '../../../lib/data-tables.js';
import { onInstalled } from '../../../lib/events.js';

const page = window.location.pathname.split('/').pop() ?? '';
const settings = await DataTables.getSettings(page);

const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
        if (
            mutation.target.nodeType !== Node.ELEMENT_NODE
            || (<HTMLElement>mutation.target).tagName !== 'SCRIPT'
            || !(<HTMLElement>mutation.target).textContent?.match(/\bfunction loadHorses\b/)
        )
            return;

        mutation.addedNodes?.forEach(async node => {
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

observer.observe(document, { childList: true, subtree: true });
onInstalled(() => observer.disconnect());