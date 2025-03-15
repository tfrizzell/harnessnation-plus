import { CalculateStudFeeData } from './actions.js';
import { api } from './harnessnation.js'
import { StudFeeFormula } from './settings.js';
import { parseCurrency, parseInt, seasonsBetween } from './utils.js';

export interface BreedingScore {
    score: number | null;
    confidence: number;
}

export interface Horse {
    id?: number;
    name?: string;
    sireId?: number | null;
    damId?: number | null;
    retired?: boolean;
    stallionScore?: StallionScore | null;
}

export interface Race {
    id?: number;
    name?: string;
    stake?: boolean;
    elim?: boolean;
    age?: '2yo' | '3yo' | '2-4yo' | '4-5yo' | '5yo+' | '6yo+';
    condition?: string;
    gait?: 'trot' | 'pace';
    trackCondition?: string;
    trackSize?: 'full' | 'half';
    purse?: number;
    finish?: number;
    time?: number;
    date?: Date;
}

export class RaceList extends Array<Race> {
    #getEarnings(purse: number, finish: number): number {
        switch (finish) {
            case 1: return purse * 0.5;
            case 2: return purse * 0.25;
            case 3: return purse * 0.12;
            case 4: return purse * 0.08;
            case 5: return purse * 0.05;
            default: return 0;
        }
    }

    filter(predicate: (value: Race, index: number, array: Array<Race>) => unknown, thisArg?: any): RaceList {
        return new RaceList(...super.filter(predicate, thisArg));
    }

    slice(start?: number, end?: number): RaceList {
        return new RaceList(...super.slice(start, end));
    }

    splice(start: number, deleteCount?: number, ...items: Race[]): RaceList {
        return new RaceList(...super.splice(start, deleteCount!, ...items));
    }

    findAge(race: Race, ageRef?: Race): number | undefined {
        if (/^[23]yo$/i.test(race?.age ?? ''))
            return parseInt(race.age!.charAt(0));

        ageRef ??= this.findAgeRef();
        return !ageRef || !race?.date ? undefined : parseInt(ageRef.age!.charAt(0)) + seasonsBetween(ageRef.date!, race.date!);
    }

    findAgeRef(): Race | undefined {
        return this.find((race, index, races) =>
            /^[23]yo$/i.test(race.age ?? '')
            || (index < races.length - 1 && race.stake !== true && /^5yo\+$/i.test(race.age ?? '') && /^2-4yo$/i.test(races[index + 1].age ?? '')));
    }

    findFastestRace(predicate?: (value: Race, index: number, array: Array<Race>) => boolean): Race | undefined {
        return (predicate == null ? this.slice() : this.filter(predicate))
            .sort((a, b) => b.time! - a.time!)
            .pop();
    }

    findFastestWin(predicate?: (value: Race, index: number, array: Array<Race>) => boolean): Race | undefined {
        return this.filter((value: Race, index: number, array: Array<Race>) =>
            value.finish === 1 && predicate?.(value, index, array) !== false)
            .sort((a, b) => b.time! - a.time!)
            .pop();
    }

    getEarnings(predicate?: (value: Race, index: number, array: Array<Race>) => boolean): number {
        return (predicate == null ? this.slice() : this.filter(predicate))
            .reduce((earnings, race) => earnings + this.#getEarnings(race.purse ?? 0, race.finish ?? 0), 0);
    }

    getStarts(predicate?: (value: Race, index: number, array: Array<Race>) => boolean): number {
        return (predicate == null ? this.slice() : this.filter(predicate)).length;
    }

    getSummary(predicate?: (value: Race, index: number, array: Array<Race>) => boolean): [number, number, number, number, number] {
        return (predicate == null ? this.slice() : this.filter(predicate))
            .reduce(([starts, firsts, seconds, thirds, earnings], race) => [
                starts + 1,
                firsts + (race.finish === 1 ? 1 : 0),
                seconds + (race.finish === 2 ? 1 : 0),
                thirds + (race.finish === 3 ? 1 : 0),
                earnings + this.#getEarnings(race.purse ?? 0, race.finish ?? 0),
            ], [0, 0, 0, 0, 0]);
    }

    getWins(predicate?: (value: Race, index: number, array: Array<Race>) => boolean): number {
        return this.filter((value: Race, index: number, array: Array<Race>) =>
            value.finish === 1 && predicate?.(value, index, array) !== false).length;
    }
}

