import { describe, expect, it } from 'vitest';
import { onLoad } from '@src/lib/events';

describe(`onLoad`, () => {
    it(`waits for DOMContentLoaded if document.readyState is loading`, () => {
        Object.defineProperty(global.document, 'readyState', {
            configurable: true,
            value: 'loading',
        });

        let value = false,
            target: EventTarget | null | undefined = undefined;

        onLoad((e: Event) => {
            value = true;
            target = e.target;
        });

        expect(value).toBe(false);
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
        expect(target).toBe(global.document);
    });

    it(`runs immediately if document.readyState is interactive`, () => {
        Object.defineProperty(global.document, 'readyState', {
            configurable: true,
            value: 'interactive',
        });

        let value = false,
            target: EventTarget | null | undefined = undefined;

        onLoad((e: Event) => {
            value = true;
            target = e.target;
        });

        expect(value).toBe(true);
        expect(target).toBe(document);
    });

    it(`runs immediately if document.readyState is complete`, () => {
        Object.defineProperty(global.document, 'readyState', {
            configurable: true,
            value: 'complete',
        });

        let value = false,
            target: EventTarget | null | undefined = undefined;

        onLoad((e: Event) => {
            value = true;
            target = e.target;
        });

        expect(value).toBe(true);
        expect(target).toBe(document);
    });
});