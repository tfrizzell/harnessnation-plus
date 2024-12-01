import { onInstalled, onLoad } from '../../../lib/events.js';

type TrainingGroup = 'yearlings' | 'older';
type TrainingInputElement = HTMLInputElement | HTMLSelectElement;

const copiedSettings: Map<TrainingGroup, Map<string, string>> = new Map();
const buttonClasses: string[] = ['btn', 'p-2', 'btn-sm', 'waves-effect', 'waves-light', 'hn-plus-button'];

const font: HTMLLinkElement = document.createElement('link');
font.setAttribute('rel', 'stylesheet');
font.setAttribute('href', chrome.runtime.getURL('/public/fonts/MaterialSymbolsOutlined.css'));
document.head.append(font);

function addButtons(row: Element): void {
    const wrapper: HTMLElement = document.createElement('div');
    wrapper.classList.add('hn-plus-button-wrapper');

    const copyButton: HTMLButtonElement = document.createElement('button');
    copyButton.classList.add(...buttonClasses, 'hn-plus-copy-button');
    copyButton.title = 'Copy Training Settings';
    copyButton.type = 'button';
    wrapper.append(copyButton);

    copyButton.addEventListener('click', (e: Event): void => {
        e.preventDefault();
        copySettings(row);
    });

    const copyIcon: HTMLElement = document.createElement('span');
    copyIcon.classList.add('material-symbols-outlined');
    copyIcon.innerHTML = 'content_copy';
    copyButton.append(copyIcon);

    const cloneButton: HTMLButtonElement = document.createElement('button');
    cloneButton.classList.add(...buttonClasses, 'hn-plus-clone-button');
    cloneButton.title = 'Copy Training Settings to All Rows';
    cloneButton.type = 'button';
    wrapper.append(cloneButton);

    const cloneIcon: HTMLElement = document.createElement('span');
    cloneIcon.classList.add('material-symbols-outlined');
    cloneIcon.innerHTML = 'copy_all';
    cloneButton.append(cloneIcon);

    cloneButton.addEventListener('click', (e: Event): void => {
        e.preventDefault();
        copySettingsToAll(row);
    });

    row.querySelector<HTMLButtonElement>('button.horseInfoBtn')!.parentNode?.append(wrapper);

    if (copiedSettings.has(getTrainingGroup(row)))
        addPasteButton(row);
}

function addPasteButton(row: Element): void {
    if (row.querySelector('.hn-plus-button-wrapper .hn-plus-paste-button'))
        return;

    const wrapper: Element | null = row.querySelector('.hn-plus-button-wrapper');

    if (null == wrapper)
        return;

    const pasteButton: HTMLButtonElement = document.createElement('button');
    pasteButton.classList.add(...buttonClasses, 'hn-plus-paste-button');
    pasteButton.title = 'Paste Training Settings';
    pasteButton.type = 'button';

    pasteButton.addEventListener('click', (e: Event): void => {
        e.preventDefault();
        pasteSettings(row);
    });

    const pasteIcon: HTMLElement = document.createElement('span');
    pasteIcon.classList.add('material-symbols-outlined');
    pasteIcon.innerHTML = 'content_paste';
    pasteButton.append(pasteIcon);

    wrapper.insertBefore(pasteButton, wrapper.firstElementChild);
}

function copySettings(row: Element): void {
    copiedSettings.set(getTrainingGroup(row), getSettings(row));

    row.closest('form')?.querySelector(':is(.horseField, .horseFieldYearling).hn-plus-copy-source')?.classList.remove('hn-plus-copy-source');
    row.closest('.horseField, .horseFieldYearling')?.classList.add('hn-plus-copy-source');

    row.closest('form')?.querySelectorAll('.horseField, .horseFieldYearling').forEach((row: Element): void => {
        addPasteButton(row);
    });
}

function copySettingsToAll(row: Element): void {
    const settings: Map<string, string> = getSettings(row);

    row.closest('form')?.querySelectorAll('.horseField, .horseFieldYearling').forEach((row: Element): void => {
        pasteSettings(row, settings);
    });
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
        if (null != el.offsetParent && !/^input(HorseName|FastworkGait)(Yearling)?_\d+$/i.test(el.id))
            settings.set(getKey(el), el.value);
    });

    return settings;
}

function handleAutoSelect(e: Event): void {
    const form: Element | null | undefined = (<Element>e.target).closest('.pb-3 > .row')?.querySelector('form');

    form?.querySelectorAll<HTMLSelectElement>('.horseField, .horseFieldYearling').forEach((row: HTMLSelectElement): void => {
        removeButtons(row);
        addButtons(row);
    });
}

function pasteSettings(row: Element, settings: Map<string, string> | undefined | null = null): void {
    if (null === settings)
        return pasteSettings(row, copiedSettings.get(getTrainingGroup(row)));

    if (null == settings)
        return;

    getInputs(row).forEach((el: TrainingInputElement): void => {
        const key: string = getKey(el);

        if (null != el.offsetParent && settings.has(key)) {
            el.value = settings.get(key)!;
            el.dispatchEvent(new Event('change'));
        }
    });
}

function removeButtons(row?: Element | undefined): void {
    (row ?? document).querySelectorAll<HTMLButtonElement>('.hn-plus-button-wrapper, .hn-plus-button').forEach((el: HTMLButtonElement): void => el.remove());
}

const observer: MutationObserver = new MutationObserver((mutations: MutationRecord[]): void => {
    mutations.forEach((mutation: MutationRecord): void => {
        [].forEach.call(mutation.addedNodes, (node: HTMLElement): void => {
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

observer.observe(window.document, { childList: true, subtree: true });

onInstalled((): void => {
    font.remove();
    observer.disconnect();
    document.querySelectorAll('button.autoSelectHorses, button.autoSelectYearlings').forEach((button: Element): void => button.removeEventListener('click', handleAutoSelect));
    removeButtons();
    copiedSettings.clear();
});

onLoad((): void => {
    document.querySelectorAll('form').forEach((form: Element): void => {
        form.querySelectorAll('.horseField, .horseFieldYearliog').forEach((row: Element): void => {
            removeButtons(row);

            if (row.querySelector<HTMLSelectElement>('select.trainingSelect, select.trainingSelectYearling')?.value)
                addButtons(row);
        });

        form.closest('.pb-3 > .row')?.querySelectorAll('button.autoSelectHorses, button.autoSelectYearlings').forEach((button: Element): void => button.addEventListener('click', handleAutoSelect));
    });
});