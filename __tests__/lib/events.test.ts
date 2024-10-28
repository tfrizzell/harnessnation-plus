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

    test(`waits for DOMContentLoaded if document.readyState is loading`, () => {
        Object.defineProperty(document, 'readyState', {
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
                get() { return document; }
            },
            target: {
                get() { return document; }
            },
        });

        Object.defineProperty(document, 'readyState', {
            configurable: true,
            value: 'interactive',
        });

        window.dispatchEvent(event);
        expect(value).toBe(true);
        expect(srcElement).toBe(document);
        expect(target).toBe(document);
    });

    test(`runs immediately if document.readyState is interactive`, () => {
        Object.defineProperty(document, 'readyState', {
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

    test(`runs immediately if document.readyState is complete`, () => {
        Object.defineProperty(document, 'readyState', {
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