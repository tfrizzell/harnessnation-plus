export function createPlainError(...args) {
    const error = new Error(...args);
    const plainError = JSON.parse(JSON.stringify(error, Object.getOwnPropertyNames(error)))
    Object.defineProperty(plainError, '@type', { enumerable: true, value: '\u2063error' });
    return plainError;
}

export function isPlainError(object) {
    return object['@type'] === '\u2063error';
}

export function parseCurrency(earnings) {
    const numVal = parseFloat(earnings?.toString?.().replace(/[^\d.]+/g, ''));
    return Number.isNaN(numVal) ? earnings : numVal;
}

export function timestamp(value = new Date()) {
    return [
        value.getFullYear(),
        '-',
        (value.getMonth() + 1).toString().padStart(2, '0'),
        '-',
        value.getDate().toString().padStart(2, '0'),
        'T',
        value.getHours().toString().padStart(2, '0'),
        ':',
        value.getMinutes().toString().padStart(2, '0'),
        ':',
        value.getSeconds().toString().padStart(2, '0'),
    ].join('');
}

export function toPercentage(num, den) {
    return `${Number(den != 0 ? 100 * num / den : 0).toFixed(2)}%`;
}