export enum EventType {
    BloodlineSearch = 'bloodline-search.harnessnation-plus',
    Installed = 'installed.harnessnation-plus',
}

export function onInstalled(callback: EventListenerOrEventListenerObject, options?: AddEventListenerOptions): void {
    window.addEventListener(EventType.Installed, callback, { once: true, ...options });
}

export function onLoad(callback: EventListenerOrEventListenerObject, options?: AddEventListenerOptions | boolean): void {
    if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', callback, options);
        return;
    }

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

    (callback as (this: Window, ev: Event) => void).call(window, event);
}

export default {
    onInstalled,
    onLoad,
}