export interface StallionScore {
    value?: number | null;
    confidence?: number;
    racing?: number | null;
    breeding?: number | null;
    bloodline?: number | null;
}

export interface StallionScoreBadgeOptions {
    preview?: boolean;
    clickable?: boolean;
}

/**
 * Calculates the bloodline score of a particular horse.
 * @param {number} id - the id of the horse.
 * @returns {Promise<number>} A `Promise` resolving with the bloodline score.
 */
export function calculateBloodlineScore(id: number, horses: Horse[]): Promise<number | null> {
    const horse = horses.find(horse => horse.id === id);

    if (horse?.sireId == null)
        return Promise.resolve(null);

    const filteredHorses = horses.filter(h => (h.stallionScore?.breeding != null) && (h.id === horse.sireId || h.sireId === horse.sireId));

    return Promise.resolve(parseFloat(Number(
        filteredHorses.length < 1
            ? 0
            : filteredHorses.reduce((score, horse) => score + horse.stallionScore!.breeding!, 0) / filteredHorses.length
    ).toFixed(6)));
}

/**
 * Calculates the breeding score of a particular horse.
 * @param {number} id - the id of the horse.
 * @returns {Promise<BreedingScore>} A `Promise` resolving with the breeding score and its confidence level.
 */
export async function calculateBreedingScore(id: number): Promise<BreedingScore> {
    const report = await api.getProgenyReport(id);
    const totalStarters = parseInt(report.match(/<b[^>]*>\s*Total\s+Starters\s*:\s*<\/b[^>]*>\s*([\d,]+)/is)?.[1] ?? '0');
    const totalEarnings = parseCurrency(report.match(/<b[^>]*>\s*Total\s+Earnings\s*:\s*<\/b[^>]*>\s*([$\d,]+(?:\.\d+)?)/is)?.[1] ?? '$0');
    const stakeStarters = parseInt(report.match(/<b[^>]*>\s*Stake\s+Starters\s*:\s*<\/b[^>]*>\s*([\d,]+)/is)?.[1] ?? '0');
    const stakeWinners = parseInt(report.match(/<b[^>]*>\s*Stake\s+Winners\s*:\s*<\/b[^>]*>\s*([\d,]+)/is)?.[1] ?? '0');
    const [stakeStarts, stakePlaces] = (report.match(/<b[^>]*>\s*Stake\s+Results\s*:\s*<\/b[^>]*>\s*([\d,]+)\s*-\s*([\d,]+)\s*-\s*([\d,]+)\s*-\s*([\d,]+)\s*\([$\d,]+(?:\.\d+)?\)/is)?.slice(1).map(parseCurrency)
        ?? [0, 0, 0, 0]).reduce(([starts, places], value, index) => [starts + +(index === 0) * value, places + +(index !== 0) * value], [0, 0]);

    return {
        score: totalStarters < 1
            ? null
            : parseFloat(Number(
                1250 * stakeWinners / totalStarters
                + (stakeStarts < 1 ? 0 : 100 * stakePlaces / stakeStarts)
                + 50 * stakeStarters / totalStarters
                + totalEarnings / totalStarters / 20000
            ).toFixed(6)),
        confidence: parseFloat(Number(
            Math.max(0, Math.min(1, totalStarters / 140))
        ).toFixed(6)),
    };
}

/**
 * Calculates the racing score of a particular horse.
 * @param {number} id - the id of the horse.
 * @returns {Promise<number>} A `Promise` resolving with the racing score.
 */
