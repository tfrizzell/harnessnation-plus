import defaultSettings from '../../data/settings.json' assert { type: "json" };
import '../lib/const.js';

export const setDefaultData = (data) => Promise.resolve({
    ...defaultSettings,
    dt: {
        ...defaultSettings?.dt,
        breeding: {
            ...defaultSettings?.dt?.breeding,
            ...data?.dt?.breeding,
        },
        main: {
            ...defaultSettings?.dt?.main,
            ...data?.dt?.main,
        },
        progeny: {
            ...defaultSettings?.dt?.progeny,
            ...data?.dt?.progeny,
        },
        ...data?.dt,
    },
    stallions: {
        ...defaultSettings?.stallions,
        management: {
            ...defaultSettings?.stallions?.management,
            formula: data?.studFee?.formula ?? defaultSettings?.stallions?.management?.formula ?? FORMULA_APEX,
            ...data?.stallions?.management,
        },
        registry: {
            ...defaultSettings?.stallions?.registry,
            bloodlineSearch: data?.stallions?.bloodlineSearch ?? defaultSettings?.stallions?.registry?.bloodlineSearch ?? true,
            ...data?.stallions?.registry,
        },
        ...data?.stallions,
    },
    ...data,
});
