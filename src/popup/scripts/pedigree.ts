import { ActionType, sendAction } from '../../lib/actions.js';
import { getEstimatedRuntime } from '../../lib/pedigree.js';
import { HNPlusCatalogCreatorElement } from '../../public/components/catalog-creator.d';
import { bindDialogEventListeners } from './dialogs.js';

const form = document.querySelector<HNPlusCatalogCreatorElement>('hn-plus-catalog-creator')!;

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
    const dialog = document.createElement('dialog');
    bindDialogEventListeners(dialog);
    dialog.addEventListener('close', () => dialog.remove());

    try {
        await sendAction(ActionType.GeneratePedigreeCatalog, {
            data: data,
            showHipNumbers: showHipNumbers,
            fullPedigrees: fullPedigrees,
        });

        dialog.innerHTML = '<p style="align-items:center;display:flex;gap:0.3em"><span class="material-symbols-outlined" style="color:green">check_circle</span> Your pedigree catalog has been created and downloaded successfully!</p>';
    } catch (e: any) {
        if (e) {
            console.error(`%cpedigree.ts%c     ${e.message}`, 'color:#406e8e;font-weight:bold;', '');
            dialog.innerHTML = `<p style="align-items:center;display:flex;gap:0.3em"><span class="material-symbols-outlined" style="color:red">error</span> An unexpected error has occurred: ${e.message}</p>`;
            closeTimeout = 10000;
        }
    }

    if (dialog.innerHTML) {
        document.body.append(dialog);
        dialog.showModal();
        setTimeout(() => dialog.close(), closeTimeout);
    }

    form.reset();
});

chrome.storage.onChanged.addListener((changes: { [key: string]: chrome.storage.StorageChange }, areaName: chrome.storage.AreaName): void => {
    if (areaName !== 'local' || !changes['running.catalogs.pedigree'])
        return;

    form.disabled = changes['running.catalogs.pedigree']?.newValue ?? false;
});

form.disabled = (await chrome.storage.local.get('running.catalogs.pedigree'))['running.catalogs.pedigree'] ?? false;