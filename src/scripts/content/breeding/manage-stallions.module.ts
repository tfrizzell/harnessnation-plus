import { ActionType, sendAction } from '../../../lib/actions.js';
import { onInstalled } from '../../../lib/events.js';
import { StudFeeFormula } from '../../../lib/settings.js';

document.querySelectorAll<HTMLInputElement>('#inputStudFee, #inputStudFeeUpdate').forEach((input: HTMLInputElement): void => {
    const button: HTMLButtonElement = document.createElement('button');
    button.classList.add('hn-plus-calculate-button');
    button.setAttribute('data-extension', chrome.runtime.id);
    button.setAttribute('type', 'button');
    button.textContent = 'calculate';

    const icon: HTMLImageElement = document.createElement('img');
    icon.src = `chrome-extension://${chrome.runtime.id}/public/icons/calculate.svg`;
    button.append(icon);

    input.classList.add('hn-plus-calculate-input');
    input.parentNode?.append(button);

    let calculating: boolean = false;

    button.addEventListener('click', async (): Promise<void> => {
        const id: number = parseInt((input?.form?.elements as any)?.horse?.value);

        if (calculating || Number.isNaN(id))
            return;

        try {
            input.classList.add('hn-plus-calculating');
            calculating = true;

            const formula: StudFeeFormula = (await chrome.storage.sync.get('stallions.management.formula'))?.['stallions.management.formula'];
            input.value = (await sendAction(ActionType.CalculateStudFee, { id, formula }))?.data?.toString() ?? input.value;
        } catch (e: any) {
            console.error(`%cmanage-stallions.module.ts%c     Error while calculating stud fee: ${e.message}`, 'color:#406e8e;font-weight:bold;', '');
            console.error(e);
            alert((e as Error).message || e);
        } finally {
            calculating = false;
            input.classList.remove('hn-plus-calculating');
        }
    });
});

onInstalled((): void => {
    document.querySelectorAll('.hn-plus-calculate-button').forEach(el => el.remove());
    document.querySelectorAll('.hn-plus-calculate-input').forEach(el => el.classList.remove('hn-plus-calculate-input', 'hn-plus-calculating'));
});