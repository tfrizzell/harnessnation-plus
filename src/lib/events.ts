export enum EventType {
    BloodlineSeach = 'bloodline-search.harnessnation-plus',
    Installed = 'installed.harnessnation-plus',
}

export function onInstalled(callback: EventListenerOrEventListenerObject, options?: AddEventListenerOptions): void {
    window.addEventListener(EventType.Installed, callback, { once: true, ...options });
}

export function onLoad(callback: EventListenerOrEventListenerObject, options?: AddEventListenerOptions | boolean): void {
    window.addEventListener('DOMContentLoaded', callback, options);
}

export default {
    onInstalled,
    onLoad,
}