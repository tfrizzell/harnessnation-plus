import fs from 'fs';
import path from 'path';

import { BreedingScore, calculateBloodlineScore, calculateBreedingScore, calculateRacingScore, calculateStallionScore, calculateStudFee, createStallionScoreBadge, getHorse, Horse, StallionScore } from '../../src/lib/horses.js';
import { StudFeeFormula } from '../../src/lib/settings.js';

beforeAll(() => {
    global.fetch = <jest.Mock>jest.fn((input: RequestInfo, init?: RequestInit): Promise<{ ok: boolean, text: () => Promise<string> }> => {
        const url = (input as Request).url ?? input;
        let file: fs.PathLike | undefined;

        if (url === 'https://www.harnessnation.com/api/progeny/report' && init?.method === 'POST') {
            const { horseId } = Object.fromEntries(new URLSearchParams(init!.body as string));
            file = path.join(__dirname, '../__files__', `api_progeny_report-${horseId}.html`);
        } else if (url.startsWith('https://www.harnessnation.com/horse/')) {
            const horseId = url.split('/').pop()!;
            file = path.join(__dirname, '../__files__', `horse_${horseId}.html`);
        }

        if (!file)
            return Promise.reject(`${url} not found`);

        return new Promise(resolve => {
            fs.access(file!, undefined, (err) => {
                if (err) {
                    return resolve({
                        ok: true,
                        text: (): Promise<string> => Promise.resolve('')
                    });
                }

                resolve({
                    ok: true,
                    text: (): Promise<string> => new Promise(resolve =>
                        fs.readFile(file!, { encoding: 'utf-8' }, (err: any, data: string) => resolve(err ? '' : data))),
                });
            });
        });
    });
});

afterAll(() => {
    (<jest.Mock>global.fetch).mockRestore();
});

describe(`calculateBloodlineScore`, () => {
    it(`exists`, () => {
        expect(calculateBloodlineScore).not.toBeUndefined();
    });

    it(`is a function`, () => {
        expect(typeof calculateBloodlineScore).toEqual('function');
    });

    it(`returns a promise`, () => {
        expect(calculateBloodlineScore(-1, [])).toBeInstanceOf(Promise);
    });

    it(`resolves with 0 if there are no matching horses`, async () => {
        await expect(calculateBloodlineScore(75756, [{ id: 75756, sireId: 53494, stallionScore: { breeding: null } }])).resolves.toBe(0);
    });

    (<[Horse[], number | null][]>[
        [
            [
                { id: 14, sireId: null, stallionScore: { breeding: 128.929962 } },
                { id: 14181, sireId: 14, stallionScore: { breeding: 9.048 } },
                { id: 14423, sireId: 14, stallionScore: { breeding: 19.689479 } },
                { id: 14927, sireId: 14, stallionScore: { breeding: 55.833375 } },
                { id: 15459, sireId: 14, stallionScore: { breeding: 6.240625 } },
            ],
            43.948288
        ],
        [
            [
                { id: 10474, sireId: null, stallionScore: { breeding: 109.575342 } },
                { id: 15449, sireId: 10474, stallionScore: { breeding: null } },
                { id: 16060, sireId: 10474, stallionScore: { breeding: 29.118371 } },
                { id: 16961, sireId: 10474, stallionScore: { breeding: 57.704504 } },
                { id: 17054, sireId: 10474, stallionScore: { breeding: 2.443125 } },
            ],
            49.710336
        ],
        [
            [
                { id: 15729, sireId: 13, stallionScore: { breeding: 114.532213 } },
                { id: 12833, sireId: 13, stallionScore: { breeding: null } },
                { id: 18192, sireId: 13, stallionScore: { breeding: 1.664375 } },
                { id: 18222, sireId: 13, stallionScore: { breeding: 127.54869 } },
                { id: 36890, sireId: 13, stallionScore: { breeding: 96.775675 } },
            ],
            85.130238
        ],
        [
            [
                { id: 26326, sireId: 15729, stallionScore: { breeding: 9.73433 } },
                { id: 15729, sireId: 13, stallionScore: { breeding: 114.532213 } },
                { id: 61017, sireId: 15729, stallionScore: { breeding: null } },
            ],
            62.133271
        ],
        [
            [
                { id: 75756, sireId: 53494, stallionScore: { breeding: null } },
                { id: 53494, sireId: 9293, stallionScore: { breeding: 57.390083 } },
            ],
            57.390083
        ],
    ]).forEach(([horses, expected]) => {
        horses.forEach(horse => {
            if (horse.sireId != null && horse.sireId !== horses[0].sireId)
                return;

            if (horse.sireId == null)
                expected = null;

            it(`resolves with ${expected} when given id=${horse.id}`, async () => {
                await expect(calculateBloodlineScore(horse.id!, horses)).resolves.toBe(expected);
            });
        });
    });
});

