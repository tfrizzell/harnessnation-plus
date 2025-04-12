import { Timestamp } from 'firebase/firestore';
import { Horse, StallionScore } from '../../../src/lib/horses.js';
import { shouldUpdateStallionScore } from '../../../src/scripts/background/horses.js';

interface HorseWithLastModified extends Horse {
    stallionScore?: StallionScoreWithLastModified;
    lastModified?: Timestamp;
}

interface StallionScoreWithLastModified extends StallionScore {
    lastModified?: Timestamp;
}

describe(`shouldUpdateStallionScore`, () => {
    it(`exists`, () => {
        expect(shouldUpdateStallionScore).not.toBeUndefined();
    });

    it(`is a function`, () => {
        expect(typeof shouldUpdateStallionScore).toBe('function');
    });

    it(`returns a boolean`, () => {
        expect(typeof shouldUpdateStallionScore({})).toBe('boolean');
    });

    (<[Partial<HorseWithLastModified>, boolean][]>[
        [{}, true],
        [{ stallionScore: { lastModified: undefined } }, true],
        [{ stallionScore: { lastModified: Date.now() - 1_209_600_000 } }, false],
        [{ stallionScore: { lastModified: Date.now() - 2_505_600_000 } }, true],
        [{ stallionScore: { lastModified: Date.now() - 31_622_400_000 } }, true],
        [{ retired: false }, true],
        [{ retired: false, stallionScore: { lastModified: undefined } }, true],
        [{ retired: false, stallionScore: { lastModified: Date.now() - 1_209_600_000 } }, false],
        [{ retired: false, stallionScore: { lastModified: Date.now() - 2_505_600_000 } }, true],
        [{ retired: false, stallionScore: { lastModified: Date.now() - 31_622_400_000 } }, true],
        [{ retired: true }, true],
        [{ retired: true, stallionScore: { lastModified: undefined } }, true],
        [{ retired: true, stallionScore: { lastModified: Date.now() - 1_209_600_000 } }, true],
        [{ retired: true, stallionScore: { lastModified: Date.now() - 2_505_600_000 } }, true],
        [{ retired: true, stallionScore: { lastModified: Date.now() - 31_622_400_000 } }, false],
    ]).forEach(([horse, expected]) => {
        const lastModified = horse?.stallionScore?.lastModified;

        if (lastModified != null)
            horse!.stallionScore!.lastModified = { toDate: () => new Date(lastModified!) };

        it(`returns ${expected} when given retired=${horse.retired} and lastModified=${lastModified}`, async () => {
            expect(shouldUpdateStallionScore(horse)).toBe(expected);
        });
    });
});