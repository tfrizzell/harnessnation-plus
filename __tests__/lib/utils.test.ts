import { parseCurrency, parseInt, reduceChanges, regexEscape, sleep, toPercentage, toTimestamp } from '../../src/lib/utils';

type NumberTestData = [string | number, number];
type PercentageTestData = [number, number, string];
type TimestampTestData = [Date | string | number, string];

describe(`parseCurrency`, () => {
    test(`exists`, () => {
        expect(parseCurrency).not.toBeUndefined();
    });

    test(`is a function`, () => {
        expect(typeof parseCurrency).toEqual('function');
    });

    test(`properly converts strings to numbers`, () => {
        const values: NumberTestData[] = [
            ['1000000', 1000000],
            ['1000000.00', 1000000.00],
            ['$1000000', 1000000],
            ['$1000000.00', 1000000.00],
            ['1,000,000', 1000000],
            ['1,000,000.00', 1000000.00],
            ['$1,000,000', 1000000],
            ['$1,000,000.00', 1000000.00],
            [1000000, 1000000],
            [1000000.00, 1000000.00],
            [1_000_000, 1000000],
            [1_000_000.00, 1000000.00],
        ];

        for (const [value, expected] of values)
            expect(parseCurrency(value)).toEqual(expected);
    });
});

describe(`parseInt`, () => {
    test(`exists`, () => {
        expect(parseInt).not.toBeUndefined();
    });

    test(`is a function`, () => {
        expect(typeof parseInt).toEqual('function');
    });

    test(`properly converts strings to numbers`, () => {
        const values: NumberTestData[] = [
            ['1000000', 1000000],
            ['1000000.00', 1000000],
            ['$1000000', 1000000],
            ['$1000000.00', 1000000],
            ['1,000,000', 1000000],
            ['1,000,000.00', 1000000],
            ['$1,000,000', 1000000],
            ['$1,000,000.00', 1000000],
            [1000000, 1000000],
            [1000000.00, 1000000],
            [1_000_000, 1000000],
            [1_000_000.00, 1000000],
        ];

        for (const [value, expected] of values)
            expect(parseInt(value)).toEqual(expected);
    });
});

describe(`reduceChanges`, () => {
    test(`exists`, () => {
        expect(reduceChanges).not.toBeUndefined();
    });

    test(`is a function`, () => {
        expect(typeof reduceChanges).toEqual('function');
    });

    test(`reduces changes as expected`, () => {
        expect({
            a: 'a',
            b: 'b',
            ...Object.entries({
                a: {
                    oldValue: 'a',
                    newValue: 'b'
                },
                b: {
                    oldValue: 'b',
                    newValue: 'a',
                },
            }).reduce(reduceChanges, {})
        }).toEqual({ a: 'b', b: 'a' });
    });
});

describe(`regexEscape`, () => {
    const specialCharacters: string[] = [
        '.',
        '*',
        '+',
        '?',
        '^',
        '$',
        '{',
        '}',
        '(',
        ')',
        '|',
        '[',
        ']',
        '\\',
    ];

    test(`exists`, () => {
        expect(regexEscape).not.toBeUndefined();
    });

    test(`is a function`, () => {
        expect(typeof regexEscape).toEqual('function');
    });

    for (const value of specialCharacters) {
        test(`'regexEscape' properly escapes the special character '${value}'`, () => {
            expect(regexEscape(value)).toEqual(`\\${value}`);
        });
    }

    // Using extended ASCII instead of UTF-8 or Unicode due to the amount of time
    // it takes to iterate over 2-billion possible characters.
    test(`'regexEscape' does not escape non-special ASCII characters`, () => {
        for (const value of Array(256).fill(0).map((_, i) => String.fromCharCode(i)).filter(c => !specialCharacters.includes(c)))
            expect(regexEscape(value)).toEqual(value);
    });
});

describe(`sleep`, () => {
    test(`exists`, () => {
        expect(sleep).not.toBeUndefined();
    });

    test(`is a function`, () => {
        expect(typeof sleep).toEqual('function');
    });

    test(`sleeps for 100ms then returns`, async () => {
        const start = performance.now();
        await sleep(100);
        const time = Math.round(performance.now() - start);
        expect(time).toBeGreaterThanOrEqual(90);
        expect(time).toBeLessThanOrEqual(199);
    });

    test(`can be aborted`, async () => {
        try {
            const controller = new AbortController();
            setTimeout(() => controller.abort(), 50);
            await sleep(100, controller.signal);
            throw 'Test failed to be aborted';
        } catch (e) {
            expect(e).toEqual('Aborted by the user');
        }
    });
});

describe(`toPercentage`, () => {
    test(`exists`, () => {
        expect(toPercentage).not.toBeUndefined();
    });

    test(`is a function`, () => {
        expect(typeof toPercentage).toEqual('function');
    });

    test(`properly computes a percentage`, () => {
        const values: PercentageTestData[] = [
            [25, 100, '25.00%'],
            [50, 25, '200.00%'],
            [256, 287, '89.20%'],
            [239, 256, '93.36%'],
            [48, 256, '18.75%'],
            [5, 256, '1.95%'],
        ];

        for (const [nom, den, expected] of values)
            expect(toPercentage(nom, den)).toEqual(expected);
    });

    test(`returns 0.00% when given 0 as a denominator`, () => {
        expect(toPercentage(25, 0)).toEqual('0.00%');
    });
});

describe(`toTimestamp`, () => {
    test(`exists`, () => {
        expect(toTimestamp).not.toBeUndefined();
    });

    test(`is a function`, () => {
        expect(typeof toTimestamp).toEqual('function');
    });

    test(`properly converts values to timestamps`, () => {
        const values: TimestampTestData[] = [
            [new Date('2022-01-01 00:00:00 +00:00'), '2022-01-01T00:00:00'],
            ['2022-01-01 00:00:00 +00:00', '2022-01-01T00:00:00'],
            [1_640_995_200_000, '2022-01-01T00:00:00'],
        ];

        for (const [value, expected] of values)
            expect(toTimestamp(value)).toEqual(expected);
    });
});