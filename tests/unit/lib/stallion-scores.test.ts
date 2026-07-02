import { describe, expect, it } from 'vitest';
import '@mocks/harnessnation';

import { Horse } from '../../../src/lib/horses';
import { BreedingScore, calculateBloodlineScore, calculateBreedingScore, calculateRacingScore, calculateStallionScore, createStallionScoreBadge, StallionScore } from '../../../src/lib/stallion-scores';

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

    it(`resolves with null the horse has no sire`, async () => {
        await expect(calculateBloodlineScore(14, [
            { id: 14, sireId: null, stallionScore: { breeding: 128.929962 } }
        ])).resolves.toBeNull();
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
            if (horse.sireId == null || horse.sireId !== horses[0].sireId)
                return;

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