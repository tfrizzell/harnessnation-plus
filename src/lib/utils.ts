import { Timestamp } from 'firebase/firestore';
import { Race, RaceList } from './horses';

export interface DownloadOptions {
    contentType?: string;
    saveAs?: boolean
};

export function ageToText(age: number): string {
    return [
        'Zero',
        'One',
        'Two',
        'Three',
        'Four',
        'Five',
        'Six',
        'Seven',
        'Eight',
        'Nine',
        'Ten',
        'Eleven',
        'Twelve',
        'Thirteen',
        'Fourteen',
        'Fifteen',
        'Sixteen',
        'Seventeen',
        'Eighteen',
        'Nineteen',
        'Twenty',
        'Twenty-One',
    ][age] ?? age.toString();
}

export async function downloadFile(file: string | Blob, filename: string, options: DownloadOptions = {}): Promise<void> {
    if (typeof file === 'string' && /^data:([^;]+);/i.test(file)) {
        const [contentType, encoding, content] = /^data:([^;]+);(?:([^,]+),)?(.*)$/.exec(file)!.slice(1);
        return await downloadFile(encoding === 'base64' ? window.atob(content) : content, filename, { contentType, ...options });
    }

    options ??= {}

    if (!options.contentType?.trim()) {
        switch (filename.split('.')?.pop()?.toLowerCase()) {
            case 'csv':
                options.contentType = 'text/csv';
                break;

            case 'html':
                options.contentType = 'text/html';
                break;

            case 'json':
                options.contentType = 'application/json';
                break;

            case 'pdf':
                options.contentType = 'application/pdf';
                break;

            case 'xls':
                options.contentType = 'application/vnd.ms-excel';
                break;

            case 'xlsx':
                options.contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                break;

            default:
                options.contentType = 'text/plain';
                break;
        }
    }

    let revokeObjectUrl = false;

    if (window.URL?.createObjectURL != null) {
        if (!(file instanceof Blob))
            file = new Blob([new Uint8Array(Array.from(file).map(char => char.charCodeAt(0)))], { type: options.contentType });

        file = window.URL.createObjectURL(file);
        revokeObjectUrl = true;
    } else if (file instanceof Blob) {
        file = await new Promise<string>(resolve => {
            const reader = new FileReader();

            reader.addEventListener('load', () => {
                resolve(<string>reader.result);
            });

            reader.readAsDataURL(<Blob>file);
        });
    } else
        file = `data:${options.contentType};base64,${window.btoa(file)}`;

    try {
        await chrome.downloads.download({
            url: file,
            filename,
            saveAs: options.saveAs ?? false,
        });
    } finally {
        if (revokeObjectUrl)
            setTimeout(window.URL.revokeObjectURL, 1, file);
    }
}

export function formatMark(race: Race | undefined, age?: number): string {
    return !race ? '' : [
        race.gait?.charAt(0)?.toLocaleLowerCase(),
        age,
        secondsToTime(race.time!),
    ].filter(m => m).join(',');
}

export function formatOrdinal(value: number): string {
    const englishOrdinalRules = new Intl.PluralRules('en', { type: 'ordinal' });
    const category = englishOrdinalRules.select(value);

    switch (category) {
        case 'one': {
            return `${value}st`
        }

        case 'two': {
            return `${value}nd`
        }

        case 'few': {
            return `${value}rd`
        }

        default: {
            return `${value}th`
        }
    }
}

export function getCurrentSeason(): Date {
    const value = new Date();
    value.setMonth(value.getMonth() - (value.getMonth() % 3));
    value.setDate(1);
    value.setHours(0);
    value.setMinutes(0);
    value.setSeconds(0);
    value.setMilliseconds(0);
    return value;
}

export function getLifetimeMark(races: RaceList): string {
    const race = races.findFastestWin();
    return !race ? '' : formatMark(race, races.findAge(race));
}

export async function isMobileOS(): Promise<boolean> {
    const platform = await chrome.runtime.getPlatformInfo?.();
    return platform?.os === 'android' || <any>platform?.os === 'ios';
}

export function parseCurrency(value: string | number): number {
    return value == null ? value : globalThis.parseFloat(value.toString().replace(/[^\d.]/g, ''));
}

export function parseInt(value: string | number): number {
    return value == null ? value : ~~(globalThis.parseFloat(value.toString().replace(/[^\d.]/g, '')));
}

export function reduceChanges(changes: { [key: string]: any }, [key, value]: [string, chrome.storage.StorageChange]): { [key: string]: any } {
    return value.newValue ? { ...changes, [key]: value.newValue } : changes;
}

export function regexEscape(value: string): string {
    return value?.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function removeAll(...selectors: string[]): void {
    document.querySelectorAll(selectors.join(', ')).forEach((el: Element) => el.remove());
}

export function seasonsBetween(from: Date, to: Date): number {
    const start = new Date(from);
    start.setDate(1);
    start.setMonth(from.getMonth() - (from.getMonth() % 3));

    const end = new Date(to);
    end.setDate(1);
    end.setMonth(to.getMonth() - (to.getMonth() % 3));

    return 4 * (end.getFullYear() - start.getFullYear()) + (end.getMonth() - start.getMonth()) / 3;
}

export function secondsToTime(seconds: number): string {
    return `${Math.floor(seconds / 60)}:${Number(seconds % 60).toFixed(2).padStart(5, '0')}`;
}

export function sleep(value: number, abortSignal: AbortSignal | null = null): Promise<void> {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(resolve, value);

        abortSignal?.addEventListener('abort', () => {
            clearTimeout(timeout);
            reject('Aborted by the user');
        });
    });
}

export function toDate(timestamp: Timestamp | undefined): Date {
    const milliseconds = parseFloat(`${timestamp?.seconds ?? 0}.${timestamp?.nanoseconds ?? 0}`) * 1000;
    return new Date(milliseconds);
}

export function toPercentage(numerator: number, denominator: number): string {
    if (denominator === 0)
        return toPercentage(0, 1);

    return `${Number(100 * numerator / denominator).toFixed(2)}%`.replace(/(\D)%$/, '$1');
}

export function toTimestamp(value: Date | string | number = new Date()): string {
    if (typeof value === 'string')
        return toTimestamp(Date.parse(value));
    else if (typeof value === 'number')
        return toTimestamp(new Date(value));

    return `${value.getFullYear()}-${(value.getMonth() + 1).toString().padStart(2, '0')}-${value.getDate().toString().padStart(2, '0')}T${value.getHours().toString().padStart(2, '0')}:${value.getMinutes().toString().padStart(2, '0')}:${value.getMinutes().toString().padStart(2, '0')}`;
}

export async function waitFor<T>(promise: Promise<T>): Promise<T> {
    const keepAlive = setInterval(chrome.runtime.getPlatformInfo, 15000);

    try {
        return await promise;
    } finally {
        console.log('clear interval');
        clearInterval(keepAlive);
    }
}