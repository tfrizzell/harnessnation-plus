import { BreedingReportData } from './actions.js';
import { api } from './harnessnation.js'
import { parseInt, sleep, toPercentage } from './utils.js';

type BreedingReportRow = (string | number | undefined)[];

/**
 * Generates a breeding report for the provided list of horses.
 * @param {BreedingReportData} data - an object containing the ids of the horses and any header override.
 * @returns {Promise<string>} A `Promise` that resolves with the report as a base64-encoded data URI.
 */
export async function generateBreedingReport({ ids, headers }: BreedingReportData): Promise<string> {
    const report: BreedingReportRow[] = [
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
            'Stake Earnings',
        ].filter(v => !!v).map((v, i) => headers?.[i] ?? v),
    ];

    const _ids = Array.from(ids);
    let batch: number[] | null;

    while ((batch = _ids.splice(0, 10)) && batch.length > 0) {
        const rows = await Promise.all(batch.map(id => getBreedingReportRow(id)));
        report.push(...rows.map(row => row.slice(0, report[0].length)));
    }

    return `data:text/csv;base64,${window.btoa(
        report.filter(row => Array.isArray(row))
            .map(row => row.map(col => `"${(col?.toString() ?? '')
                .replace('"', '\\"')}"`)
                .join(','))
            .join('\n'))}`;
}


/**
 * Generates a breeding report row for the given horse.
 * @param {number} id - the id of the horse.
 * @returns {Promise<BreedingReportRow>} A `Promise` that resolves with an array of row data values.
 */
async function getBreedingReportRow(id: number): Promise<BreedingReportRow> {
    const [profile, report] = await Promise.all([
        api.getHorse(id),
        api.getProgenyReport(id),
    ]);

    const totalFoals = parseInt(profile.match(/<b[^>]*>\s*Total\s+Foals\s*:\s*<\/b[^>]*>\s*([\d,]+)/is)?.[1] ?? '0');
    const totalStarters = parseInt(report.match(/<b[^>]*>\s*Total\s+Starters\s*:\s*<\/b[^>]*>\s*([\d,]+)/is)?.[1] ?? '0');
    const totalWinners = parseInt(report.match(/<b[^>]*>\s*Total\s+Winners\s*:\s*<\/b[^>]*>\s*([\d,]+)/is)?.[1] ?? '0');
    const stakeStarters = parseInt(report.match(/<b[^>]*>\s*Stake\s+Starters\s*:\s*<\/b[^>]*>\s*([\d,]+)/is)?.[1] ?? '0');
    const stakeWinners = parseInt(report.match(/<b[^>]*>\s*Stake\s+Winners\s*:\s*<\/b[^>]*>\s*([\d,]+)/is)?.[1] ?? '0');

    return [
        +id,
        profile.match(/<h1[^>]*>(.*?)<\/h1[^>]*>/is)?.[1],
        profile.match(/<b[^>]*>\s*Age\s*:\s*<\/b[^>]*>\s*(\d+)/is)?.[1]?.trim(),
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
        report.match(/<b[^>]*>\s*Total\s+Earnings\s*:\s*<\/b[^>]*>\s*([$\d,]+(?:\.\d+)?)/is)?.[1] ?? '$0',
        report.match(/<b[^>]*>\s*Average\s+Earnings\s+per\s+Starter\s*:\s*<\/b[^>]*>\s*([$\d,]+(?:\.\d+)?)/is)?.[1] ?? '$0',
        stakeStarters,
        toPercentage(stakeStarters, totalStarters),
        stakeWinners,
        toPercentage(stakeWinners, totalStarters),
        ...(report.match(/<b[^>]*>\s*Stake\s+Results\s*:\s*<\/b[^>]*>\s*([\d,]+)\s*-\s*([\d,]+)\s*-\s*([\d,]+)\s*-\s*([\d,]+)\s*\(([$\d,]+(?:\.\d+)?)\)/is)?.slice(1) ?? ['0', '0', '0', '0', '$0']),
    ];
}