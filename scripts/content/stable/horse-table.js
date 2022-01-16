(() => {
    const page = window.location.pathname.split('/').pop();

    DataTables.getSettings(page).then(settings => {
        const observer = new MutationObserver(mutations => {
            mutations.filter(m => m.target.tagName === 'SCRIPT' && m.target.innerHTML.match(/\bfunction loadHorses\b/)).forEach(script => {
                script.addedNodes?.forEach(node => {
                    if (!node.data.match(/\bfunction loadHorses\b/))
                        return;

                    node.data = DataTables.extend(`'#${page === 'breeding' ? 'breedingHorse' : 'horse'}Table_' + i`, node.data, settings);
                });
            });
        });

        observer.observe(document, {
            childList: true,
            subtree: true
        });

        window.addEventListener('installed.harnessnation-plus', () => {
            observer.disconnect();
        }, { once: true });
    });
})();