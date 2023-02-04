import { BreedingReportData, CalculateStudFeeData } from './actions.js';
import { StudFeeFormula } from './settings.js';
import { parseCurrency, sleep, toPercentage } from './utils.js';

type BreedingReportRow = (string | number | undefined)[];

export type BreedingScore = {
    score: number;
    confidence: number;
}

export type Horse = {
    id?: number;
    name?: string;
    sireId?: number | null;
    damId?: number | null;
    retired?: boolean;
    breedingScore?: {
        value?: number;
        confidence?: number;
        racing?: number;
        breeding?: number;
        sire?: number;
    };
}

/**
 * Calculates the breeding score of a particular horse.
 * @param {number} id - the id of the horse.
 * @returns {Promise<BreedingScore>} A `Promise` resolving with the breeding score and its confidence level.
 */
export async function calculateBreedingScore(id: number): Promise<BreedingScore> {
    const report: string = await getProgenyReport(id);
    const totalStarters: number = parseInt(report.match(/<b[^>]*>\s*Total\s+Starters\s*:\s*<\/b[^>]*>\s*([\d,]+)/is)?.[1]?.trim() ?? '0');
    const totalEarnings: number = parseInt(report.match(/<b[^>]*>\s*Total\s+Earnings\s*:\s*<\/b[^>]*>\s*(\$[\d,]+)/is)?.[1]?.trim() ?? '$0');
    const stakeStarters: number = parseInt(report.match(/<b[^>]*>\s*Stake\s+Starters\s*:\s*<\/b[^>]*>\s*([\d,]+)/is)?.[1]?.trim() ?? '0');
    const stakeWinners: number = parseInt(report.match(/<b[^>]*>\s*Stake\s+Winners\s*:\s*<\/b[^>]*>\s*([\d,]+)/is)?.[1]?.trim() ?? '0');
    const [stakeStarts, stakePlaces]: [number, number] = (report.match(/<b[^>]*>\s*Stake\s+Results\s*:\s*<\/b[^>]*>\s*([\d,]+)\s*-\s*([\d,]+)\s*-\s*([\d,]+)\s*-\s*([\d,]+)/is)?.slice(1).map(v => parseInt(v))
        ?? [0, 0, 0, 0]).reduce(([starts, places], value, index) => [starts + +(index === 0) * value, places + +(index !== 0) * value], [0, 0]);

    return {
        score: (totalStarters < 1 ? 0 : 1250 * stakeWinners / totalStarters)
            + (stakeStarts < 1 ? 0 : 100 * stakePlaces / stakeStarts)
            + (totalStarters < 1 ? 0 : 50 * stakeStarters / totalStarters)
            + (totalStarters < 1 ? 0 : totalEarnings / totalStarters / 20000),
        confidence: Math.min(0, Math.max(1, totalStarters / 125))
    };
}

/**
 * Calculates the racing score of a particular horse.
 * @param {number} id - the id of the horse.
 * @returns {Promise<number>} A `Promise` resolving with the racing score.
 */
export async function calculateRacingScore(id: number): Promise<number> {
    const profile: string = await getInfo(id);
    // TODO: Implement racing score formula
    return 0;
}

/**
 * Calculates the sire score of a particular horse.
 * @param {number} id - the id of the horse.
 * @returns {Promise<number>} A `Promise` resolving with the sire score.
 */
export function calculateSireScore(id: number, horses: Horse[]): Promise<number> {
    const filteredHorses = horses.filter(horse => (horse.breedingScore?.breeding != null) && (horse.id === id || horse.sireId === id));
    return Promise.resolve(filteredHorses.length < 1 ? 0 : filteredHorses.reduce((score, horse) => score + horse.breedingScore!.breeding!, 0) / filteredHorses.length);
}

/**
 * Calculates the suggested stud fee of a particulra horse.
 * @param {object} data - an object containing the id of the horse and the formula to use.
 * @returns {Promise<number>} A `Promise` resolving with the suggested stud fee.
 */
