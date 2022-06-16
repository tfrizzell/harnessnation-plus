import { DataTablesMode } from '../../lib/data-tables.js';
import { DataTablesDisplayUnits, DataTablesSettings } from '../../lib/settings.js';

declare type StateDurationMode = {
    value: DataTablesMode;
    name: string;
    default?: boolean;
}

declare type StateDurationUnit = {
    value: DataTablesDisplayUnits;
    name: string;
    default?: boolean;
}

const modes: StateDurationMode[] = [
    { value: DataTablesMode.Default, name: 'Site Default', default: true },
    { value: DataTablesMode.Custom, name: 'Custom' },
];

const units: StateDurationUnit[] = [
    { value: DataTablesDisplayUnits.Minutes, name: 'Minute(s)' },
    { value: DataTablesDisplayUnits.Hours, name: 'Hour(s)' },
    { value: DataTablesDisplayUnits.Days, name: 'Day(s)', default: true },
    { value: DataTablesDisplayUnits.Weeks, name: 'Week(s)' },
    { value: DataTablesDisplayUnits.Years, name: 'Year(s)' },
];

export class HNPlusStateDurationElement extends HTMLElement {
    static #style: HTMLStyleElement;

    static get observedAttributes(): string[] {
        return ['name', 'value'];
    }

    static #initStyle(): void {
        HNPlusStateDurationElement.#style ||= document.createElement('style');

        HNPlusStateDurationElement.#style.textContent ||= `
            :host {
                all: revert;
                column-gap: 0.75em;
                display: inline-flex;
            }
        `.trim();
    }

    name: string | null = this.getAttribute('name');

    get value(): DataTablesSettings {
        return this.#value;
    }

    set value(value: DataTablesSettings | string) {
        this.#setValue(value);
    }

    #root: ShadowRoot;
    #value: DataTablesSettings;

    #modeInput: HTMLSelectElement;
    #unitsInput: HTMLSelectElement | null = null;
    #valueInput: HTMLInputElement | null = null;

    constructor() {
        super();
        HNPlusStateDurationElement.#initStyle();

        this.#value = JSON.parse(this.getAttribute('value') ?? '{}');
        this.#root = this.attachShadow({ mode: 'closed' });

        this.#modeInput = document.createElement('select');
        this.#modeInput.setAttribute('role', 'mode');
        this.#modeInput.toggleAttribute('required');

        for (const opt of modes) {
            const option = document.createElement('option');
            option.setAttribute('value', opt.value.toString());
            option.innerHTML = opt.name;
            this.#modeInput.append(option);

            if (opt.default)
                option.toggleAttribute('selected');
        }

        this.#modeInput.addEventListener('input', (): void => {
            this.#setValue({
                ...this.#value,
                mode: parseInt(this.#modeInput.value) as DataTablesMode
            });

            this.dispatchEvent(new Event('change'));
        });
    }

    connectedCallback(): void {
        this.#root.append(
            ...<Node[]>[].map.call(document.head.querySelectorAll<HTMLLinkElement>('link'), (link: HTMLLinkElement): Node => link.cloneNode()),
            HNPlusStateDurationElement.#style.cloneNode(true),
            this.#modeInput
        );
    }

    attributeChangedCallback(name: string, _oldValue: string, newValue: string): void {
        (this as any)[name] = newValue;
    }

    #setValue(value: DataTablesSettings | string) {
        const _value = this.#value;

        if (typeof value === 'string')
            this.#value = JSON.parse(value);
        else if (typeof value === 'object' && value != null)
            this.#value = value;
        else
            return;

        if (_value.mode !== this.#value.mode)
            this.#value.mode ? this.#renderCustom() : this.#unrenderCustom();

        const unit: StateDurationUnit = units.find((unit: StateDurationUnit): boolean => unit.value === this.#value.displayUnits) ?? units.find(unit => unit.default)!;
        this.#modeInput.value = this.#value.mode.toString();
        this.#valueInput && (this.#valueInput.value = ((this.#value.duration / unit.value) ?? 1).toString())
        this.#unitsInput && (this.#unitsInput.value = unit.value.toString());
    }

    #renderCustom() {
        this.#valueInput = document.createElement('input');
        this.#valueInput.setAttribute('pattern', '^\\d+(\\.\\d+)?$');
        this.#valueInput.setAttribute('role', 'value');
        this.#valueInput.setAttribute('type', 'text');
        this.#valueInput.toggleAttribute('required');

        this.#valueInput.addEventListener('input', (): void => {
            const unit: StateDurationUnit = units.find((unit: StateDurationUnit): boolean => unit.value === this.#value.displayUnits) ?? units.find(unit => unit.default)!;

            this.#setValue({
                ...this.#value,
                duration: parseInt(this.#valueInput!.value) * unit.value,
            });

            this.dispatchEvent(new Event('change'));
        });

        this.#unitsInput = document.createElement('select');
        this.#unitsInput.setAttribute('role', 'units');
        this.#unitsInput.toggleAttribute('required');

        for (const opt of units) {
            const option = document.createElement('option');
            option.setAttribute('value', opt.value.toString());
            option.innerHTML = opt.name;
            this.#unitsInput.append(option);

            if (opt.default)
                option.toggleAttribute('selected');
        }

        this.#unitsInput.addEventListener('input', (): void => {
            const oldUnit: StateDurationUnit = units.find((unit: StateDurationUnit): boolean => unit.value === this.#value.displayUnits) ?? units.find((unit: StateDurationUnit): boolean => unit.default == true)!;
            const newUnit: StateDurationUnit = units.find((unit: StateDurationUnit): boolean => unit.value.toString() === this.#unitsInput!.value)!;

            this.#setValue({
                ...this.#value,
                displayUnits: newUnit.value,
                duration: this.#value.duration * newUnit.value / oldUnit.value,
            });

            this.dispatchEvent(new Event('change'));
        });

        this.#root.append(this.#valueInput, this.#unitsInput);
    }

    #unrenderCustom(): void {
        this.#valueInput?.remove();
        this.#valueInput = null;

        this.#unitsInput?.remove();
        this.#unitsInput = null;
    }
}

customElements.define('hn-plus-state-duration', HNPlusStateDurationElement);