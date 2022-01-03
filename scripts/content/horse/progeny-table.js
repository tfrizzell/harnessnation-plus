'use strict';

DataTables.getSettings('progeny').then(settings => {
    const observer = new MutationObserver(mutations => {
        mutations.filter(m => m.target.tagName === 'SCRIPT' && m.target.innerHTML.match(/\bfunction updateProgenyTableData\b/)).forEach(script => {
            script.addedNodes?.forEach(node => {
                if (!node.data.match(/\bfunction updateProgenyTableData\b/)) return;
                node.data = DataTables.extend('#progenyListTable', node.data.replace(/\bsaleTable\b/g, 'progenyListTable'), { ...settings, saveSearch: false });
            });
        });
    });
    
    observer.observe(document, {
        childList: true,
        subtree: true
    });

    window.addEventListener('plus:installed', function handleInstalled() {
        window.removeEventListener('plus:installed', handleInstalled);
        observer.disconnect();
    });
});