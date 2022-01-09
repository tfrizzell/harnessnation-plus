const style = document.createElement('style');
style.textContent = `
    :host {
        all: revert;
        column-gap: 0.75em;
        display: inline-flex;
    }
`.trim();

const modeOptions = [
    { value: 0, name: 'Site Default', default: true },
    { value: 1, name: 'Custom' },
];

const unitOptions = [
    { value: 'MINUTES', name: 'Minute(s)', scalar: 60 },
    { value: 'HOURS', name: 'Hour(s)', scalar: 3600 },
    { value: 'DAYS', name: 'Day(s)', scalar: 86400, default: true },
    { value: 'WEEKS', name: 'Week(s)', scalar: 604800 },
    { value: 'YEARS', name: 'Year(s)', scalar: 31557600 },
];

class DTStateDuration extends HTMLElement {
    static get observedAttributes() {
        return ['name', 'value'];
    }

    name = this.getAttribute('name');

    get value() {
        return this.#value;
    }

    set value(value) {
        this.#setValue(value);
    }

    #shadow = this.attachShadow({ mode: 'closed' });
    #value = JSON.parse(this.getAttribute('value') ?? '{}');

    #modeInput = null;
    #unitsInput = null;
    #valueInput = null;

    connectedCallback() {
        for (const ps of document.head.querySelectorAll('link'))
            this.#shadow.append(ps.cloneNode());

        this.#shadow.append(style.cloneNode(true));

        this.#modeInput = document.createElement('select');
        this.#modeInput.setAttribute('role', 'mode');
        this.#modeInput.toggleAttribute('required');
        this.#shadow.append(this.#modeInput);

        for (const opt of modeOptions) {
            const option = document.createElement('option');
            option.setAttribute('value', opt.value);
            option.innerHTML = opt.name;
            this.#modeInput.append(option);

            if (opt.default)
                option.toggleAttribute('selected');
        }

        this.#modeInput.addEventListener('input', e => {
            this.#setValue({
                ...this.#value,
                mode: +e.target.value,
            });

            this.dispatchEvent(new Event('change'));
        });
    }

    attributeChangedCallback(name, _, newValue) {
        this[name] = newValue;
    }

    #setValue(value) {
        const _value = this.#value;

        if (typeof value === 'string')
            this.#value = JSON.parse(value);
        else if (typeof value === 'object' && value != null)
            this.#value = value;
        else
            return;

        if (_value.mode !== this.#value.mode)
            this.#value.mode ? this.#renderCustom() : this.#unrenderCustom();

        const unit = unitOptions.find(o => o.value === this.#value.displayUnits) ?? unitOptions.find(o => o.default);
        this.#modeInput.value = this.#value.mode;
        this.#valueInput && (this.#valueInput.value = (this.#value.duration / unit.scalar) ?? 1);
        this.#unitsInput && (this.#unitsInput.value = unit.value);
    }

    #renderCustom() {
        this.#valueInput = document.createElement('input');
        this.#valueInput.setAttribute('pattern', '^\\d+(\\.\\d+)?$');
        this.#valueInput.setAttribute('role', 'value');
        this.#valueInput.setAttribute('type', 'text');
        this.#valueInput.toggleAttribute('required');
        this.#shadow.append(this.#valueInput);

        this.#valueInput.addEventListener('input', e => {
            const unit = unitOptions.find(o => o.value === this.#value.displayUnits) ?? unitOptions.find(o => o.default);

            this.#setValue({
                ...this.#value,
                duration: +e.target.value * unit.scalar,
            });

            this.dispatchEvent(new Event('change'));
        });

        this.#unitsInput = document.createElement('select');
        this.#unitsInput.setAttribute('role', 'units');
        this.#unitsInput.toggleAttribute('required');
        this.#shadow.append(this.#unitsInput);

        this.#unitsInput.addEventListener('input', e => {
            const oldUnit = unitOptions.find(o => o.value === this.#value.displayUnits) ?? unitOptions.find(o => o.default);
            const newUnit = unitOptions.find(o => o.value === e.target.value);

            this.#setValue({
                ...this.#value,
                displayUnits: e.target.value,
                duration: this.#value.duration * newUnit.scalar / oldUnit.scalar,
            });

            this.dispatchEvent(new Event('change'));
        });

        for (const opt of unitOptions) {
            const option = document.createElement('option');
            option.setAttribute('value', opt.value);
            option.innerHTML = opt.name;
            this.#unitsInput.append(option);

            if (opt.default)
                option.toggleAttribute('selected');
        }
    }

    #unrenderCustom() {
        this.#valueInput?.remove();
        this.#valueInput = null;

        this.#unitsInput?.remove();
        this.#unitsInput = null;
    }
}

customElements.define('hn-plus-dt-state-duration', DTStateDuration);