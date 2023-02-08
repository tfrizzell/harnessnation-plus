import fs from 'fs';
import path from 'path';

import { calculateBreedingScore, calculateRacingScore, calculateStudFee, getHorse, Horse } from '../../src/lib/horses';
import { StudFeeFormula } from '../../src/lib/settings';

type HorseTestData = [number, Horse];
type ScoreTestData = [number, number | { value: number | null, confidence: number }];
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

describe(`calculateBreedingScore`, (): void => {
    test(`exists`, (): void => {
        expect(calculateBreedingScore).not.toBeUndefined();
    });

    test(`is a function`, (): void => {
        expect(typeof calculateBreedingScore).toEqual('function');
    });

    test(`returns the expected values`, async (): Promise<void> => {
        const values: ScoreTestData[] = [
            [14, { value: 126.46416, confidence: 1 }],
            [10474, { value: 102.26093, confidence: 1 }],
            [15729, { value: 90.71718, confidence: 0.41429 }],
            [26326, { value: null, confidence: 0 }],
        ];

        for (const [id, expected] of values) {
            const { score, confidence } = await calculateBreedingScore(id);
            expect(score).not.toBeUndefined();
            expect(confidence).not.toBeUndefined();
            expect(score == null ? score : parseFloat(score.toFixed(5))).toEqual((expected as any).value);
            expect(parseFloat(confidence.toFixed(5))).toEqual((expected as any).confidence);
        }
    });
});

describe(`calculateRacingScore`, (): void => {
    test(`exists`, (): void => {
        expect(calculateRacingScore).not.toBeUndefined();
    });

    test(`is a function`, (): void => {
        expect(typeof calculateRacingScore).toEqual('function');
    });

    test(`returns the expected values`, async (): Promise<void> => {
        const values: ScoreTestData[] = [
            [14, 69.66064],
            [10474, 136.97471],
            [15729, 68.28668],
            [26326, 81.19782],
        ];

        for (const [id, expected] of values) {
            const score = await calculateRacingScore(id);
            expect(score).not.toBeUndefined();
            expect(parseFloat(score!.toFixed(5))).toEqual(expected);
        }
    });
});

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
            [StudFeeFormula.Apex, 10474, 72000],
            [StudFeeFormula.Apex, 15729, 63000],
            [StudFeeFormula.Apex, 26326, 26000],
            [StudFeeFormula.Ridge, 14, 170000],
            [StudFeeFormula.Ridge, 10474, 150000],
            [StudFeeFormula.Ridge, 15729, 132000],
            [StudFeeFormula.Ridge, 26326, 109000],
        ];

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
            [10474, { id: 10474, name: 'Readly Express', sireId: null, damId: null, retired: true }],
            [15729, { id: 15729, name: 'Fighter Apex', sireId: 13, damId: 444, retired: false }],
            [26326, { id: 26326, name: 'Leader Apex', sireId: 15729, damId: 186, retired: false }],
        ]

        for (const [id, expected] of values)
            expect(await getHorse(id)).toEqual(expected);
    });
});