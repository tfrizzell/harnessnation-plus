import { onLoad } from '../../../lib/events.js';
import { removeAll } from '../../../lib/utils.js';

const materialSymbolsStyleUrl = chrome.runtime.getURL('/public/fonts/MaterialSymbolsOutlined.css');

function addMaterialSymbols(): void {
    if (document.querySelector(`link[href*="${materialSymbolsStyleUrl}"]`))
        return;

    const font = document.createElement('link');
    font.setAttribute('rel', 'stylesheet');
    font.setAttribute('href', `${materialSymbolsStyleUrl}?t=${Date.now()}`);
    document.head.append(font);
}

function removeMaterialSymbols(): void {
    removeAll(`link[href*="${materialSymbolsStyleUrl}"]`);
}

onLoad(() => {
    removeMaterialSymbols();
    addMaterialSymbols();
});