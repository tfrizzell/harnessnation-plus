import { ActionType, sendAction } from '../../lib/actions.js';
import { getEstimatedRuntime } from '../../lib/pedigree.js';
import { HNPlusCatalogCreatorElement } from '../../public/components/catalog-creator.d';
import { bindDialogEventListeners } from './dialogs.js';

const form = document.querySelector('hn-plus-catalog-creator') as HNPlusCatalogCreatorElement;
let submitted: boolean = false;

form.addEventListener('submit', e => {
    e.preventDefault();

    if (submitted)
        return;

    submitted = true;

    void (async () => {
        try {
            const { data, showHipNumbers, fullPedigrees } = e.detail;
            const estimatedDuration = await getEstimatedRuntime(data.length);

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
            } catch (e: unknown) {
                console.groupCollapsed(`%cpedigree.ts%c     Error while generating catalog`, 'color:#406e8e;font-weight:bold;', '')
                const message = document.createElement('span');

                if (e instanceof Error) {
                    console.error('Message:', e.message);
                    console.error('Stack Trace:', e);
                    message.textContent = e.message;
                } else {
                    console.error('Unknown Error:', e);
                    message.textContent = String(e);
                }

                console.groupEnd();
                closeTimeout = 10000;

                dialog.innerHTML = '<p style="align-items:center;display:flex;gap:0.3em"><span class="material-symbols-outlined" style="color:red">error</span> An unexpected error has occurred: </p>';
                dialog.children[0].append(message);
            }

            if (dialog.innerHTML) {
                document.body.append(dialog);
                dialog.showModal();
                setTimeout(() => dialog.close(), closeTimeout);
            }

            form.reset();
        } finally {
            submitted = false;
        }
    })();
});

chrome.storage.onChanged.addListener(
    (
        changes: { [key: string]: chrome.storage.StorageChange },
        areaName: chrome.storage.AreaName
    ): void => {
        if (areaName !== 'local' || !('running.catalogs.pedigree' in changes))
            return;

        form.disabled = Boolean(changes['running.catalogs.pedigree'].newValue)
    }
);

form.disabled = (await chrome.storage.local.get({
    'running.catalogs.pedigree': false,
}))['running.catalogs.pedigree'] as boolean;