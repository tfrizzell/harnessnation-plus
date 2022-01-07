const style = document.createElement('style');
style.textContent = `
    .plus-toggle {
        --toggle-width: 3.6em;
        appearance: none;
        align-items: center;
        background-color: var(--theme-tertiary, #8ea8c3);
        border-radius: 1em;
        cursor: pointer;
        display: inline-flex;
        height: 1.8em;
        transition: .4s;
        width: var(--toggle-width);
    }

    .plus-toggle:before {
        background-color: var(--logo-color, #ffffff);
        border: none;
        border-radius: 50%;
        content: "";
        height: 1.2em;
        transition: .4s;
        transform: translateX(4px);
        width: 1.2em;
    }

    .plus-toggle:checked {
        background-color: var(--theme-secondary, #406e8e);
    }

    .plus-toggle:checked:before {
        transform: translateX(calc(var(--toggle-width) - 100% - 4px));
    }

    .plus-toggle:disabled {
        cursor: default;
        filter: grayscale(1);
        opacity: 0.5;
    }
`;

class Toggle extends HTMLInputElement {
    constructor() {
        super();
        if (this.type !== 'checkbox')
            return;

        this.classList.add('plus-toggle');

        if (!style.isConnected)
            document.head.appendChild(style);
    }
}

customElements.define('plus-toggle', Toggle, { extends: 'input' });