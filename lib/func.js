export function parseCurrency(earnings) {
    const numVal = parseFloat(earnings?.toString?.().replace(/[^\d.]+/g, ''));
    return Number.isNaN(numVal) ? earnings : numVal;
}

export function toPercentage(num, den) {
    return `${Number(den != 0 ? 100 * num / den : 0).toFixed(2)}%`;
}