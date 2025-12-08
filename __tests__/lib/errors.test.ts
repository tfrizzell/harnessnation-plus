import { HNPlusRuntimeError } from '../../src/lib/errors';

afterAll(() => {
    jest.clearAllTimers();
    jest.clearAllMocks();
});

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