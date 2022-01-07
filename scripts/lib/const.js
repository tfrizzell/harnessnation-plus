Object.defineProperties(globalThis ?? self ?? window, {
    FORMULA_APEX: {
        configurable: true,
        enumerable: true,
        value: 'FORMULA_APEX',
        writable: false,
    },
    FORMULA_RIDGE: {
        configurable: true,
        enumerable: true,
        value: 'FORMULA_RIDGE',
        writable: false,
    },

    MODE_DEFAULT: {
        configurable: true,
        enumerable: true,
        value: 0,
        writable: false,
    },
    MODE_CUSTOM: {
        configurable: true,
        enumerable: true,
        value: 1,
        writable: false,
    },
});
