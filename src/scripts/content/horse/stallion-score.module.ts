import { ActionType, sendAction } from '../../../lib/actions.js';
import { onInstalled } from '../../../lib/events.js';
import { Horse, StallionScore } from '../../../lib/horses.js';

(async (): Promise<void> => {
    async function addStallionScore() {
        const id: number = document.body.innerHTML.match(/<b[^>]*>\s*ID\s*:\s*<\/b[^>]*>\s*(\d+)/i)?.slice(1)?.map(parseInt)?.[0] ?? 0;
        const gender: string | undefined = document.body.innerHTML.match(/<b[^>]*>\s*Gender\s*:\s*<\/b[^>]*>\s*(\S+)/i)?.[0]?.toLowerCase();
        const breeding: boolean = /<b[^>]*>\s*Location\s*:\s*<\/b[^>]*>\s*Breeding\s+Stable/i.test(document.body.innerHTML);

        if (gender !== 'stallion' || id < 1)
            return;

        const horse: Horse | undefined = (await sendAction(ActionType.GetHorse, { id })).data;

        const score: HTMLElement = document.createElement('h3');
        score.classList.add('hn-plus-breeding-score-value');

        const level: HTMLElement = document.createElement('h4');
        level.classList.add('hn-plus-breeding-score-level');
        level.textContent = '';

        const tooltip: HTMLElement = document.createElement('aside');
        tooltip.classList.add('hn-plus-breeding-score-tooltip');
        tooltip.addEventListener('click', e => e.stopPropagation());

        const el: HTMLElement = document.createElement('div');
        el.classList.add('hn-plus-stallion-score');
        el.append(score, level, tooltip);

        if (horse?.stallionScore?.value == null) {
            score.innerHTML = '<i>N/A</i>';

            tooltip.innerHTML = breeding
                ? '<p>The HarnessNation+ stallion score reflects the estimated breeding ability of a stallion.</p><p>The stallion score isn\'t available for this horse. Click the box to evaluate the stallion score.</p>'
                : '<p>The HarnessNation+ stallion score reflects the estimated breeding ability of a stallion.</p><p>The stallion score isn\'t available for this horse. Click the box to preview the stallion score.</p>';

            el.addEventListener('click', async () => {
                const prevTooltip = tooltip.innerHTML;
                tooltip.innerHTML = 'Please wait while the stallion score is calculated...';

                const data: StallionScore | null | undefined = (await sendAction(ActionType.PreviewStallionScore, { id })).data;

                if (data != null) {
                    await updateStallionScore(el, data);

                    if (breeding)
                        await sendAction(ActionType.SaveHorses, [{ id, stallionScore: data }]);
                } else
                    tooltip.innerHTML = prevTooltip.replace(/\s*Click\s+the\s+box\s+[^.]+/i, '');
            }, { once: true });
        } else
            updateStallionScore(el, horse.stallionScore!);

        const name: HTMLElement | null = document.querySelector('h1.font-weight-bold.text-left');
        name?.parentElement?.nextElementSibling?.insertBefore(el, name?.parentElement?.nextElementSibling.firstChild);
        onInstalled((): void => el.remove());
    }

    async function updateStallionScore(el: HTMLElement, data: StallionScore): Promise<void> {
        const score: HTMLElement = el.querySelector('.hn-plus-breeding-score-value')!;
        const level: HTMLElement = el.querySelector('.hn-plus-breeding-score-level')!;
        const tooltip: HTMLElement = el.querySelector('.hn-plus-breeding-score-tooltip')!;

        const stallionScore: number = Math.floor(data.value!);
        score.innerHTML = `<b>${stallionScore.toString()}</b>`;
        tooltip.innerHTML = `<p>The HarnessNation+ stallion score reflects the estimated breeding ability of a stallion.</p><p class="hn-plus-stallion-score-confidence"><b>Confidence:</b> ${Math.round(100 * data.confidence!)}%</p>`;
        el.classList.remove('grade-a-plus', 'grade-b-plus', 'grade-c-plus', 'grade-d-plus', 'grade-e-plus');

        if (stallionScore >= 110) {
            level.textContent = 'Elite';
            el.classList.add('grade-a-plus');
        } else if (stallionScore >= 90) {
            level.textContent = 'Good';
            el.classList.add('grade-b-plus');
        } else if (stallionScore >= 40) {
            level.textContent = 'Average';
            el.classList.add('grade-c-plus');
        } else if (stallionScore >= 20) {
            level.textContent = 'Weak';
            el.classList.add('grade-d-plus');
        } else if (stallionScore >= 0) {
            level.textContent = 'Poor';
            el.classList.add('grade-e-plus');
        } else
            level.textContent = 'N/A';

        return Promise.resolve();
    }

    window.addEventListener('DOMContentLoaded', addStallionScore, { once: true });

    if (document.querySelector('h1.font-weight-bold.text-left') != null)
        await addStallionScore();
})();