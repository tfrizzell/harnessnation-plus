import { type Mock, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import { RaceList } from '@src/lib/races';
import { ageToText, downloadFile, formatEarnings, formatMark, formatOrdinal, getCurrentSeason, getLifetimeMark, parseCurrency, parseInt, reduceChanges, regexEscape, removeAll, seasonsBetween, secondsToTime, sleep, toDate, toPercentage, toTimestamp, waitFor } from '@src/lib/utils';

afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
});

describe(`ageToText`, () => {
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

    const downloadMock = chrome.downloads.download as Mock;
    let createObjectURLSpy: ReturnType<typeof vi.spyOn>;
    let revokeObjectURLSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        vi.restoreAllMocks();

        createObjectURLSpy = vi.spyOn(URL, 'createObjectURL')
            .mockReturnValue('blob:mock-url');

        revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL');
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
            await downloadFile(textContent, filename);

            const blobArg = createObjectURLSpy.mock.calls[0][0] as Blob;
            expect(blobArg).toBeInstanceOf(Blob);
            expect(blobArg.type).toBe(contentType);
        });
    });

    it(`downloads the file with the given filename`, async () => {
        const filename = `${new Date().toISOString()}.txt`;
        await downloadFile(textContent, filename);

        expect(downloadMock).toHaveBeenCalledWith(
            expect.objectContaining({
                url: 'blob:mock-url',
                filename: filename,
            })
        );
    });

    it(`accepts the contentType and saveAs options`, async () => {
        await downloadFile(textContent, 'file.txt', {
            contentType: 'text/html',
            saveAs: true,
        });

        const blobArg = createObjectURLSpy.mock.calls[0][0] as Blob;
        expect(blobArg.type).toBe('text/html');

        expect(downloadMock).toHaveBeenCalledWith(
            expect.objectContaining({
                url: 'blob:mock-url',
                saveAs: true,
            })
        );
    });

    [
        [textContent, 'unencoded string'],
        [`data:text/plain;${textContent}`, 'unencoded data uri'],
        [`data:text/plain;base64,${base64Content}`, 'encoded data uri'],
    ].forEach(([content, descriptor]) => {
        it(`downloads an ${descriptor}`, async () => {
            await downloadFile(content, 'file.txt');

            expect(downloadMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    url: 'blob:mock-url'
                })
            );
        });
    });

    it(`converts string input into Blob when using createObjectURL`, async () => {
        await downloadFile(textContent, 'file.txt');

        const blobArg = createObjectURLSpy.mock.calls[0][0];
        expect(blobArg).toBeInstanceOf(Blob);
    });

    it(`downloads a ${Blob.name}`, async () => {
        await downloadFile(blobContent, 'file.txt');

        expect(downloadMock).toHaveBeenCalledWith(
            expect.objectContaining({
                url: 'blob:mock-url'
            })
        );
    });

    it(`falls back to FileReader when createObjectURL is unavailable and input as Blob`, async () => {
        const originalURL = global.URL;

        try {
            // @ts-expect-error intentionally breaking environment
            global.URL = undefined;

            const readSpy = vi.spyOn(FileReader.prototype, 'readAsDataURL');
            await downloadFile(blobContent, 'file.txt');

            expect(readSpy).toHaveBeenCalledWith(blobContent);

            expect(downloadMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    url: `data:text/plain;base64,${base64Content}`
                })
            );
        } finally {
            global.URL = originalURL;
        }
    });

    it('falls back to base64 data URL when createObjectURL is unavailable and input is string', async () => {
        const originalURL = global.URL;

        try {
            // @ts-expect-error intentionally breaking environment
            global.URL = undefined;

            await downloadFile(textContent, 'file.txt')

            expect(downloadMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    url: `data:text/plain;base64,${base64Content}`
                })
            );
        } finally {
            global.URL = originalURL;
        }
    });

    it(`revokes a created object URL`, async () => {
        vi.useFakeTimers();

        await downloadFile(textContent, 'file.txt');
        expect(revokeObjectURLSpy).not.toHaveBeenCalled();

        await vi.advanceTimersByTimeAsync(1);
        expect(revokeObjectURLSpy).toHaveBeenCalledTimes(createObjectURLSpy.mock.calls.length);
        expect(revokeObjectURLSpy).toHaveBeenLastCalledWith('blob:mock-url');
    });
});

