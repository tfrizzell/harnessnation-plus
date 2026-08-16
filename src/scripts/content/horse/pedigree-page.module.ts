import { ActionType, sendAction } from '../../../lib/actions.js';
import { onInstalled, onLoad } from '../../../lib/events.js';
import { getEstimatedRuntime } from '../../../lib/pedigree.js';
import { removeAll } from '../../../lib/utils.js';
import '../fonts/material-symbols.js';

async function addPedigreeButton(): Promise<void> {
    const id = document.body.innerHTML
        .match(/<b[^>]*>\s*ID\s*:\s*<\/b[^>]*>\s*(\d+)/i)
        ?.slice(1)
        .map(parseInt)[0] ?? 0;

    if (id < 1)
        return;

    const isRunning = (await chrome.storage.local.get({
        'running.catalogs.pedigree': false,
    }))['running.catalogs.pedigree'] as boolean;

    const button = document.createElement('button');
    button.classList.add('hn-plus-button', 'hn-plus-pedigree-button');
    button.setAttribute('title', 'HN+ : Create Pedigree Page');
    button.setAttribute('type', 'button');
    button.toggleAttribute('disabled', isRunning);

    const icon = document.createElement('span');
    icon.classList.add('material-symbols-outlined');
    icon.textContent = 'family_history';
    button.append(icon);

    button.addEventListener('click', e => {
        e.preventDefault();

        void (async () => {
            try {
                button.disabled = true;
                await createPedigreePage();
            } finally {
                button.disabled = false;
            }
        })();
    });

    const parent = document.querySelector('h1.font-weight-bold.text-left')?.parentElement?.nextElementSibling;

    if (parent?.querySelector('.hn-plus-stallion-score') != null)
        parent.querySelector('.hn-plus-stallion-score')?.after(button);
    else
        parent?.insertBefore(button, parent.firstChild);
}

async function createPedigreePage(): Promise<void> {
    const id = document.body.innerHTML
        .match(/<b[^>]*>\s*ID\s*:\s*<\/b[^>]*>\s*(\d+)/i)
        ?.slice(1)
        .map(parseInt)[0] ?? 0;

    const name = document.querySelector('h1.font-weight-bold.text-left')?.textContent.trim();
    const estimatedDuration = await getEstimatedRuntime(1);

    const estimateString = [
        Math.floor(estimatedDuration / 3600000)
            .toString()
            .padStart(2, '0'),
        Math.floor(estimatedDuration % 3600000 / 60000)
            .toString()
            .padStart(2, '0'),
        Math.ceil(estimatedDuration % 60000 / 1000)
            .toString()
            .padStart(2, '0'),
    ].join(':');

    if (!confirm(`You are about to generate a pedigree page. This will take an estimated ${estimateString}. During this time you will be unable to generate any other pedigree pages. Would you like to continue?`))
        return;

    try {
        await sendAction(ActionType.GeneratePedigreeCatalog, {
            data: [id],
            fullPedigrees: true,
            filename: !name ? undefined : `${name}.pdf`,
        });
    } catch (e: unknown) {
        console.groupCollapsed(`%cpedigree-page.module.ts%c     Error while generating catalog page`, 'color:#406e8e;font-weight:bold;', '');

        if (e instanceof Error) {
            console.error('Message:', e.message);
            console.error('Stack Trace:', e);
        } else
            console.error('Unknown Error:', e);

        console.groupEnd();
    }
}

function handleStateChange(
    changes: { [key: string]: chrome.storage.StorageChange },
    areaName: chrome.storage.AreaName
): void {
    if (areaName !== 'local' || !('running.catalogs.pedigree' in changes))
        return;

    const isRunning = Boolean(changes['running.catalogs.pedigree'].newValue);

    document.querySelectorAll<HTMLButtonElement>('.hn-plus-pedigree-button')
        .forEach(el => { el.disabled = isRunning; });
}

function removePedigreeButton(): void {
    chrome.storage.onChanged.removeListener(handleStateChange);
    removeAll('.hn-plus-pedigree-button')
}

onInstalled(() => {
    chrome.storage.onChanged.removeListener(handleStateChange);
});

onLoad(() => {
    removePedigreeButton();
    void addPedigreeButton();
    chrome.storage.onChanged.addListener(handleStateChange);
});