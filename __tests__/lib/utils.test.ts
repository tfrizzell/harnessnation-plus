import { Timestamp } from '@firebase/firestore';
import { chrome } from 'jest-chrome';
import { RaceList } from '../../src/lib/horses';
import { ageToText, downloadFile, formatMark, formatOrdinal, getCurrentSeason, getLifetimeMark, parseCurrency, parseInt, reduceChanges, regexEscape, removeAll, seasonsBetween, secondsToTime, sleep, toDate, toPercentage, toTimestamp, waitFor } from '../../src/lib/utils';

afterAll(() => {
    jest.clearAllTimers();
    jest.clearAllMocks();
});

describe(`ageToText`, () => {
    it(`exists`, () => {
        expect(ageToText).not.toBeUndefined();
    });

    it(`is a function`, () => {
        expect(typeof ageToText).toEqual('function');
    });

    it(`throws an exception when given null`, () => {
        expect(() => ageToText(<any>null)).toThrow(TypeError);
    });

    it(`throws an exception when given undefined`, () => {
        expect(() => ageToText(<any>undefined)).toThrow(TypeError);
    });

    (<[number, string][]>[
        [0, 'Zero'],
        [1, 'One'],
        [2, 'Two'],
        [3, 'Three'],
        [4, 'Four'],
        [5, 'Five'],
        [6, 'Six'],
        [7, 'Seven'],
        [8, 'Eight'],
        [9, 'Nine'],
        [10, 'Ten'],
        [11, 'Eleven'],
        [12, 'Twelve'],
        [13, 'Thirteen'],
        [14, 'Fourteen'],
        [15, 'Fifteen'],
        [16, 'Sixteen'],
        [17, 'Seventeen'],
        [18, 'Eighteen'],
        [19, 'Nineteen'],
        [20, 'Twenty'],
        [21, 'Twenty-One'],
    ]).forEach(([value, expected]) => {
        it(`returns ${expected} when given ${value}`, () => {
            expect(ageToText(value)).toEqual(expected)
        });
    });

    it(`returns its value as a string when given any other value`, () => {
        expect(ageToText(74)).toEqual('74');
    });
});

