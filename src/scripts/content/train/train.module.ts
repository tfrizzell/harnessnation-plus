import { onInstalled, onLoad } from '../../../lib/events.js';
import { removeAll } from '../../../lib/utils.js';
import '../fonts/material-symbols.js';

type TrainingGroup = 'yearlings' | 'older';
type TrainingInputElement = HTMLInputElement | HTMLSelectElement;

const buttonClasses = ['btn', 'p-2', 'btn-sm', 'waves-effect', 'waves-light', 'hn-plus-button'];
const copiedSettings: Map<TrainingGroup, Map<string, string>> = new Map();

function addButtons(row: Element): void {
    const wrapper = document.createElement('div');
    wrapper.classList.add('hn-plus-button-wrapper', 'hn-plus-training-buttons');

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

function addPasteButton(row: Element): void {
    if (row.querySelector('.hn-plus-training-buttons .hn-plus-paste-button'))
        return;

    const wrapper = row.querySelector('.hn-plus-training-buttons');

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

    row.closest('form')?.querySelector(':is(.horseField, .horseFieldYearling).hn-plus-copy-source')?.classList.remove('hn-plus-copy-source');
    row.closest('.horseField, .horseFieldYearling')?.classList.add('hn-plus-copy-source');
    row.closest('form')?.querySelectorAll('.horseField, .horseFieldYearling').forEach(addPasteButton);
}

function copySettingsToAll(row: Element): void {
    const settings: Map<string, string> = getSettings(row);

    row.closest('form')?.querySelectorAll('.horseField, .horseFieldYearling').forEach(row => pasteSettings(row, settings));
}

function getInputs(row: Element): NodeListOf<TrainingInputElement> {
    return row.querySelectorAll<TrainingInputElement>('input, select');
}

function getKey(el: TrainingInputElement): string {
    return el.id.split('_')[0];
}

function getTrainingGroup(row: Element): TrainingGroup {
    return row.closest('form')?.classList.contains('olderHorseTrain') ? 'older' : 'yearlings';
}

function getSettings(row: Element): Map<string, string> {
    const settings: Map<string, string> = new Map()

    getInputs(row).forEach((el: TrainingInputElement): void => {
        if (el.offsetParent != null && !/^input(HorseName|FastworkGait)(Yearling)?_\d+$/i.test(el.id))
            settings.set(getKey(el), el.value);
    });

    return settings;
}

function handleAutoSelect(e: Event): void {
    const form = (<Element>e.target).closest('.pb-3 > .row')?.querySelector('form');

    form?.querySelectorAll('.horseField, .horseFieldYearling').forEach(row => {
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
        row.querySelectorAll('.hn-plus-training-buttons').forEach(el => el.remove());
    else
        removeAll('.hn-plus-training-buttons');
}

const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
        [].forEach.call(mutation.addedNodes, (node: HTMLElement) => {
            if (node.classList?.contains('horseField') || node.classList?.contains('horseFieldYearling')) {
                node.querySelectorAll<HTMLSelectElement>('select.horseNameSelect, select.horseNameSelectYearling')?.forEach(select => {
                    select.addEventListener('change', (e: Event): void => {
                        if (select.value)
                            addButtons(node);
                        else
                            removeButtons(node)
                    });
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

    document.querySelectorAll('form').forEach(form => {
        form.querySelectorAll('.horseField, .horseFieldYearliog').forEach(row => {
            if (row.querySelector<HTMLSelectElement>('select.trainingSelect, select.trainingSelectYearling')?.value)
                addButtons(row);
        });

        form.closest('.pb-3 > .row')?.querySelectorAll('button.autoSelectHorses, button.autoSelectYearlings').forEach((button: Element): void => button.addEventListener('click', handleAutoSelect));
    });
});