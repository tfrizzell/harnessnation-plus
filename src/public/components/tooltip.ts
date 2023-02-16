class HNPlusTooltipElement extends HTMLElement {
    static #style: HTMLStyleElement;

    static #initStyle(): void {
        HNPlusTooltipElement.#style ||= document.createElement('style');

        HNPlusTooltipElement.#style.textContent ||= `
            hn-plus-tooltip, hn-plus-tooltip * {
                all: revert;
                box-sizing: border-box;
                margin: 0;
                padding: 0;
            }
            hn-plus-tooltip {
                cursor: default;
                display: inline-block;
                position: relative;
            }
            hn-plus-tooltip .hn-plus-icon {
                color: var(--hn-plus-theme-secondary, #406e8e);
                font-size: 24px;
                font-style: normal;
            }
            hn-plus-tooltip .hn-plus-tooltip {
                background: #ffffff;
                border: 1px solid var(--hn-plus-theme-primary, #23395b);
                border-radius: 5px;
                box-shadow: 0 0 5px 0 #4f4f4f;
                color: var(--hn-plus-theme-primary, #23395b);
                display: none;
                flex-direction: column;
                left: 12px;
                max-width: 320px;
                min-width: 256px;
                padding: 0.4em 0.8em;
                position: absolute;
                row-gap: 0.67em;
                top: 100%;
                transition: 400ms ease;
                transform: translate(-50%, 0.25rem);
                white-space: initial !important;
                z-index: 2;
            }
            hn-plus-tooltip .hn-plus-tooltip:after {
                border-color: transparent;
                border-style: solid;
                border-width: 1rem;
                border-bottom-color: var(--hn-plus-theme-primary, #23395b);
                bottom: 100%;
                content: "";
                position: absolute;
                left: 50%;
                transform: translateX(-50%);
            }
            hn-plus-tooltip .hn-plus-icon:hover + .hn-plus-tooltip,
            hn-plus-tooltip .hn-plus-tooltip:hover {
                display: flex;
            }
            hn-plus-tooltip .hn-plus-tooltip ul {
                margin-left: 2em;
            }
            hn-plus-tooltip .hn-plus-tooltip ul > li + li {
                margin-top: 1em;
            }
        `.trim();

        HNPlusTooltipElement.#injectStyle();
    }

    static #injectStyle(): void {
        if (HNPlusTooltipElement.#style.isConnected)
            return;

        const ref: HTMLElement | null = document.head.querySelector('link[rel="stylesheet"], style');

        if (ref != null)
            document.head.insertBefore(HNPlusTooltipElement.#style, ref);
        else
            document.head.append(HNPlusTooltipElement.#style);
    }

    #icon: HTMLElement;
    #tooltip: HTMLDivElement;

    constructor() {
        super();
        HNPlusTooltipElement.#initStyle();

        this.#icon ??= document.createElement('i');
        this.#icon.classList.add('hn-plus-icon');
        this.#icon.innerHTML = '&#x1f6c8;';

        this.#tooltip ??= document.createElement('div');
        this.#tooltip.classList.add('hn-plus-tooltip');
        this.#tooltip.innerHTML = this.innerHTML;
    }

    connectedCallback(): void {
        HNPlusTooltipElement.#injectStyle();

        this.#tooltip.innerHTML = this.innerHTML;
        this.innerHTML = '';
        this.append(this.#icon, this.#tooltip);
    }

    disconnectedCallback(): void {
        const html = this.#tooltip.innerHTML;
        this.#tooltip.remove();
        this.#icon.remove();
        this.innerHTML = html;
    }
}

customElements.define('hn-plus-tooltip', HNPlusTooltipElement);