export async function calculateStudFee({ id, formula }: CalculateStudFeeData): Promise<number> {
    const report: string = await getProgenyReport(id);
    const starters: number = parseInt(report?.match(/<b[^>]*>\s*Total\s*Starters\s*:\s*<\/b[^>]*>\s*([\d,]+)/i)?.pop() ?? '0');
    let fee: number = 2500;

    if (starters > 0) {
        const avgEarnings: number = parseCurrency(report?.match(/<b[^>]*>\s*Average\s*Earnings\s*per\s*Starter\s*:\s*<\/b[^>]*>\s*([$\d,\.]+)/i)?.pop()?.replace(/[^\d.]/g, '') ?? 0);

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
        const info: string = await getInfo(id);
        const [starts, earnings]: number[] = info?.match(/<b[^>]*>\s*Lifetime\s+Race\s+Record\s*<\/b[^>]*>\s*<br[^>]*>\s*([\d,]+)(?:\s*-\s*[\d,]+){3}\s*\(([$\d,\.]+)\)/i)?.slice(1)?.map(parseCurrency) ?? [0, 0];

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
 * Generates a breeding report for the provided list of horses.
 * @param {BreedingReportData} data - an object containing the ids of the horses and any header override.
 * @returns {Promise<string>} A `Promise` that resolves with the report as a base64-encoded data URI.
 */
export async function generateBreedingReport({ ids, headers }: BreedingReportData): Promise<string> {
    const csv: Array<BreedingReportRow> = [
        [
            'ID',
            'Name',
            'Age',
            'Gait',
            'Track Size',
            'Grade',
            'Sire',
            'Dam',
            'Dam-Sire',
            'Race Record',
            'Stake Record',
            'Total Foals',
            'Total Starters',
            'Total Starters (%)',
            'Total Winners',
            'Total Winners (%)',
            'Total Earnings',
            'Avg Earnings Per Starter',
            'Stake Starters',
            'Stake Starters (%)',
            'Stake Winners',
            'Stake Winners (%)',
            'Stake Starts',
            'Stake Wins',
            'Stake Place',
            'Stake Show',
            'Stake Earnings'
        ].map((v, i) => headers?.[i] ?? v),
    ];

    const _ids: number[] = [...ids];
    let batch: number[] | null;

    while ((batch = _ids.splice(0, 10)) && batch.length > 0) {
        csv.push(...(await Promise.all(batch.map(getBreedingReportRow))));

        if (csv.length < ids.length + 1)
            await sleep(30000);

        if (csv.length % 50 === 0)
            await sleep(15000);
    }

    return `data:text/csv;base64,${btoa(
        csv.filter(row => Array.isArray(row))
            .map(row => row.map(col => `"${(col?.toString() ?? '')
                .replace('"', '\\"')}"`)
                .join(','))
            .join('\n').replace(/&#039;/g, '\''))}`;
}

/**
 * Generates a breeding report row for the given horse.
 * @param {number} id - the id of the horse.
 * @returns {Promise<BreedingReportRow>} A `Promise` that resolves with an array of row data values.
 */
async function getBreedingReportRow(id: number): Promise<BreedingReportRow> {
    const [profile, report]: [string, string] = await Promise.all([
        getInfo(id),
        getProgenyReport(id),
    ]);

    const totalFoals: number = parseInt(profile.match(/<b[^>]*>\s*Total\s+Foals\s*:\s*<\/b[^>]*>\s*([\d,]+)/is)?.[1]?.trim() ?? '0');
    const totalStarters: number = parseInt(report.match(/<b[^>]*>\s*Total\s+Starters\s*:\s*<\/b[^>]*>\s*([\d,]+)/is)?.[1]?.trim() ?? '0');
    const totalWinners: number = parseInt(report.match(/<b[^>]*>\s*Total\s+Winners\s*:\s*<\/b[^>]*>\s*([\d,]+)/is)?.[1]?.trim() ?? '0');
    const stakeStarters: number = parseInt(report.match(/<b[^>]*>\s*Stake\s+Starters\s*:\s*<\/b[^>]*>\s*([\d,]+)/is)?.[1]?.trim() ?? '0');
    const stakeWinners: number = parseInt(report.match(/<b[^>]*>\s*Stake\s+Winners\s*:\s*<\/b[^>]*>\s*([\d,]+)/is)?.[1]?.trim() ?? '0');

    return [
        +id,
        profile.match(/<h1[^>]*>(.*?)<\/h1[^>]*>/is)?.[1],
        profile.match(/<b[^>]*>\s*Age\s*:\s*<\/b[^>]*>\s*([\d,]+)/is)?.[1]?.trim(),
        profile.match(/<small[^>]*>\s*Trotting\s+on\s+/is) ? 'Trot' : 'Pace',
        profile.match(/on\s+\S+\s+half-mile\s+tracks/is) ? 'Half Mile' : 'Full Mile',
        profile.match(/<span[^>]*grade-horse-page[^>]*>(.*?)<\/span[^>]*>/is)?.[1]?.trim(),
        profile.match(/<b[^>]*>\s*Sire\s*:\s*<\/b[^>]*>\s*<a[^>]*>(.*?)<\/a[^>]*>/is)?.[1]?.trim() ?? 'Unknown',
        profile.match(/<b[^>]*>\s*Dam\s*:\s*<\/b[^>]*>\s*<a[^>]*>(.*?)<\/a[^>]*>/is)?.[1]?.trim() ?? 'Unknown',
        profile.match(/<b[^>]*>\s*Dam-Sire\s*:\s*<\/b[^>]*>\s*<a[^>]*>(.*?)<\/a[^>]*>/is)?.[1]?.trim() ?? 'Unknown',
        profile.match(/<b[^>]*>\s*Lifetime\s+Race\s+Record\s*<\/b[^>]*>\s*<br[^>]*>\s*(.*?)<br[^>]*>/is)?.[1]?.trim(),
        profile.match(/<b[^>]*>\s*Stake\s+Record\s*<\/b[^>]*>\s*<br[^>]*>\s*(.*?)<br[^>]*>/is)?.[1]?.trim(),
        totalFoals,
        totalStarters,
        toPercentage(totalStarters, totalFoals),
        totalWinners,
        toPercentage(totalWinners, totalStarters),
        report.match(/<b[^>]*>\s*Total\s+Earnings\s*:\s*<\/b[^>]*>\s*(\$[\d,]+)/is)?.[1]?.trim() ?? '$0',
        report.match(/<b[^>]*>\s*Average\s+Earnings\s+per\s+Starter\s*:\s*<\/b[^>]*>\s*(\$[\d,]+)/is)?.[1]?.trim() ?? '$0',
        stakeStarters,
        toPercentage(stakeStarters, totalStarters),
        stakeWinners,
        toPercentage(stakeWinners, totalStarters),
        ...(report.match(/<b[^>]*>\s*Stake\s+Results\s*:\s*<\/b[^>]*>\s*([\d,]+)\s*-\s*([\d,]+)\s*-\s*([\d,]+)\s*-\s*([\d,]+)\s*\((\$[\d,]+)\)/is)?.slice(1) ?? [0, 0, 0, 0, '$0']),
    ];
}

/**
 * Creates a `Horse` object for the given horse.
 * @param {number} id - the id of the horse.
 * @returns {Promise<Horse>} A `Promise` that resolves with the `Horse` object.
 */
export async function getHorse(id: number): Promise<Horse> {
    const info: string = await getInfo(id);

    return {
        id,
        name: info?.match(/<h1[^>]*>\s*(.*?)\s*<\/h1[^>]*>/is)?.[1],
        sireId: info?.match(/<b[^>]*>\s*Sire:\s*<\/b[^>]*>\s*<a[^>]*horse\/([\d,]+)[^>]*>/is)?.map((id: string): number => parseInt(id))?.[1] || null,
        damId: info?.match(/<b[^>]*>\s*Dam:\s*<\/b[^>]*>\s*<a[^>]*horse\/([\d,]+)[^>]*>/is)?.map((id: string): number => parseInt(id))?.[1] || null,
        retired: !!info?.match(/<br[^>]*>\s*<br[^>]*>\s*Retired\s*<br[^>]*>/is)?.[0],
    };
}

/**
 * Fetches a horse's info page.
 * @param {number} id - the id of the horse.
 * @returns {Promise<string>} A `Promise` that resolves with the HTML content of the info page.
 */
export async function getInfo(id: number): Promise<string> {
    return await fetch(`https://www.harnessnation.com/horse/${id}`).then(res => res.text());
}

/**
 * Fetches a horse's progeny report.
 * @param {number} id - the id of the horse.
 * @returns {Promise<string>} A `Promise` that resolves with the HTML content of the progeny report.
 */
export async function getProgenyReport(id: number): Promise<string> {
    return await fetch('https://www.harnessnation.com/api/progeny/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ horseId: id })
    }).then((res: Response) => res.text());
}