import type { HNPlusCatalogData } from './catalog-creator.d';

class HNPlusCatalogCreatorElement extends HTMLElement {
    static get observedAttributes() {
        return ['disabled', 'options'];
    }

    #disabled: boolean = false;
    #options?: [number, string][];

    get disabled(): boolean {
        return this.#disabled;
    }

    set disabled(value: boolean) {
        this.#disabled = value ?? false;

        if (this.#disabled)
            this.#disableAll();
        else
            this.#enableAll();
    }

    get options(): [number, string][] | undefined {
        return this.#options;
    }

    set options(value: [number, string][] | undefined) {
        this.#options = value;
        this.#updateRows();
    }

    #root: ShadowRoot;
    #useHipNumbers: HTMLInputElement = null!;
    #useCustomHipNumbers: HTMLInputElement = null!;
    #showFullPedigrees: HTMLInputElement = null!;
    #pages: HTMLElement = null!;

    constructor() {
        super();
        this.#root = this.attachShadow({ mode: 'closed' });
    }

    connectedCallback(): void {
        for (const stylesheet of [
            '/public/fonts/MaterialSymbolsOutlined.css',
            '/public/style/theme.css',
            '/public/style/common.css',
        ].map(file => {
            if (window?.chrome?.runtime?.getURL != null)
                return window.chrome.runtime.getURL(file);

            try {
                return new URL(file, import.meta.url).toString();
            } catch (e: any) {
                if (e.message === `Cannot use 'import.meta' outside a module`)
                    return file;

                throw e;
            }
        })) {
            const link = document.createElement('link');
            link.setAttribute('rel', 'stylesheet');
            link.setAttribute('href', stylesheet);
            this.#root.append(link);
        }

        const style = document.createElement('style');
        this.#root.append(style);

        style.textContent = `
            * {
                box-sizing: border-box;
                font-family: inherit;
                font-size: inherit;
            }

            button {
                align-items: center;
                background: color-mix(in hsl, var(--hn-plus-theme-primary) 90%, #ffffff);
                border: none;
                border-radius: 0.3em;
                color: #ffffff;
                cursor: pointer;
                display: inline-flex;
                gap: 0.3em;
                padding: 0.5em 1em;
            }

            button:is(:hover, :focus) {
                background: color-mix(in hsl, var(--hn-plus-theme-primary) 87%, #ffffff);
            }

            button:active {
                background: color-mix(in hsl, var(--hn-plus-theme-primary) 93%, #ffffff);
            }

            input,
            select {
                border: thin solid var(--border-color);
                border-radius: 0.3em;
                padding: 0.5em;
            }

            input {
                padding: 0.584em;
            }

            input[type="number" i]::-webkit-outer-spin-button,
            input[type="number" i]::-webkit-inner-spin-button {
                -webkit-appearance: none;
                margin: 0;
            }

            input[type="number" i] {
                -moz-appearance: textfield;
                appearance: textfield;
            }

            input:is([type="checkbox" i], [type="radio" i])[role="toggle" i] {
                --transition-speed: 400ms;
                align-items: center;
                appearance: none;
                aspect-ratio: 2 / 1;
                background-color: color-mix(in hsl, var(--hn-plus-theme-primary) 25%, #ffffff);
                border-radius: 2em;
                color: #ffffff;
                cursor: pointer;
                display: inline-flex;
                font-size: 0.9em;
                height: 2.5em;
                padding: 4px;
                transition: var(--transition-speed) ease;
            }

            input:is([type="checkbox" i], [type="radio" i])[role="toggle" i]:before {
                aspect-ratio: 1 / 1;
                background-color: currentColor;
                border-radius: 50%;
                content: "";
                height: 100%;
                left: 0;
                position: relative;
                transition: var(--transition-speed) ease;
            }

            input:is([type="checkbox" i], [type="radio" i])[role="toggle" i]:checked {
                background-color: var(--hn-plus-theme-secondary);
            }

            input:is([type="checkbox" i], [type="radio" i])[role="toggle" i]:checked:before {
                left: 100%;
                transform: translate(-100%);
            }

            input:is([type="checkbox" i], [type="radio" i])[role="toggle" i][data-initializing] {
                --transition-speed: 0ms;
            }

            :is(button, input, input:is([type="checkbox" i], [type="radio" i])[role="toggle" i], select):disabled {
                background: #e7e7e7;
                color: #f7f7f7;
                cursor: default;
            }

            input:disabled::placeholder {
                color: inherit;
            }

            form {
                align-content: flex-start;
                display: grid;
                flex: 1;
                gap: 1em;
                grid-template-columns: minmax(0, 1fr) minmax(0, 0.65fr);
                height: 100%;
                overflow: hidden;
            }

            #create-button {
                align-self: flex-start;
                grid-column: 2;
                grid-row: 1 / span 2;
            }

            .input-row {
                align-items: center;
                display: grid;
                gap: 1em;
                grid-template-columns: 12em 1fr;
                justify-content: flex-start;
            }

            .input-row input:is([type="checkbox" i], [type="radio" i])[role="toggle" i] {
                justify-self: flex-start;
                width: auto;
            }

            #add-button {
                all: unset;
                align-self: flex-end;
                color: #00aa00;
                cursor: pointer;
                font-size: 0.85em;
                grid-column: 2;
                margin-bottom: -0.5em;
                margin-left: auto;
                margin-right: 1em;
                margin-top: -0.5em;
            }

            #pedigree-pages {
                align-items: center;
                display: grid;
                gap: 0.5em;
                grid-column: 1 / span 2;
                grid-template-columns: [hip-number] minmax(0, 0.5fr) [horse-id] minmax(0, 1fr) [remove-button] auto;
                max-height: 100%;
                overflow-x: hidden;
                overflow-y: auto;
                padding-bottom: 1em;
                scrollbar-gutter: stable;
                scrollbar-width: thin;
            }

            #pedigree-pages .pedigree-page {
                display: contents;
            }

            #pedigree-pages .pedigree-page input[name="hipNumber" i] {
                grid-column: hip-number;
            }

            #pedigree-pages .pedigree-page :is(input, select)[name="horseId" i] {
                grid-column: horse-id;
            }

            #pedigree-pages .pedigree-page .remove-button {
                all: unset;
                color: #aa0000;
                cursor: pointer;
                grid-column: remove-button;
                font-size: 0.85em;
            }

            :is(#add-button, #pedigree-pages .pedigree-page .remove-button):is([disabled], :disabled) {
                color: #e7e7e7;
                cursor: default;
            }

            form:not(:has(input[name="useHipNumbers" i]:checked)) {
                align-items: flex-start;
            }

            form:not(:has(input[name="useHipNumbers" i]:checked)) input[name="hipNumber" i] {
                display: none;
            }
        `;

        const form = document.createElement('form');
        form.setAttribute('method', 'dialog');
        this.#root.append(form);

        const createButton = document.createElement('button');
        createButton.setAttribute('id', 'create-button');
        createButton.setAttribute('type', 'submit');
        form.append(createButton);

        const createButtonIcon = document.createElement('span');
        createButtonIcon.classList.add('material-symbols-outlined');
        createButtonIcon.textContent = 'build';
        createButton.append(createButtonIcon);
        createButton.innerHTML += ' Create Catalog';

        let row = document.createElement('div');
        row.classList.add('input-row', 'show-hip-numbers');
        form.append(row);

        let label = document.createElement('strong');
        label.textContent = 'Include Hip Numbers';
        row.append(label);

        this.#useHipNumbers = document.createElement('input');
        this.#useHipNumbers.setAttribute('name', 'useHipNumbers');
        this.#useHipNumbers.setAttribute('role', 'toggle');
        this.#useHipNumbers.setAttribute('type', 'checkbox');
        row.append(this.#useHipNumbers);

        row = document.createElement('div');
        row.classList.add('input-row', 'custom-hip-numbers');
        form.append(row);

        label = document.createElement('strong');
        label.textContent = 'Use Custom Hip Numbers';
        row.append(label);

        this.#useCustomHipNumbers = document.createElement('input');
        this.#useCustomHipNumbers.setAttribute('name', 'useCustomHipNumbers');
        this.#useCustomHipNumbers.setAttribute('role', 'toggle');
        this.#useCustomHipNumbers.setAttribute('type', 'checkbox');
        this.#useCustomHipNumbers.toggleAttribute('disabled', true);
        row.append(this.#useCustomHipNumbers);

        row = document.createElement('div');
        row.classList.add('input-row', 'full-pedigree');
        form.append(row);

        label = document.createElement('strong');
        label.textContent = 'Show Full Pedigrees';
        row.append(label);

        this.#showFullPedigrees = document.createElement('input');
        this.#showFullPedigrees.setAttribute('name', 'showFullPedigrees');
        this.#showFullPedigrees.setAttribute('role', 'toggle');
        this.#showFullPedigrees.setAttribute('type', 'checkbox');
        row.append(this.#showFullPedigrees);

        const addButton = document.createElement('button');
        addButton.setAttribute('id', 'add-button');
        addButton.setAttribute('title', 'Add New Row');
        addButton.setAttribute('type', 'button');
        form.append(addButton);

        const addButtonIcon = document.createElement('span');
        addButtonIcon.classList.add('material-symbols-outlined');
        addButtonIcon.textContent = 'add';
        addButton.append(addButtonIcon);

        this.#pages = document.createElement('section');
        this.#pages.setAttribute('id', 'pedigree-pages');
        form.append(this.#pages);

        form.addEventListener('submit', this.#handleSubmit.bind(this));
        this.#useHipNumbers.addEventListener('change', this.#handleToggleUseHipNumbers.bind(this));
        this.#useCustomHipNumbers.addEventListener('change', this.#handleToggleCustomUseHipNumbers.bind(this));
        addButton.addEventListener('click', this.addRow.bind(this));
        this.addRow();

        if (this.hasAttribute('disabled') === true)
            this.#disableAll();
    }

    attributeChangedCallback(name: string, oldValue: any, newValue: any): void {
        switch (name) {
            case 'disabled':
                this.disabled = (newValue != null);
                break;

            case 'options':
                this.removeAttribute('options');
                this.options = newValue == null ? undefined : JSON.parse(newValue);
                break;
        }
    }

    addRow(): void {
        const row = document.createElement('div');
        row.classList.add('pedigree-page');
        this.#pages.append(row);

        const hipNumber = document.createElement('input');
        hipNumber.setAttribute('name', 'hipNumber');
        hipNumber.setAttribute('placeholder', 'Hip #');
        hipNumber.toggleAttribute('readonly', !this.#useCustomHipNumbers!.checked);
        hipNumber.toggleAttribute('required', true);
        hipNumber.setAttribute('type', 'number');
        hipNumber.setAttribute('value', this.#getNextHipNumber());
        row.append(hipNumber);

        const horseId = this.#createHorseIdInput();
        row.append(horseId);

        const removeButton = document.createElement('button');
        removeButton.classList.add('remove-button');
        removeButton.setAttribute('title', 'Remove Row');
        removeButton.setAttribute('type', 'button');
        row.append(removeButton);

        const removeIcon = document.createElement('span');
        removeIcon.classList.add('material-symbols-outlined');
        removeIcon.innerHTML = 'do_not_disturb_on';
        removeButton.append(removeIcon);

        hipNumber.addEventListener('paste', this.#handlePaste.bind(this));
        removeButton.addEventListener('click', () => this.removeRow(row));
    }

    removeRow(row: HTMLDivElement): void {
        this.#pages.removeChild(row);

        if (this.#pages.children.length < 1)
            this.addRow();
    }

    reset(): void {
        while (this.#pages.children.length > 0)
            this.#pages.removeChild(this.#pages.firstChild!);

        this.addRow();
    }

    #createHorseIdInput(): HTMLInputElement | HTMLSelectElement {
        let horseId: HTMLSelectElement | HTMLInputElement;

        if (Array.isArray(this.options)) {
            horseId = document.createElement('select');
            horseId.setAttribute('name', 'horseId');
            horseId.setAttribute('placeholder', 'Horse ID');
            horseId.toggleAttribute('required', true);

            this.options.forEach(([id, name]) => {
                const option = document.createElement('option');
                option.setAttribute('value', id.toString());
                option.textContent = name;
                horseId.append(option);
            });

            horseId.value = '';
        } else {
            horseId = document.createElement('input');
            horseId.setAttribute('name', 'horseId');
            horseId.setAttribute('placeholder', 'Horse ID');
            horseId.toggleAttribute('required', true);
            horseId.setAttribute('type', 'number');
            horseId.addEventListener('paste', this.#handlePaste.bind(this));
        }

        return horseId;
    }

    #disableAll(): void {
        this.#root.querySelectorAll<HTMLButtonElement | HTMLInputElement>('button, input, select').forEach(el => el.disabled = true);
    }

    #enableAll(): void {
        this.#root.querySelectorAll<HTMLButtonElement | HTMLInputElement>('button, input, select').forEach(el => el.disabled = false);
        this.#useCustomHipNumbers.checked = this.#useHipNumbers.checked && this.#useCustomHipNumbers.checked;
        this.#useCustomHipNumbers.disabled = !this.#useHipNumbers.checked;
    }

    #getNextHipNumber(): string {
        return Number(1 + Math.max(0, ...Array.from(this.#root.querySelectorAll<HTMLInputElement>('input[name="hipNumber"]')).map(input => parseInt(input.value) || 0))).toString();
    }

    #handlePaste(e: ClipboardEvent): void {
        e.preventDefault();

        const data = e.clipboardData?.getData('text')?.split(/[\r\n]+/).filter(r => r.trim()).map(r => r.split(/\s*,\s*/).map(p => p.trim()).reverse()) ?? [];

        const row = (<HTMLInputElement>e.target).closest<HTMLDivElement>('.pedigree-page')!;
        const index = Array.from(this.#pages.children).indexOf(row);
        const useCustomHipNumbers = this.#useCustomHipNumbers!.checked;

        while (this.#pages.children.length < index + data.length)
            this.addRow();

        for (let i = index; i < this.#pages.children.length; i++) {
            let [horseId, hipNumber] = data[i - index]
            hipNumber = hipNumber ?? this.#pages.children[i].querySelector<HTMLInputElement>('[name="hipNumber"]')!.value;

            this.#pages.children[i].querySelector<HTMLInputElement>('[name="horseId"]')!.value = horseId;

            if (useCustomHipNumbers)
                this.#pages.children[i].querySelector<HTMLInputElement>('[name="hipNumber"]')!.value = hipNumber;
            else
                this.#pages.children[i].querySelector<HTMLInputElement>('[name="hipNumber"]')!.dataset.customHipNumber = hipNumber;
        }
    }

    #handleSubmit(e: SubmitEvent): void {
        e.preventDefault();
        e.stopPropagation();

        const form = <HTMLFormElement>e.target;
        const useHipNumbers = (<HTMLInputElement>form.elements.namedItem('useHipNumbers'))!.checked;
        const useCustomHipNumbers = (<HTMLInputElement>form.elements.namedItem('useCustomHipNumbers'))!.checked;
        const fullPedigree = (<HTMLInputElement>form.elements.namedItem('showFullPedigrees'))!.checked;

        this.dispatchEvent(new CustomEvent<HNPlusCatalogData>('submit', {
            detail: {
                data: Array.from(form.querySelectorAll<HTMLInputElement>('[name="horseId"]')).map((input, index) =>
                    !useHipNumbers
                        ? parseInt(input.value)
                        : [
                            parseInt(input.value),
                            !useCustomHipNumbers
                                ? index + 1
                                : input.parentElement!.querySelector<HTMLInputElement>('[name="hipNumber"]')!.value
                        ]
                ),
                showHipNumbers: useHipNumbers,
                fullPedigrees: fullPedigree,
            }
        }));
    }

    #handleToggleCustomUseHipNumbers(e: Event): void {
        const enabled = (<HTMLInputElement>e.target).checked;

        this.#root.querySelectorAll<HTMLInputElement>('input[name="hipNumber"]').forEach((input, index) => {
            input.readOnly = !enabled;

            if (!enabled) {
                input.dataset.customHipNumber = input.value;
                input.value = `${index + 1}`;
            } else {
                input.value = input.dataset.customHipNumber ?? input.value;
                delete input.dataset.customHipNumber;
            }
        });
    }

    #handleToggleUseHipNumbers(): void {
        this.#useCustomHipNumbers!.disabled = !this.#useHipNumbers!.checked;
    }

    #updateRows(): void {
        this.#root.querySelectorAll('.pedigree-page').forEach((row) => {
            const oldHorseId = row.querySelector<HTMLInputElement | HTMLSelectElement>('[name="horseId"]')!
            const horseId = this.#createHorseIdInput();
            horseId.value = oldHorseId.value;
            oldHorseId.replaceWith(horseId);
        });
    }
}

if (customElements?.get('hn-plus-catalog-creator') == null)
    customElements?.define('hn-plus-catalog-creator', HNPlusCatalogCreatorElement);