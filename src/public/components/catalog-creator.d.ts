export interface HNPlusCatalogData {
    readonly data: Array<number | [number, string | number]>;
    readonly showHipNumbers: boolean;
    readonly fullPedigrees: boolean;
}

export interface HNPlusCatalogCreatorEvents {
    'submit': CustomEvent<HNPlusCatalogData>;
}

export interface HNPlusCatalogCreatorElement extends HTMLElement {
    disabled: boolean;
    options?: Array<[number, string]>;

    addRow(): void;
    removeRow(row: HTMLDivElement): void;
    reset(): void;

    addEventListener<K extends keyof HNPlusCatalogCreatorEvents>(
        type: K,
        listener: (this: HNPlusCatalogCreatorElement, ev: HNPlusCatalogCreatorEvents[K]) => void
    ): void;

    dispatchEvent(ev: HNPlusCatalogCreatorEvents[keyof HNPlusCatalogCreatorEvents]): boolean;
}