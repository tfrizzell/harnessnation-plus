import { parseCurrency } from '../../lib/func.js';

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