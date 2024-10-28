import { onInstalled, onLoad } from '../../../lib/events.js';
import { removeAll } from '../../../lib/utils.js';

type TrainingGroup = 'main' | 'breeding';
type TrainingInputElement = HTMLInputElement | HTMLSelectElement;

const materialSymbolsStyleUrl = chrome.runtime.getURL('/public/fonts/MaterialSymbolsOutlined.css');
const buttonClasses = ['btn', 'p-2', 'btn-sm', 'waves-effect', 'waves-light', 'hn-plus-button'];
const copiedSettings: Map<TrainingGroup, Map<string, string>> = new Map();

function addButtons(row: Element): void {
    const wrapper = document.createElement('div');
    wrapper.classList.add('hn-plus-button-wrapper');

    const copyButton = document.createElement('button');
    copyButton.classList.add(...buttonClasses, 'hn-plus-copy-button');
    copyButton.title = 'Copy Training Settings';
    copyButton.type = 'button';
    wrapper.append(copyButton);

    copyButton.addEventListener('click', e => {
        e.preventDefault();
        copySettings(row);
    });

    const copyIcon = document.createElement('span');
    copyIcon.classList.add('material-symbols-outlined');
    copyIcon.innerHTML = 'content_copy';
    copyButton.append(copyIcon);

    const cloneButton = document.createElement('button');
    cloneButton.classList.add(...buttonClasses, 'hn-plus-clone-button');
    cloneButton.title = 'Copy Training Settings to All Rows';
    cloneButton.type = 'button';
    wrapper.append(cloneButton);

    const cloneIcon = document.createElement('span');
    cloneIcon.classList.add('material-symbols-outlined');
    cloneIcon.innerHTML = 'copy_all';
    cloneButton.append(cloneIcon);

    cloneButton.addEventListener('click', e => {
        e.preventDefault();
        copySettingsToAll(row);
    });

    row.querySelector('button.horseInfoBtn')!.parentNode?.append(wrapper);

    if (copiedSettings.has(getTrainingGroup(row)))
        addPasteButton(row);
}

function addMaterialSymbols(): void {
    const font = document.createElement('link');
    font.setAttribute('rel', 'stylesheet');
    font.setAttribute('href', `${materialSymbolsStyleUrl}?t=${Date.now()}`);
    document.head.append(font);
}

function addPasteButton(row: Element): void {
    if (row.querySelector('.hn-plus-button-wrapper .hn-plus-paste-button'))
        return;

    const wrapper = row.querySelector('.hn-plus-button-wrapper');

    if (wrapper == null)
        return;

    const pasteButton = document.createElement('button');
    pasteButton.classList.add(...buttonClasses, 'hn-plus-paste-button');
    pasteButton.title = 'Paste Training Settings';
    pasteButton.type = 'button';

    pasteButton.addEventListener('click', e => {
        e.preventDefault();
        pasteSettings(row);
    });

    const pasteIcon = document.createElement('span');
    pasteIcon.classList.add('material-symbols-outlined');
    pasteIcon.innerHTML = 'content_paste';
    pasteButton.append(pasteIcon);

    wrapper.insertBefore(pasteButton, wrapper.firstElementChild);
}

function copySettings(row: Element): void {
    copiedSettings.set(getTrainingGroup(row), getSettings(row));

    row.closest('form')?.querySelector('.horseField.hn-plus-copy-source')?.classList.remove('hn-plus-copy-source');
    row.closest('.horseField')?.classList.add('hn-plus-copy-source');
    row.closest('form')?.querySelectorAll('.horseField').forEach(addPasteButton);
}

function copySettingsToAll(row: Element): void {
    const settings: Map<string, string> = getSettings(row);
    row.closest('form')?.querySelectorAll('.horseField').forEach(row => pasteSettings(row, settings));
}

function getInputs(row: Element): NodeListOf<TrainingInputElement> {
    return row.querySelectorAll<TrainingInputElement>('input, select');
}

function getKey(el: TrainingInputElement): string {
    return el.id.split('_')[0];
}

function getTrainingGroup(row: Element): TrainingGroup {
    return row.closest('form')?.classList.contains('olderHorseTrain') ? 'main' : 'breeding';
}

function getSettings(row: Element): Map<string, string> {
    const settings: Map<string, string> = new Map()

    getInputs(row).forEach((el: TrainingInputElement): void => {
        if (el.offsetParent != null && !/^input(HorseName|FastworkGait)_\d+$/i.test(el.id))
            settings.set(getKey(el), el.value);
    });

    return settings;
}

function handleAutoSelect(e: Event): void {
    const form = (<Element>e.target).closest('.pb-3 > .row')?.querySelector('form');

    form?.querySelectorAll('.horseField').forEach(row => {
        removeButtons(row);
        addButtons(row);
    });
}

function pasteSettings(row: Element, settings: Map<string, string> | undefined | null = null): void {
    if (settings === null)
        return pasteSettings(row, copiedSettings.get(getTrainingGroup(row)));

    if (settings == null)
        return;

    getInputs(row).forEach(el => {
        const key = getKey(el);

        if (el.offsetParent != null && settings.has(key)) {
            el.value = settings.get(key)!;
            el.dispatchEvent(new Event('change'));
        }
    });
}

function removeButtons(row?: Element | undefined): void {
    if (row != null)
        row.querySelectorAll('.hn-plus-button-wrapper, .hn-plus-button').forEach(el => el.remove());
    else
        removeAll('.hn-plus-button-wrapper', '.hn-plus-button');
}

function removeMaterialSymbols(): void {
    removeAll(`link[href*="${materialSymbolsStyleUrl}"]`);
}

const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
        [].forEach.call(mutation.addedNodes, (node: HTMLElement) => {
            if (node.classList?.contains('horseField')) {
                node.querySelector('select.horseNameSelect')?.addEventListener('change', e => {
                    const el = <HTMLSelectElement>e.target;

                    if (el.value)
                        addButtons(node);
                    else
                        removeButtons(node)
                });
            }
        });
    });
});

observer.observe(document, { childList: true, subtree: true });
onInstalled(() => observer.disconnect());

onLoad(() => {
    copiedSettings.clear();
    removeButtons();
    removeMaterialSymbols();
    addMaterialSymbols();

    document.querySelectorAll('form').forEach(form => {
        form.querySelectorAll('.horseField').forEach(row => {
            if (row.querySelector<HTMLSelectElement>('select.trainingSelect')?.value)
                addButtons(row);
        });

        form.closest('.pb-3 > .row')?.querySelector('button.autoSelectHorses')?.addEventListener('click', handleAutoSelect);
    });
});