import { parseCurrency, seasonsBetween } from '../lib/utils.js';
import { api } from './harnessnation.js'

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
        const removed = deleteCount == null && items.length === 0
            ? super.splice(start)
            : super.splice(start, deleteCount ?? 0, ...items);

        return new RaceList(...removed);
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

        const age = data[4].trim().replace(/&amp;/gi, '&');

        races.push({
            id: raceId,
            name: data[2].replace('Elim', '').trim(),
            stake: isStake,
            elim: isStake && / Elim$/i.test(data[2].trim()),
            age: /^Two-Year-Old$/i.test(age)
                ? '2yo'
                : /^Three-Year-Old$/i.test(age)
                    ? '3yo'
                    : /^Four-Year-Old & Younger$/i.test(age)
                        ? '2-4yo'
                        : /^Five-Year-Old & Older$/i.test(age)
                            ? '5yo+'
                            : /^Six-Year-Old & Older$/i.test(age)
                                ? '6yo+'
                                : undefined,
            condition: data[5]?.replace(/(\\[rn]|[\r\n\s])+/gs, ' ')?.trim(),
            gait: /^trot/i.test(data[6]) ? 'trot' : 'pace',
            trackCondition: data[7]?.trim()?.toLowerCase(),
            trackSize: /^half/i.test(data[8]) ? 'half' : 'full',
            purse: parseCurrency(data[9]),
            finish: parseInt(data[10]),
            time: data[11].split(':').map(parseFloat).reduce((seconds: number, time: number, index: number) => seconds + (index === 0 ? time * 60 : time), 0),
            date: new Date(data[12].replace(/(\d+)[A-Z]{2}/i, '$1')),
        });
    }

    return races;
}