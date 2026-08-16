import { ActionType, sendAction } from '../../../lib/actions.js';
import { onLoad } from '../../../lib/events.js';
import { StudFeeFormula } from '../../../lib/settings.js';
import { removeAll } from '../../../lib/utils.js';
import '../fonts/material-symbols.js';

function addCalculateButtons(): void {
    document.querySelectorAll<HTMLInputElement>('#inputStudFee, #inputStudFeeUpdate')
        .forEach(input => {
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

            button.addEventListener('click', () => {
                const id = parseInt((input.form?.elements.namedItem('horse') as HTMLInputElement | null)?.value ?? '');

                if (calculating || Number.isNaN(id))
                    return;

                void (async () => {
                    try {
                        input.classList.add('hn-plus-calculating');
                        calculating = true;

                        const formula = (await chrome.storage.sync.get(
                            'stallions.management.formula'
                        ))['stallions.management.formula'] as StudFeeFormula | undefined;

                        input.value = (
                            await sendAction(ActionType.CalculateStudFee, { id, formula })
                        ).data.toString();
                    } catch (e: unknown) {
                        console.groupCollapsed(`%cbreeding.module.ts%c     Error while calculating stud fee`, 'color:#406e8e;font-weight:bold;', '');

                        if (e instanceof Error) {
                            console.error('Message:', e.message);
                            console.error('Stack Trace:', e);
                        } else
                            console.error('Unknown Error:', e);

                        console.groupEnd();
                        alert(e instanceof Error ? e.message : e);
                    } finally {
                        calculating = false;
                        input.classList.remove('hn-plus-calculating');
                    }
                })();
            });
        });
}

function removeCalculateButtons(): void {
    removeAll('.hn-plus-calculate-button');
}

onLoad(() => {
    removeCalculateButtons();
    addCalculateButtons();
});