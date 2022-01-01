'use strict';

DataTables.getSettings('progeny').then(settings => {
    new MutationObserver(mutations => {
        mutations.filter(m => m.target.tagName === 'SCRIPT' && m.target.innerHTML.match(/\bfunction updateProgenyTableData\b/)).forEach(script => {
            script.addedNodes?.forEach(node => {
                if (!node.data.match(/\bfunction updateProgenyTableData\b/)) return;
                node.data = DataTables.extend('#progenyListTable', node.data.replace(/\bsaleTable\b/g, 'progenyListTable'), { ...settings, saveSearch: false });
            });
        });
    }).observe(document, {
        childList: true,
        subtree: true
    });
});