describe(`downloadFile`, () => {
    const textContent = 'Hello World';
    const base64Content = 'SGVsbG8gV29ybGQ=';
    const blobContent = new Blob([textContent], { type: 'text/plain' });

    const downloadedFiles: Map<string, chrome.downloads.DownloadOptions | null> = new Map();

    beforeAll(() => {
        chrome.downloads.download.mockImplementation((options) => {
            const id = downloadedFiles.size + 1;
            downloadedFiles.set(options.filename || `${Date.now()}.file`, options);
            return Promise.resolve(id);
        });
    });

    afterAll(() => {
        chrome.downloads.download.mockRestore();
    });

    it(`exists`, () => {
        expect(downloadFile).not.toBeUndefined();
    });

    it(`is a function`, () => {
        expect(typeof downloadFile).toEqual('function');
    });

    it(`returns a promise`, () => {
        expect(downloadFile(textContent, 'test-return-promise.txt')).toBeInstanceOf(Promise);
    });

    [
        ['csv', 'text/csv'],
        ['html', 'text/html'],
        ['json', 'application/json'],
        ['pdf', 'application/pdf'],
        ['txt', 'text/plain'],
        ['xls', 'application/vnd.ms-excel'],
        ['xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
        ['readme', 'text/plain'],
    ].forEach(([ext, contentType]) => {
        it(`infers the content type ${contentType} for the extension ${ext}`, async () => {
            const filename = `test-content-type.${ext}`;

            await expect(downloadFile(textContent, filename)).resolves;
            await new Promise(process.nextTick);

            expect(downloadedFiles.get(filename)).toEqual({
                url: `data:${contentType};base64,${base64Content}`,
                filename: filename,
                saveAs: false,
            });
        });
    });

    it(`accepts the contentType and saveAs options`, async () => {
        const filename = `test-options.txt`;

        await expect(downloadFile(textContent, filename, { contentType: 'text/html', saveAs: true })).resolves;
        await new Promise(process.nextTick);

        expect(downloadedFiles.get(filename)).toEqual({
            url: `data:text/html;base64,${base64Content}`,
            filename: filename,
            saveAs: true,
        });
    });

    [
        ['test-unencoded-string.txt', textContent, 'unencoded string'],
        ['test-unencoded-data-uri.txt', `data:text/plain;${textContent}`, 'unencoded data uri'],
        ['test-encoded-data-uri.txt', `data:text/plain;base64,${base64Content}`, 'encoded data uri'],
    ].forEach(([filename, content, descriptor]) => {
        it(`downloads an ${descriptor}`, async () => {
            await expect(downloadFile(content, filename)).resolves;
            await new Promise(process.nextTick);

            expect(downloadedFiles.get(filename)).toEqual({
                url: `data:text/plain;base64,${base64Content}`,
                filename: filename,
                saveAs: false,
            });
        });
    });

    test(`downloads a ${Blob.name}`, async () => {
        const _FileReader = global.FileReader;

        jest.spyOn(global, 'FileReader').mockImplementation(() => {
            const inst = new _FileReader();

            inst.readAsDataURL = (blob) => {
                blob.text().then(content => {
                    Object.defineProperty(inst, 'result', { value: `data:${blob.type};base64,${global.window.btoa(content)}` });
                    inst.dispatchEvent(new Event('load'));
                });
            }

            return inst;
        });

        try {
            const filename = 'test-blob.txt';

            await expect(downloadFile(blobContent, filename)).resolves;
            await new Promise(process.nextTick);

            expect(downloadedFiles.get(filename)).toEqual({
                url: `data:text/plain;base64,${base64Content}`,
                filename: filename,
                saveAs: false,
            });
        } finally {
            jest.restoreAllMocks();
        }
    });

    [
        textContent,
        blobContent,
    ].forEach(content => {
        const type = typeof content === 'object' ? content.constructor.name : typeof content;

        it(`downloads a ${type} using window.URL.createObjectURL`, async () => {
            const createdUrls: string[] = [];
            let createdUrlCount: number = 0;

            global.window.URL.createObjectURL = jest.fn((obj: Blob): string => {
                const result = `data:${obj.type};base64,${base64Content}`;
                createdUrls.push(result!);
                createdUrlCount++;
                return result!;
            });

            global.window.URL.revokeObjectURL = jest.fn((id: string): void => {
                const index = createdUrls.indexOf(id);

                if (index >= 0)
                    createdUrls.splice(0, 1);
            });

            try {
                const filename = `test-${type.toLowerCase()}-from-createobjecturl.txt`;

                await expect(downloadFile(content, filename)).resolves;
                await new Promise(process.nextTick);

                expect(downloadedFiles.get(filename)).toEqual({
                    url: `data:text/plain;base64,${base64Content}`,
                    filename: filename,
                    saveAs: false,
                });

                await new Promise(resolve => setTimeout(resolve, 1500));
                expect(createdUrlCount).toBe(1);
                expect(createdUrls.length).toBe(0);
            } finally {
                (<jest.Mock>global.window.URL.revokeObjectURL).mockRestore();
                (<jest.Mock>global.window.URL.createObjectURL).mockRestore();
            }
        });
    });
});

describe(`formatMark`, () => {
    it(`exists`, () => {
        expect(formatMark).not.toBeUndefined();
    });

    it(`is a function`, () => {
        expect(typeof formatMark).toEqual('function');
    });

    it(`returns an empty string when given null`, () => {
        expect(formatMark(<any>null)).toEqual('');
    });

    it(`returns an empty string when given undefined`, () => {
        expect(formatMark(<any>undefined)).toEqual('');
    });

    it(`returns the expected mark outputs`, () => {
        expect(formatMark({
            time: 120
        })).toEqual('2:00.00');

        expect(formatMark({
            gait: 'pace',
            time: 120
        })).toEqual('p,2:00.00');

        expect(formatMark({
            gait: 'pace',
            time: 120
        }, 2)).toEqual('p,2,2:00.00');
    });
});

describe(`formatOrdinal`, () => {
    it(`exists`, () => {
        expect(formatOrdinal).not.toBeUndefined();
    });

    it(`is a function`, () => {
        expect(typeof formatOrdinal).toEqual('function');
    });

    (<[number, string][]>[
        [0, '0th'],
        [1, '1st'],
        [2, '2nd'],
        [3, '3rd'],
        [4, '4th'],
        [10, '10th'],
        [11, '11th'],
        [12, '12th'],
        [13, '13th'],
        [21, '21st'],
        [22, '22nd'],
        [23, '23rd'],
        [25, '25th'],
        [101, '101st'],
        [102, '102nd'],
        [111, '111th'],
        [112, '112th'],
        [113, '113th'],
        [121, '121st'],
    ]).forEach(([value, expected]) => {
        it(`returns ${expected} when given ${value}`, () => {
            expect(formatOrdinal(value)).toEqual(expected)
        });
    });
});

describe(`getCurrentSeason`, () => {
    it(`exists`, () => {
        expect(getCurrentSeason).not.toBeUndefined();
    });

    it(`is a function`, () => {
        expect(typeof getCurrentSeason).toEqual('function');
    });

    const actual = new Date(1_735_689_600_000);

    new Array(90).fill(0).forEach((_, offset) => {
        const value = new Date(1_735_704_000_000 + offset * 86400000);

        it(`returns the expected season start date for ${value.toJSON()}`, () => {
            jest.useFakeTimers().setSystemTime(value);

            try {
                expect(getCurrentSeason()).toEqual(actual);
            } finally {
                jest.useRealTimers();
            }
        });
    });
});

describe(`getLifetimeMark`, () => {
    it(`exists`, () => {
        expect(getLifetimeMark).not.toBeUndefined();
    });

    it(`is a function`, () => {
        expect(typeof getLifetimeMark).toEqual('function');
    });

    it(`throws an exception when given null`, () => {
        expect(() => getLifetimeMark(<any>null)).toThrow(TypeError);
    });

    it(`throws an exception when given undefined`, () => {
        expect(() => getLifetimeMark(<any>undefined)).toThrow(TypeError);
    });

    it(`returns an empty string if no wins are found`, () => {
        const races = new RaceList();

        races.push({
            finish: 2,
            time: 120,
        });

        expect(getLifetimeMark(races)).toEqual('');
        expect(getLifetimeMark(new RaceList())).toEqual('');
    });

    it(`returns the expected value`, () => {
        const races = new RaceList();

        races.push({
            age: '3yo',
            gait: 'trot',
            finish: 1,
            time: 122,
        });

        races.push({
            age: '3yo',
            gait: 'trot',
            finish: 1,
            time: 120,
        });

        races.push({
            age: '3yo',
            gait: 'trot',
            finish: 1,
            time: 121,
        });

        expect(getLifetimeMark(races)).toEqual('t,3,2:00.00');
    });
});

describe(`parseCurrency`, () => {
    it(`exists`, () => {
        expect(parseCurrency).not.toBeUndefined();
    });

    it(`is a function`, () => {
        expect(typeof parseCurrency).toEqual('function');
    });

    it(`returns null when given null`, () => {
        expect(parseCurrency(<any>null)).toBeNull();
    });

    [
        ['1000000', 1000000],
        ['1000000.00', 1000000.00],
        ['$1000000', 1000000],
        ['$1000000.00', 1000000.00],
        ['1,000,000', 1000000],
        ['1,000,000.00', 1000000.00],
        ['$1,000,000', 1000000],
        ['$1,000,000.00', 1000000.00],
        [1000000, 1000000],
        [1000000.00, 1000000.00],
        [1_000_000, 1000000],
        [1_000_000.00, 1000000.00],
    ].forEach(([value, expected]) => {
        it(`returns ${expected} when given ${typeof value} ${value}`, () => {
            expect(parseCurrency(value)).toEqual(expected);
        });
    });
});

describe(`parseInt`, () => {
    it(`exists`, () => {
        expect(parseInt).not.toBeUndefined();
    });

    it(`is a function`, () => {
        expect(typeof parseInt).toEqual('function');
    });

    it(`returns null when given null`, () => {
        expect(parseInt(<any>null)).toBeNull();
    });

    [
        ['1000000', 1000000],
        ['1000000.00', 1000000],
        ['$1000000', 1000000],
        ['$1000000.00', 1000000],
        ['1,000,000', 1000000],
        ['1,000,000.00', 1000000],
        ['$1,000,000', 1000000],
        ['$1,000,000.00', 1000000],
        [1000000, 1000000],
        [1000000.00, 1000000],
        [1_000_000, 1000000],
        [1_000_000.00, 1000000],
    ].forEach(([value, expected]) => {
        it(`returns ${expected} when given ${typeof value} ${value}`, () => {
            expect(parseInt(value)).toEqual(expected);
        });
    });
});

describe(`reduceChanges`, () => {
    it(`exists`, () => {
        expect(reduceChanges).not.toBeUndefined();
    });

    it(`is a function`, () => {
        expect(typeof reduceChanges).toEqual('function');
    });

    it(`reduces changes as expected`, () => {
        expect({
            a: 'a',
            b: 'b',
            ...Object.entries({
                a: {
                    oldValue: 'a',
                    newValue: 'b'
                },
                b: {
                    oldValue: 'b',
                    newValue: 'a',
                },
            }).reduce(reduceChanges, {})
        }).toEqual({ a: 'b', b: 'a' });
    });

    it(`ignores change entries with no new value`, () => {
        expect({
            a: 'a',
            b: 'b',
            ...Object.entries({
                a: {
                    oldValue: 'a',
                    newValue: 'b'
                },
                b: {
                    oldValue: 'b',
                },
            }).reduce(reduceChanges, {})
        }).toEqual({ a: 'b', b: 'b' });
    });
});

describe(`regexEscape`, () => {
    const specialCharacters: string[] = [
        '.',
        '*',
        '+',
        '?',
        '^',
        '$',
        '{',
        '}',
        '(',
        ')',
        '|',
        '[',
        ']',
        '\\',
    ];

    it(`exists`, () => {
        expect(regexEscape).not.toBeUndefined();
    });

    it(`is a function`, () => {
        expect(typeof regexEscape).toEqual('function');
    });

    specialCharacters.forEach(value => {
        it(`escape the special character: ${value}`, () => {
            expect(regexEscape(value)).toEqual(`\\${value}`);
        });
    });

    // Using extended ASCII instead of UTF-8 or Unicode due to the amount of time
    // it takes to iterate over 2-billion possible characters.
    Array(256)
        .fill(0)
        .map((_, i) => String.fromCharCode(i))
        .filter(c => !specialCharacters.includes(c))
        .forEach(value => {
            it(`does not escape the non-special character: ${value}`, () => {
                expect(regexEscape(value)).toEqual(value);
            });
        });
});

describe(`removeAll`, () => {
    it(`exists`, () => {
        expect(removeAll).not.toBeUndefined();
    });

    it(`is a function`, () => {
        expect(typeof removeAll).toEqual('function');
    });

    it(`removes matching elements from the DOM`, () => {
        global.document.body.innerHTML = '<div class="one">1</div><div class="two">2</div><div class="one">1</div><div class="three">3</div>';
        expect(global.document.querySelectorAll('.one').length).toBe(2)
        expect(global.document.querySelectorAll('.two').length).toBe(1)
        expect(global.document.querySelectorAll('.three').length).toBe(1)

        removeAll('.one', '.three');
        expect(global.document.querySelectorAll('.one').length).toBe(0)
        expect(global.document.querySelectorAll('.two').length).toBe(1)
        expect(global.document.querySelectorAll('.three').length).toBe(0)
    });
});

describe(`getCurrentSeason`, () => {
    it(`exists`, () => {
        expect(getCurrentSeason).not.toBeUndefined();
    });

    it(`is a function`, () => {
        expect(typeof getCurrentSeason).toEqual('function');
    });

    const actual = new Date(1_735_689_600_000);

    new Array(90).fill(0).forEach((_, offset) => {
        const value = new Date(1_735_704_000_000 + offset * 86400000);

        it(`returns the expected season start date for ${value.toJSON()}`, () => {
            jest.useFakeTimers().setSystemTime(value);

            try {
                expect(getCurrentSeason()).toEqual(actual);
            } finally {
                jest.useRealTimers();
            }
        });
    });
});

describe(`seasonsBetween`, () => {
    const ref = new Date(1_735_689_600_000);

    it(`exists`, () => {
        expect(seasonsBetween).not.toBeUndefined();
    });

    it(`is a function`, () => {
        expect(typeof seasonsBetween).toEqual('function');
    });

    it(`throws an exception when given null`, () => {
        expect(() => seasonsBetween(<any>null, <any>null)).toThrow(TypeError);
    });

    it(`throws an exception when given undefined`, () => {
        expect(() => seasonsBetween(<any>undefined, <any>undefined)).toThrow(TypeError);
    });

    [
        [0, 0],
        [1, 3],
        [6, 18],
    ].forEach(([expected, offset]) => {
        it(`returns ${expected} for an offset of ${offset} months`, () => {
            const value = new Date(ref.valueOf());
            value.setMonth(value.getMonth() + offset);
            expect(seasonsBetween(ref, value)).toEqual(expected)
        });
    });
});

describe(`secondsToTime`, () => {
    it(`exists`, () => {
        expect(secondsToTime).not.toBeUndefined();
    });

    it(`is a function`, () => {
        expect(typeof secondsToTime).toEqual('function');
    });

    (<[number, string][]>[
        [114.25, '1:54.25'],
        [120, '2:00.00'],
        [126.1, '2:06.10'],
    ]).forEach(([seconds, expected]) => {
        it(`resolves with ${JSON.stringify(expected)} when given seconds=${seconds}`, () => {
            expect(secondsToTime(seconds)).toEqual(expected);
        });
    });
});

describe(`sleep`, () => {
    it(`exists`, () => {
        expect(sleep).not.toBeUndefined();
    });

    it(`is a function`, () => {
        expect(typeof sleep).toEqual('function');
    });

    it(`sleeps for 100ms then returns`, async () => {
        const start = performance.now();
        await sleep(100);
        const time = Math.round(performance.now() - start);
        expect(time).toBeGreaterThanOrEqual(90);
        expect(time).toBeLessThanOrEqual(199);
    });

    it(`can be aborted`, async () => {
        try {
            const controller = new AbortController();
            setTimeout(() => controller.abort(), 50);
            await sleep(100, controller.signal);
            throw 'Test failed to be aborted';
        } catch (e) {
            expect(e).toEqual('Aborted by the user');
        }
    });
});

describe(`toDate`, () => {
    it(`exists`, () => {
        expect(toDate).not.toBeUndefined();
    });

    it(`is a function`, () => {
        expect(typeof toDate).toEqual('function');
    });

    it(`returns a default value of new Date(0)`, () => {
        expect(toDate(undefined)).toEqual(new Date(0));
    });

    it(`converts a Timestamp object`, () => {
        expect(toDate(<Timestamp>{ seconds: 1730165342, nanoseconds: 322 })).toEqual(new Date(1730165342322));
    });
});

describe(`toPercentage`, () => {
    it(`exists`, () => {
        expect(toPercentage).not.toBeUndefined();
    });

    it(`is a function`, () => {
        expect(typeof toPercentage).toEqual('function');
    });

    (<[[number, number], string][]>[
        [[25, 100], '25.00%'],
        [[50, 25], '200.00%'],
        [[256, 287], '89.20%'],
        [[239, 256], '93.36%'],
        [[48, 256], '18.75%'],
        [[5, 256], '1.95%'],
    ]).forEach(([[nom, den], expected]) => {
        it(`returns ${expected} when given ${nom} / ${den}`, () => {
            expect(toPercentage(nom, den)).toEqual(expected);
        });
    });

    it(`returns 0.00% when given 0 as a denominator`, () => {
        expect(toPercentage(25, 0)).toEqual('0.00%');
    });
});

describe(`toTimestamp`, () => {
    it(`exists`, () => {
        expect(toTimestamp).not.toBeUndefined();
    });

    it(`is a function`, () => {
        expect(typeof toTimestamp).toEqual('function');
    });

    it(`returns the current timestamp if no value is given`, () => {
        jest.useFakeTimers().setSystemTime(new Date(1_640_995_200_000));

        try {
            expect(toTimestamp()).toEqual('2022-01-01T00:00:00');
        } finally {
            jest.useRealTimers();
        }
    });

    [
        [new Date('2022-01-01 00:00:00 +00:00'), '2022-01-01T00:00:00'],
        ['2022-01-01 00:00:00 +00:00', '2022-01-01T00:00:00'],
        [1_640_995_200_000, '2022-01-01T00:00:00'],
    ].forEach(([value, expected]) => {
        it(`returns ${expected} when given ${typeof value} ${value}`, () => {
            expect(toTimestamp(value)).toEqual(expected);
        });
    });
});

describe(`waitFor`, () => {
    it(`exists`, () => {
        expect(waitFor).not.toBeUndefined();
    });

    it(`is a function`, () => {
        expect(typeof waitFor).toEqual('function');
    });

    it(`creates an interval that calls chrome.runtime.getPlatformInfo every 15 seconds`, async () => {
        jest.useFakeTimers();
        const expectedValue = Date.now();
        jest.spyOn(global, 'setInterval');
        jest.spyOn(global, 'clearInterval');

        try {
            await expect(waitFor(Promise.resolve(expectedValue))).resolves.toEqual(expectedValue);
            expect(setInterval).toHaveBeenCalledTimes(1)
            expect(setInterval).toHaveBeenCalledWith(chrome.runtime.getPlatformInfo, 15000);
            expect(clearInterval).toHaveBeenCalled();
        } finally {
            jest.restoreAllMocks();
            jest.useRealTimers();
        }
    });
});