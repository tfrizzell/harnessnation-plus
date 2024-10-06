import { ActionType, sendAction } from '../../../lib/actions.js';
import { pastels as palette } from '../../../lib/colors.js';
import { onInstalled } from '../../../lib/events.js';
import { createStallionScoreBadge, Horse, StallionScore } from '../../../lib/horses.js';

const stallionScores: Map<number, StallionScore> = new Map((await sendAction(ActionType.GetHorses)).data
    ?.filter((horse: Horse) => horse.id != null && horse.stallionScore?.value != null)
    ?.map((horse: Horse) => [horse.id!, horse.stallionScore!])
    ?? []);

const observer: MutationObserver = new MutationObserver((mutations: MutationRecord[]): void => {
    mutations.forEach((mutation: MutationRecord): void => {
        let container: Element | undefined = [...mutation.addedNodes].find((node: Node): boolean => (node instanceof HTMLElement) && (node.classList.contains('pedigreeContainer') || node.querySelector('.pedigreeContainer') != null)) as Element;

        if (container == null)
            return;
        else if (!container.classList.contains('pedigreeContainer'))
            container = container.querySelector('.pedigreeContainer')!;

        const colors: { [key: number]: string } = [...container.innerHTML.matchAll(/<a[^>]*\/horse\/(\d+)[^>]*>/ig)]
            .map((match: string[]) => parseInt(match[1]))
            .filter((id: number, index: number, array: number[]): boolean => array.indexOf(id) === index && array.lastIndexOf(id) !== index)
            .reduce((colors: { [key: number]: string }, id: number, index: number): { [key: number]: string } => ({ ...colors, [id]: palette[index % palette.length] }), {});

        const cells: HTMLElement[] = [].filter.call(container.querySelectorAll('.pedigree > tbody > tr > td'),
            (td: HTMLElement) => td.textContent!.trim().length > 0);

        container.querySelectorAll('a[href*="/horse/"]').forEach((el: Element) => {
            const id: number = parseInt(el.getAttribute('href')!.match(/\/horse\/(\d+)/)![1]!);
            const stallionScore: StallionScore | undefined = stallionScores.get(id);

            if (stallionScore != null) {
                const badge = createStallionScoreBadge(stallionScore);
                el.parentElement?.insertBefore?.(badge, el.parentNode?.querySelector('br:last-of-type') ?? null);
            }

            if (!(id in colors))
                return;

            el.parentElement!.style.setProperty('background', `#${colors[id]}66`);

            el.parentElement!.addEventListener('mouseenter', (): void => {
                cells.forEach((td: HTMLElement) => {
                    if (td.querySelector(`:scope > a[href$="/horse/${id}"]`))
                        td.style.setProperty('background', `#${colors[id]}cc`);
                    else
                        td.style.setProperty('opacity', '0.5');
                });
            });

            el.parentElement!.addEventListener('mouseleave', (): void => {
                cells.forEach((td: HTMLElement) => {
                    if (td.querySelector(`:scope > a[href$="/horse/${id}"]`))
                        td.style.setProperty('background', `#${colors[id]}66`);
                    else
                        td.style.removeProperty('opacity');
                });
            });
        });
    });
});

observer.observe(window.document, { childList: true, subtree: true });
onInstalled((): void => observer.disconnect());