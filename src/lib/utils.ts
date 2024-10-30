import { Timestamp } from 'firebase/firestore';

export type DownloadOptions = {
    contentType?: string;
    saveAs?: boolean
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
            file = new Blob([file], { type: options.contentType });

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
            window.URL.revokeObjectURL(file);
    }
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