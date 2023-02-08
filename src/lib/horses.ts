import { BreedingReportData, CalculateStudFeeData } from './actions.js';
import { StudFeeFormula } from './settings.js';
import { parseCurrency, parseInt, sleep, toPercentage } from './utils.js';

type BreedingReportRow = (string | number | undefined)[];

export type BreedingScore = {
    score: number | null;
    confidence: number;
}

export type Horse = {
    id?: number;
    name?: string;
    sireId?: number | null;
    damId?: number | null;
    retired?: boolean;
    stallionScore?: StallionScore | null;
}

export type StallionScore = {
    value?: number | null;
    confidence?: number;
    racing?: number | null;
    breeding?: number | null;
    bloodline?: number | null;
}

export type StallionScoreBadgeOptions = {
    preview?: boolean;
    clickable?: boolean;
}

/**
 * Calculates the bloodline score of a particular horse.
 * @param {number} id - the id of the horse.
 * @returns {Promise<number>} A `Promise` resolving with the bloodline score.
 */
export function calculateBloodlineScore(id: number, horses: Horse[]): Promise<number | null> {
    const horse: Horse | undefined = horses.find(horse => horse.id === id);

    if (horse?.sireId == null)
        return Promise.resolve(null);

    const filteredHorses = horses.filter(h => (h.stallionScore?.breeding != null) && (h.id === horse.sireId || h.sireId === horse.sireId));
    return Promise.resolve(filteredHorses.length < 1 ? 0 : filteredHorses.reduce((score, horse) => score + horse.stallionScore!.breeding!, 0) / filteredHorses.length);
}

/**
 * Calculates the breeding score of a particular horse.
 * @param {number} id - the id of the horse.
 * @returns {Promise<BreedingScore>} A `Promise` resolving with the breeding score and its confidence level.
 */
export async function calculateBreedingScore(id: number): Promise<BreedingScore> {
    const report: string = await getProgenyReport(id);
    const totalStarters: number = parseInt(report.match(/<b[^>]*>\s*Total\s+Starters\s*:\s*<\/b[^>]*>\s*([\d,]+)/is)?.[1] ?? '0');
    const totalEarnings: number = parseCurrency(report.match(/<b[^>]*>\s*Total\s+Earnings\s*:\s*<\/b[^>]*>\s*([$\d,]+(?:\.\d+)?)/is)?.[1] ?? '$0');
    const stakeStarters: number = parseInt(report.match(/<b[^>]*>\s*Stake\s+Starters\s*:\s*<\/b[^>]*>\s*([\d,]+)/is)?.[1] ?? '0');
    const stakeWinners: number = parseInt(report.match(/<b[^>]*>\s*Stake\s+Winners\s*:\s*<\/b[^>]*>\s*([\d,]+)/is)?.[1] ?? '0');
    const [stakeStarts, stakePlaces]: [number, number] = (report.match(/<b[^>]*>\s*Stake\s+Results\s*:\s*<\/b[^>]*>\s*([\d,]+)\s*-\s*([\d,]+)\s*-\s*([\d,]+)\s*-\s*([\d,]+)\s*\([$\d,]+(?:\.\d+)?\)/is)?.slice(1).map(parseCurrency)
        ?? [0, 0, 0, 0]).reduce(([starts, places], value, index) => [starts + +(index === 0) * value, places + +(index !== 0) * value], [0, 0]);

    return {
        score: totalStarters < 1 ? null :
            1250 * stakeWinners / totalStarters
            + (stakeStarts < 1 ? 0 : 100 * stakePlaces / stakeStarts)
            + 50 * stakeStarters / totalStarters
            + totalEarnings / totalStarters / 20000,
        confidence: Math.max(0, Math.min(1, totalStarters / 140))
    };
}

/**
 * Calculates the racing score of a particular horse.
 * @param {number} id - the id of the horse.
 * @returns {Promise<number>} A `Promise` resolving with the racing score.
 */
