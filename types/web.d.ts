import DataTables, { DataTablesMode } from '../src/lib/data-tables';
import Events, { EventType } from '../src/lib/events';
import { regexEscape } from '../src/lib/utils';

export { }

declare global {
    interface Window {
        DataTables: typeof DataTables,
        DataTablesMode: typeof DataTablesMode,
        Events: typeof Events,
        EventType: typeof EventType,
        regexEscape: typeof regexEscape,
    }
}