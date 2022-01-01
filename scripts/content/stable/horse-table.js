'use strict';

DataTables.getSettings(window.location.pathname.split('/').pop()).then(settings => {
    new MutationObserver(mutations => {
        mutations.filter(m => m.target.tagName === 'SCRIPT' && m.target.innerHTML.match(/\bfunction loadHorses\b/)).forEach(script => {
            script.addedNodes?.forEach(node => {
                if (!node.data.match(/\bfunction loadHorses\b/)) return;
                node.data = DataTables.extend(`'#horseTable_' + i`, node.data, settings);
            });
        });
    }).observe(document, {
        childList: true,
        subtree: true
    });
});