export const Formula = Object.freeze({
    Apex: 'FORMULA_APEX',
    Ridge: 'FORMULA_RIDGE',
});

export const FORMULA_APEX = Formula.Apex;
export const FORMULA_RIDGE = Formula.Ridge;

export const Mode = Object.freeze({
    Default: 0,
    Custom: 1,
});

export const MODE_DEFAULT = Mode.Default;
export const MODE_CUSTOM = Mode.Custom;

Object.defineProperties(window, {
    Formula: {
        configurable: true,
        enumerable: true,
        value: Formula,
        writable: false,
    },
    FORMULA_APEX: {
        configurable: true,
        enumerable: true,
        value: FORMULA_APEX,
        writable: false,
    },
    FORMULA_RIDGE: {
        configurable: true,
        enumerable: true,
        value: FORMULA_RIDGE,
        writable: false,
    },

    Mode: {
        configurable: true,
        enumerable: true,
        value: Mode,
        writable: false,
    },
    MODE_DEFAULT: {
        configurable: true,
        enumerable: true,
        value: MODE_DEFAULT,
        writable: false,
    },
    MODE_CUSTOM: {
        configurable: true,
        enumerable: true,
        value: MODE_CUSTOM,
        writable: false,
    },
});
