void (async () => {
    const DataTables = window.DataTables;
    const { onInstalled } = window.Events;

    const page = window.location.pathname.split('/').pop() ?? '';
    const settings = await DataTables.getSettings(page);

    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (
                mutation.target.nodeType !== Node.ELEMENT_NODE
                || (mutation.target as HTMLElement).tagName !== 'SCRIPT'
                || !(mutation.target as HTMLElement).textContent.match(/\bfunction loadHorses\b/)
            )
                return;

            mutation.addedNodes.forEach(node => {
                void (async () => {
                    if (node.textContent?.match(/\bfunction loadHorses\b/)) {
                        node.textContent = await DataTables.extend(
                            `'#${page === 'breeding' ? 'breedingHorse' : 'horse'}Table_' + i`,
                            node.textContent,
                            settings
                        );
                    }
                })();
            });
        });
    });

    observer.observe(document, { childList: true, subtree: true });

    onInstalled(() => {
        observer.disconnect();
    });
})();