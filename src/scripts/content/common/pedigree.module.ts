import { ActionType, sendAction } from '../../../lib/actions.js';
import { pastels as palette } from '../../../lib/colors.js';
import { onInstalled, onLoad } from '../../../lib/events.js';
import { createStallionScoreBadge } from '../../../lib/stallion-scores.js';
import { removeAll } from '../../../lib/utils.js';

async function addStallionScores(container?: Element | null): Promise<void> {
    container ??= document.querySelector('.pedigreeContainer');

    if (container?.classList.contains('pedigreeContainer') !== true)
        return;

    const stallionScores = new Map((await sendAction(ActionType.GetHorses)).data
        .filter(horse => horse.id != null && horse.stallionScore?.value != null)
        .map(horse => [horse.id, horse.stallionScore]));

    const colors = Array.from(container.innerHTML.matchAll(/<a[^>]*\/horse\/(\d+)[^>]*>/ig))
        .map(match => parseInt(match[1]))
        .filter((id, index, array) =>
            array.indexOf(id) === index && array.lastIndexOf(id) !== index)
        .reduce<{ [key: number]: string }>((colors, id, index) =>
            ({ ...colors, [id]: palette[index % palette.length] }), {});

    const cells = Array.from(container.querySelectorAll<HTMLTableCellElement>('.pedigree > tbody > tr > td'))
        .filter(td => td.textContent.trim().length > 0);

    container.querySelectorAll<HTMLAnchorElement>('a[href*="/horse/"]').forEach(el => {
        const id = parseInt(el.getAttribute('href')?.match(/\/horse\/(\d+)/)?.[1] ?? '');
        const stallionScore = stallionScores.get(id);

        if (stallionScore != null) {
            const badge = createStallionScoreBadge(stallionScore);
            el.parentElement?.insertBefore(badge, el.parentNode?.querySelector('br:last-of-type') ?? null);
        }

        if (!(id in colors) || el.parentElement == null)
            return;

        el.parentElement.style.setProperty('background', `#${colors[id]}66`);

        el.parentElement.addEventListener('mouseenter', () => {
            cells.forEach(td => {
                if (td.querySelector(`:scope > a[href$="/horse/${id}"]`))
                    td.style.setProperty('background', `#${colors[id]}cc`);
                else
                    td.style.setProperty('opacity', '0.5');
            });
        });

        el.parentElement.addEventListener('mouseleave', () => {
            cells.forEach(td => {
                if (td.querySelector(`:scope > a[href$="/horse/${id}"]`))
                    td.style.setProperty('background', `#${colors[id]}66`);
                else
                    td.style.removeProperty('opacity');
            });
        });
    });
}

function removeStallionScores(): void {
    removeAll('.pedigreeContainer .hn-plus-stallion-score');
}

const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
        let container = Array.from(mutation.addedNodes)
            .find(node => (node instanceof HTMLElement) && (node.classList.contains('pedigreeContainer') || node.querySelector('.pedigreeContainer') != null)) as Element | null | undefined;

        if (container == null)
            return;

        if (!container.classList.contains('pedigreeContainer'))
            container = container.querySelector('.pedigreeContainer');

        void addStallionScores(container)
    });
});

observer.observe(document, { childList: true, subtree: true });

onInstalled(() => {
    observer.disconnect();
});

onLoad(() => {
    removeStallionScores();

    if (document.querySelector('.pedigreeContainer'))
        void addStallionScores();
});