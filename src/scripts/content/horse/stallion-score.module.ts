import { ActionType, sendAction } from '../../../lib/actions.js';
import { onInstalled } from '../../../lib/events.js';
import { Horse } from '../../../lib/horses.js';

(async (): Promise<void> => {
    async function addBreedingScore() {
        const id: number = document.body.innerHTML.match(/<small[^>]*>\s*<b[^>]*>\s*ID\s*:\s*<\/b[^>]*>\s*(\d+)/i)?.slice(1)?.map(parseInt)?.[0] ?? 0;

        if (id > 0) {
            const horse: Horse | undefined = (await sendAction(ActionType.GetHorse, { id })).data;

            if (horse?.stallionScore?.value != null) {
                const breedingScore: number = Math.floor(horse.stallionScore.value);

                const score: HTMLElement = document.createElement('h3');
                score.classList.add('hn-plus-breeding-score-value');
                score.innerHTML = `<b>${breedingScore.toString()}</b>`;

                const level: HTMLElement = document.createElement('h4');
                level.classList.add('hn-plus-breeding-score-level');
                level.textContent = '';

                const tooltip: HTMLElement = document.createElement('aside');
                tooltip.classList.add('hn-plus-breeding-score-tooltip');
                tooltip.innerHTML = `<p>The HarnessNation+ breeding score reflects the estimated breeding ability of a stallion.</p><p><b>Confidence:</b> ${Math.round(100 * horse.stallionScore.confidence!)}%</p>`;

                const el: HTMLElement = document.createElement('div');
                el.classList.add('hn-plus-stallion-score');
                el.append(score, level, tooltip);

                if (breedingScore >= 110) {
                    level.textContent = 'Elite';
                    el.classList.add('grade-a-plus');
                } else if (breedingScore >= 90) {
                    level.textContent = 'Good';
                    el.classList.add('grade-b-plus');
                } else if (breedingScore >= 40) {
                    level.textContent = 'Average';
                    el.classList.add('grade-c-plus');
                } else if (breedingScore >= 20) {
                    level.textContent = 'Weak';
                    el.classList.add('grade-d-plus');
                } else if (breedingScore >= 0) {
                    level.textContent = 'Poor';
                    el.classList.add('grade-e-plus');
                }

                const name: HTMLElement | null = document.querySelector('h1.font-weight-bold.text-left');
                name?.parentElement?.nextElementSibling?.insertBefore(el, name?.parentElement?.nextElementSibling.firstChild);

                onInstalled((): void => el.remove());
            }
        }
    }

    window.addEventListener('DOMContentLoaded', addBreedingScore, { once: true });

    if (document.querySelector('h1.font-weight-bold.text-left') != null)
        await addBreedingScore();
})();