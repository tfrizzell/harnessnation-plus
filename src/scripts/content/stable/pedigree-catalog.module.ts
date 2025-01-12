import { onLoad } from '../../../lib/events.js';
import { createCatalogButton } from '../common/pedigree-catalog.module.js';

export async function addCatalogButton(): Promise<void> {
    const button = await createCatalogButton('.horseLinkOpen:has(.theHorseName)');

    (
        document.querySelector(':has(>.mainStableColumnBtn, >.breedingStableColumnBtn) > :is(form, input)')
        ?? document.querySelector(':has(>.mainStableColumnBtn, >.breedingStableColumnBtn) > :last-child')
    )?.after(button);

    if (button.parentNode?.querySelector('.breedingStableColumnBtn'))
        button.before(document.createElement('br'));
}

export function removeCatalogButton(): void {
    for (const button of document.querySelectorAll('.hn-plus-catalog-button')) {
        if (button.parentNode?.querySelector('.breedingStableColumnBtn'))
            button.previousElementSibling?.remove();

        button.remove();
    }
}

onLoad(() => {
    removeCatalogButton();
    addCatalogButton();
});