export async function calculateRacingScore(id: number): Promise<number | null> {
    const profile: string = await getInfo(id);
    const [starts, wins, places, shows, earnings]: number[] = profile.match(/<b[^>]*>\s*Lifetime\s+Race\s+Record\s*<\/b[^>]*>\s*<br[^>]*>\s*([\d,]+)\s*-\s*([\d,]+)\s*-\s*([\d,]+)\s*-\s*([\d,]+)\s*\(([$\d,]+(?:\.\d+)?)\)/is)?.slice(1).map(parseCurrency) ?? [0, 0, 0, 0];
    const [stakeStarts, stakeWins, stakePlaces, stakeShows, stakeEarnings]: number[] = profile.match(/<b[^>]*>\s*Stake\s+Record\s*<\/b[^>]*>\s*<br[^>]*>\s*([\d,]+)\s*-\s*([\d,]+)\s*-\s*([\d,]+)\s*-\s*([\d,]+)\s*\(([$\d,]+(?:\.\d+)?)\)/is)?.slice(1).map(parseCurrency) ?? [0, 0, 0, 0, 0];

    return starts < 1 ? null :
        0.3 * (
            (starts < 1 ? 0 : 100 * (wins - stakeWins) / (starts - stakeStarts))
            + Math.max(0, Math.log(earnings - stakeEarnings) || 0)
            + Math.max(0, Math.log((earnings - stakeEarnings) / (starts - stakeStarts)) || 0)
        ) + 0.85 * (
            Math.max(0, Math.sqrt(stakeStarts) || 0)
            + (stakeStarts < 1 ? 0 : 100 * (stakeWins + stakePlaces + stakeShows) / stakeStarts)
            + Math.max(0, Math.log(stakeEarnings) || 0)
            + Math.max(0, Math.log(stakeEarnings / stakeStarts) || 0)
        );
}

/**
 * Calculates the composite stallion score of a particular horse.
 * @param {number} id - the id of the horse.
 * @returns {Promise<number>} A `Promise` resolving with the composite stallion score.
 */
