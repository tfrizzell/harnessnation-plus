import { EventType, onInstalled, onLoad } from '../../src/lib/events';

describe(`EventType`, () => {
    test(`exists`, () => {
        expect(EventType).not.toBeUndefined();
    });
});

describe(`onInstalled`, () => {
    test(`exists`, () => {
        expect(onInstalled).not.toBeUndefined();
    });

    test(`is a function`, () => {
        expect(typeof onInstalled).toEqual('function');
    });

    test(`returns nothing`, () => {
        expect(onInstalled(() => { })).toBeUndefined();
    });
});

describe(`onLoad`, () => {
    test(`exists`, () => {
        expect(onLoad).not.toBeUndefined();
    });

    test(`is a function`, () => {
        expect(typeof onLoad).toEqual('function');
    });

    test(`returns nothing`, () => {
        expect(onLoad(() => { })).toBeUndefined();
    });
});