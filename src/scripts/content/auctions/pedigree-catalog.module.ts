import { onLoad } from '../../../lib/events.js';
import { removeAll } from '../../../lib/utils.js';
import { createCatalogButton } from '../common/pedigree-catalog.module.js';

export async function addCatalogButton(): Promise<void> {
    document.querySelector('h2')?.after(await createCatalogButton('.horseLinkOpen'));
}

export function removeCatalogButton(): void {
    removeAll('.hn-plus-catalog-button')
}

onLoad(() => {
    removeCatalogButton();
    addCatalogButton();
});