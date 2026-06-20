// src/types/web.d.ts
import DataTables, { DataTablesMode } from '../lib/data-tables';
import Events, { EventType } from '../lib/events';
import { regexEscape } from '../lib/utils';

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