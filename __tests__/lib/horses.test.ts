import fs from 'fs';
import path from 'path';

import { calculateStudFee, getHorse, Horse } from '../../src/lib/horses';
import { StudFeeFormula } from '../../src/lib/settings';

type HorseTestData = [number, Horse];
type StudFeeTestData = [StudFeeFormula, number, number];

global.fetch = jest.fn((input: RequestInfo, init?: RequestInit): Promise<any> => {
    const url: string = (input as Request).url ?? input as string;

    if (url === 'https://www.harnessnation.com/api/progeny/report' && init?.method === 'POST') {
        const { horseId }: { horseId: number } = JSON.parse(init.body as string);

        return Promise.resolve({
            text: (): Promise<string> => Promise.resolve(fs.readFileSync(path.join(__dirname, '../__files__', `api_progeny_report-${horseId}.html`), 'utf-8'))
        });
    }

    if (url.startsWith('https://www.harnessnation.com/horse/')) {
        const horseId: number = parseInt(url.split('/').pop()!);

        return Promise.resolve({
            text: (): Promise<string> => Promise.resolve(fs.readFileSync(path.join(__dirname, '../__files__', `horse_${horseId}.html`), 'utf-8'))
        });
    }

    return Promise.reject(`${url} not found`);
}) as jest.Mock;

describe(`calculateStudFee`, (): void => {
    test(`exists`, (): void => {
        expect(calculateStudFee).not.toBeUndefined();
    });

    test(`is a function`, (): void => {
        expect(typeof calculateStudFee).toEqual('function');
    });

    test(`returns the expected values`, async (): Promise<void> => {
        const values: StudFeeTestData[] = [
            [StudFeeFormula.Apex, 14, 82000],
            [StudFeeFormula.Apex, 26326, 26000],
            [StudFeeFormula.Ridge, 14, 170000],
            [StudFeeFormula.Ridge, 26326, 109000],
        ]

        for (const [formula, id, expected] of values)
            expect(await calculateStudFee({ id, formula })).toEqual(expected);
    });
});

describe(`getHorse`, (): void => {
    test(`exists`, (): void => {
        expect(getHorse).not.toBeUndefined();
    });

    test(`is a function`, (): void => {
        expect(typeof getHorse).toEqual('function');
    });

    test(`returns the expected values`, async (): Promise<void> => {
        const values: HorseTestData[] = [
            [14, { id: 14, name: 'Astronomical', sireId: null, damId: null, retired: true }],
            [26326, { id: 26326, name: 'Leader Apex', sireId: 15729, damId: 186, retired: false }],
        ]

        for (const [id, expected] of values)
            expect(await getHorse(id)).toEqual(expected);
    });
});