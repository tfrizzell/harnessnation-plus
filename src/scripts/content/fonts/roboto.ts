import { onLoad } from '../../../lib/events.js';
import { removeAll } from '../../../lib/utils.js';

const robotoStyleUrl = chrome.runtime.getURL('/public/fonts/Roboto.css');

function addRoboto(): void {
    if (document.querySelector(`link[href*="${robotoStyleUrl}"]`))
        return;

    const font = document.createElement('link');
    font.setAttribute('rel', 'stylesheet');
    font.setAttribute('href', `${robotoStyleUrl}?t=${Date.now()}`);
    document.head.append(font);
}

function removeRoboto(): void {
    removeAll(`link[href*="${robotoStyleUrl}"]`);
}

onLoad(() => {
    removeRoboto();
    addRoboto();
});