export async function calculateRacingScore(id: number): Promise<number | null> {
    const info = await api.getHorse(id);
    const [starts, wins, places, shows, earnings] = info.match(/<b[^>]*>\s*Lifetime\s+Race\s+Record\s*<\/b[^>]*>\s*<br[^>]*>\s*([\d,]+)\s*-\s*([\d,]+)\s*-\s*([\d,]+)\s*-\s*([\d,]+)\s*\(([$\d,]+(?:\.\d+)?)\)/is)?.slice(1).map(parseCurrency) ?? [0, 0, 0, 0];
    const [stakeStarts, stakeWins, stakePlaces, stakeShows, stakeEarnings] = info.match(/<b[^>]*>\s*Stake\s+Record\s*<\/b[^>]*>\s*<br[^>]*>\s*([\d,]+)\s*-\s*([\d,]+)\s*-\s*([\d,]+)\s*-\s*([\d,]+)\s*\(([$\d,]+(?:\.\d+)?)\)/is)?.slice(1).map(parseCurrency) ?? [0, 0, 0, 0, 0];

    return starts < 1
        ? null
        : parseFloat(Number(
            0.3 * (
                (starts < 1 ? 0 : 100 * (wins - stakeWins) / (starts - stakeStarts))
                + Math.max(0, Math.log(earnings - stakeEarnings) || 0)
                + Math.max(0, Math.log((earnings - stakeEarnings) / (starts - stakeStarts)) || 0)
            ) + 0.85 * (
                Math.max(0, Math.sqrt(stakeStarts) || 0)
                + (stakeStarts < 1 ? 0 : 100 * (stakeWins + stakePlaces + stakeShows) / stakeStarts)
                + Math.max(0, Math.log(stakeEarnings) || 0)
                + Math.max(0, Math.log(stakeEarnings / stakeStarts) || 0)
            )
        ).toFixed(6));
}

/**
 * Calculates the composite stallion score of a particular horse.
 * @param {number} id - the id of the horse.
 * @returns {Promise<number>} A `Promise` resolving with the composite stallion score.
 */
export function calculateStallionScore({ confidence, racing: racingScore, breeding: breedingScore, bloodline: bloodlineScore }: StallionScore): Promise<number | null> {
    if (confidence == null || (breedingScore == null && racingScore == null && bloodlineScore == null))
        return Promise.resolve(null);

    return Promise.resolve(parseFloat(Number(
        ((1 - +confidence) * (+racingScore! + +bloodlineScore!) / Math.max(1, +(racingScore != null) + +(bloodlineScore != null)))
        + (+confidence! * +breedingScore!)
    ).toFixed(6)));
}

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
 * Calculates the suggested stud fee of a particulra horse.
 * @param {object} data - an object containing the id of the horse and the formula to use.
 * @returns {Promise<number>} A `Promise` resolving with the suggested stud fee.
 */
