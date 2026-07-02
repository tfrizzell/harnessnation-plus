import { describe, expect, it } from 'vitest';
import { HNPlusRuntimeError } from '@src/lib/errors';

describe(`HNPlusRuntimeError`, () => {
    it(`exists`, () => {
        expect(HNPlusRuntimeError).not.toBeUndefined();
    });

    it(`is a function`, () => {
        expect(typeof HNPlusRuntimeError).toEqual('function');
    });

    it(`is an Error`, () => {
        expect(HNPlusRuntimeError.prototype).toBeInstanceOf(Error);
        expect(new HNPlusRuntimeError('unit test')).toBeInstanceOf(Error);
    });
});