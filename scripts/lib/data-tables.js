'use strict';

const DataTables = {
    extend(selector, script, {
        indent,
        saveSearch,
        saveState,
        stateDuration,
    } = {}) {
        if (!selector.match(/^\s*["'`]/)) selector = `'${selector.replace(/'/g, `\\'`)}'`;

        const table = script.match(new RegExp(`\\$\\(${Regex.escape(selector)}\\)\\s*\\.DataTable\\s*\\((\\s*\\{(.*?)\\}\\s*)?\\)`, 'is'));
        if (!table) return script;

        const tIndent = (table[2].match(/^[\r\n]*(\s*)/)?.[1] ?? '').replace(/^(\t|    )/, '');

        return script.replace(table[0],
            `$(${selector}).DataTable({
    // HarnessNation
${table[2].replace(/(^[\r\n]+|[,\s]+$)/g, '').replace(new RegExp(`(^|[\r\n]+)(\t|    )${tIndent}`, 'g'), `$1    `)},
    
    // HarnessNation+
${JSON.stringify({ saveState, stateDuration }, null, 4).replace(/(^\{[\r\n]*|[\r\n]*$)/, '')
                })${saveSearch === false ? `.on('stateSaveParams.dt', (e, settings, data) => {
    data.search.search = '';
})` : ''}`.replace(/([\r\n]+)/g, `$1${indent ?? tIndent}`));
    },

    getSettings(key) {
        return new Promise(resolve => {
            chrome.storage.sync.get('dt', ({ dt }) => {
                const { enabled, duration } = key?.split('.').reduce((data, key) => data?.[key], dt) ?? {};
                resolve(enabled && { saveState: true, stateDuration: +duration });
            });
        });
    },
};