export function createStallionScoreBadge(data: StallionScore | null | undefined): HTMLElement {
    const badge = document.createElement('div');
    badge.classList.add('hn-plus-stallion-score');

    const score = document.createElement('h3');
    score.classList.add('hn-plus-stallion-score-value');

    const level = document.createElement('h4');
    level.classList.add('hn-plus-stallion-score-level');

    const tooltip = document.createElement('aside');
    tooltip.classList.add('hn-plus-stallion-score-tooltip');

    if (data?.value != null) {
        const stallionScore = Math.floor(data.value!);
        score.innerHTML = `<b>${stallionScore.toString()}</b>`;
        tooltip.innerHTML = `<p>The HarnessNation+ stallion score reflects the estimated breeding ability of a stallion.</p><p class="hn-plus-stallion-score-confidence"><b>Confidence:</b> ${Math.round(100 * data.confidence!)}%</p>`;

        if (stallionScore >= 100) {
            level.textContent = 'Elite';
            badge.classList.add('grade-a-plus');
        } else if (stallionScore >= 75) {
            level.textContent = 'Good';
            badge.classList.add('grade-b-plus');
        } else if (stallionScore >= 50) {
            level.textContent = 'Average';
            badge.classList.add('grade-c-plus');
        } else if (stallionScore >= 30) {
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
 * Gets the `Horse` object for the given horse.
 * @param {number} id - the id of the horse.
 * @returns {Promise<Horse>} A `Promise` that resolves with the `Horse` object.
 */
export async function getHorse(id: number): Promise<Horse> {
    const html = await api.getHorse(id);

    return {
        id: parseInt(html?.match(/<b[^>]*>\s*ID:\s*<\/b[^>]*>\s*(\d+)/is)?.[1]!),
        name: html?.match(/<h1[^>]*>\s*(.*?)\s*<\/h1[^>]*>/is)?.[1]?.trim(),
        sireId: html?.match(/<b[^>]*>\s*Sire:\s*<\/b[^>]*>\s*<a[^>]*horse\/(\d+)[^>]*>/is)?.map(parseInt)?.[1] || null,
        damId: html?.match(/<b[^>]*>\s*Dam:\s*<\/b[^>]*>\s*<a[^>]*horse\/(\d+)[^>]*>/is)?.map(parseInt)?.[1] || null,
        retired: !!html?.match(/<br[^>]*>\s*<br[^>]*>\s*Retired\s*<br[^>]*>/is)?.[0],
    };
}

/**
 * Gets the array of `Race` objects for the given horse.
 * @param {number} id - the id of the horse.
 * @param {string} token - the CSRF token to sign the request with.
 * @returns {Promise<Race[]>} A `Promise` that resulves with the array of `Race` objects.
 */
export async function getRaces(id: number, token?: string): Promise<RaceList> {
    token ??= await api.getCSRFToken();
    const html = await api.getRaceHistory(id, token);
    const races: RaceList = new RaceList();
    const raceIds: number[] = [];

    for (const data of html.matchAll(/<tr[^>]*>\s*<td[^>]*>\s*<a[^>]*data-attr-race-id="(\d+)"[^>]*>\s*<b[^>]*>(.*?)<\/b[^>]*>\s*<\/a[^>]*>\s*(<i[^>]*fa-star[^>]*>\s*<\/i[^>]*>)?.*?\s*<br[^>]*>\s*(\w+-Year-Old(?:\s*&(?:amp;)?\s*.*?)?)\s+(.*?)\s*<br[^>]*>\s*(Trotting|Pacing)\s+on\s+(\S+)\s+(Full|Half)\s+Mile\s*<\/td>\s*<td[^>]*>\s*<span[^>]*raceHistPurse[^>]*>\s*<\/span[^>]*>\s*(\$[\d,]+).*?<\/td[^>]*>\s*<td[^>]*>\s*<span[^>]*raceHistFinish[^>]*>\s*<\/span[^>]*>\s*(\d+)<sup[^>]*>\w+<\/sup[^>]*>.*?<br[^>]*>\s*(\d+:\d+(?:\.\d+)?).*?<\/td[^>]*>\s*<td[^>]*>.*?<\/td[^>]*>\s*<td[^>]*>\s*<span[^>]*raceHistDate[^>]*>\s*<\/span[^>]*>\s*\w+\s+(\w+\s+\d+\w{2},\s+\d+).*?<\/td[^>]*>\s*<\/tr>/gis)) {
        const raceId = parseInt(data[1]);

        if (raceIds.includes(raceId))
            continue;

        const isStake = !!data[3] && !/^(Maiden )?(Open|Preferred|Claiming \$[\d,]+)$/i.test(data[2].trim());
        raceIds.push(raceId);

        races.push({
            id: raceId,
            name: data[2].replace('Elim', '').trim(),
            stake: isStake,
            elim: isStake && / Elim$/i.test(data[2].trim()),
            age: /^Two-Year-Old$/i.test(data[4].trim())
                ? '2yo'
                : /^Three-Year-Old$/i.test(data[4].trim())
                    ? '3yo'
                    : /^Four-Year-Old &amp; Younger$/i.test(data[4].trim())
                        ? '2-4yo'
                        : /^Five-Year-Old &amp; Older$/i.test(data[4].trim())
                            ? '5yo+'
                            : /^Six-Year-Old &amp; Older$/i.test(data[4].trim())
                                ? '6yo+'
                                : undefined,
            condition: data[5].replace(/\s+/, ' ')?.trim(),
            gait: /^trot/i.test(data[6]) ? 'trot' : 'pace',
            trackCondition: data[7]?.trim()?.toLowerCase(),
            trackSize: /^half/i.test(data[8]) ? 'half' : 'full',
            purse: parseCurrency(data[9]),
            finish: parseInt(data[10]),
            time: data[11].split(':').map(parseFloat).reduce((seconds: number, time: number, index: number): number => seconds + (index === 0 ? time * 60 : time), 0),
            date: new Date(data[12].replace(/(\d+)[A-Z]{2}/i, '$1')),
        });
    }

    return races;
}