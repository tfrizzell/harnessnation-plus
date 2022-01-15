import './enums.js';
import './regex.js';

export class DataTables {
    constructor() {
        throw new Error(`${DataTables.name} is static and cannot be instantiated`);
    }

    static extend(selector, script, {
        indent,
        saveSearch,
        saveState,
        stateDuration,
    } = {}) {
        /* istanbul ignore next */
        if (!selector.match(/^\s*["'`]/)) selector = `'${selector.replace(/'/g, `\\'`)}'`;

        const table = script.match(new RegExp(`^(\\s+)[^\\r\\n]+(\\$\\(${Regex.escape(selector)}\\)\\s*\\.DataTable\\s*\\((\\s*\\{(.*?)\\}\\s*)?\\))`, 'is'));

        if (!table)
            return script;

        const tIndent = indent ?? table[1].replace(/[\r\n]+/g, '');

        return script.replace(table[2], `$(${selector}).DataTable({
    // HarnessNation
    ${table[4].replace(/(^[\r\n]+|[,\s]+$)/g, '').split(/[\r\n]+/).map(l => l.trim()).join('\n    ')},

    // HarnessNation+
${JSON.stringify({ saveState, stateDuration }, null, 4).replace(/(^\{[\r\n]*|[\r\n]*$)/, '')
            })${saveSearch === false ? `.on('stateSaveParams.dt', (e, settings, data) => {
    data.search.search = '';
})` : ''}`.replace(/([\r\n]+)/g, `$1${indent ?? tIndent}`)).replace(/^[ \t]+$/g, '');
    }

    static getSettings(key) {
        return new Promise(resolve => {
            /* istanbul ignore next */
            chrome.storage.sync.get('dt', ({ dt }) => {
                const { enabled, duration, mode } = key?.split('.').reduce((data, key) => data?.[key], dt) ?? {};
                if (!enabled) return resolve(undefined);

                resolve(mode === Mode.Custom
                    ? { saveState: true, stateDuration: +duration }
                    : { saveState: true });
            });
        });
    }
}

Object.defineProperties(window, {
    DataTables: {
        configurable: true,
        enumerable: true,
        value: DataTables,
        writable: false,
    },
});