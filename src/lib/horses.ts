import { CalculateStudFeeData } from './actions.js';
import { api } from './harnessnation.js'
import { StudFeeFormula } from './settings.js';
import { StallionScore } from './stallion-scores.js';
import { parseCurrency, parseInt } from './utils.js';

export interface Horse {
    id?: number;
    name?: string;
    sireId?: number | null;
    damId?: number | null;
    retired?: boolean;
    stallionScore?: StallionScore | null;
}

/**
 * 
 */

/**
 * Calculates the suggested stud fee of a particulra horse.
 * @param {object} data - an object containing the id of the horse and the formula to use.
 * @returns {Promise<number>} A `Promise` resolving with the suggested stud fee.
 */
export async function calculateStudFee({ id, formula }: CalculateStudFeeData): Promise<number> {
    const report = await api.getProgenyReport(id);
    const starters = parseInt(report?.match(/<b[^>]*>\s*Total\s*Starters\s*:\s*<\/b[^>]*>\s*([\d,]+)/i)?.pop() ?? '0');
    let fee = 2500;

    if (starters > 0) {
        const avgEarnings = parseCurrency(report?.match(/<b[^>]*>\s*Average\s*Earnings\s*per\s*Starter\s*:\s*<\/b[^>]*>\s*([$\d,\.]+(?:\.\d+)?)/i)?.pop() ?? '$0');

        switch (formula) {
            case StudFeeFormula.Apex:
            default:
                fee = (1000 * Math.round(avgEarnings / 4000)) || fee;
                break;

            case StudFeeFormula.Ridge:
                fee = (1000 * Math.round(5 + (avgEarnings / 2000))) || fee;
                break;
        }
    } else {
        const info = await api.getHorse(id);
        const [starts, earnings] = info?.match(/<b[^>]*>\s*Lifetime\s+Race\s+Record\s*<\/b[^>]*>\s*<br[^>]*>\s*([\d,]+)(?:\s*-\s*[\d,]+){3}\s*\(([$\d,\.]+(?:\.\d+)?)\)/i)?.slice(1)?.map(parseCurrency) ?? [0, 0];

        switch (formula) {
            case StudFeeFormula.Apex:
            default:
                fee = (1000 * Math.round(earnings / starts / 1000)) || fee;
                break;

            case StudFeeFormula.Ridge:
                fee = (1000 * Math.round(5 + (earnings / 20000))) || fee;
                break;
        }
    }

    return Math.min(10000000, Math.max(1000, fee));
}

/**
 * Gets the `Horse` object for the given horse.
 * @param {number} id - the id of the horse.
 * @returns {Promise<Horse>} A `Promise` that resolves with the `Horse` object.
 */
export async function getHorse(id: number): Promise<Horse> {
    const html = await api.getHorse(id);

    return {
        id: parseInt(html?.match(/<b[^>]*>\s*ID:\s*<\/b[^>]*>\s*(\d+)/is)?.[1]!),
        name: html?.match(/<h1[^>]*>\s*(.*?)\s*<\/h1[^>]*>/is)?.[1]?.trim(),
        sireId: html?.match(/<b[^>]*>\s*Sire:\s*<\/b[^>]*>\s*<a[^>]*\/horse\/(\d+)[^>]*>/is)?.map(parseInt)?.[1] || null,
        damId: html?.match(/<b[^>]*>\s*Dam:\s*<\/b[^>]*>\s*<a[^>]*\/horse\/(\d+)[^>]*>/is)?.map(parseInt)?.[1] || null,
        retired: !!html?.match(/<br[^>]*>\s*<br[^>]*>\s*Retired\s*<br[^>]*>/is)?.[0],
    };
}