describe(`calculateBreedingScore`, () => {
    it(`exists`, () => {
        expect(calculateBreedingScore).not.toBeUndefined();
    });

    it(`is a function`, () => {
        expect(typeof calculateBreedingScore).toEqual('function');
    });

    it(`returns a promise`, () => {
        expect(calculateBreedingScore(-1)).toBeInstanceOf(Promise);
    });

    (<[number, BreedingScore][]>[
        [14, { score: 129.068075, confidence: 1 }],
        [10474, { score: 109.584346, confidence: 1 }],
        [15729, { score: 114.63548, confidence: 0.535714 }],
        [26326, { score: 9.713204, confidence: 0.507143 }],
        [75756, { score: null, confidence: 0 }],
    ]).forEach(([id, expected]) => {
        it(`resolves with ${JSON.stringify(expected)} when given id=${id}`, async () => {
            await expect(calculateBreedingScore(id)).resolves.toEqual(expected)
        });
    });
});

describe(`calculateRacingScore`, () => {
    it(`exists`, () => {
        expect(calculateRacingScore).not.toBeUndefined();
    });

    it(`is a function`, () => {
        expect(typeof calculateRacingScore).toEqual('function');
    });

    it(`returns a promise`, () => {
        expect(calculateRacingScore(-1)).toBeInstanceOf(Promise);
    });

    [
        [14, 69.660639],
        [10474, 136.974712],
        [15729, 68.286678],
        [26326, 81.197822],
        [75756, 72.496202],
    ].forEach(([id, expected]) => {
        it(`resolves with ${expected} when given id=${id}`, async () => {
            await expect(calculateRacingScore(id)).resolves.toBe(expected);
        });
    });
});

describe(`calculateStallionScore`, () => {
    it(`exists`, () => {
        expect(calculateStallionScore).not.toBeUndefined();
    });

    it(`is a function`, () => {
        expect(typeof calculateStallionScore).toEqual('function');
    });

    it(`returns a promise`, () => {
        expect(calculateStallionScore({})).toBeInstanceOf(Promise);
    });

    (<[StallionScore, number][]>[
        [{ bloodline: null, breeding: 128.929962, confidence: 1, racing: 69.660639 }, 128.929962],
        [{ bloodline: null, breeding: 109.575342, confidence: 1, racing: 136.974712 }, 109.575342],
        [{ bloodline: 79.620648, breeding: 114.532213, confidence: 0.535714, racing: 68.286678 }, 95.69216],
        [{ bloodline: 62.133272, breeding: 9.73433, confidence: 0.492857, racing: 81.197822 }, 41.142313],
        [{ bloodline: 57.390083, breeding: null, confidence: 0, racing: 72.496202 }, 64.943142],
    ]).forEach(([value, expected]) => {
        it(`resolves with ${expected} when given ${JSON.stringify(value)}`, async () => {
            await expect(calculateStallionScore(value)).resolves.toBe(expected);
        });
    });
});

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

