import { BreedingScore, calculateBloodlineScore, calculateBreedingScore, calculateRacingScore, calculateStallionScore, calculateStudFee, createStallionScoreBadge, getHorse, getRaces, Horse, Race, RaceList, StallionScore } from '../../src/lib/horses.js';
import { StudFeeFormula } from '../../src/lib/settings.js';
import '../fetch.mock';

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
        [15729, { score: 114.63548, confidence: 0.375 }],
        [26326, { score: 9.713204, confidence: 0.355 }],
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
            { value: 110, confidence: 0.005122 },
            ['110', 'Elite', 'grade-a-plus', '1']
        ],
        [
            { value: 109.999999, confidence: 0.770726 },
            ['109', 'Good', 'grade-b-plus', '77']
        ],
        [
            { value: 70, confidence: 0.240673 },
            ['70', 'Good', 'grade-b-plus', '24']
        ],
        [
            { value: 69.999999, confidence: 0 },
            ['69', 'Average', 'grade-c-plus', '0']
        ],
        [
            { value: 40, confidence: 0.574268 },
            ['40', 'Average', 'grade-c-plus', '57']
        ],
        [
            { value: 39.999999, confidence: 0.816838 },
            ['39', 'Weak', 'grade-d-plus', '82']
        ],
        [
            { value: 20, confidence: 0.156131 },
            ['20', 'Weak', 'grade-d-plus', '16']
        ],
        [
            { value: 19.999999, confidence: 0.423113 },
            ['19', 'Poor', 'grade-e-plus', '42']
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

describe(`getRaces`, () => {
    it(`exists`, () => {
        expect(getRaces).not.toBeUndefined();
    });

    it(`is a function`, () => {
        expect(typeof getRaces).toEqual('function');
    });

    it(`returns a promise`, () => {
        expect(getRaces(-1)).toBeInstanceOf(Promise);
    });

    (<[number, Array<Race>][]>[
        [
            14,
            [
                { 'id': 112364, 'name': 'Gold Cup & Saucer', 'stake': true, 'elim': false, 'age': '5yo+', 'condition': 'Open', 'gait': 'pace', 'trackCondition': 'sloppy', 'trackSize': 'half', 'purse': 175000, 'finish': 7, 'time': 121.14, 'date': new Date('2018-05-26T00:00:00.000Z') },
                { 'id': 110783, 'name': 'Gold Cup & Saucer', 'stake': true, 'elim': true, 'age': '5yo+', 'condition': 'Open', 'gait': 'pace', 'trackCondition': 'fast', 'trackSize': 'half', 'purse': 61250, 'finish': 5, 'time': 119.62, 'date': new Date('2018-05-19T00:00:00.000Z') },
                { 'id': 106991, 'name': 'Preferred', 'stake': false, 'elim': false, 'age': '5yo+', 'condition': 'Colts & Geldings Nw4', 'gait': 'pace', 'trackCondition': 'slow', 'trackSize': 'half', 'purse': 45000, 'finish': 1, 'time': 119.53999999999999, 'date': new Date('2018-05-11T00:00:00.000Z') },
                { 'id': 105311, 'name': 'Preferred', 'stake': false, 'elim': false, 'age': '5yo+', 'condition': 'Colts & Geldings Nw2', 'gait': 'pace', 'trackCondition': 'slow', 'trackSize': 'half', 'purse': 45000, 'finish': 1, 'time': 117.33, 'date': new Date('2018-05-04T00:00:00.000Z') },
                { 'id': 103151, 'name': 'Preferred', 'stake': false, 'elim': false, 'age': '5yo+', 'condition': 'Colts & Geldings Nw4', 'gait': 'pace', 'trackCondition': 'muddy', 'trackSize': 'half', 'purse': 45000, 'finish': 2, 'time': 119.22, 'date': new Date('2018-04-24T00:00:00.000Z') },
                { 'id': 101327, 'name': 'Preferred', 'stake': false, 'elim': false, 'age': '5yo+', 'condition': 'Colts & Geldings Nw4', 'gait': 'pace', 'trackCondition': 'fast', 'trackSize': 'half', 'purse': 45000, 'finish': 1, 'time': 117.72, 'date': new Date('2018-04-15T00:00:00.000Z') },
                { 'id': 99943, 'name': 'Open', 'stake': false, 'elim': false, 'age': '5yo+', 'condition': 'Colts & Geldings', 'gait': 'pace', 'trackCondition': 'slow', 'trackSize': 'half', 'purse': 50000, 'finish': 3, 'time': 118.37, 'date': new Date('2018-04-06T00:00:00.000Z') },
                { 'id': 98767, 'name': 'Open', 'stake': false, 'elim': false, 'age': '5yo+', 'condition': 'Colts & Geldings', 'gait': 'pace', 'trackCondition': 'slow', 'trackSize': 'half', 'purse': 50000, 'finish': 2, 'time': 119.25, 'date': new Date('2018-03-30T00:00:00.000Z') },
                { 'id': 99455, 'name': 'Inter Dominion', 'stake': true, 'elim': false, 'age': '5yo+', 'condition': 'Open', 'gait': 'pace', 'trackCondition': 'fast', 'trackSize': 'half', 'purse': 1000000, 'finish': 5, 'time': 119.03999999999999, 'date': new Date('2018-03-24T00:00:00.000Z') },
                { 'id': 97985, 'name': 'Inter Dominion', 'stake': true, 'elim': true, 'age': '5yo+', 'condition': 'Open', 'gait': 'pace', 'trackCondition': 'slow', 'trackSize': 'half', 'purse': 350000, 'finish': 2, 'time': 117.47, 'date': new Date('2018-03-17T00:00:00.000Z') },
                { 'id': 96417, 'name': 'Grand Prix Des Pays-Bas', 'stake': true, 'elim': false, 'age': '5yo+', 'condition': 'Open', 'gait': 'pace', 'trackCondition': 'muddy', 'trackSize': 'half', 'purse': 150000, 'finish': 5, 'time': 119.06, 'date': new Date('2018-03-10T00:00:00.000Z') },
                { 'id': 94851, 'name': 'Grand Prix Des Pays-Bas', 'stake': true, 'elim': true, 'age': '5yo+', 'condition': 'Open', 'gait': 'pace', 'trackCondition': 'good', 'trackSize': 'half', 'purse': 52500, 'finish': 4, 'time': 118.18, 'date': new Date('2018-03-03T00:00:00.000Z') },
                { 'id': 89647, 'name': 'Open', 'stake': false, 'elim': false, 'age': '5yo+', 'condition': 'Colts & Geldings', 'gait': 'pace', 'trackCondition': 'sloppy', 'trackSize': 'half', 'purse': 50000, 'finish': 1, 'time': 118.63, 'date': new Date('2018-02-17T00:00:00.000Z') },
                { 'id': 90147, 'name': 'George M Levy', 'stake': true, 'elim': false, 'age': '5yo+', 'condition': 'Open', 'gait': 'pace', 'trackCondition': 'fast', 'trackSize': 'half', 'purse': 200000, 'finish': 9, 'time': 118.28, 'date': new Date('2018-02-10T00:00:00.000Z') },
                { 'id': 88577, 'name': 'George M Levy', 'stake': true, 'elim': true, 'age': '5yo+', 'condition': 'Open', 'gait': 'pace', 'trackCondition': 'good', 'trackSize': 'half', 'purse': 70000, 'finish': 4, 'time': 118.45, 'date': new Date('2018-02-03T00:00:00.000Z') },
                { 'id': 84719, 'name': 'Open', 'stake': false, 'elim': false, 'age': '5yo+', 'condition': 'Colts & Geldings', 'gait': 'pace', 'trackCondition': 'fast', 'trackSize': 'half', 'purse': 50000, 'finish': 1, 'time': 117.34, 'date': new Date('2018-01-26T00:00:00.000Z') },
                { 'id': 83471, 'name': 'Open', 'stake': false, 'elim': false, 'age': '5yo+', 'condition': 'Colts & Geldings', 'gait': 'pace', 'trackCondition': 'slow', 'trackSize': 'half', 'purse': 50000, 'finish': 3, 'time': 123.42, 'date': new Date('2018-01-20T00:00:00.000Z') },
                { 'id': 81935, 'name': 'Open', 'stake': false, 'elim': false, 'age': '5yo+', 'condition': 'Colts & Geldings', 'gait': 'pace', 'trackCondition': 'fast', 'trackSize': 'half', 'purse': 50000, 'finish': 1, 'time': 118.07, 'date': new Date('2018-01-12T00:00:00.000Z') },
                { 'id': 80495, 'name': 'Open', 'stake': false, 'elim': false, 'age': '5yo+', 'condition': 'Colts & Geldings', 'gait': 'pace', 'trackCondition': 'good', 'trackSize': 'half', 'purse': 50000, 'finish': 1, 'time': 118.03999999999999, 'date': new Date('2018-01-05T00:00:00.000Z') },
                { 'id': 63993, 'name': 'Gold Cup & Saucer', 'stake': true, 'elim': true, 'age': '5yo+', 'condition': 'Open', 'gait': 'pace', 'trackCondition': 'fast', 'trackSize': 'half', 'purse': 61250, 'finish': 5, 'time': 118.69, 'date': new Date('2017-11-18T00:00:00.000Z') },
                { 'id': 60888, 'name': 'George M Levy', 'stake': true, 'elim': false, 'age': '5yo+', 'condition': 'Open', 'gait': 'pace', 'trackCondition': 'fast', 'trackSize': 'half', 'purse': 200000, 'finish': 4, 'time': 118.72, 'date': new Date('2017-11-11T00:00:00.000Z') },
                { 'id': 57781, 'name': 'George M Levy', 'stake': true, 'elim': true, 'age': '5yo+', 'condition': 'Open', 'gait': 'pace', 'trackCondition': 'muddy', 'trackSize': 'half', 'purse': 70000, 'finish': 1, 'time': 120.58, 'date': new Date('2017-11-04T00:00:00.000Z') },
                { 'id': 49652, 'name': 'Open', 'stake': false, 'elim': false, 'age': '5yo+', 'condition': 'Colts & Geldings', 'gait': 'pace', 'trackCondition': 'sloppy', 'trackSize': 'half', 'purse': 50000, 'finish': 1, 'time': 118.22999999999999, 'date': new Date('2017-10-26T00:00:00.000Z') },
                { 'id': 45956, 'name': 'Open', 'stake': false, 'elim': false, 'age': '5yo+', 'condition': 'Colts & Geldings', 'gait': 'pace', 'trackCondition': 'muddy', 'trackSize': 'half', 'purse': 50000, 'finish': 1, 'time': 119.91, 'date': new Date('2017-10-18T00:00:00.000Z') },
                { 'id': 44036, 'name': 'Open', 'stake': false, 'elim': false, 'age': '5yo+', 'condition': 'Colts & Geldings', 'gait': 'pace', 'trackCondition': 'slow', 'trackSize': 'half', 'purse': 50000, 'finish': 2, 'time': 120.53, 'date': new Date('2017-10-12T00:00:00.000Z') },
                { 'id': 41636, 'name': 'Open', 'stake': false, 'elim': false, 'age': '5yo+', 'condition': 'Colts & Geldings', 'gait': 'pace', 'trackCondition': 'slow', 'trackSize': 'half', 'purse': 50000, 'finish': 1, 'time': 115.56, 'date': new Date('2017-10-03T00:00:00.000Z') },
                { 'id': 35908, 'name': 'Open', 'stake': false, 'elim': false, 'age': '5yo+', 'condition': 'Colts & Geldings', 'gait': 'pace', 'trackCondition': 'fast', 'trackSize': 'half', 'purse': 50000, 'finish': 1, 'time': 120.78, 'date': new Date('2017-09-20T00:00:00.000Z') },
                { 'id': 35420, 'name': 'Grand Prix Des Pays-Bas', 'stake': true, 'elim': false, 'age': '5yo+', 'condition': 'Open', 'gait': 'pace', 'trackCondition': 'fast', 'trackSize': 'half', 'purse': 150000, 'finish': 3, 'time': 117.72, 'date': new Date('2017-09-09T00:00:00.000Z') },
                { 'id': 32309, 'name': 'Grand Prix Des Pays-Bas', 'stake': true, 'elim': true, 'age': '5yo+', 'condition': 'Open', 'gait': 'pace', 'trackCondition': 'slow', 'trackSize': 'half', 'purse': 52500, 'finish': 3, 'time': 118.37, 'date': new Date('2017-09-02T00:00:00.000Z') },
                { 'id': 25014, 'name': 'Open', 'stake': false, 'elim': false, 'age': '5yo+', 'condition': 'Colts & Geldings', 'gait': 'pace', 'trackCondition': 'fast', 'trackSize': 'half', 'purse': 50000, 'finish': 1, 'time': 117.83, 'date': new Date('2017-08-26T00:00:00.000Z') },
                { 'id': 22983, 'name': 'George M Levy', 'stake': true, 'elim': false, 'age': '5yo+', 'condition': 'Open', 'gait': 'pace', 'trackCondition': 'muddy', 'trackSize': 'half', 'purse': 200000, 'finish': 1, 'time': 117.86, 'date': new Date('2017-08-12T00:00:00.000Z') },
                { 'id': 19878, 'name': 'George M Levy', 'stake': true, 'elim': true, 'age': '5yo+', 'condition': 'Open', 'gait': 'pace', 'trackCondition': 'slow', 'trackSize': 'half', 'purse': 70000, 'finish': 2, 'time': 121.04, 'date': new Date('2017-08-05T00:00:00.000Z') },
                { 'id': 9018, 'name': 'Open', 'stake': false, 'elim': false, 'age': '5yo+', 'condition': 'Colts & Geldings', 'gait': 'pace', 'trackCondition': 'slow', 'trackSize': 'half', 'purse': 50000, 'finish': 1, 'time': 119.45, 'date': new Date('2017-07-21T00:00:00.000Z') },
                { 'id': 3546, 'name': 'Open', 'stake': false, 'elim': false, 'age': '5yo+', 'condition': 'Colts & Geldings', 'gait': 'pace', 'trackCondition': 'slow', 'trackSize': 'half', 'purse': 50000, 'finish': 1, 'time': 117.68, 'date': new Date('2017-07-14T00:00:00.000Z') },
                { 'id': 282, 'name': 'Open', 'stake': false, 'elim': false, 'age': '5yo+', 'condition': 'Colts & Geldings', 'gait': 'pace', 'trackCondition': 'sloppy', 'trackSize': 'half', 'purse': 50000, 'finish': 1, 'time': 119.31, 'date': new Date('2017-07-05T00:00:00.000Z') }
            ]
        ],
        [
            10474,
            [
                { 'id': 137735, 'name': 'Open', 'stake': false, 'elim': false, 'age': '2-4yo', 'condition': 'Colts & Geldings', 'gait': 'trot', 'trackCondition': 'fast', 'trackSize': 'half', 'purse': 50000, 'finish': 1, 'time': 123.22, 'date': new Date('2018-09-22T00:00:00.000Z') },
                { 'id': 135575, 'name': 'Claiming $75,000', 'stake': false, 'elim': false, 'age': '2-4yo', 'condition': 'Colts & Geldings Nw5', 'gait': 'trot', 'trackCondition': 'fast', 'trackSize': 'half', 'purse': 30000, 'finish': 1, 'time': 122.95, 'date': new Date('2018-09-12T00:00:00.000Z') },
                { 'id': 112362, 'name': 'Grand Derby de l\'UET', 'stake': true, 'elim': false, 'age': '3yo', 'condition': 'Open', 'gait': 'trot', 'trackCondition': 'good', 'trackSize': 'half', 'purse': 500000, 'finish': 3, 'time': 127.33, 'date': new Date('2018-05-26T00:00:00.000Z') },
                { 'id': 110779, 'name': 'Grand Derby de l\'UET', 'stake': true, 'elim': true, 'age': '3yo', 'condition': 'Open', 'gait': 'trot', 'trackCondition': 'sloppy', 'trackSize': 'half', 'purse': 175000, 'finish': 3, 'time': 128.9, 'date': new Date('2018-05-19T00:00:00.000Z') },
                { 'id': 106521, 'name': 'Open', 'stake': false, 'elim': false, 'age': '2-4yo', 'condition': 'Colts & Geldings', 'gait': 'trot', 'trackCondition': 'good', 'trackSize': 'half', 'purse': 50000, 'finish': 1, 'time': 127.25, 'date': new Date('2018-05-09T00:00:00.000Z') },
                { 'id': 102201, 'name': 'Open', 'stake': false, 'elim': false, 'age': '2-4yo', 'condition': 'Colts & Geldings', 'gait': 'trot', 'trackCondition': 'fast', 'trackSize': 'half', 'purse': 50000, 'finish': 2, 'time': 129.88, 'date': new Date('2018-04-20T00:00:00.000Z') },
                { 'id': 100665, 'name': 'Open', 'stake': false, 'elim': false, 'age': '2-4yo', 'condition': 'Colts & Geldings', 'gait': 'trot', 'trackCondition': 'slow', 'trackSize': 'half', 'purse': 50000, 'finish': 1, 'time': 126.01, 'date': new Date('2018-04-11T00:00:00.000Z') },
                { 'id': 99449, 'name': 'Home Grown Classic', 'stake': true, 'elim': false, 'age': '2yo', 'condition': 'Open', 'gait': 'trot', 'trackCondition': 'fast', 'trackSize': 'half', 'purse': 200000, 'finish': 2, 'time': 122.18, 'date': new Date('2018-03-24T00:00:00.000Z') },
                { 'id': 97974, 'name': 'Home Grown Classic', 'stake': true, 'elim': true, 'age': '2yo', 'condition': 'Open', 'gait': 'trot', 'trackCondition': 'slow', 'trackSize': 'half', 'purse': 70000, 'finish': 2, 'time': 122.47, 'date': new Date('2018-03-17T00:00:00.000Z') },
                { 'id': 93971, 'name': 'Open', 'stake': false, 'elim': false, 'age': '2yo', 'condition': 'Colts & Geldings', 'gait': 'trot', 'trackCondition': 'fast', 'trackSize': 'half', 'purse': 50000, 'finish': 1, 'time': 126.06, 'date': new Date('2018-03-09T00:00:00.000Z') },
                { 'id': 94857, 'name': 'William Wellwood Memorial', 'stake': true, 'elim': false, 'age': '2yo', 'condition': 'Open', 'gait': 'trot', 'trackCondition': 'fast', 'trackSize': 'half', 'purse': 625000, 'finish': 1, 'time': 122.63, 'date': new Date('2018-03-03T00:00:00.000Z') },
                { 'id': 93277, 'name': 'William Wellwood Memorial', 'stake': true, 'elim': true, 'age': '2yo', 'condition': 'Open', 'gait': 'trot', 'trackCondition': 'sloppy', 'trackSize': 'half', 'purse': 218750, 'finish': 1, 'time': 124.04, 'date': new Date('2018-02-24T00:00:00.000Z') },
                { 'id': 88977, 'name': 'Open', 'stake': false, 'elim': false, 'age': '2yo', 'condition': 'Colts & Geldings', 'gait': 'trot', 'trackCondition': 'fast', 'trackSize': 'half', 'purse': 50000, 'finish': 1, 'time': 123.22, 'date': new Date('2018-02-14T00:00:00.000Z') },
                { 'id': 87697, 'name': 'Open', 'stake': false, 'elim': false, 'age': '2yo', 'condition': 'Colts & Geldings', 'gait': 'trot', 'trackCondition': 'fast', 'trackSize': 'half', 'purse': 50000, 'finish': 1, 'time': 127.04, 'date': new Date('2018-02-09T00:00:00.000Z') },
                { 'id': 86737, 'name': 'Maiden Open', 'stake': false, 'elim': false, 'age': '2yo', 'condition': 'Colts & Geldings Nw1', 'gait': 'trot', 'trackCondition': 'good', 'trackSize': 'half', 'purse': 50000, 'finish': 1, 'time': 127.07, 'date': new Date('2018-02-03T00:00:00.000Z') }
            ]
        ],
        [
            15729,
            [
                { 'id': 276928, 'name': 'Open', 'stake': false, 'elim': false, 'age': '5yo+', 'condition': 'Colts & Geldings', 'gait': 'pace', 'trackCondition': 'fast', 'trackSize': 'full', 'purse': 50000, 'finish': 1, 'time': 114.2, 'date': new Date('2020-03-20T00:00:00.000Z') },
                { 'id': 275656, 'name': 'Open', 'stake': false, 'elim': false, 'age': '5yo+', 'condition': 'Colts & Geldings', 'gait': 'pace', 'trackCondition': 'slow', 'trackSize': 'full', 'purse': 50000, 'finish': 2, 'time': 114.75999999999999, 'date': new Date('2020-03-14T00:00:00.000Z') },
                { 'id': 274412, 'name': 'Open', 'stake': false, 'elim': false, 'age': '5yo+', 'condition': 'Colts & Geldings', 'gait': 'pace', 'trackCondition': 'slow', 'trackSize': 'full', 'purse': 50000, 'finish': 2, 'time': 113.75999999999999, 'date': new Date('2020-03-08T00:00:00.000Z') },
                { 'id': 273164, 'name': 'Open', 'stake': false, 'elim': false, 'age': '5yo+', 'condition': 'Colts & Geldings', 'gait': 'pace', 'trackCondition': 'fast', 'trackSize': 'full', 'purse': 50000, 'finish': 1, 'time': 114.13, 'date': new Date('2020-03-03T00:00:00.000Z') },
                { 'id': 271696, 'name': 'Open', 'stake': false, 'elim': false, 'age': '5yo+', 'condition': 'Colts & Geldings', 'gait': 'pace', 'trackCondition': 'good', 'trackSize': 'full', 'purse': 50000, 'finish': 1, 'time': 113.77000000000001, 'date': new Date('2020-02-26T00:00:00.000Z') },
                { 'id': 269636, 'name': 'Open', 'stake': false, 'elim': false, 'age': '5yo+', 'condition': 'Colts & Geldings', 'gait': 'pace', 'trackCondition': 'fast', 'trackSize': 'full', 'purse': 50000, 'finish': 2, 'time': 113.95, 'date': new Date('2020-02-19T00:00:00.000Z') },
                { 'id': 266734, 'name': 'Preferred', 'stake': false, 'elim': false, 'age': '5yo+', 'condition': 'Colts & Geldings Nw4', 'gait': 'pace', 'trackCondition': 'sloppy', 'trackSize': 'full', 'purse': 45000, 'finish': 1, 'time': 115.66, 'date': new Date('2020-02-09T00:00:00.000Z') },
                { 'id': 264294, 'name': 'Open', 'stake': false, 'elim': false, 'age': '5yo+', 'condition': 'Colts & Geldings', 'gait': 'pace', 'trackCondition': 'fast', 'trackSize': 'full', 'purse': 50000, 'finish': 2, 'time': 116.72999999999999, 'date': new Date('2020-02-01T00:00:00.000Z') },
                { 'id': 262710, 'name': 'Open', 'stake': false, 'elim': false, 'age': '5yo+', 'condition': 'Colts & Geldings', 'gait': 'pace', 'trackCondition': 'slow', 'trackSize': 'full', 'purse': 50000, 'finish': 2, 'time': 116.56, 'date': new Date('2020-01-26T00:00:00.000Z') },
                { 'id': 259878, 'name': 'Open', 'stake': false, 'elim': false, 'age': '5yo+', 'condition': 'Colts & Geldings', 'gait': 'pace', 'trackCondition': 'fast', 'trackSize': 'full', 'purse': 50000, 'finish': 1, 'time': 115.8, 'date': new Date('2020-01-17T00:00:00.000Z') },
                { 'id': 258294, 'name': 'Open', 'stake': false, 'elim': false, 'age': '5yo+', 'condition': 'Colts & Geldings', 'gait': 'pace', 'trackCondition': 'slow', 'trackSize': 'full', 'purse': 50000, 'finish': 3, 'time': 116.00999999999999, 'date': new Date('2020-01-10T00:00:00.000Z') },
                { 'id': 257142, 'name': 'Open', 'stake': false, 'elim': false, 'age': '5yo+', 'condition': 'Colts & Geldings', 'gait': 'pace', 'trackCondition': 'fast', 'trackSize': 'full', 'purse': 50000, 'finish': 1, 'time': 114.06, 'date': new Date('2020-01-04T00:00:00.000Z') },
                { 'id': 255294, 'name': 'Open', 'stake': false, 'elim': false, 'age': '5yo+', 'condition': 'Colts & Geldings', 'gait': 'pace', 'trackCondition': 'fast', 'trackSize': 'full', 'purse': 50000, 'finish': 1, 'time': 113.34, 'date': new Date('2019-12-27T00:00:00.000Z') },
                { 'id': 256080, 'name': 'European Pacing Championship', 'stake': true, 'elim': false, 'age': '5yo+', 'condition': 'Open', 'gait': 'pace', 'trackCondition': 'slow', 'trackSize': 'full', 'purse': 200000, 'finish': 2, 'time': 115.64, 'date': new Date('2019-12-21T00:00:00.000Z') },
                { 'id': 254508, 'name': 'European Pacing Championship', 'stake': true, 'elim': true, 'age': '5yo+', 'condition': 'Open', 'gait': 'pace', 'trackCondition': 'sloppy', 'trackSize': 'full', 'purse': 70000, 'finish': 2, 'time': 112.63, 'date': new Date('2019-12-14T00:00:00.000Z') },
                { 'id': 252937, 'name': 'New Zealand Cup', 'stake': true, 'elim': false, 'age': '5yo+', 'condition': 'Open', 'gait': 'pace', 'trackCondition': 'sloppy', 'trackSize': 'full', 'purse': 750000, 'finish': 5, 'time': 115.34, 'date': new Date('2019-12-07T00:00:00.000Z') },
                { 'id': 251366, 'name': 'New Zealand Cup', 'stake': true, 'elim': true, 'age': '5yo+', 'condition': 'Open', 'gait': 'pace', 'trackCondition': 'fast', 'trackSize': 'full', 'purse': 262500, 'finish': 5, 'time': 115.59, 'date': new Date('2019-11-30T00:00:00.000Z') },
                { 'id': 249800, 'name': 'Dan Patch', 'stake': true, 'elim': false, 'age': '5yo+', 'condition': 'Open', 'gait': 'pace', 'trackCondition': 'fast', 'trackSize': 'full', 'purse': 200000, 'finish': 5, 'time': 113.87, 'date': new Date('2019-11-23T00:00:00.000Z') },
                { 'id': 247836, 'name': 'Dan Patch', 'stake': true, 'elim': true, 'age': '5yo+', 'condition': 'Open', 'gait': 'pace', 'trackCondition': 'fast', 'trackSize': 'full', 'purse': 70000, 'finish': 1, 'time': 114.75, 'date': new Date('2019-11-16T00:00:00.000Z') },
                { 'id': 245786, 'name': 'Canadian Pacing Derby', 'stake': true, 'elim': false, 'age': '5yo+', 'condition': 'Open', 'gait': 'pace', 'trackCondition': 'sloppy', 'trackSize': 'full', 'purse': 275000, 'finish': 5, 'time': 115.28999999999999, 'date': new Date('2019-11-09T00:00:00.000Z') },
                { 'id': 243737, 'name': 'Canadian Pacing Derby', 'stake': true, 'elim': true, 'age': '5yo+', 'condition': 'Open', 'gait': 'pace', 'trackCondition': 'muddy', 'trackSize': 'full', 'purse': 96250, 'finish': 2, 'time': 115.43, 'date': new Date('2019-11-02T00:00:00.000Z') },
                { 'id': 239061, 'name': 'Open', 'stake': false, 'elim': false, 'age': '5yo+', 'condition': 'Colts & Geldings', 'gait': 'pace', 'trackCondition': 'sloppy', 'trackSize': 'full', 'purse': 50000, 'finish': 2, 'time': 114.15, 'date': new Date('2019-10-26T00:00:00.000Z') },
                { 'id': 236661, 'name': 'Open', 'stake': false, 'elim': false, 'age': '5yo+', 'condition': 'Colts & Geldings', 'gait': 'pace', 'trackCondition': 'sloppy', 'trackSize': 'full', 'purse': 50000, 'finish': 2, 'time': 113.66, 'date': new Date('2019-10-18T00:00:00.000Z') },
                { 'id': 234645, 'name': 'Open', 'stake': false, 'elim': false, 'age': '5yo+', 'condition': 'Colts & Geldings', 'gait': 'pace', 'trackCondition': 'good', 'trackSize': 'full', 'purse': 50000, 'finish': 1, 'time': 114.33, 'date': new Date('2019-10-09T00:00:00.000Z') },
                { 'id': 233493, 'name': 'Open', 'stake': false, 'elim': false, 'age': '5yo+', 'condition': 'Colts & Geldings', 'gait': 'pace', 'trackCondition': 'fast', 'trackSize': 'full', 'purse': 50000, 'finish': 6, 'time': 117.14, 'date': new Date('2019-10-04T00:00:00.000Z') },
                { 'id': 231933, 'name': 'Open', 'stake': false, 'elim': false, 'age': '2-4yo', 'condition': 'Colts & Geldings', 'gait': 'pace', 'trackCondition': 'fast', 'trackSize': 'full', 'purse': 50000, 'finish': 1, 'time': 113.44, 'date': new Date('2019-09-27T00:00:00.000Z') },
                { 'id': 230349, 'name': 'Open', 'stake': false, 'elim': false, 'age': '2-4yo', 'condition': 'Colts & Geldings', 'gait': 'pace', 'trackCondition': 'slow', 'trackSize': 'full', 'purse': 50000, 'finish': 2, 'time': 114.47999999999999, 'date': new Date('2019-09-20T00:00:00.000Z') },
                { 'id': 229077, 'name': 'Open', 'stake': false, 'elim': false, 'age': '2-4yo', 'condition': 'Colts & Geldings', 'gait': 'pace', 'trackCondition': 'slow', 'trackSize': 'full', 'purse': 50000, 'finish': 1, 'time': 112.62, 'date': new Date('2019-09-14T00:00:00.000Z') },
                { 'id': 229621, 'name': 'New Zealand Cup', 'stake': true, 'elim': false, 'age': '5yo+', 'condition': 'Open', 'gait': 'pace', 'trackCondition': 'fast', 'trackSize': 'full', 'purse': 750000, 'finish': 9, 'time': 116.28, 'date': new Date('2019-09-07T00:00:00.000Z') },
                { 'id': 228041, 'name': 'New Zealand Cup', 'stake': true, 'elim': true, 'age': '5yo+', 'condition': 'Open', 'gait': 'pace', 'trackCondition': 'fast', 'trackSize': 'full', 'purse': 262500, 'finish': 6, 'time': 113.56, 'date': new Date('2019-08-31T00:00:00.000Z') },
                { 'id': 223040, 'name': 'Open', 'stake': false, 'elim': false, 'age': '2-4yo', 'condition': 'Colts & Geldings', 'gait': 'pace', 'trackCondition': 'fast', 'trackSize': 'full', 'purse': 50000, 'finish': 1, 'time': 112.43, 'date': new Date('2019-08-21T00:00:00.000Z') },
                { 'id': 220987, 'name': 'Open', 'stake': false, 'elim': false, 'age': '2-4yo', 'condition': 'Colts & Geldings', 'gait': 'pace', 'trackCondition': 'slow', 'trackSize': 'full', 'purse': 50000, 'finish': 1, 'time': 115.68, 'date': new Date('2019-08-14T00:00:00.000Z') },
                { 'id': 219320, 'name': 'Open', 'stake': false, 'elim': false, 'age': '2-4yo', 'condition': 'Colts & Geldings', 'gait': 'pace', 'trackCondition': 'sloppy', 'trackSize': 'full', 'purse': 50000, 'finish': 2, 'time': 116.18, 'date': new Date('2019-08-09T00:00:00.000Z') },
                { 'id': 220394, 'name': 'Canadian Pacing Derby', 'stake': true, 'elim': true, 'age': '5yo+', 'condition': 'Open', 'gait': 'pace', 'trackCondition': 'good', 'trackSize': 'full', 'purse': 96250, 'finish': 6, 'time': 114.66, 'date': new Date('2019-08-03T00:00:00.000Z') },
                { 'id': 215288, 'name': 'Open', 'stake': false, 'elim': false, 'age': '2-4yo', 'condition': 'Colts & Geldings', 'gait': 'pace', 'trackCondition': 'slow', 'trackSize': 'full', 'purse': 50000, 'finish': 2, 'time': 114.00999999999999, 'date': new Date('2019-07-26T00:00:00.000Z') },
                { 'id': 213656, 'name': 'Open', 'stake': false, 'elim': false, 'age': '2-4yo', 'condition': 'Colts & Geldings', 'gait': 'pace', 'trackCondition': 'slow', 'trackSize': 'full', 'purse': 50000, 'finish': 1, 'time': 116.64, 'date': new Date('2019-07-20T00:00:00.000Z') },
                { 'id': 211544, 'name': 'Open', 'stake': false, 'elim': false, 'age': '2-4yo', 'condition': 'Colts & Geldings', 'gait': 'pace', 'trackCondition': 'slow', 'trackSize': 'full', 'purse': 50000, 'finish': 1, 'time': 114.62, 'date': new Date('2019-07-12T00:00:00.000Z') },
                { 'id': 206275, 'name': 'Australasian Pacing Derby', 'stake': true, 'elim': false, 'age': '3yo', 'condition': 'Open', 'gait': 'pace', 'trackCondition': 'fast', 'trackSize': 'full', 'purse': 200000, 'finish': 10, 'time': 114.7, 'date': new Date('2019-06-08T00:00:00.000Z') },
                { 'id': 204692, 'name': 'Australasian Pacing Derby', 'stake': true, 'elim': true, 'age': '3yo', 'condition': 'Open', 'gait': 'pace', 'trackCondition': 'slow', 'trackSize': 'full', 'purse': 70000, 'finish': 4, 'time': 115.17, 'date': new Date('2019-06-01T00:00:00.000Z') },
                { 'id': 200521, 'name': 'Open', 'stake': false, 'elim': false, 'age': '3yo', 'condition': 'Colts & Geldings', 'gait': 'pace', 'trackCondition': 'good', 'trackSize': 'full', 'purse': 50000, 'finish': 1, 'time': 115.28, 'date': new Date('2019-05-25T00:00:00.000Z') },
                { 'id': 198467, 'name': 'Open', 'stake': false, 'elim': false, 'age': '3yo', 'condition': 'Colts & Geldings', 'gait': 'pace', 'trackCondition': 'fast', 'trackSize': 'full', 'purse': 50000, 'finish': 1, 'time': 115.64, 'date': new Date('2019-05-18T00:00:00.000Z') },
                { 'id': 199207, 'name': 'North America Cup', 'stake': true, 'elim': false, 'age': '3yo', 'condition': 'Open', 'gait': 'pace', 'trackCondition': 'sloppy', 'trackSize': 'full', 'purse': 1000000, 'finish': 6, 'time': 115.11, 'date': new Date('2019-05-11T00:00:00.000Z') },
                { 'id': 197180, 'name': 'North America Cup', 'stake': true, 'elim': true, 'age': '3yo', 'condition': 'Open', 'gait': 'pace', 'trackCondition': 'fast', 'trackSize': 'full', 'purse': 350000, 'finish': 6, 'time': 114.9, 'date': new Date('2019-05-04T00:00:00.000Z') },
                { 'id': 192035, 'name': 'Open', 'stake': false, 'elim': false, 'age': '3yo', 'condition': 'Colts & Geldings', 'gait': 'pace', 'trackCondition': 'slow', 'trackSize': 'full', 'purse': 50000, 'finish': 2, 'time': 116.33, 'date': new Date('2019-04-26T00:00:00.000Z') },
                { 'id': 190019, 'name': 'Open', 'stake': false, 'elim': false, 'age': '3yo', 'condition': 'Colts & Geldings', 'gait': 'pace', 'trackCondition': 'sloppy', 'trackSize': 'full', 'purse': 50000, 'finish': 2, 'time': 114.8, 'date': new Date('2019-04-19T00:00:00.000Z') },
                { 'id': 188435, 'name': 'Open', 'stake': false, 'elim': false, 'age': '3yo', 'condition': 'Colts & Geldings', 'gait': 'pace', 'trackCondition': 'muddy', 'trackSize': 'full', 'purse': 50000, 'finish': 1, 'time': 113.36, 'date': new Date('2019-04-12T00:00:00.000Z') },
                { 'id': 186995, 'name': 'Open', 'stake': false, 'elim': false, 'age': '3yo', 'condition': 'Colts & Geldings', 'gait': 'pace', 'trackCondition': 'sloppy', 'trackSize': 'full', 'purse': 50000, 'finish': 1, 'time': 113.03, 'date': new Date('2019-04-05T00:00:00.000Z') },
                { 'id': 186220, 'name': 'Metro Pace', 'stake': true, 'elim': false, 'age': '2yo', 'condition': 'Open', 'gait': 'pace', 'trackCondition': 'slow', 'trackSize': 'full', 'purse': 625000, 'finish': 3, 'time': 114.17, 'date': new Date('2019-03-24T00:00:00.000Z') },
                { 'id': 184644, 'name': 'Metro Pace', 'stake': true, 'elim': true, 'age': '2yo', 'condition': 'Open', 'gait': 'pace', 'trackCondition': 'slow', 'trackSize': 'full', 'purse': 218750, 'finish': 1, 'time': 113.44, 'date': new Date('2019-03-17T00:00:00.000Z') },
                { 'id': 183076, 'name': 'Sapling Stakes', 'stake': true, 'elim': false, 'age': '2yo', 'condition': 'Open', 'gait': 'pace', 'trackCondition': 'slow', 'trackSize': 'full', 'purse': 200000, 'finish': 6, 'time': 114.86, 'date': new Date('2019-03-10T00:00:00.000Z') },
                { 'id': 181502, 'name': 'Sapling Stakes', 'stake': true, 'elim': true, 'age': '2yo', 'condition': 'Open', 'gait': 'pace', 'trackCondition': 'fast', 'trackSize': 'full', 'purse': 70000, 'finish': 4, 'time': 114.59, 'date': new Date('2019-03-03T00:00:00.000Z') },
                { 'id': 176982, 'name': 'Open', 'stake': false, 'elim': false, 'age': '2yo', 'condition': 'Colts & Geldings', 'gait': 'pace', 'trackCondition': 'muddy', 'trackSize': 'full', 'purse': 50000, 'finish': 1, 'time': 115, 'date': new Date('2019-02-22T00:00:00.000Z') },
                { 'id': 178162, 'name': 'Prix Emmanuel Margouty', 'stake': true, 'elim': false, 'age': '2yo', 'condition': 'Open', 'gait': 'pace', 'trackCondition': 'slow', 'trackSize': 'full', 'purse': 150000, 'finish': 2, 'time': 113.31, 'date': new Date('2019-02-16T00:00:00.000Z') },
                { 'id': 176095, 'name': 'Prix Emmanuel Margouty', 'stake': true, 'elim': true, 'age': '2yo', 'condition': 'Open', 'gait': 'pace', 'trackCondition': 'fast', 'trackSize': 'full', 'purse': 52500, 'finish': 2, 'time': 115.39, 'date': new Date('2019-02-09T00:00:00.000Z') },
                { 'id': 170869, 'name': 'Open', 'stake': false, 'elim': false, 'age': '2yo', 'condition': 'Colts & Geldings', 'gait': 'pace', 'trackCondition': 'sloppy', 'trackSize': 'full', 'purse': 50000, 'finish': 2, 'time': 115.75, 'date': new Date('2019-02-01T00:00:00.000Z') },
                { 'id': 168853, 'name': 'Open', 'stake': false, 'elim': false, 'age': '2yo', 'condition': 'Colts & Geldings', 'gait': 'pace', 'trackCondition': 'fast', 'trackSize': 'full', 'purse': 50000, 'finish': 2, 'time': 115.22999999999999, 'date': new Date('2019-01-25T00:00:00.000Z') },
                { 'id': 166453, 'name': 'Open', 'stake': false, 'elim': false, 'age': '2yo', 'condition': 'Colts & Geldings', 'gait': 'pace', 'trackCondition': 'slow', 'trackSize': 'full', 'purse': 50000, 'finish': 1, 'time': 115.72, 'date': new Date('2019-01-16T00:00:00.000Z') }
            ]
        ],
        [
            26326,
            [
                { 'id': 499874, 'name': 'Open', 'stake': false, 'elim': false, 'age': '5yo+', 'condition': 'Colts & Geldings', 'gait': 'pace', 'trackCondition': 'fast', 'trackSize': 'full', 'purse': 50000, 'finish': 3, 'time': 115.63, 'date': new Date('2022-05-11T00:00:00.000Z') },
                { 'id': 500471, 'name': 'Fillybuster Stakes', 'stake': true, 'elim': false, 'age': '5yo+', 'condition': 'Open', 'gait': 'pace', 'trackCondition': 'slow', 'trackSize': 'full', 'purse': 250000, 'finish': 11, 'time': 114.13, 'date': new Date('2022-05-04T00:00:00.000Z') },
                { 'id': 497990, 'name': 'Fillybuster Stakes', 'stake': true, 'elim': true, 'age': '5yo+', 'condition': 'Open', 'gait': 'pace', 'trackCondition': 'fast', 'trackSize': 'full', 'purse': 87500, 'finish': 3, 'time': 114.03999999999999, 'date': new Date('2022-04-27T00:00:00.000Z') },
                { 'id': 495524, 'name': 'Find Out Stakes', 'stake': true, 'elim': false, 'age': '5yo+', 'condition': 'Open', 'gait': 'pace', 'trackCondition': 'fast', 'trackSize': 'full', 'purse': 175000, 'finish': 10, 'time': 115.36, 'date': new Date('2022-04-20T00:00:00.000Z') },
                { 'id': 493056, 'name': 'Find Out Stakes', 'stake': true, 'elim': true, 'age': '5yo+', 'condition': 'Open', 'gait': 'pace', 'trackCondition': 'slow', 'trackSize': 'full', 'purse': 61250, 'finish': 3, 'time': 114.47, 'date': new Date('2022-04-13T00:00:00.000Z') },
                { 'id': 487619, 'name': 'Open', 'stake': false, 'elim': false, 'age': '5yo+', 'condition': 'Colts & Geldings', 'gait': 'pace', 'trackCondition': 'good', 'trackSize': 'full', 'purse': 50000, 'finish': 1, 'time': 115.63, 'date': new Date('2022-04-02T00:00:00.000Z') },
                { 'id': 485492, 'name': 'Open', 'stake': false, 'elim': false, 'age': '5yo+', 'condition': 'Colts & Geldings', 'gait': 'pace', 'trackCondition': 'fast', 'trackSize': 'full', 'purse': 50000, 'finish': 1, 'time': 114.03999999999999, 'date': new Date('2022-03-25T00:00:00.000Z') },
                { 'id': 480900, 'name': 'Open', 'stake': false, 'elim': false, 'age': '5yo+', 'condition': 'Colts & Geldings', 'gait': 'pace', 'trackCondition': 'fast', 'trackSize': 'full', 'purse': 50000, 'finish': 3, 'time': 113.63, 'date': new Date('2022-03-08T00:00:00.000Z') },
                { 'id': 479451, 'name': 'Open', 'stake': false, 'elim': false, 'age': '5yo+', 'condition': 'Colts & Geldings', 'gait': 'pace', 'trackCondition': 'sloppy', 'trackSize': 'full', 'purse': 50000, 'finish': 2, 'time': 116.07, 'date': new Date('2022-03-02T00:00:00.000Z') },
                { 'id': 479747, 'name': 'Astronomical Stakes', 'stake': true, 'elim': true, 'age': '5yo+', 'condition': 'Open', 'gait': 'pace', 'trackCondition': 'muddy', 'trackSize': 'full', 'purse': 175000, 'finish': 7, 'time': 114.47999999999999, 'date': new Date('2022-02-23T00:00:00.000Z') },
                { 'id': 477605, 'name': 'Light Speed Stakes', 'stake': true, 'elim': false, 'age': '5yo+', 'condition': 'Open', 'gait': 'pace', 'trackCondition': 'muddy', 'trackSize': 'full', 'purse': 320000, 'finish': 3, 'time': 117.19, 'date': new Date('2022-02-16T00:00:00.000Z') },
                { 'id': 475104, 'name': 'Light Speed Stakes', 'stake': true, 'elim': true, 'age': '5yo+', 'condition': 'Open', 'gait': 'pace', 'trackCondition': 'slow', 'trackSize': 'full', 'purse': 112000, 'finish': 3, 'time': 115.89, 'date': new Date('2022-02-09T00:00:00.000Z') },
                { 'id': 469967, 'name': 'Open', 'stake': false, 'elim': false, 'age': '5yo+', 'condition': 'Colts & Geldings', 'gait': 'pace', 'trackCondition': 'fast', 'trackSize': 'full', 'purse': 50000, 'finish': 2, 'time': 114.88, 'date': new Date('2022-02-03T00:00:00.000Z') },
                { 'id': 470169, 'name': 'Fillybuster Stakes', 'stake': true, 'elim': true, 'age': '5yo+', 'condition': 'Open', 'gait': 'pace', 'trackCondition': 'fast', 'trackSize': 'full', 'purse': 87500, 'finish': 5, 'time': 115.28, 'date': new Date('2022-01-26T00:00:00.000Z') },
                { 'id': 465017, 'name': 'Preferred', 'stake': false, 'elim': false, 'age': '5yo+', 'condition': 'Colts & Geldings Nw5', 'gait': 'pace', 'trackCondition': 'slow', 'trackSize': 'full', 'purse': 45000, 'finish': 1, 'time': 115.63, 'date': new Date('2022-01-20T00:00:00.000Z') },
                { 'id': 465225, 'name': 'Find Out Stakes', 'stake': true, 'elim': true, 'age': '5yo+', 'condition': 'Open', 'gait': 'pace', 'trackCondition': 'fast', 'trackSize': 'full', 'purse': 61250, 'finish': 5, 'time': 117.72999999999999, 'date': new Date('2022-01-12T00:00:00.000Z') },
                { 'id': 461329, 'name': 'Open', 'stake': false, 'elim': false, 'age': '5yo+', 'condition': 'Colts & Geldings', 'gait': 'pace', 'trackCondition': 'slow', 'trackSize': 'full', 'purse': 50000, 'finish': 3, 'time': 115.78, 'date': new Date('2022-01-07T00:00:00.000Z') },
                { 'id': 459889, 'name': 'Open', 'stake': false, 'elim': false, 'age': '5yo+', 'condition': 'Colts & Geldings', 'gait': 'pace', 'trackCondition': 'fast', 'trackSize': 'full', 'purse': 50000, 'finish': 6, 'time': 114.06, 'date': new Date('2022-01-01T00:00:00.000Z') },
                { 'id': 458401, 'name': 'Open', 'stake': false, 'elim': false, 'age': '5yo+', 'condition': 'Colts & Geldings', 'gait': 'pace', 'trackCondition': 'slow', 'trackSize': 'full', 'purse': 50000, 'finish': 1, 'time': 114.14, 'date': new Date('2021-12-26T00:00:00.000Z') },
                { 'id': 454013, 'name': 'Open', 'stake': false, 'elim': false, 'age': '5yo+', 'condition': 'Colts & Geldings', 'gait': 'pace', 'trackCondition': 'fast', 'trackSize': 'full', 'purse': 50000, 'finish': 1, 'time': 114.27000000000001, 'date': new Date('2021-12-10T00:00:00.000Z') },
                { 'id': 453859, 'name': 'Astronomical Stakes', 'stake': true, 'elim': true, 'age': '5yo+', 'condition': 'Open', 'gait': 'pace', 'trackCondition': 'sloppy', 'trackSize': 'full', 'purse': 175000, 'finish': 5, 'time': 118.03999999999999, 'date': new Date('2021-12-01T00:00:00.000Z') },
                { 'id': 452004, 'name': 'Light Speed Stakes', 'stake': true, 'elim': false, 'age': '5yo+', 'condition': 'Open', 'gait': 'pace', 'trackCondition': 'sloppy', 'trackSize': 'full', 'purse': 320000, 'finish': 7, 'time': 114.64, 'date': new Date('2021-11-24T00:00:00.000Z') },
                { 'id': 449702, 'name': 'Light Speed Stakes', 'stake': true, 'elim': true, 'age': '5yo+', 'condition': 'Open', 'gait': 'pace', 'trackCondition': 'muddy', 'trackSize': 'full', 'purse': 112000, 'finish': 4, 'time': 115.44, 'date': new Date('2021-11-17T00:00:00.000Z') },
                { 'id': 443762, 'name': 'Open', 'stake': false, 'elim': false, 'age': '5yo+', 'condition': 'Colts & Geldings', 'gait': 'pace', 'trackCondition': 'slow', 'trackSize': 'full', 'purse': 50000, 'finish': 2, 'time': 114.09, 'date': new Date('2021-11-09T00:00:00.000Z') },
                { 'id': 444778, 'name': 'Fillybuster Stakes', 'stake': true, 'elim': true, 'age': '5yo+', 'condition': 'Open', 'gait': 'pace', 'trackCondition': 'fast', 'trackSize': 'full', 'purse': 87500, 'finish': 6, 'time': 116.3, 'date': new Date('2021-11-03T00:00:00.000Z') },
                { 'id': 442347, 'name': 'Find Out Stakes', 'stake': true, 'elim': false, 'age': '5yo+', 'condition': 'Open', 'gait': 'pace', 'trackCondition': 'slow', 'trackSize': 'full', 'purse': 175000, 'finish': 12, 'time': 114.22, 'date': new Date('2021-10-27T00:00:00.000Z') },
                { 'id': 439866, 'name': 'Find Out Stakes', 'stake': true, 'elim': true, 'age': '5yo+', 'condition': 'Open', 'gait': 'pace', 'trackCondition': 'fast', 'trackSize': 'full', 'purse': 61250, 'finish': 1, 'time': 114.06, 'date': new Date('2021-10-20T00:00:00.000Z') },
                { 'id': 433897, 'name': 'Open', 'stake': false, 'elim': false, 'age': '5yo+', 'condition': 'Colts & Geldings', 'gait': 'pace', 'trackCondition': 'fast', 'trackSize': 'full', 'purse': 50000, 'finish': 2, 'time': 114.00999999999999, 'date': new Date('2021-10-09T00:00:00.000Z') },
                { 'id': 432448, 'name': 'THE FALCON STAKE', 'stake': true, 'elim': false, 'age': '5yo+', 'condition': 'Colts & Geldings', 'gait': 'pace', 'trackCondition': 'fast', 'trackSize': 'full', 'purse': 1000000, 'finish': 2, 'time': 113.59, 'date': new Date('2021-09-25T00:00:00.000Z') },
                { 'id': 430609, 'name': 'THE FALCON STAKE', 'stake': true, 'elim': true, 'age': '5yo+', 'condition': 'Colts & Geldings', 'gait': 'pace', 'trackCondition': 'sloppy', 'trackSize': 'full', 'purse': 350000, 'finish': 4, 'time': 113.81, 'date': new Date('2021-09-18T00:00:00.000Z') },
                { 'id': 428730, 'name': 'European Pacing Championship', 'stake': true, 'elim': false, 'age': '5yo+', 'condition': 'Open', 'gait': 'pace', 'trackCondition': 'good', 'trackSize': 'full', 'purse': 200000, 'finish': 1, 'time': 115.28, 'date': new Date('2021-09-11T00:00:00.000Z') },
                { 'id': 426851, 'name': 'European Pacing Championship', 'stake': true, 'elim': true, 'age': '5yo+', 'condition': 'Open', 'gait': 'pace', 'trackCondition': 'fast', 'trackSize': 'full', 'purse': 70000, 'finish': 3, 'time': 115.28999999999999, 'date': new Date('2021-09-04T00:00:00.000Z') },
                { 'id': 421575, 'name': 'Claiming $150,000', 'stake': false, 'elim': false, 'age': '5yo+', 'condition': 'Colts & Geldings Nw4', 'gait': 'pace', 'trackCondition': 'sloppy', 'trackSize': 'full', 'purse': 40000, 'finish': 1, 'time': 114.06, 'date': new Date('2021-08-26T00:00:00.000Z') },
                { 'id': 418103, 'name': 'Dan Patch', 'stake': true, 'elim': true, 'age': '5yo+', 'condition': 'Open', 'gait': 'pace', 'trackCondition': 'fast', 'trackSize': 'full', 'purse': 70000, 'finish': 10, 'time': 115.39, 'date': new Date('2021-08-07T00:00:00.000Z') },
                { 'id': 415655, 'name': 'Canadian Pacing Derby', 'stake': true, 'elim': false, 'age': '5yo+', 'condition': 'Open', 'gait': 'pace', 'trackCondition': 'fast', 'trackSize': 'full', 'purse': 275000, 'finish': 6, 'time': 113.7, 'date': new Date('2021-07-31T00:00:00.000Z') },
                { 'id': 413191, 'name': 'Canadian Pacing Derby', 'stake': true, 'elim': true, 'age': '5yo+', 'condition': 'Open', 'gait': 'pace', 'trackCondition': 'fast', 'trackSize': 'full', 'purse': 96250, 'finish': 3, 'time': 115.13, 'date': new Date('2021-07-24T00:00:00.000Z') },
                { 'id': 407743, 'name': 'Open', 'stake': false, 'elim': false, 'age': '5yo+', 'condition': 'Colts & Geldings', 'gait': 'pace', 'trackCondition': 'fast', 'trackSize': 'full', 'purse': 50000, 'finish': 2, 'time': 115.22999999999999, 'date': new Date('2021-07-17T00:00:00.000Z') },
                { 'id': 406063, 'name': 'Open', 'stake': false, 'elim': false, 'age': '5yo+', 'condition': 'Colts & Geldings', 'gait': 'pace', 'trackCondition': 'good', 'trackSize': 'full', 'purse': 50000, 'finish': 1, 'time': 114.47999999999999, 'date': new Date('2021-07-11T00:00:00.000Z') },
                { 'id': 404476, 'name': 'THE IRON MAN STAKE', 'stake': true, 'elim': false, 'age': '5yo+', 'condition': 'Colts & Geldings', 'gait': 'pace', 'trackCondition': 'sloppy', 'trackSize': 'full', 'purse': 1000000, 'finish': 8, 'time': 112.88, 'date': new Date('2021-06-26T00:00:00.000Z') },
                { 'id': 402644, 'name': 'THE IRON MAN STAKE', 'stake': true, 'elim': true, 'age': '5yo+', 'condition': 'Colts & Geldings', 'gait': 'pace', 'trackCondition': 'slow', 'trackSize': 'full', 'purse': 350000, 'finish': 1, 'time': 114.91, 'date': new Date('2021-06-19T00:00:00.000Z') },
                { 'id': 398403, 'name': 'Open', 'stake': false, 'elim': false, 'age': '5yo+', 'condition': 'Colts & Geldings', 'gait': 'pace', 'trackCondition': 'sloppy', 'trackSize': 'full', 'purse': 50000, 'finish': 1, 'time': 115.18, 'date': new Date('2021-06-12T00:00:00.000Z') },
                { 'id': 398896, 'name': 'New Zealand Cup', 'stake': true, 'elim': false, 'age': '5yo+', 'condition': 'Open', 'gait': 'pace', 'trackCondition': 'slow', 'trackSize': 'full', 'purse': 750000, 'finish': 3, 'time': 116.55, 'date': new Date('2021-06-05T00:00:00.000Z') },
                { 'id': 397013, 'name': 'New Zealand Cup', 'stake': true, 'elim': true, 'age': '5yo+', 'condition': 'Open', 'gait': 'pace', 'trackCondition': 'fast', 'trackSize': 'full', 'purse': 262500, 'finish': 3, 'time': 115.86, 'date': new Date('2021-05-29T00:00:00.000Z') },
                { 'id': 395147, 'name': 'Dan Patch', 'stake': true, 'elim': false, 'age': '5yo+', 'condition': 'Open', 'gait': 'pace', 'trackCondition': 'fast', 'trackSize': 'full', 'purse': 200000, 'finish': 4, 'time': 115.25, 'date': new Date('2021-05-22T00:00:00.000Z') },
                { 'id': 392684, 'name': 'Dan Patch', 'stake': true, 'elim': true, 'age': '5yo+', 'condition': 'Open', 'gait': 'pace', 'trackCondition': 'fast', 'trackSize': 'full', 'purse': 70000, 'finish': 4, 'time': 115.09, 'date': new Date('2021-05-15T00:00:00.000Z') },
                { 'id': 390238, 'name': 'Canadian Pacing Derby', 'stake': true, 'elim': false, 'age': '5yo+', 'condition': 'Open', 'gait': 'pace', 'trackCondition': 'fast', 'trackSize': 'full', 'purse': 275000, 'finish': 10, 'time': 116.78999999999999, 'date': new Date('2021-05-08T00:00:00.000Z') },
                { 'id': 387782, 'name': 'Canadian Pacing Derby', 'stake': true, 'elim': true, 'age': '5yo+', 'condition': 'Open', 'gait': 'pace', 'trackCondition': 'sloppy', 'trackSize': 'full', 'purse': 96250, 'finish': 3, 'time': 112.22999999999999, 'date': new Date('2021-05-01T00:00:00.000Z') },
                { 'id': 381571, 'name': 'Open', 'stake': false, 'elim': false, 'age': '5yo+', 'condition': 'Colts & Geldings', 'gait': 'pace', 'trackCondition': 'slow', 'trackSize': 'full', 'purse': 50000, 'finish': 1, 'time': 115.88, 'date': new Date('2021-04-22T00:00:00.000Z') },
                { 'id': 379171, 'name': 'Open', 'stake': false, 'elim': false, 'age': '5yo+', 'condition': 'Colts & Geldings', 'gait': 'pace', 'trackCondition': 'fast', 'trackSize': 'full', 'purse': 50000, 'finish': 1, 'time': 116.17, 'date': new Date('2021-04-15T00:00:00.000Z') },
                { 'id': 377539, 'name': 'Open', 'stake': false, 'elim': false, 'age': '5yo+', 'condition': 'Colts & Geldings', 'gait': 'pace', 'trackCondition': 'good', 'trackSize': 'full', 'purse': 50000, 'finish': 2, 'time': 113.8, 'date': new Date('2021-04-08T00:00:00.000Z') },
                { 'id': 375653, 'name': 'Open', 'stake': false, 'elim': false, 'age': '5yo+', 'condition': 'Colts & Geldings', 'gait': 'pace', 'trackCondition': 'sloppy', 'trackSize': 'full', 'purse': 50000, 'finish': 1, 'time': 112.69, 'date': new Date('2021-04-01T00:00:00.000Z') },
                { 'id': 374862, 'name': 'European Pacing Championship', 'stake': true, 'elim': false, 'age': '5yo+', 'condition': 'Open', 'gait': 'pace', 'trackCondition': 'fast', 'trackSize': 'full', 'purse': 200000, 'finish': 6, 'time': 112.72, 'date': new Date('2021-03-20T00:00:00.000Z') },
                { 'id': 372974, 'name': 'European Pacing Championship', 'stake': true, 'elim': true, 'age': '5yo+', 'condition': 'Open', 'gait': 'pace', 'trackCondition': 'slow', 'trackSize': 'full', 'purse': 70000, 'finish': 1, 'time': 116.31, 'date': new Date('2021-03-13T00:00:00.000Z') },
                { 'id': 368384, 'name': 'Open', 'stake': false, 'elim': false, 'age': '2-4yo', 'condition': 'Colts & Geldings', 'gait': 'pace', 'trackCondition': 'slow', 'trackSize': 'full', 'purse': 50000, 'finish': 2, 'time': 114.97, 'date': new Date('2021-03-05T00:00:00.000Z') },
                { 'id': 369231, 'name': 'New Zealand Cup', 'stake': true, 'elim': true, 'age': '5yo+', 'condition': 'Open', 'gait': 'pace', 'trackCondition': 'slow', 'trackSize': 'full', 'purse': 262500, 'finish': 8, 'time': 116.58, 'date': new Date('2021-02-27T00:00:00.000Z') },
                { 'id': 367366, 'name': 'Dan Patch', 'stake': true, 'elim': false, 'age': '5yo+', 'condition': 'Open', 'gait': 'pace', 'trackCondition': 'slow', 'trackSize': 'full', 'purse': 200000, 'finish': 3, 'time': 114.34, 'date': new Date('2021-02-20T00:00:00.000Z') },
                { 'id': 364908, 'name': 'Dan Patch', 'stake': true, 'elim': true, 'age': '5yo+', 'condition': 'Open', 'gait': 'pace', 'trackCondition': 'fast', 'trackSize': 'full', 'purse': 70000, 'finish': 3, 'time': 114.7, 'date': new Date('2021-02-13T00:00:00.000Z') },
                { 'id': 362468, 'name': 'Canadian Pacing Derby', 'stake': true, 'elim': false, 'age': '5yo+', 'condition': 'Open', 'gait': 'pace', 'trackCondition': 'slow', 'trackSize': 'full', 'purse': 275000, 'finish': 9, 'time': 116.56, 'date': new Date('2021-02-06T00:00:00.000Z') },
                { 'id': 360015, 'name': 'Canadian Pacing Derby', 'stake': true, 'elim': true, 'age': '5yo+', 'condition': 'Open', 'gait': 'pace', 'trackCondition': 'fast', 'trackSize': 'full', 'purse': 96250, 'finish': 4, 'time': 114.93, 'date': new Date('2021-01-30T00:00:00.000Z') },
                { 'id': 354084, 'name': 'Open', 'stake': false, 'elim': false, 'age': '2-4yo', 'condition': 'Colts & Geldings', 'gait': 'pace', 'trackCondition': 'slow', 'trackSize': 'full', 'purse': 50000, 'finish': 1, 'time': 116.66, 'date': new Date('2021-01-19T00:00:00.000Z') },
                { 'id': 352260, 'name': 'Open', 'stake': false, 'elim': false, 'age': '2-4yo', 'condition': 'Colts & Geldings', 'gait': 'pace', 'trackCondition': 'muddy', 'trackSize': 'full', 'purse': 50000, 'finish': 1, 'time': 116.2, 'date': new Date('2021-01-12T00:00:00.000Z') },
                { 'id': 350820, 'name': 'Open', 'stake': false, 'elim': false, 'age': '2-4yo', 'condition': 'Colts & Geldings', 'gait': 'pace', 'trackCondition': 'sloppy', 'trackSize': 'full', 'purse': 50000, 'finish': 1, 'time': 115.39, 'date': new Date('2021-01-05T00:00:00.000Z') },
                { 'id': 349198, 'name': 'European Pacing Derby', 'stake': true, 'elim': false, 'age': '3yo', 'condition': 'Open', 'gait': 'pace', 'trackCondition': 'fast', 'trackSize': 'full', 'purse': 240000, 'finish': 1, 'time': 113.91, 'date': new Date('2020-12-19T00:00:00.000Z') },
                { 'id': 347615, 'name': 'European Pacing Derby', 'stake': true, 'elim': true, 'age': '3yo', 'condition': 'Open', 'gait': 'pace', 'trackCondition': 'fast', 'trackSize': 'full', 'purse': 84000, 'finish': 1, 'time': 114.07, 'date': new Date('2020-12-12T00:00:00.000Z') },
                { 'id': 346048, 'name': 'Australasian Pacing Derby', 'stake': true, 'elim': false, 'age': '3yo', 'condition': 'Open', 'gait': 'pace', 'trackCondition': 'fast', 'trackSize': 'full', 'purse': 200000, 'finish': 2, 'time': 114.88, 'date': new Date('2020-12-05T00:00:00.000Z') },
                { 'id': 344455, 'name': 'Australasian Pacing Derby', 'stake': true, 'elim': true, 'age': '3yo', 'condition': 'Open', 'gait': 'pace', 'trackCondition': 'sloppy', 'trackSize': 'full', 'purse': 70000, 'finish': 1, 'time': 113.38, 'date': new Date('2020-11-28T00:00:00.000Z') },
                { 'id': 342892, 'name': 'Meadowlands Pace', 'stake': true, 'elim': false, 'age': '3yo', 'condition': 'Open', 'gait': 'pace', 'trackCondition': 'fast', 'trackSize': 'full', 'purse': 400000, 'finish': 4, 'time': 115.93, 'date': new Date('2020-11-21T00:00:00.000Z') },
                { 'id': 340819, 'name': 'Meadowlands Pace', 'stake': true, 'elim': true, 'age': '3yo', 'condition': 'Open', 'gait': 'pace', 'trackCondition': 'fast', 'trackSize': 'full', 'purse': 140000, 'finish': 2, 'time': 114.47999999999999, 'date': new Date('2020-11-14T00:00:00.000Z') },
                { 'id': 336716, 'name': 'North America Cup', 'stake': true, 'elim': true, 'age': '3yo', 'condition': 'Open', 'gait': 'pace', 'trackCondition': 'fast', 'trackSize': 'full', 'purse': 350000, 'finish': 10, 'time': 113.81, 'date': new Date('2020-10-31T00:00:00.000Z') },
                { 'id': 331187, 'name': 'Open', 'stake': false, 'elim': false, 'age': '3yo', 'condition': 'Colts & Geldings', 'gait': 'pace', 'trackCondition': 'fast', 'trackSize': 'full', 'purse': 50000, 'finish': 1, 'time': 111.75, 'date': new Date('2020-10-21T00:00:00.000Z') },
                { 'id': 329555, 'name': 'Open', 'stake': false, 'elim': false, 'age': '3yo', 'condition': 'Colts & Geldings', 'gait': 'pace', 'trackCondition': 'slow', 'trackSize': 'full', 'purse': 50000, 'finish': 1, 'time': 112.88, 'date': new Date('2020-10-16T00:00:00.000Z') },
                { 'id': 328355, 'name': 'Open', 'stake': false, 'elim': false, 'age': '3yo', 'condition': 'Colts & Geldings', 'gait': 'pace', 'trackCondition': 'fast', 'trackSize': 'full', 'purse': 50000, 'finish': 1, 'time': 115.13, 'date': new Date('2020-10-10T00:00:00.000Z') },
                { 'id': 326915, 'name': 'Open', 'stake': false, 'elim': false, 'age': '3yo', 'condition': 'Colts & Geldings', 'gait': 'pace', 'trackCondition': 'slow', 'trackSize': 'full', 'purse': 50000, 'finish': 2, 'time': 115.72999999999999, 'date': new Date('2020-10-03T00:00:00.000Z') },
                { 'id': 325940, 'name': 'Metro Pace', 'stake': true, 'elim': false, 'age': '2yo', 'condition': 'Open', 'gait': 'pace', 'trackCondition': 'fast', 'trackSize': 'full', 'purse': 625000, 'finish': 4, 'time': 115.78, 'date': new Date('2020-09-19T00:00:00.000Z') },
                { 'id': 324356, 'name': 'Metro Pace', 'stake': true, 'elim': true, 'age': '2yo', 'condition': 'Open', 'gait': 'pace', 'trackCondition': 'sloppy', 'trackSize': 'full', 'purse': 218750, 'finish': 4, 'time': 113.97, 'date': new Date('2020-09-12T00:00:00.000Z') },
                { 'id': 322795, 'name': 'Sapling Stakes', 'stake': true, 'elim': false, 'age': '2yo', 'condition': 'Open', 'gait': 'pace', 'trackCondition': 'fast', 'trackSize': 'full', 'purse': 200000, 'finish': 2, 'time': 112.15, 'date': new Date('2020-09-05T00:00:00.000Z') },
                { 'id': 321210, 'name': 'Sapling Stakes', 'stake': true, 'elim': true, 'age': '2yo', 'condition': 'Open', 'gait': 'pace', 'trackCondition': 'muddy', 'trackSize': 'full', 'purse': 70000, 'finish': 1, 'time': 114.34, 'date': new Date('2020-08-29T00:00:00.000Z') },
                { 'id': 316423, 'name': 'Open', 'stake': false, 'elim': false, 'age': '2yo', 'condition': 'Colts & Geldings', 'gait': 'pace', 'trackCondition': 'slow', 'trackSize': 'full', 'purse': 50000, 'finish': 1, 'time': 113.9, 'date': new Date('2020-08-21T00:00:00.000Z') },
                { 'id': 317603, 'name': 'Prix Emmanuel Margouty', 'stake': true, 'elim': false, 'age': '2yo', 'condition': 'Open', 'gait': 'pace', 'trackCondition': 'slow', 'trackSize': 'full', 'purse': 150000, 'finish': 1, 'time': 112.38, 'date': new Date('2020-08-15T00:00:00.000Z') },
                { 'id': 315536, 'name': 'Prix Emmanuel Margouty', 'stake': true, 'elim': true, 'age': '2yo', 'condition': 'Open', 'gait': 'pace', 'trackCondition': 'fast', 'trackSize': 'full', 'purse': 52500, 'finish': 1, 'time': 115.69, 'date': new Date('2020-08-08T00:00:00.000Z') },
                { 'id': 307909, 'name': 'Open', 'stake': false, 'elim': false, 'age': '2yo', 'condition': 'Colts & Geldings', 'gait': 'pace', 'trackCondition': 'slow', 'trackSize': 'full', 'purse': 50000, 'finish': 1, 'time': 115.78, 'date': new Date('2020-07-22T00:00:00.000Z') }
            ]
        ],
        [
            75756,
            [
                { 'id': 770544, 'name': 'Open', 'stake': false, 'elim': false, 'age': '5yo+', 'condition': 'Colts & Geldings', 'gait': 'trot', 'trackCondition': 'fast', 'trackSize': 'full', 'purse': 50000, 'finish': 1, 'time': 119.64, 'date': new Date('2024-10-01T00:00:00.000Z') },
                { 'id': 768951, 'name': 'Open', 'stake': false, 'elim': false, 'age': '2-4yo', 'condition': 'Colts & Geldings', 'gait': 'trot', 'trackCondition': 'muddy', 'trackSize': 'full', 'purse': 50000, 'finish': 1, 'time': 124.93, 'date': new Date('2024-09-25T00:00:00.000Z') },
                { 'id': 766963, 'name': 'Open', 'stake': false, 'elim': false, 'age': '2-4yo', 'condition': 'Colts & Geldings', 'gait': 'trot', 'trackCondition': 'slow', 'trackSize': 'full', 'purse': 50000, 'finish': 2, 'time': 121.43, 'date': new Date('2024-09-17T00:00:00.000Z') },
                { 'id': 765492, 'name': 'Open', 'stake': false, 'elim': false, 'age': '2-4yo', 'condition': 'Colts & Geldings', 'gait': 'trot', 'trackCondition': 'fast', 'trackSize': 'full', 'purse': 50000, 'finish': 1, 'time': 120.87, 'date': new Date('2024-09-12T00:00:00.000Z') },
                { 'id': 763610, 'name': 'Open', 'stake': false, 'elim': false, 'age': '2-4yo', 'condition': 'Colts & Geldings', 'gait': 'trot', 'trackCondition': 'fast', 'trackSize': 'full', 'purse': 50000, 'finish': 5, 'time': 121.95, 'date': new Date('2024-09-05T00:00:00.000Z') },
                { 'id': 761870, 'name': 'Open', 'stake': false, 'elim': false, 'age': '2-4yo', 'condition': 'Colts & Geldings', 'gait': 'trot', 'trackCondition': 'fast', 'trackSize': 'full', 'purse': 50000, 'finish': 1, 'time': 125.27, 'date': new Date('2024-08-30T00:00:00.000Z') },
                { 'id': 759410, 'name': 'Open', 'stake': false, 'elim': false, 'age': '2-4yo', 'condition': 'Colts & Geldings', 'gait': 'trot', 'trackCondition': 'fast', 'trackSize': 'full', 'purse': 50000, 'finish': 1, 'time': 123.42, 'date': new Date('2024-08-23T00:00:00.000Z') },
                { 'id': 760504, 'name': 'The Centaur Stakes', 'stake': true, 'elim': true, 'age': '5yo+', 'condition': 'Open', 'gait': 'trot', 'trackCondition': 'fast', 'trackSize': 'full', 'purse': 70000, 'finish': 5, 'time': 122.56, 'date': new Date('2024-08-18T00:00:00.000Z') },
                { 'id': 754468, 'name': 'Open', 'stake': false, 'elim': false, 'age': '2-4yo', 'condition': 'Colts & Geldings', 'gait': 'trot', 'trackCondition': 'fast', 'trackSize': 'full', 'purse': 50000, 'finish': 1, 'time': 121.17, 'date': new Date('2024-08-09T00:00:00.000Z') },
                { 'id': 752374, 'name': 'Open', 'stake': false, 'elim': false, 'age': '2-4yo', 'condition': 'Colts & Geldings', 'gait': 'trot', 'trackCondition': 'fast', 'trackSize': 'full', 'purse': 50000, 'finish': 1, 'time': 125.38, 'date': new Date('2024-08-03T00:00:00.000Z') },
                { 'id': 749925, 'name': 'Open', 'stake': false, 'elim': false, 'age': '2-4yo', 'condition': 'Colts & Geldings', 'gait': 'trot', 'trackCondition': 'slow', 'trackSize': 'full', 'purse': 50000, 'finish': 1, 'time': 119.7, 'date': new Date('2024-07-27T00:00:00.000Z') },
                { 'id': 750630, 'name': 'Prix d\'Amerique', 'stake': true, 'elim': true, 'age': '5yo+', 'condition': 'Open', 'gait': 'trot', 'trackCondition': 'fast', 'trackSize': 'full', 'purse': 262500, 'finish': 11, 'time': 125.66, 'date': new Date('2024-07-21T00:00:00.000Z') },
                { 'id': 745302, 'name': 'Open', 'stake': false, 'elim': false, 'age': '2-4yo', 'condition': 'Colts & Geldings', 'gait': 'trot', 'trackCondition': 'fast', 'trackSize': 'full', 'purse': 50000, 'finish': 3, 'time': 123.11, 'date': new Date('2024-07-13T00:00:00.000Z') },
                { 'id': 743270, 'name': 'Open', 'stake': false, 'elim': false, 'age': '2-4yo', 'condition': 'Colts & Geldings', 'gait': 'trot', 'trackCondition': 'good', 'trackSize': 'full', 'purse': 50000, 'finish': 2, 'time': 122.41, 'date': new Date('2024-07-05T00:00:00.000Z') },
                { 'id': 744057, 'name': 'Romulan Stakes', 'stake': true, 'elim': false, 'age': '3yo', 'condition': 'Open', 'gait': 'trot', 'trackCondition': 'sloppy', 'trackSize': 'full', 'purse': 1000000, 'finish': 10, 'time': 124.68, 'date': new Date('2024-06-30T00:00:00.000Z') },
                { 'id': 742292, 'name': 'Romulan Stakes', 'stake': true, 'elim': true, 'age': '3yo', 'condition': 'Open', 'gait': 'trot', 'trackCondition': 'slow', 'trackSize': 'full', 'purse': 350000, 'finish': 1, 'time': 124.41, 'date': new Date('2024-06-23T00:00:00.000Z') },
                { 'id': 738585, 'name': 'Canadian Trotting Classic', 'stake': true, 'elim': false, 'age': '3yo', 'condition': 'Open', 'gait': 'trot', 'trackCondition': 'fast', 'trackSize': 'full', 'purse': 300000, 'finish': 5, 'time': 123.64, 'date': new Date('2024-06-09T00:00:00.000Z') },
                { 'id': 736681, 'name': 'Canadian Trotting Classic', 'stake': true, 'elim': true, 'age': '3yo', 'condition': 'Open', 'gait': 'trot', 'trackCondition': 'fast', 'trackSize': 'full', 'purse': 105000, 'finish': 1, 'time': 123.63, 'date': new Date('2024-06-02T00:00:00.000Z') },
                { 'id': 734823, 'name': 'Hambletonian', 'stake': true, 'elim': false, 'age': '3yo', 'condition': 'Open', 'gait': 'trot', 'trackCondition': 'slow', 'trackSize': 'full', 'purse': 750000, 'finish': 2, 'time': 124.28, 'date': new Date('2024-05-26T00:00:00.000Z') },
                { 'id': 732542, 'name': 'Hambletonian', 'stake': true, 'elim': true, 'age': '3yo', 'condition': 'Open', 'gait': 'trot', 'trackCondition': 'fast', 'trackSize': 'full', 'purse': 262500, 'finish': 3, 'time': 123.06, 'date': new Date('2024-05-19T00:00:00.000Z') },
                { 'id': 727299, 'name': 'Open', 'stake': false, 'elim': false, 'age': '3yo', 'condition': 'Colts & Geldings', 'gait': 'trot', 'trackCondition': 'sloppy', 'trackSize': 'full', 'purse': 50000, 'finish': 3, 'time': 122.8, 'date': new Date('2024-05-12T00:00:00.000Z') },
                { 'id': 727617, 'name': 'Australasian Trotting Derby', 'stake': true, 'elim': true, 'age': '3yo', 'condition': 'Open', 'gait': 'trot', 'trackCondition': 'sloppy', 'trackSize': 'full', 'purse': 87500, 'finish': 7, 'time': 125.27, 'date': new Date('2024-05-05T00:00:00.000Z') },
                { 'id': 725174, 'name': 'Criterium des 3 Ans', 'stake': true, 'elim': false, 'age': '3yo', 'condition': 'Open', 'gait': 'trot', 'trackCondition': 'fast', 'trackSize': 'full', 'purse': 200000, 'finish': 10, 'time': 122.01, 'date': new Date('2024-04-28T00:00:00.000Z') },
                { 'id': 722678, 'name': 'Criterium des 3 Ans', 'stake': true, 'elim': true, 'age': '3yo', 'condition': 'Open', 'gait': 'trot', 'trackCondition': 'slow', 'trackSize': 'full', 'purse': 70000, 'finish': 4, 'time': 122.76, 'date': new Date('2024-04-21T00:00:00.000Z') },
                { 'id': 716741, 'name': 'Open', 'stake': false, 'elim': false, 'age': '3yo', 'condition': 'Colts & Geldings', 'gait': 'trot', 'trackCondition': 'fast', 'trackSize': 'full', 'purse': 50000, 'finish': 1, 'time': 123.59, 'date': new Date('2024-04-11T00:00:00.000Z') },
                { 'id': 714709, 'name': 'Open', 'stake': false, 'elim': false, 'age': '3yo', 'condition': 'Colts & Geldings', 'gait': 'trot', 'trackCondition': 'slow', 'trackSize': 'full', 'purse': 50000, 'finish': 1, 'time': 122.48, 'date': new Date('2024-04-03T00:00:00.000Z') },
                { 'id': 713449, 'name': 'Open', 'stake': false, 'elim': false, 'age': '2yo', 'condition': 'Colts & Geldings', 'gait': 'trot', 'trackCondition': 'fast', 'trackSize': 'full', 'purse': 50000, 'finish': 1, 'time': 124.18, 'date': new Date('2024-03-29T00:00:00.000Z') },
                { 'id': 714352, 'name': 'Borg Stakes', 'stake': true, 'elim': true, 'age': '2yo', 'condition': 'Open', 'gait': 'trot', 'trackCondition': 'slow', 'trackSize': 'full', 'purse': 350000, 'finish': 9, 'time': 121.93, 'date': new Date('2024-03-24T00:00:00.000Z') },
                { 'id': 710616, 'name': 'Peter Haughton Memorial', 'stake': true, 'elim': true, 'age': '2yo', 'condition': 'Open', 'gait': 'trot', 'trackCondition': 'slow', 'trackSize': 'full', 'purse': 175000, 'finish': 8, 'time': 124.87, 'date': new Date('2024-03-10T00:00:00.000Z') },
                { 'id': 708735, 'name': 'Champlain Stakes', 'stake': true, 'elim': false, 'age': '2yo', 'condition': 'Open', 'gait': 'trot', 'trackCondition': 'fast', 'trackSize': 'full', 'purse': 350000, 'finish': 11, 'time': 123.59, 'date': new Date('2024-03-03T00:00:00.000Z') },
                { 'id': 706829, 'name': 'Champlain Stakes', 'stake': true, 'elim': true, 'age': '2yo', 'condition': 'Open', 'gait': 'trot', 'trackCondition': 'good', 'trackSize': 'full', 'purse': 122500, 'finish': 3, 'time': 123.47, 'date': new Date('2024-02-25T00:00:00.000Z') },
                { 'id': 704668, 'name': 'Gran Premio Allevatori', 'stake': true, 'elim': false, 'age': '2yo', 'condition': 'Open', 'gait': 'trot', 'trackCondition': 'slow', 'trackSize': 'full', 'purse': 250000, 'finish': 1, 'time': 122.06, 'date': new Date('2024-02-18T00:00:00.000Z') },
                { 'id': 702183, 'name': 'Gran Premio Allevatori', 'stake': true, 'elim': true, 'age': '2yo', 'condition': 'Open', 'gait': 'trot', 'trackCondition': 'slow', 'trackSize': 'full', 'purse': 87500, 'finish': 3, 'time': 123.98, 'date': new Date('2024-02-11T00:00:00.000Z') },
                { 'id': 695651, 'name': 'Open', 'stake': false, 'elim': false, 'age': '2yo', 'condition': 'Colts & Geldings', 'gait': 'trot', 'trackCondition': 'good', 'trackSize': 'full', 'purse': 50000, 'finish': 1, 'time': 124.45, 'date': new Date('2024-02-01T00:00:00.000Z') }
            ]
        ],
    ]).forEach(([id, expected]) => {
        it(`resolves with the expected race list when given id=${id}`, async () => {
            const actual = await getRaces(id);
            expect(actual).toBeInstanceOf(RaceList);
            expect(actual).toEqual(expected);
        });
    });
});