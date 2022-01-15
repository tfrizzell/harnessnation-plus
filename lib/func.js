export function parseCurrency(earnings) {
    const numVal = parseFloat(earnings?.toString?.().replace(/[^\d.]+/g, ''));
    return Number.isNaN(numVal) ? earnings : numVal;
}

Object.defineProperties(window, {
    parseCurrency: {
        configurable: true,
        enumerable: true,
        value: parseCurrency,
        writable: false,
    }
});
