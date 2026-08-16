import { expect } from 'vitest';

export function expectInstanceOf<T>(
    value: unknown,
    type: new (...args: Array<never>) => T,
): asserts value is T {
    expect(value).toBeInstanceOf(type);
}