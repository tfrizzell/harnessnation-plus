import { ActionType, sendAction } from '../../../lib/actions.js';
import { onInstalled, onLoad } from '../../../lib/events.js';
import { getEstimatedRuntime } from '../../../lib/pedigree.js';
import { removeAll } from '../../../lib/utils.js';
import { HNPlusCatalogCreatorElement } from '../../../public/components/catalog-creator.d';
import '../fonts/material-symbols.js';
import '../fonts/roboto.js';

const catalogCreatorUrl = chrome.runtime.getURL('/public/components/catalog-creator.js');

function addCatalogCreator(): void {
    if (document.querySelector(`script[src*="${catalogCreatorUrl}"]`))
        return;

    const script = document.createElement('script');
    script.setAttribute('type', 'module');
    script.setAttribute('src', `${catalogCreatorUrl}?t=${Date.now()}`);
    document.body.append(script);
}

export async function createCatalogButton(optionsSelector?: string): Promise<HTMLButtonElement> {
    const running = (await chrome.storage.local.get('running.catalogs.pedigree'))?.['running.catalogs.pedigree'] ?? false;

    const button = document.createElement('button');
    button.classList.add('hn-plus-button', 'hn-plus-catalog-button');
    button.setAttribute('title', 'HN+ : Create Pedigree Catalog');
    button.setAttribute('type', 'button');
    button.toggleAttribute('disabled', running);

    const icon = document.createElement('span');
    icon.classList.add('material-symbols-outlined');
    icon.textContent = 'family_history';
    button.append(icon);
    button.innerHTML += ' Catalog';

    button.addEventListener('click', async (e: MouseEvent) => {
        e.preventDefault();

        try {
            button.disabled = true;
            await showCatalogDialog(optionsSelector);
        } finally {
            button.disabled = (await chrome.storage.local.get('running.catalogs.pedigree'))?.['running.catalogs.pedigree'] ?? false;
        }
    });

    return button;
}

function handleStateChange(changes: { [key: string]: chrome.storage.StorageChange }, areaName: chrome.storage.AreaName): void {
    if (areaName !== 'local' || !changes['running.catalogs.pedigree'])
        return;

    if (changes['running.catalogs.pedigree']?.newValue) {
        document.querySelectorAll<HTMLButtonElement>('.hn-plus-catalog-button').forEach(el => { el.disabled = true; });
        document.querySelectorAll<HNPlusCatalogCreatorElement>('hn-plus-catalog-creator').forEach(el => { el.toggleAttribute('disabled', true); });
    } else {
        document.querySelectorAll<HTMLButtonElement>('.hn-plus-catalog-button').forEach(el => { el.disabled = false; });
        document.querySelectorAll<HNPlusCatalogCreatorElement>('hn-plus-catalog-creator').forEach(el => { el.toggleAttribute('disabled', false); });
    }
}

function removeCatalogCreator(): void {
    removeAll(`script[src*="${catalogCreatorUrl}"]`);
}

function showCatalogDialog(optionsSelector?: string): Promise<void> {
    return new Promise(resolve => {
        const dialog = document.createElement('dialog');
        dialog.setAttribute('id', 'hn-plus-catalog-modal');
        dialog.addEventListener('close', () => dialog.remove());

        dialog.addEventListener('click', (e: MouseEvent) => {
            const { top, right, bottom, left } = dialog.getBoundingClientRect();

            if (e.target === dialog && (e.y < top || e.y > bottom || e.x < left || e.x > right))
                dialog.close();
        });

        const header = document.createElement('header');
        dialog.append(header);

        const extensionName = document.createElement('h2');
        extensionName.classList.add('extension-name');
        extensionName.innerHTML = 'HarnessNation+';
        header.append(extensionName);

        const title = document.createElement('h2');
        title.innerHTML = 'Catalog Creator';
        header.append(title);

        const form = <HNPlusCatalogCreatorElement>document.createElement('hn-plus-catalog-creator');
        dialog.append(<Node>form);

        if (optionsSelector) {
            form.options = Array.from(document.querySelectorAll<HTMLAnchorElement>(optionsSelector))
                .map((a): [number, string] => [
                    parseInt(a.getAttribute('href')!.split('/').pop()!),
                    a.textContent!
                ])
                .sort((a, b) => a[1].localeCompare(b[1], undefined, { sensitivity: 'base' }) || (a[0] - b[0]));

            form.setAttribute('options', JSON.stringify(form.options));
        }

        form.addEventListener('submit', async e => {
            e.preventDefault();

            const { data, showHipNumbers, fullPedigrees } = e.detail;
            const estimatedDuration = await getEstimatedRuntime(data.length);

            const estimateString = [
                Math.floor(estimatedDuration / 3600000).toString().padStart(2, '0'),
                Math.floor(estimatedDuration % 3600000 / 60000).toString().padStart(2, '0'),
                Math.ceil(estimatedDuration % 60000 / 1000).toString().padStart(2, '0'),
            ].filter(v => v != null).join(':');

            if (data.length < 1 || !confirm(`You are about to generate a pedigree catalog with ${data.length} ${data.length !== 1 ? 'pages' : 'page'}. This will take an estimated ${estimateString}. During this time you will be unable to generate another catalog. Would you like to continue?`))
                return;

            let closeTimeout = 5000;
            const message = document.createElement('p');
            message.style.setProperty('align-items', 'center');
            message.style.setProperty('display', 'flex');
            message.style.setProperty('gap', '0.3em');

            try {
                form.disabled = true;

                await sendAction(ActionType.GeneratePedigreeCatalog, {
                    data: data,
                    showHipNumbers: showHipNumbers,
                    fullPedigrees: fullPedigrees,
                    filename: data.length !== 1 ? undefined : `${form.options!.find(([id]) => id === (Array.isArray(data[0]) ? data[0][0] : data[0]))![1]}.pdf`,
                });

                message.innerHTML = '<span class="material-symbols-outlined" style="color:green">check_circle</span> Your pedigree catalog has been created and downloaded successfully!';
            } catch (e: any) {
                if (e) {
                    console.error(`%cpedigree-catalog.module.ts%c     ${e.message}`, 'color:#406e8e;font-weight:bold;', '');
                    message.innerHTML = `<span class="material-symbols-outlined" style="color:red">error</span> An unexpected error has occurred: ${e.message}`;
                    closeTimeout = 10000;
                }
            } finally {
                form.disabled = false;
            }

            if (message.innerHTML) {
                dialog.style.setProperty('height', 'min-content');
                form.replaceWith(message);
                setTimeout(() => dialog.close(), closeTimeout);
            }
        });

        document.body.append(dialog);
        dialog.addEventListener('close', () => resolve());
        dialog.showModal();
    });
}

onInstalled(() => chrome.storage.onChanged.removeListener(handleStateChange));

onLoad(() => {
    chrome.storage.onChanged.removeListener(handleStateChange);
    chrome.storage.onChanged.addListener(handleStateChange);

    removeAll('#hn-plus-catalog-modal');
    removeCatalogCreator();
    addCatalogCreator();
});