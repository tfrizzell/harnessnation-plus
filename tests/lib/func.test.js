import { parseCurrency, toPercentage } from '../../lib/func.js';

describe(`parseCurrency`, () => {
    test(`exists`, () => {
        expect(parseCurrency).not.toBeUndefined();
        expect(window.parseCurrency).not.toBeUndefined();
    });

    test(`is a function`, () => {
        expect(typeof parseCurrency).toEqual('function');
    });

    test(`properly converts strings to numbers`, () => {
        const values = [
            ['1000000', 1000000],
            ['1000000.00', 1000000.00],
            ['$1000000', 1000000],
            ['$1000000.00', 1000000.00],
            ['1,000,000', 1000000],
            ['1,000,000.00', 1000000.00],
            ['$1,000,000', 1000000],
            ['$1,000,000.00', 1000000.00],
        ];

        for (const [value, result] of values)
            expect(parseCurrency(value)).toEqual(result);
    });

    test(`returns null when given null or undefined`, () => {
        const values = [
            null,
            undefined,
        ];

        for (const value of values)
            expect(parseCurrency(value)).toEqual(value);
    });
});

describe(`toPercentage`, () => {
    test(`exists`, () => {
        expect(toPercentage).not.toBeUndefined();
        expect(window.toPercentage).not.toBeUndefined();
    });

    test(`is a function`, () => {
        expect(typeof toPercentage).toEqual('function');
    });

    test(`properly computes a percentage`, () => {
        const values = [
            [25, 100, '25.00%'],
            [50, 25, '200.00%'],
            [256, 287, '89.20%'],
            [239, 256, '93.36%'],
            [48, 256, '18.75%'],
            [5, 256, '1.95%'],
        ];

        for (const [nom, den, result] of values)
            expect(toPercentage(nom, den)).toEqual(result);
    });

    test(`returns 0.00% when given 0 as a denominator`, () => {
        expect(toPercentage(25, 0)).toEqual('0.00%');
    });
});