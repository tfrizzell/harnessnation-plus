import { onLoad } from '../../../lib/events.js';
import { removeAll } from '../../../lib/utils.js';

const tooltipScriptUrl = chrome.runtime.getURL('/public/components/tooltip.js');

export function addTooltips(): void {
    if (document.querySelector(`script[src*="${tooltipScriptUrl}"]`))
        return;

    const tooltip = document.createElement('script');
    tooltip.setAttribute('type', 'module');
    tooltip.setAttribute('src', `${tooltipScriptUrl}?t=${Date.now()}`);
    document.body.append(tooltip);
}

export function removeTooltips(): void {
    removeAll(`script[src*="${tooltipScriptUrl}"]`);
}

onLoad(() => {
    removeTooltips();
    addTooltips();
});