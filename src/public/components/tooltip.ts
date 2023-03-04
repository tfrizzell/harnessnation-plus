class HNPlusTooltipElement extends HTMLElement {
    #root: ShadowRoot;

    constructor() {
        super();
        this.#root = this.attachShadow({ mode: 'closed' });
    }

    connectedCallback(): void {
        const style: HTMLStyleElement = document.createElement('style');
        style.textContent = `
            :host, * {
                all: revert;
                box-sizing: border-box;
                margin: 0;
                padding: 0;
            }

            :host {
                cursor: default;
                display: inline-block;
                position: relative;
            }

            .hn-plus-icon {
                color: var(--hn-plus-theme-secondary, #406e8e);
                font-size: 24px;
                font-style: normal;
            }

            .hn-plus-tooltip {
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

            .hn-plus-tooltip:after {
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

            .hn-plus-icon:hover + .hn-plus-tooltip,
            .hn-plus-tooltip:hover {
                display: flex;
            }

            .hn-plus-tooltip ul {
                margin-left: 2em;
            }

            .hn-plus-tooltip ul > li + li {
                margin-top: 1em;
            }
        `.trim().replace(/^ {8}/g, '$1');

        const icon: HTMLElement = document.createElement('i');
        icon.classList.add('hn-plus-icon');
        icon.innerHTML = '&#x1f6c8;';

        const tooltip: HTMLDivElement = document.createElement('div');
        tooltip.classList.add('hn-plus-tooltip');
        tooltip.innerHTML = this.innerHTML;

        this.innerHTML = '';
        this.#root.append(style, icon, tooltip);
    }

    disconnectedCallback(): void {
        const html = this.#root.querySelector('.hn-plus-tooltip')?.innerHTML ?? '';
        this.#root.innerHTML = '';
        this.innerHTML = html;
    }
}

customElements.define('hn-plus-tooltip', HNPlusTooltipElement);