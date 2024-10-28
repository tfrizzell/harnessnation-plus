import { ActionType, sendAction } from '../../../lib/actions.js';
import { onLoad } from '../../../lib/events.js';
import { StudFeeFormula } from '../../../lib/settings.js';
import { removeAll } from '../../../lib/utils.js';

const materialSymbolsStyleUrl = chrome.runtime.getURL('/public/fonts/MaterialSymbolsOutlined.css');

function addCalculateButtons(): void {
    document.querySelectorAll<HTMLInputElement>('#inputStudFee, #inputStudFeeUpdate').forEach(input => {
        const button = document.createElement('button');
        button.classList.add('hn-plus-calculate-button');
        button.setAttribute('data-extension', chrome.runtime.id);
        button.setAttribute('type', 'button');

        const icon = document.createElement('span');
        icon.classList.add('material-symbols-outlined');
        icon.innerHTML = 'calculate';
        button.append(icon);

        input.classList.add('hn-plus-calculate-input');
        input.parentNode?.append(button);

        let calculating = false;

        button.addEventListener('click', async () => {
            const id = parseInt((<any>input?.form?.elements)?.horse?.value);

            if (calculating || Number.isNaN(id))
                return;

            try {
                input.classList.add('hn-plus-calculating');
                calculating = true;

                const formula: StudFeeFormula = (await chrome.storage.sync.get('stallions.management.formula'))?.['stallions.management.formula'];
                input.value = (await sendAction(ActionType.CalculateStudFee, { id, formula }))?.data?.toString() ?? input.value;
            } catch (e: any) {
                console.error(`%cmanage-stallions.module.ts%c     Error while calculating stud fee: ${e?.message || e}`, 'color:#406e8e;font-weight:bold;', '');
                console.error(e);
                alert(e?.message || e);
            } finally {
                calculating = false;
                input.classList.remove('hn-plus-calculating');
            }
        });
    });
}

function addMaterialSymbols(): void {
    const font = document.createElement('link');
    font.setAttribute('rel', 'stylesheet');
    font.setAttribute('href', `${materialSymbolsStyleUrl}?t=${Date.now()}`);
    document.head.append(font);
}

function removeCalculateButtons(): void {
    removeAll('.hn-plus-calculate-button');
}

function removeMaterialSymbols(): void {
    removeAll(`link[href*="${materialSymbolsStyleUrl}"]`);
}

onLoad(() => {
    removeCalculateButtons();
    removeMaterialSymbols();
    addMaterialSymbols();
    addCalculateButtons();
});