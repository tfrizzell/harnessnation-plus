const style = document.createElement('style');
style.textContent = `
    hn-plus-tooltip, hn-plus-tooltip * {
        all: revert;
        box-sizing: border-box;
        margin: 0;
        padding: 0;
    }

    hn-plus-tooltip {
        display: inline-block;
        position: relative;
    }

    hn-plus-tooltip .hn-plus-icon {
        color: var(--theme-secondary, #406e8e);
        font-size: 24px;
        font-style: normal;
    }

    hn-plus-tooltip .hn-plus-tooltip {
        background: #ffffff;
        border: 1px solid var(--theme-primary, #23395b);
        border-radius: 5px;
        box-shadow: 0 0 5px 0 #4f4f4f;
        color: var(--theme-primary, #23395b);
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
        z-index: 2;
    }

    hn-plus-tooltip .hn-plus-tooltip:after {
        border-color: transparent;
        border-style: solid;
        border-width: 1rem;
        border-bottom-color: var(--theme-primary, #23395b);
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

class Tooltip extends HTMLElement {
    #icon = null;
    #tooltip = null;

    connectedCallback() {
        this.#icon = document.createElement('i');
        this.#icon.classList.add('hn-plus-icon');
        this.#icon.innerHTML = '&#x1f6c8;';

        this.#tooltip = document.createElement('div');
        this.#tooltip.classList.add('hn-plus-tooltip');
        this.#tooltip.innerHTML = this.innerHTML;

        this.innerHTML = '';
        this.append(this.#icon);
        this.append(this.#tooltip);

        if (!style.isConnected)
            document.head.append(style);
    }

    disconnectedCallback() {
        const html = this.#tooltip.innerHTML;
        this.#tooltip.remove();
        this.#icon.remove();
        this.innerHTML = html;
    }
}

customElements.define('hn-plus-tooltip', Tooltip);