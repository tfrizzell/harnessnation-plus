new MutationObserver(mutations => {
    mutations.filter(m => m.target.tagName === 'SCRIPT' && m.target.innerHTML.match(/\bfunction loadHorses\b/)).forEach(script => {
        [].forEach.call(script.addedNodes, node => {
            if (!node.data.match(/\bfunction loadHorses\b/)) return;
            node.data = DataTables.extend(`'#horseTable_' + i`, node.data);
        });
    });
}).observe(document, {
    childList: true,
    subtree: true
});