describe(`createStallionScoreBadge`, () => {
    it(`exists`, () => {
        expect(createStallionScoreBadge).not.toBeUndefined();
    });

    it(`is a function`, () => {
        expect(typeof createStallionScoreBadge).toEqual('function');
    });

    it(`returns an HTMLDivElement`, () => {
        expect(createStallionScoreBadge(undefined)).toBeInstanceOf(HTMLDivElement);
    });

    [undefined, null].forEach(value => {
        it(`returns a default bage when given ${value}`, () => {
            const badge = createStallionScoreBadge(value);
            expect(badge).toBeInstanceOf(HTMLDivElement);
            expect(badge.children.length).toBe(3)

            expect(badge.children[0]).toBeInstanceOf(HTMLHeadingElement);
            expect(badge.children[0].tagName).toBe('H3');
            expect(badge.children[0].classList).toContain('hn-plus-stallion-score-value');
            expect(badge.children[0].innerHTML).toBe(`<i>N/A</i>`);

            expect(badge.children[1]).toBeInstanceOf(HTMLHeadingElement);
            expect(badge.children[1].tagName).toBe('H4');
            expect(badge.children[1].classList).toContain('hn-plus-stallion-score-level');
            expect(badge.children[1].innerHTML).toBe('');

            expect(badge.children[2]).toBeInstanceOf(HTMLElement);
            expect(badge.children[2].classList).toContain('hn-plus-stallion-score-tooltip');
            expect(badge.children[2].innerHTML).toBe(`<p>The HarnessNation+ stallion score reflects the estimated breeding ability of a stallion.</p><p>The stallion score isn't available for this horse.</p>`);
        });
    });

    (<[StallionScore, [string, string, string, string]][]>[
        [
            { value: 999.999999, confidence: 0 },
            ['999', 'Elite', 'grade-a-plus', '0']
        ],
        [
            { value: 199.999999, confidence: 0.437513 },
            ['199', 'Elite', 'grade-a-plus', '44']
        ],
        [
            { value: 100, confidence: 0.005122 },
            ['100', 'Elite', 'grade-a-plus', '1']
        ],
        [
            { value: 99.999999, confidence: 0.770726 },
            ['99', 'Good', 'grade-b-plus', '77']
        ],
        [
            { value: 75, confidence: 0.240673 },
            ['75', 'Good', 'grade-b-plus', '24']
        ],
        [
            { value: 74.999999, confidence: 0 },
            ['74', 'Average', 'grade-c-plus', '0']
        ],
        [
            { value: 50, confidence: 0.574268 },
            ['50', 'Average', 'grade-c-plus', '57']
        ],
        [
            { value: 49.999999, confidence: 0.816838 },
            ['49', 'Weak', 'grade-d-plus', '82']
        ],
        [
            { value: 30, confidence: 0.156131 },
            ['30', 'Weak', 'grade-d-plus', '16']
        ],
        [
            { value: 29.999999, confidence: 0.423113 },
            ['29', 'Poor', 'grade-e-plus', '42']
        ],
        [
            { value: 0, confidence: 0.682004 },
            ['0', 'Poor', 'grade-e-plus', '68']
        ],
        [
            { value: -1, confidence: 0 },
            ['-1', 'N/A', '', '0']
        ],
    ]).forEach(([value, [score, level, className, confidence]]) => {
        it(`returns a badge with score=${score}, level=${level}, class=${className}, and confidence=${confidence} given ${JSON.stringify(value)}`, () => {
            const badge = createStallionScoreBadge(value);
            expect(badge).toBeInstanceOf(HTMLDivElement);
            expect(badge.children.length).toBe(3)

            if (className)
                expect(badge.classList).toContain(className);

            expect(badge.children[0]).toBeInstanceOf(HTMLHeadingElement);
            expect(badge.children[0].tagName).toBe('H3');
            expect(badge.children[0].classList).toContain('hn-plus-stallion-score-value');
            expect(badge.children[0].innerHTML).toBe(`<b>${score}</b>`);

            expect(badge.children[1]).toBeInstanceOf(HTMLHeadingElement);
            expect(badge.children[1].tagName).toBe('H4');
            expect(badge.children[1].classList).toContain('hn-plus-stallion-score-level');
            expect(badge.children[1].innerHTML).toBe(level);

            expect(badge.children[2]).toBeInstanceOf(HTMLElement);
            expect(badge.children[2].classList).toContain('hn-plus-stallion-score-tooltip');
            expect(badge.children[2].innerHTML).toBe(`<p>The HarnessNation+ stallion score reflects the estimated breeding ability of a stallion.</p><p class="hn-plus-stallion-score-confidence"><b>Confidence:</b> ${confidence}%</p>`);
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