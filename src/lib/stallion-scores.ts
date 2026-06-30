import { api } from './harnessnation.js';
import { Horse } from './horses.js';
import { getBreedingReport } from './reporting.js';
import { parseCurrency } from './utils.js';

export interface BreedingScore {
    score: number | null;
    confidence: number;
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

    const filteredHorses = horses
        .filter(h => (h.stallionScore?.breeding != null) && (h.id === horse.sireId || h.sireId === horse.sireId))
        .sort((a, b) => a.stallionScore!.breeding! - b.stallionScore!.breeding!);

    if (filteredHorses.length >= 10) {
        const trim = Math.floor(filteredHorses.length / 10);
        filteredHorses.splice(filteredHorses.length - trim);
        filteredHorses.splice(0, trim);
    }

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
    const report = await getBreedingReport(id, 'enhanced');

    return {
        score: report.totalStarters < 1
            ? null
            : parseFloat(Number(
                1250 * report.stakeWinners / report.totalStarters
                + (report.stakeStarts < 1 ? 0 : 100 * (report.stakeWins + report.stakePlaces + report.stakeShows) / report.stakeStarts)
                + 50 * report.stakeStarters / report.totalStarters
                + report.totalEarnings / report.totalStarters / 20000
            ).toFixed(6)),
        confidence: parseFloat(Number(
            Math.max(0, Math.min(1, report.totalStarters / 200))
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

    const nonStakeStarts = starts - stakeStarts;
    const nonStakeWins = wins - stakeWins;
    const nonStakeEarnings = earnings - stakeEarnings;

    return starts < 1
        ? null
        : parseFloat(Number(
            0.3 * (
                (nonStakeStarts < 1 ? 0 : 100 * nonStakeWins / nonStakeStarts)
                + Math.max(0, Math.log(nonStakeEarnings) || 0)
                + (nonStakeStarts < 1 ? 0 : Math.max(0, Math.log(nonStakeEarnings / nonStakeStarts) || 0))
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

    const racingScoreWeight = racingScore != null ? 1 : 0;
    const bloodlineScoreWeight = bloodlineScore != null ? 1 : 0;

    racingScore ??= 0;
    breedingScore ??= 0;
    bloodlineScore ??= 0;

    return Promise.resolve(parseFloat(Number(
        ((1 - confidence) * (racingScore + bloodlineScore) / Math.max(1, racingScoreWeight + bloodlineScoreWeight))
        + (confidence * breedingScore)
    ).toFixed(6)));
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

        if (stallionScore >= 110) {
            level.textContent = 'Elite';
            badge.classList.add('grade-a-plus');
        } else if (stallionScore >= 70) {
            level.textContent = 'Good';
            badge.classList.add('grade-b-plus');
        } else if (stallionScore >= 40) {
            level.textContent = 'Average';
            badge.classList.add('grade-c-plus');
        } else if (stallionScore >= 20) {
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