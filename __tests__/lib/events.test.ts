import { EventType, onInstalled, onLoad } from '../../src/lib/events';

afterAll(() => {
    jest.clearAllTimers();
    jest.clearAllMocks();
});

describe(`EventType`, () => {
    it(`exists`, () => {
        expect(EventType).not.toBeUndefined();
    });
});

describe(`onInstalled`, () => {
    it(`exists`, () => {
        expect(onInstalled).not.toBeUndefined();
    });

    it(`is a function`, () => {
        expect(typeof onInstalled).toEqual('function');
    });

    it(`returns nothing`, () => {
        expect(onInstalled(() => { })).toBeUndefined();
    });
});

describe(`onLoad`, () => {
    it(`exists`, () => {
        expect(onLoad).not.toBeUndefined();
    });

    it(`is a function`, () => {
        expect(typeof onLoad).toEqual('function');
    });

    it(`returns nothing`, () => {
        expect(onLoad(() => { })).toBeUndefined();
    });

    it(`waits for DOMContentLoaded if document.readyState is loading`, () => {
        Object.defineProperty(global.document, 'readyState', {
            configurable: true,
            value: 'loading',
        });

        let value = false,
            srcElement: EventTarget | null | undefined = undefined,
            target: EventTarget | null | undefined = undefined;

        expect(onLoad((e: Event) => {
            value = true;
            srcElement = e.srcElement;
            target = e.target;
        })).toBeUndefined();

        expect(value).toBe(false);
        expect(srcElement).toBeUndefined();
        expect(target).toBeUndefined();

        const event = new Event('DOMContentLoaded', {
            bubbles: true,
            cancelable: false,
            composed: false,
        });

        Object.defineProperties(event, {
            srcElement: {
                get() { return global.document; }
            },
            target: {
                get() { return global.document; }
            },
        });

        Object.defineProperty(global.document, 'readyState', {
            configurable: true,
            value: 'interactive',
        });

        window.dispatchEvent(event);
        expect(value).toBe(true);
        expect(srcElement).toBe(global.document);
        expect(target).toBe(global.document);
    });

    it(`runs immediately if document.readyState is interactive`, () => {
        Object.defineProperty(global.document, 'readyState', {
            configurable: true,
            value: 'interactive',
        });

        let value = false,
            srcElement: EventTarget | null | undefined = undefined,
            target: EventTarget | null | undefined = undefined;

        expect(onLoad((e: Event) => {
            value = true;
            srcElement = e.srcElement;
            target = e.target;
        })).toBeUndefined();

        expect(value).toBe(true);
        expect(srcElement).toBe(document);
        expect(target).toBe(document);
    });

    it(`runs immediately if document.readyState is complete`, () => {
        Object.defineProperty(global.document, 'readyState', {
            configurable: true,
            value: 'complete',
        });

        let value = false,
            srcElement: EventTarget | null | undefined = undefined,
            target: EventTarget | null | undefined = undefined;

        expect(onLoad((e: Event) => {
            value = true;
            srcElement = e.srcElement;
            target = e.target;
        })).toBeUndefined();

        expect(value).toBe(true);
        expect(srcElement).toBe(document);
        expect(target).toBe(document);
    });
});