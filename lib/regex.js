export class Regex {
    constructor() {
        throw new Error(`${Regex.name} is static and cannot be instantiated`);
    }

    static escape(value) {
        return value?.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}

Object.defineProperties(window, {
    Regex: {
        configurable: true,
        enumerable: true,
        value: Regex,
        writable: false,
    },
});
