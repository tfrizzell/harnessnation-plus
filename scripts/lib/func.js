Object.defineProperties(globalThis ?? self ?? window, {
    parseCurrency: {
        configurable: true,
        enumerable: true,
        value: function parseCurrency(earnings) {
            return parseFloat(earnings?.toString?.().replace(/[^\d.]+/g, ''));
        },
        writable: false,
    }
});
