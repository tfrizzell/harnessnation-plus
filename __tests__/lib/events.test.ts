import { EventType, onInstalled, onLoad } from '../../src/lib/events';

describe(`EventType`, (): void => {
    test(`exists`, (): void => {
        expect(EventType).not.toBeUndefined();
    });
});

describe(`onInstalled`, (): void => {
    test(`exists`, (): void => {
        expect(onInstalled).not.toBeUndefined();
    });

    test(`is a function`, (): void => {
        expect(typeof onInstalled).toEqual('function');
    });

    test(`returns nothing`, (): void => {
        expect(onInstalled((): void => { })).toBeUndefined();
    });
});

describe(`onLoad`, (): void => {
    test(`exists`, (): void => {
        expect(onLoad).not.toBeUndefined();
    });

    test(`is a function`, (): void => {
        expect(typeof onLoad).toEqual('function');
    });

    test(`returns nothing`, (): void => {
        expect(onLoad((): void => { })).toBeUndefined();
    });
});