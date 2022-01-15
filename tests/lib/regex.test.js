import { Regex } from '../../lib/regex.js';

describe(`Regex`, () => {
    test(`exists`, () => {
        expect(Regex).not.toBeUndefined();
        expect(window.Regex).not.toBeUndefined();
    });

    test(`is a class`, () => {
        expect(typeof Regex).toEqual('function');
        expect(typeof Regex.constructor).toEqual('function');
    });

    test(`cannot be instantiated`, () => {
        expect(() => {
            class TestRegex extends Regex { }
            return new TestRegex();
        }).toThrow(`${Regex.name} is static and cannot be instantiated`);
    });

    test(`contains the static function escape`, () => {
        expect(Regex).toHaveProperty('escape');
        expect(typeof Regex.escape).toEqual('function');
    });

    test(`'escape' properly escapes special characters`, () => {
        const values = [
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

        for (const value of values)
            expect(Regex.escape(value)).toEqual(`\\${value}`);
    });
});