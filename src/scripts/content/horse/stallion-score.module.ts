import { ActionType, sendAction } from '../../../lib/actions.js';
import { onLoad } from '../../../lib/events.js';
import { createStallionScoreBadge } from '../../../lib/horses.js';
import { removeAll } from '../../../lib/utils.js';

async function addStallionScore(): Promise<void> {
    const id = document.body.innerHTML.match(/<b[^>]*>\s*ID\s*:\s*<\/b[^>]*>\s*(\d+)/i)?.slice(1)?.map(parseInt)?.[0] ?? 0;
    const gender = document.body.innerHTML.match(/<b[^>]*>\s*Gender\s*:\s*<\/b[^>]*>\s*(\S+)/i)?.[1]?.toLowerCase();
    const breeding = /<b[^>]*>\s*Location\s*:\s*<\/b[^>]*>\s*Breeding\s+Stable/i.test(document.body.innerHTML);
    const retired = /<br[^>]*>\s*Retired\s*<br[^>]*>/i.test(document.body.innerHTML);
    const totalFoals = parseInt(document.body.innerHTML.match(/<b[^>]*>\s*Total\s+Foals\s*:\s*<\/b[^>]*>\s*(\d+)/i)?.[1] ?? '0') || 0;

    if (gender !== 'stallion' || id < 1)
        return;

    const horse = (await sendAction(ActionType.GetHorse, { id })).data;
    const previewOnly = (!breeding && (!retired || totalFoals < 1));

    if (retired && totalFoals > 0 && horse?.stallionScore == null) {
        const stallionScore = (await sendAction(ActionType.PreviewStallionScore, { id })).data;
        await sendAction(ActionType.SaveHorses, [{ id, stallionScore }]);
        await addStallionScore();
        return;
    }

    let badge = createStallionScoreBadge(horse?.stallionScore);

    let tooltip = badge.querySelector('.hn-plus-stallion-score-tooltip')!;
    tooltip.addEventListener('click', e => e.stopPropagation());

    if (horse?.stallionScore?.confidence == null) {
        tooltip.innerHTML = tooltip.innerHTML.replace(/<\/p[^>]*>$/i, ` Click the box to ${previewOnly ? 'preview' : 'evaluate'} the stallion score.</p>`)
        tooltip.addEventListener('click', e => e.stopPropagation());

        badge.classList.add('hn-plus-stallion-score-available');

        badge.addEventListener('click', async () => {
            const prevTooltip = tooltip.innerHTML;
            tooltip.innerHTML = '<p>Please wait while the stallion score is calculated...</p>';

            badge.classList.remove('hn-plus-stallion-score-available');
            const data = (await sendAction(ActionType.PreviewStallionScore, { id })).data;

            if (data != null) {
                const newBadge = createStallionScoreBadge(data);
                badge.replaceWith(newBadge);

                badge = newBadge;
                tooltip = newBadge.querySelector('.hn-plus-stallion-score-tooltip')!;

                if (previewOnly) {
                    tooltip.innerHTML += '<p>This value is a projection of what the stallion score would be if the horse were retired to stud right now.</p>';
                    badge.classList.add('hn-plus-stallion-score-preview');
                } else
                    await sendAction(ActionType.SaveHorses, [{ id, stallionScore: data }]);
            } else
                tooltip.innerHTML = prevTooltip.replace(/\s*Click\s+the\s+box\s+[^.]+/i, '');
        }, { once: true });
    }

    const parent =  document.querySelector('h1.font-weight-bold.text-left')?.parentElement?.nextElementSibling;
    parent?.insertBefore(badge, parent?.firstChild);
}

function removeStallionScore(): void {
    removeAll('.hn-plus-stallion-score')
}

onLoad(() => {
    removeStallionScore();
    addStallionScore();
});