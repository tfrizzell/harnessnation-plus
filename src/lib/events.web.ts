// This file is used to make events.js available in a synchronous way in content scripts
Object.assign(window, {
    Events: {
        onInstalled: function Events__onInstalled(callback: EventListenerOrEventListenerObject, options?: AddEventListenerOptions): void {
            window.addEventListener(window.EventType.Installed, callback, { once: true, ...options });
        },
        onLoad: function Events__onLoad(callback: EventListenerOrEventListenerObject, options?: AddEventListenerOptions | boolean): void {
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
        },
    },
    EventType: {
        ['BloodlineSeach']: 'bloodline-search.harnessnation-plus',
        ['Installed']: 'installed.harnessnation-plus',
        [0]: 'bloodline-search.harnessnation-plus',
        [1]: 'installed.harnessnation-plus',
    },
});