import { pastels as palette } from '../../../lib/colors.js';

((): void => {
    if (document.readyState === 'complete')
        return;

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
})();