const style = document.createElement('style');
style.textContent = `
    .hn-plus-toggle {
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

    .hn-plus-toggle:before {
        background-color: var(--logo-color, #ffffff);
        border: none;
        border-radius: 50%;
        content: "";
        height: 1.2em;
        transition: .4s;
        transform: translateX(4px);
        width: 1.2em;
    }

    .hn-plus-toggle:checked {
        background-color: var(--theme-secondary, #406e8e);
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

class Toggle extends HTMLInputElement {
    connectedCallback() {
        if (this.getAttribute('type') !== 'checkbox')
            throw new TypeError(`HNPlusToggle: Cannot bind to input type ${this.getAttribute('type')}`);

        this.classList.add('hn-plus-toggle');

        if (!style.isConnected)
            document.body.append(style);
    }

    disconnectedCallback() {
        this.classList.add('hn-plus-toggle');
    }
}

customElements.define('hn-plus-toggle', Toggle, { extends: 'input' });