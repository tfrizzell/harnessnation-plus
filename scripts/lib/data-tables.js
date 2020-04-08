const DataTables = {
    extend: (selector, script, {
        indent,
        saveSearch,
        saveState = true,
        stateDuration = 31557600,
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
};