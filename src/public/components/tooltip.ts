class HNPlusTooltipElement extends HTMLElement {
    #root: ShadowRoot;

    constructor() {
        super();
        this.#root = this.attachShadow({ mode: 'closed' });
    }

    connectedCallback(): void {
        const style: HTMLStyleElement = document.createElement('style');
        style.textContent = `
        :host, *:not(svg):not(svg *) {
            all: revert;
        }

        :host {
            cursor: default;
            display: inline-block;
            position: relative;
        }

        :host, * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        .hn-plus-icon {
            color: var(--hn-plus-theme-primary);
            font-size: 24px;
            font-style: normal;
        }

        .hn-plus-icon svg {
            vertical-align: middle;
        }

        .hn-plus-tooltip {
            background: #ffffff;
            border: 1px solid var(--hn-plus-theme-primary);
            border-radius: 5px;
            box-shadow: 0 0 5px 0 #4f4f4f;
            color: var(--hn-plus-theme-primary);
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
            border-bottom-color: var(--hn-plus-theme-primary);
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
        icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 -960 960 960" width="1em" fill="currentColor"><path d="M440-280h80v-240h-80v240Zm40-320q17 0 28.5-11.5T520-640q0-17-11.5-28.5T480-680q-17 0-28.5 11.5T440-640q0 17 11.5 28.5T480-600Zm0 520q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/></svg>';

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

if (customElements?.get('hn-plus-tooltip') == null)
    customElements?.define('hn-plus-tooltip', HNPlusTooltipElement);