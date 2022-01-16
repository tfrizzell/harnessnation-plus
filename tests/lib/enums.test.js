import '../../lib/enums.js';

describe(`Formula`, () => {
    test(`exists`, () => {
        expect(Formula).not.toBeUndefined();
        expect(window.Formula).not.toBeUndefined();
    });

    test(`Formula.Apex equals 'FORMULA_APEX'`, () => {
        expect(Formula.Apex).toEqual('FORMULA_APEX');
    });

    test(`Formula.Ridge equals 'FORMULA_RIDGE'`, () => {
        expect(Formula.Ridge).toEqual('FORMULA_RIDGE');
    });
});

describe(`FORMULA_APEX`, () => {
    test(`exists`, () => {
        expect(FORMULA_APEX).not.toBeUndefined();
        expect(window.FORMULA_APEX).not.toBeUndefined();
    });

    test(`equals 'FORMULA_APEX'`, () => {
        expect(FORMULA_APEX).toEqual('FORMULA_APEX');
    });

    test(`equals Formula.Apex`, () => {
        expect(FORMULA_APEX).toEqual(Formula.Apex);
    });
});

describe(`FORMULA_RIDGE`, () => {
    test(`exists`, () => {
        expect(FORMULA_RIDGE).not.toBeUndefined();
        expect(window.FORMULA_RIDGE).not.toBeUndefined();
    });

    test(`equals 'FORMULA_RIDGE'`, () => {
        expect(FORMULA_RIDGE).toEqual('FORMULA_RIDGE');
    });

    test(`equals Formula.Ridge`, () => {
        expect(FORMULA_RIDGE).toEqual(Formula.Ridge);
    });
});

describe(`Mode`, () => {
    test(`exists`, () => {
        expect(Mode).not.toBeUndefined();
        expect(window.Mode).not.toBeUndefined();
    });

    test(`Mode.Default equals 0`, () => {
        expect(Mode.Default).toEqual(0);
    });

    test(`Mode.Custom equals 1`, () => {
        expect(Mode.Custom).toEqual(1);
    });
});

describe(`MODE_DEFAULT`, () => {
    test(`exists`, () => {
        expect(MODE_DEFAULT).not.toBeUndefined();
        expect(window.MODE_DEFAULT).not.toBeUndefined();
    });

    test(`equals 0`, () => {
        expect(MODE_DEFAULT).toEqual(0);
    });

    test(`equals Mode.Default`, () => {
        expect(MODE_DEFAULT).toEqual(Mode.Default);
    });
});

describe(`MODE_CUSTOM`, () => {
    test(`exists`, () => {
        expect(MODE_CUSTOM).not.toBeUndefined();
        expect(window.MODE_CUSTOM).not.toBeUndefined();
    });

    test(`equals 1`, () => {
        expect(MODE_CUSTOM).toEqual(1);
    });

    test(`equals Mode.Custom`, () => {
        expect(MODE_CUSTOM).toEqual(Mode.Custom);
    });
});