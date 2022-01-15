const style = document.createElement('style');
style.textContent = `
    hn-plus-loader, hn-plus-loader * {
        all: revert;
        box-sizing: border-box;
        margin: 0;
        padding: 0;
    }

    hn-plus-loader {
        --loader-progress: 0%;
        align-items: center;
        background: rgb(0, 0, 0, 0.6);
        display: flex;
        height: 100%;
        justify-content: center;
        left: 0;
        position: fixed;
        top: 0;
        width: 100%;
        z-index: 3
    }

    hn-plus-loader:before  {
        background: linear-gradient(to top, #cbf7ed 0%, #cbf7ed var(--loader-progress, 0%), #23395b var(--loader-progress, 0%));
        -webkit-background-clip: text;
        color: #23395b;
        content: 'HN+';
        font-family: 'Noto Sans Bold', sans-serif;
        font-size: 100px;
        font-style: italic;
        font-weight: bold;
        -webkit-text-fill-color: transparent;
    }
`.trim();

class Loader extends HTMLElement {
    static get observedAttributes() {
        return ['ppp'];
    }

    get progress() {
        console.log('get', this.#prog);
        return this.#prog;
    }

    set progress(value) {
        this.#prog = /\d/.test(value) && !Number.isNaN(value) ? +value : null;
console.log('>', value, this.#prog);
        this.#prog == null
            ? this.style.removeProperty('--loader-progress')
            : this.style.setProperty('--loader-progress', `${this.#prog}%`);
    }

    #prog = null;

    connectedCallback() {
        // this.progress = this.getAttribute('ppp');

        if (!style.isConnected)
            document.body.append(style);
    }

    attributeChangedCallback(name, _, newValue) {
        this[name] = newValue;
    }

    disconnectedCallback() {
        console.log('disconnect');
    }
}

customElements.define('hn-plus-loader', Loader);