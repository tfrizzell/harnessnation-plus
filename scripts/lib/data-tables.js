'use strict';

const DataTables = {
    extend: (selector, script, {
        indent,
        saveSearch,
        saveState,
        stateDuration,
    } = {}) => {
        if (!selector.match(/^\s*["'`]/)) selector = `'${selector.replace(/'/g, `\\'`)}'`;
    
        const table = script.match(new RegExp(`\\$\\(${Regex.escape(selector)}\\)\\s*\\.DataTable\\s*\\((\\s*\\{(.*?)\\}\\s*)?\\)`, 'is'));
        if (!table) return script;
    
        const tIndent = (table[2].match(/^[\r\n]*(\s*)/)?.[1] ?? '').replace(/^(\t|    )/, '');
    
        return script.replace(table[0],
`$(${selector}).DataTable({
    // HarnessNation
${table[2].replace(/(^[\r\n]+|[,\s]+$)/g, '').replace(new RegExp(`(^|[\r\n]+)(\t|    )${tIndent}`, 'g'), `$1    `)},
    
    // HN-Plus
${JSON.stringify({ saveState, stateDuration }, null, 4).replace(/(^\{[\r\n]*|[\r\n]*$)/, '')
})${saveSearch === false ? `.on('stateSaveParams.dt', (e, settings, data) => {
    data.search.search = '';
})` : ''}`.replace(/([\r\n]+)/g, `$1${indent ?? tIndent}`));
    },

    getSettings: key => new Promise(resolve => {
        chrome.storage.sync.get([
            ...[`${key}.stateDuration.control`, `${key}.stateDuration.value`, `${key}.stateDuration.units`],
        ], data => {
            resolve({
                saveState: true,
                stateDuration: (+data[`${key}.stateDuration.control`]) * (+data[`${key}.stateDuration.value`]) * (+data[`${key}.stateDuration.units`])
            });
        });
    }),
};