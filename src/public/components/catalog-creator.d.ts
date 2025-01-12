export interface HNPlusCatalogData {
    readonly data: (number | [number, string | number])[];
    readonly showHipNumbers: boolean;
}

export interface HNPlusCatalogCreatorCustomEventMap {
    'submit': CustomEvent<HNPlusCatalogData>;
}

export interface HNPlusCatalogCreatorElement extends HTMLElement {
    disabled: boolean;
    options?: [number, string][];

    addRow(): void;
    removeRow(row: HTMLDivElement): void;
    reset(): void;

    addEventListener<K extends keyof HNPlusCatalogCreatorCustomEventMap>(type: K, listener: (this: HNPlusCatalogCreatorElement, ev: HNPlusCatalogCreatorCustomEventMap[K]) => void): void;
    dispatchEvent<K extends keyof HNPlusCatalogCreatorCustomEventMap>(ev: HNPlusCatalogCreatorCustomEventMap[K]): any;
}