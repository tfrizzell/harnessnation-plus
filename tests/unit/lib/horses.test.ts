import { calculateStudFee, getHorse, Horse } from '@src/lib/horses';
import { StudFeeFormula } from '@src/lib/settings';
import '@mocks/harnessnation';

describe(`calculateStudFee`, () => {
    it(`exists`, () => {
        expect(calculateStudFee).not.toBeUndefined();
    });

    it(`is a function`, () => {
        expect(typeof calculateStudFee).toEqual('function');
    });

    it(`returns a promise`, () => {
        expect(calculateStudFee({ formula: StudFeeFormula.Apex, id: -1 })).toBeInstanceOf(Promise);
    });

    (<[[StudFeeFormula, number], number][]>[
        [[StudFeeFormula.Apex, 14], 88000],
        [[StudFeeFormula.Apex, 10474], 86000],
        [[StudFeeFormula.Apex, 15729], 87000],
        [[StudFeeFormula.Apex, 26326], 34000],
        [[StudFeeFormula.Apex, 75756], 28000],
        [[StudFeeFormula.Ridge, 14], 181000],
        [[StudFeeFormula.Ridge, 10474], 177000],
        [[StudFeeFormula.Ridge, 15729], 179000],
        [[StudFeeFormula.Ridge, 26326], 74000],
        [[StudFeeFormula.Ridge, 75756], 53000],
    ]).forEach(([[formula, id], expected]) => {
        it(`resolves with ${expected} when given formula=${formula} and id=${id}`, async () => {
            await expect(calculateStudFee({ id, formula })).resolves.toBe(expected);
        });
    });
});

describe(`getHorse`, () => {
    it(`exists`, () => {
        expect(getHorse).not.toBeUndefined();
    });

    it(`is a function`, () => {
        expect(typeof getHorse).toEqual('function');
    });

    it(`returns a promise`, () => {
        expect(getHorse(-1)).toBeInstanceOf(Promise);
    });

    (<[number, Horse][]>[
        [14, { id: 14, name: 'Astronomical', sireId: null, damId: null, retired: true }],
        [10474, { id: 10474, name: 'Readly Express', sireId: null, damId: null, retired: true }],
        [15729, { id: 15729, name: 'Fighter Apex', sireId: 13, damId: 444, retired: true }],
        [26326, { id: 26326, name: 'Leader Apex', sireId: 15729, damId: 186, retired: false }],
        [75756, { id: 75756, name: 'Zanjero Apex', sireId: 53494, damId: 35324, retired: false }],
    ]).forEach(([id, expected]) => {
        it(`resolves with ${JSON.stringify(expected)} when given id=${id}`, async () => {
            await expect(getHorse(id)).resolves.toEqual(expected);
        });
    });
});