export function calculateStallionScore({ confidence, racing: racingScore, breeding: breedingScore, bloodline: bloodlineScore }: StallionScore): Promise<number | null> {
    if (confidence == null || (breedingScore == null && racingScore == null && bloodlineScore == null))
        return Promise.resolve(null);

    return Promise.resolve(
        ((1 - confidence) * (+racingScore! + bloodlineScore!) / (+(racingScore != null) + +(bloodlineScore != null)))
        + (confidence! * +breedingScore!)
    );
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
        const avgEarnings: number = parseCurrency(report?.match(/<b[^>]*>\s*Average\s*Earnings\s*per\s*Starter\s*:\s*<\/b[^>]*>\s*([$\d,\.]+(?:\.\d+)?)/i)?.pop() ?? '$0');

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
        const [starts, earnings]: number[] = info?.match(/<b[^>]*>\s*Lifetime\s+Race\s+Record\s*<\/b[^>]*>\s*<br[^>]*>\s*([\d,]+)(?:\s*-\s*[\d,]+){3}\s*\(([$\d,\.]+(?:\.\d+)?)\)/i)?.slice(1)?.map(parseCurrency) ?? [0, 0];

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
 * Calculates the suggested stud fee of a particulra horse.
 * @param {object} data - an object containing the id of the horse and the formula to use.
 * @returns {Promise<number>} A `Promise` resolving with the suggested stud fee.
 */
export function createStallionScoreBadge(data: StallionScore | null | undefined): HTMLElement {
    const badge: HTMLElement = document.createElement('div');
    badge.classList.add('hn-plus-stallion-score');

    const score: HTMLElement = document.createElement('h3');
    score.classList.add('hn-plus-breeding-score-value');

    const level: HTMLElement = document.createElement('h4');
    level.classList.add('hn-plus-breeding-score-level');

    const tooltip: HTMLElement = document.createElement('aside');
    tooltip.classList.add('hn-plus-breeding-score-tooltip');

    if (data?.value != null) {
        const stallionScore: number = Math.floor(data.value!);
        score.innerHTML = `<b>${stallionScore.toString()}</b>`;
        tooltip.innerHTML = `<p>The HarnessNation+ stallion score reflects the estimated breeding ability of a stallion.</p><p class="hn-plus-stallion-score-confidence"><b>Confidence:</b> ${Math.round(100 * data.confidence!)}%</p>`;

        if (stallionScore >= 110) {
            level.textContent = 'Elite';
            badge.classList.add('grade-a-plus');
        } else if (stallionScore >= 90) {
            level.textContent = 'Good';
            badge.classList.add('grade-b-plus');
        } else if (stallionScore >= 50) {
            level.textContent = 'Average';
            badge.classList.add('grade-c-plus');
        } else if (stallionScore >= 25) {
            level.textContent = 'Weak';
            badge.classList.add('grade-d-plus');
        } else if (stallionScore >= 0) {
            level.textContent = 'Poor';
            badge.classList.add('grade-e-plus');
        } else
            level.textContent = 'N/A';
    } else {
        score.innerHTML = '<i>N/A</i>';
        tooltip.innerHTML = '<p>The HarnessNation+ stallion score reflects the estimated breeding ability of a stallion.</p><p>The stallion score isn\'t available for this horse.</p>';
    }

    badge.append(score, level, tooltip);
    return badge;
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
            'Stake Earnings',
        ].filter(v => !!v).map((v, i) => headers?.[i] ?? v),
    ];

    const _ids: number[] = [...ids];
    let batch: number[] | null;

    while ((batch = _ids.splice(0, 10)) && batch.length > 0) {
        const rows = await Promise.all(batch.map(id => getBreedingReportRow(id)));
        csv.push(...rows.map(row => row.slice(0, csv[0].length)));

        if (_ids.length > 0) {
            await sleep(30000);

            if (csv.length % 50 === 0)
                await sleep(15000);
        }
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

    const totalFoals: number = parseInt(profile.match(/<b[^>]*>\s*Total\s+Foals\s*:\s*<\/b[^>]*>\s*([\d,]+)/is)?.[1] ?? '0');
    const totalStarters: number = parseInt(report.match(/<b[^>]*>\s*Total\s+Starters\s*:\s*<\/b[^>]*>\s*([\d,]+)/is)?.[1] ?? '0');
    const totalWinners: number = parseInt(report.match(/<b[^>]*>\s*Total\s+Winners\s*:\s*<\/b[^>]*>\s*([\d,]+)/is)?.[1] ?? '0');
    const stakeStarters: number = parseInt(report.match(/<b[^>]*>\s*Stake\s+Starters\s*:\s*<\/b[^>]*>\s*([\d,]+)/is)?.[1] ?? '0');
    const stakeWinners: number = parseInt(report.match(/<b[^>]*>\s*Stake\s+Winners\s*:\s*<\/b[^>]*>\s*([\d,]+)/is)?.[1] ?? '0');

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

/**
 * Creates a `Horse` object for the given horse.
 * @param {number} id - the id of the horse.
 * @returns {Promise<Horse>} A `Promise` that resolves with the `Horse` object.
 */
export async function getHorse(id: number): Promise<Horse> {
    const info: string = await getInfo(id);

    return {
        id,
        name: info?.match(/<h1[^>]*>\s*(.*?)\s*<\/h1[^>]*>/is)?.[1]?.trim(),
        sireId: info?.match(/<b[^>]*>\s*Sire:\s*<\/b[^>]*>\s*<a[^>]*horse\/(\d+)[^>]*>/is)?.map(parseInt)?.[1] || null,
        damId: info?.match(/<b[^>]*>\s*Dam:\s*<\/b[^>]*>\s*<a[^>]*horse\/(\d+)[^>]*>/is)?.map(parseInt)?.[1] || null,
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