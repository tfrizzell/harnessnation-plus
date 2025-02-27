import { DataTablesMode } from './data-tables.js';

export enum DataTablesDisplayUnits {
    Minutes = 60,
    Hours = Minutes * 60,
    Days = Hours * 24,
    Weeks = Days * 7,
    Years = Days * 365.25,
}

export interface DataTablesSettings {
    enabled: boolean;
    mode: DataTablesMode;
    duration: number;
    displayUnits: DataTablesDisplayUnits;
}

export interface Settings {
    dt: {
        breeding: DataTablesSettings;
        main: DataTablesSettings;
        progeny: DataTablesSettings;
    };

    stallions: {
        management: StallionManagementSettings;
        registry: StallionRegistrySettings;
    };
}

export interface StallionManagementSettings {
    formula: StudFeeFormula;
}

export interface StallionRegistrySettings {
    bloodlineSearch: boolean;
    maxGenerations: number;
}

export enum StudFeeFormula {
    Apex = 'FORMULA_APEX',
    Ridge = 'FORMULA_RIDGE',
}

export const defaultSettings: Settings = {
    dt: {
        breeding: {
            enabled: true,
            mode: DataTablesMode.Default,
            duration: 1 * DataTablesDisplayUnits.Years,
            displayUnits: DataTablesDisplayUnits.Years,
        },
        main: {
            enabled: true,
            mode: DataTablesMode.Default,
            duration: 1 * DataTablesDisplayUnits.Years,
            displayUnits: DataTablesDisplayUnits.Years,
        },
        progeny: {
            enabled: true,
            mode: DataTablesMode.Default,
            duration: 1 * DataTablesDisplayUnits.Years,
            displayUnits: DataTablesDisplayUnits.Years,
        },
    },
    stallions: {
        management: {
            formula: StudFeeFormula.Apex,
        },
        registry: {
            bloodlineSearch: true,
            maxGenerations: 4,
        },
    },
}

export default defaultSettings;