describe(`formatEarnings`, () => {
    it(`returns a formatted currency string`, () => {
        expect(formatEarnings(12_345_678.09)).toEqual('$12,345,678')
    });
});

describe(`formatMark`, () => {
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
    const actual = new Date(1_735_689_600_000);

    new Array(90).fill(0).forEach((_, offset) => {
        const value = new Date(1_735_704_000_000 + offset * 86400000);

        it(`returns the expected season start date for ${value.toJSON()}`, () => {
            vi.useFakeTimers()
            vi.setSystemTime(value);

            expect(getCurrentSeason()).toEqual(actual);
        });
    });
});

describe(`getLifetimeMark`, () => {
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
    it(`removes matching elements from the DOM`, () => {
        document.body.innerHTML = '<div class="one">1</div><div class="two">2</div><div class="one">1</div><div class="three">3</div>';
        expect(document.querySelectorAll('.one').length).toBe(2)
        expect(document.querySelectorAll('.two').length).toBe(1)
        expect(document.querySelectorAll('.three').length).toBe(1)

        removeAll('.one', '.three');
        expect(document.querySelectorAll('.one').length).toBe(0)
        expect(document.querySelectorAll('.two').length).toBe(1)
        expect(document.querySelectorAll('.three').length).toBe(0)
    });
});

describe(`seasonsBetween`, () => {
    const ref = new Date(1_735_689_600_000);

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
    it(`sleeps for 100ms then returns`, async () => {
        vi.useFakeTimers();

        let resolved = false;
        const p = sleep(100).then(() => { resolved = true; });
        expect(resolved).toBe(false);

        await vi.advanceTimersByTimeAsync(50);
        expect(resolved).toBe(false);

        await vi.advanceTimersByTimeAsync(50);
        expect(resolved).toBe(true);

        await expect(p).resolves.toBeUndefined();
    });

    it(`can be aborted`, async () => {
        vi.useFakeTimers();

        const controller = new AbortController();
        const p = sleep(100, controller.signal);

        controller.abort();
        await expect(p).rejects.toEqual('Aborted by the user');
    });
});

describe(`toDate`, () => {
    it(`returns a default value of new Date(0)`, () => {
        expect(toDate(undefined)).toEqual(new Date(0));
    });

    it(`converts a Timestamp object`, () => {
        expect(toDate(<Timestamp>{ seconds: 1730165342, nanoseconds: 322 })).toEqual(new Date(1730165342322));
    });
});

describe(`toPercentage`, () => {
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
    it(`returns the current timestamp if no value is given`, () => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date(1_640_995_200_000));

        expect(toTimestamp()).toEqual('2022-01-01T00:00:00');
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
    it(`returns the promise result`, async () => {
        const result = Symbol('result');
        await expect(waitFor(Promise.resolve(result))).resolves.toBe(result);
    });

    it(`rethrows promise rejections`, async () => {
        const error = new Error('boom');
        await expect(waitFor(Promise.reject(error))).rejects.toBe(error);
    });

    it(`starts a keep-alive interval`, async () => {
        const setIntervalSpy = vi.spyOn(global, 'setInterval');

        await waitFor(Promise.resolve());

        expect(setIntervalSpy).toHaveBeenCalledWith(
            chrome.runtime.getPlatformInfo,
            15000,
        );
    });

    it(`calls getPlatformInfo every 15 seconds while waiting`, async () => {
        vi.useFakeTimers();

        const getPlatformInfoSpy = vi.spyOn(chrome.runtime, 'getPlatformInfo');

        let resolve!: () => void;
        const w = waitFor(new Promise<void>(r => (resolve = r)));

        vi.advanceTimersByTime(15000);
        expect(getPlatformInfoSpy).toHaveBeenCalledTimes(1);

        vi.advanceTimersByTime(15000);
        expect(getPlatformInfoSpy).toHaveBeenCalledTimes(2);

        resolve();
        await expect(w).resolves;
    });

    it(`stops the keep-alive interval when the promise settles`, async () => {
        vi.useFakeTimers();

        const intervalId = Symbol('interval');

        vi.spyOn(global, 'setInterval')
            .mockReturnValue(intervalId as unknown as ReturnType<typeof setInterval>);

        const clearIntervalSpy = vi.spyOn(global, 'clearInterval')
            .mockImplementation(() => {});

        await waitFor(Promise.resolve());

        expect(clearIntervalSpy).toHaveBeenCalledWith(intervalId);
    });
});