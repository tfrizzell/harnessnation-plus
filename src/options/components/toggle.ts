class HNPlusToggleElement extends HTMLInputElement {
    static #style: HTMLStyleElement;

    static #initStyle(): void {
        HNPlusToggleElement.#style ||= document.createElement('style');

        HNPlusToggleElement.#style.textContent ||= `
            .hn-plus-toggle {
                --toggle-width: 3.6em;
                appearance: none;
                align-items: center;
                background-color: var(--hn-plus-theme-tertiary, #8ea8c3);
                border-radius: 1em;
                cursor: pointer;
                display: inline-flex;
                height: 1.8em;
                transition: .4s;
                width: var(--toggle-width);
            }
            .hn-plus-toggle:before {
                background-color: var(--hn-plus-logo-color, #ffffff);
                border: none;
                border-radius: 50%;
                content: "";
                height: 1.2em;
                transition: .4s;
                transform: translateX(4px);
                width: 1.2em;
            }
            .hn-plus-toggle:checked {
                background-color: var(--hn-plus-theme-secondary, #406e8e);
            }
            .hn-plus-toggle:checked:before {
                transform: translateX(calc(var(--toggle-width) - 100% - 4px));
            }
            .hn-plus-toggle:disabled {
                cursor: default;
                filter: grayscale(1);
                opacity: 0.5;
            }
        `.trim();

        HNPlusToggleElement.#injectStyle();
    }

    static #injectStyle(): void {
        if (HNPlusToggleElement.#style.isConnected)
            return;

        const ref: HTMLElement | null = document.head.querySelector('link[rel="stylesheet"], style');

        if (ref != null)
            document.head.insertBefore(HNPlusToggleElement.#style, ref);
        else
            document.head.append(HNPlusToggleElement.#style);
    }

    constructor() {
        super();
        HNPlusToggleElement.#initStyle();
    }

    connectedCallback(): void {
        if (this.getAttribute('type') !== 'checkbox' && this.getAttribute('type') !== 'radio')
            throw new TypeError(`HNPlusToggle: Cannot bind to input type ${this.getAttribute('type')}`);

        HNPlusToggleElement.#injectStyle();
        this.classList.add('hn-plus-toggle');
    }

    disconnectedCallback(): void {
        this.classList.add('hn-plus-toggle');
    }
}

customElements.define('hn-plus-toggle', HNPlusToggleElement, { extends: 'input' });