'use strict';

DataTables.getSettings('progenyList').then(settings => {
    new MutationObserver(mutations => {
        mutations.filter(m => m.target.tagName === 'SCRIPT' && m.target.innerHTML.match(/\bfunction updateProgenyTableData\b/)).forEach(script => {
            [].forEach.call(script.addedNodes, node => {
                if (!node.data.match(/\bfunction updateProgenyTableData\b/)) return;
                node.data = DataTables.extend('#progenyListTable', node.data.replace(/\bsaleTable\b/g,'progenyListTable'), { ...settings, saveSearch: false });
            });
        });
    }).observe(document, {
        childList: true,
        subtree: true
    });
});