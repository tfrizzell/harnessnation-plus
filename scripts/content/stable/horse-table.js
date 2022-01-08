DataTables.getSettings(window.location.pathname.split('/').pop()).then(settings => {
    const observer = new MutationObserver(mutations => {
        mutations.filter(m => m.target.tagName === 'SCRIPT' && m.target.innerHTML.match(/\bfunction loadHorses\b/)).forEach(script => {
            script.addedNodes?.forEach(node => {
                if (!node.data.match(/\bfunction loadHorses\b/))
                    return;

                node.data = DataTables.extend(`'#horseTable_' + i`, node.data, settings);
            });
        });
    });

    observer.observe(document, {
        childList: true,
        subtree: true
    });

    window.addEventListener(`installed.${chrome.runtime.id}`, () => {
        observer.disconnect();
    }, { once: true });
});
