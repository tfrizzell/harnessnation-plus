import { DataTablesSettings, Settings } from './settings.js';
import { regexEscape } from './utils.js';

export enum DataTablesMode {
    Default,
    Custom,
}

export interface DataTablesOptions {
    indent?: string,
    saveSearch?: boolean,
    saveState?: boolean,
    stateDuration?: number
}

export function extend(
    selector: string,
    script: string,
    { indent, saveSearch, saveState, stateDuration }: DataTablesOptions = {}
): Promise<string> {
    if (!selector.match(/^\s*[''`]/))
        selector = `'${selector.replace(/'/g, `\\'`)}'`;

    const table = script.match(new RegExp(`\\$\\(${regexEscape(selector)}\\)\\s*\\.DataTable\\s*\\((\\s*\\{(.*?)\\}\\s*)?\\)`, 'is'));

    if (table == null)
        return Promise.resolve(script);

    const tableIndent = (table[2].match(/^[\r\n]*(\s*)/)?.[1] ?? '').replace(/^(\t| {4})/, '');

    return Promise.resolve(script.replace(table[0], `$(${selector}).DataTable({
    // HarnessNation
    ${table[2]
            .replace(/(^[\r\n]+|[,\s]+$)/g, '')
            .split(/[\r\n]+/)
            .map(l => l.trim())
            .join('\n    ')
        },

    // HarnessNation+
${JSON.stringify({ saveState, stateDuration }, null, 4).replace(/(^\{[\r\n]*|[\r\n]*$)/, '')
        })${saveSearch === false ? `.on('stateSaveParams.dt', (e, settings, data) => {
    data.search.search = '';
})` : ''}`.replace(/([\r\n]+)/g, `$1${indent ?? tableIndent}`)).replace(/^[ \t]+$/g, ''));
}

export async function getSettings(key: string): Promise<DataTablesOptions | undefined> {
    const settings: Partial<Settings> = await chrome.storage.sync.get('dt');

    const { enabled, duration, mode } = (
        key.split('.')
            .reduce<unknown>((data, key) =>
                data && typeof data === 'object'
                    ? (data as Record<string, unknown>)[key]
                    : undefined, settings.dt)
        ?? {}) as Partial<DataTablesSettings>;

    if (!enabled)
        return undefined;

    if (mode == DataTablesMode.Default)
        return { saveState: true };

    return { saveState: true, stateDuration: duration };
}

export default {
    extend,
    getSettings,
}