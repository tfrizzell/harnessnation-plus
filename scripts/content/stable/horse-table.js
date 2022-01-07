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

    window.addEventListener(`${chrome.runtime.id}.installed`, function handleInstalled() {
        window.removeEventListener(`${chrome.runtime.id}.installed`, handleInstalled);
        observer.disconnect();
    });
});
