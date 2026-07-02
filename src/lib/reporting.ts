import { BreedingReportData, BreedingReportMode } from './actions.js';
import { api } from './harnessnation.js'
import { getRaces } from './races.js';
import { formatEarnings, parseInt, toPercentage } from './utils.js';

export interface BreedingReport {
    totalFoals: number;
    totalStarters: number;
    totalWinners: number;
    totalEarnings: number;
    stakeStarters: number;
    stakeWinners: number;
    stakeStarts: number;
    stakeWins: number;
    stakePlaces: number;
    stakeShows: number;
    stakeEarnings: number;
}

type BreedingReportRow = (string | number | undefined)[];

const encoder = new TextEncoder();

/**
 * Generates a breeding report for the provided list of horses.
 * @param {BreedingReportData} data - an object containing the ids of the horses and any header override.
 * @returns {Promise<string>} A `Promise` that resolves with the report as a base64-encoded data URI.
 */
export async function generateBreedingReport({ ids, headers, mode }: BreedingReportData): Promise<string> {
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
        const rows = await Promise.all(batch.map(id => getBreedingReportRow(id, mode)));
        report.push(...rows.map(row => row.slice(0, report[0].length)));
    }

    return `data:text/csv;base64,${window.btoa(
        Array.from(
            encoder.encode(report.filter(row => Array.isArray(row))
                .map(row => row
                    .map(col => `"${(col?.toString() ?? '').replace(/"/g, '""')}"`)
                    .join(','))
                .join('\n')
            ),
            b => String.fromCharCode(b)
        ).join('')
    )}`;
}

/**
 * Gets the breeding report for the given horse.
 * @param {number} id - the id of the horse.
 * @param {BreedingReportMode} mode - the lookup mode use for generating the report.
 * @returns {Promise<BreedingReport>} A `Promise` that resolves with the breeding report data.
 */
export async function getBreedingReport(id: number, mode?: BreedingReportMode): Promise<BreedingReport> {
    const [profile, report] = await Promise.all([
        api.getHorse(id),
        api.getProgenyReport(id),
    ]);

    const [stakeStarts, stakeWins, stakePlaces, stakeShows, stakeEarnings] = (
        report.match(/<b[^>]*>\s*Stake\s+Results\s*:\s*<\/b[^>]*>\s*([\d,]+)\s*-\s*([\d,]+)\s*-\s*([\d,]+)\s*-\s*([\d,]+)\s*\(\$([\d,]+(?:\.\d+)?)\)/is)?.slice(1)
        ?? ['0', '0', '0', '0', '0']
    ).map(parseInt);

    const data: BreedingReport = {
        totalFoals: parseInt(profile.match(/<b[^>]*>\s*Total\s+Foals\s*:\s*<\/b[^>]*>\s*([\d,]+)/is)?.[1] ?? '0'),
        totalStarters: parseInt(report.match(/<b[^>]*>\s*Total\s+Starters\s*:\s*<\/b[^>]*>\s*([\d,]+)/is)?.[1] ?? '0'),
        totalWinners: parseInt(report.match(/<b[^>]*>\s*Total\s+Winners\s*:\s*<\/b[^>]*>\s*([\d,]+)/is)?.[1] ?? '0'),
        totalEarnings: parseInt(report.match(/<b[^>]*>\s*Total\s+Earnings\s*:\s*<\/b[^>]*>\s*\$([\d,]+(?:\.\d+)?)/is)?.[1] ?? '0'),
        stakeStarters: parseInt(report.match(/<b[^>]*>\s*Stake\s+Starters\s*:\s*<\/b[^>]*>\s*([\d,]+)/is)?.[1] ?? '0'),
        stakeWinners: parseInt(report.match(/<b[^>]*>\s*Stake\s+Winners\s*:\s*<\/b[^>]*>\s*([\d,]+)/is)?.[1] ?? '0'),
        stakeStarts,
        stakeWins,
        stakePlaces,
        stakeShows,
        stakeEarnings,
    };

    if (mode === 'enhanced') {
        const csrfToken = await api.getCSRFToken();
        const progeny = await api.getProgenyList(id, csrfToken);

        const candidates = Array.from(progeny
            .replace(/\s*data-[^\s=]+="[^"]*"/g, '')
            .matchAll(/<tr[^>]*>[\s\S]*?<\/tr[^>]*>/g)
        )
            .filter(([match]) => /<td[^>]*>\s*(1\d|[2-9])\s*<\/td[^>]*>\s*<td[^>]*>[\s\S]*?<\/td[^>]*>\s*<td[^>]*>\s*<span[^>]*>\s*R\s*<\/span[^>]*>\s*<\/td[^>]*>\s*<td[^>]*>[\s\S]*?<\/td[^>]*>\s*<td[^>]*>\s*0\s*-\s*0\s*-\s*0\s*-\s*0\s*<\/td[^>]*>\s*<td[^>]*>\s*\$0\s*<\/td[^>]*>/i.test(match))
            .map(([match]) => parseInt(/<a(?=[^>]*\bhorseLink\b)[^>]*\/horse\/(\d+)[^>]*>/i.exec(match)?.[1] ?? ''))
            .filter(id => !Number.isNaN(id));

        const chunkSize = 3;

        for (let i = 0; i < candidates.length; i += chunkSize) {
            const chunk = candidates.slice(i, i + chunkSize);

            for (const result of await Promise.allSettled(chunk.map(id => getRaces(id)))) {
                if (result.status !== 'fulfilled')
                    continue;

                const races = result.value;

                if (races.length < 1)
                    continue;

                data.totalStarters++;
                data.totalEarnings += races.getEarnings();

                if (races.some(r => r.finish === 1))
                    data.totalWinners++;

                const [starts, wins, places, shows] = races.getSummary(r => r.stake === true && r.elim === false);
                data.stakeStarters += (starts > 0 ? 1 : 0);
                data.stakeWinners += (wins > 0 ? 1 : 0);
                data.stakeStarts += starts;
                data.stakeWins += wins;
                data.stakePlaces += places;
                data.stakeShows += shows;
                data.stakeEarnings += races.getEarnings(r => r.stake === true && r.elim === false);
            }
        }
    }

    return data;
}

/**
 * Generates a breeding report row for the given horse.
 * @param {number} id - the id of the horse.
 * @param {BreedingReportMode} mode - the data lookup mode.
 * @returns {Promise<BreedingReportRow>} A `Promise` that resolves with an array of row data values.
 */
async function getBreedingReportRow(id: number, mode?: BreedingReportMode): Promise<BreedingReportRow> {
    const report = await getBreedingReport(id, mode);
    const profile = await api.getHorse(id);

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
        report.totalFoals,
        report.totalStarters,
        toPercentage(report.totalStarters, report.totalFoals),
        report.totalWinners,
        toPercentage(report.totalWinners, report.totalStarters),
        formatEarnings(report.totalEarnings),
        formatEarnings(report.totalStarters > 0 ? report.totalEarnings / report.totalStarters : 0),
        report.stakeStarters,
        toPercentage(report.stakeStarters, report.totalStarters),
        report.stakeWinners,
        toPercentage(report.stakeWinners, report.totalStarters),
        report.stakeStarts,
        report.stakeWins,
        report.stakePlaces,
        report.stakeShows,
        formatEarnings(report.stakeEarnings),
    ];
}