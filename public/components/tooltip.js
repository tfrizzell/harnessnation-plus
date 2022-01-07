const style = document.createElement('style');
style.textContent = `
    plus-tooltip, plus-tooltip * {
        all: revert;
        box-sizing: border-box;
        margin: 0;
        padding: 0;
    }

    plus-tooltip {
        display: inline-block;
        position: relative;
    }

    plus-tooltip .icon {
        color: var(--theme-secondary, #406e8e);
        font-size: 24px;
        font-style: normal;
    }

    plus-tooltip .tooltip {
        background: #ffffff;
        border: 1px solid var(--theme-primary, #23395b);
        border-radius: 5px;
        box-shadow: 0 0 5px 0 #4f4f4f;
        color: var(--theme-primary, #23395b);
        display: none;
        flex-direction: column;
        left: 12px;
        padding: 0.4em 0.8em;
        position: absolute;
        row-gap: 0.67em;
        top: 100%;
        transition: 400ms ease;
        transform: translate(-50%, 0.25rem);
        width: 256px;
        z-index: 2;
    }

    plus-tooltip .tooltip:after {
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

    plus-tooltip .icon:hover + .tooltip,
    plus-tooltip .tooltip:hover {
        display: flex;
    }

    plus-tooltip .tooltip ul {
        margin-left: 2em;
    }

    plus-tooltip .tooltip ul > li + li {
        margin-top: 1em;
    }
`;

class Tooltip extends HTMLElement {
    constructor() {
        super();

        const icon = document.createElement('i');
        icon.classList.add('icon');
        icon.innerHTML = '&#x1f6c8;';

        const tooltip = document.createElement('div');
        tooltip.classList.add('tooltip');
        tooltip.innerHTML = this.innerHTML;

        this.innerHTML = '';
        this.appendChild(icon);
        this.appendChild(tooltip);

        if (!style.isConnected)
            document.head.appendChild(style);
    }
}

customElements.define('plus-tooltip', Tooltip);