import { Timestamp } from '@firebase/firestore';
import { downloadFile, parseCurrency, parseInt, reduceChanges, regexEscape, removeAll, sleep, toDate, toPercentage, toTimestamp } from '../../src/lib/utils';

type NumberTestData = [string | number, number];
type PercentageTestData = [number, number, string];
type TimestampTestData = [Date | string | number, string];

afterAll(() => {
    jest.clearAllTimers();
    jest.clearAllMocks();
});

describe(`downloadFile`, () => {
    const textContent = 'Hello World';
    const base64Content = 'SGVsbG8gV29ybGQ=';
    const blobContent = new Blob([textContent], { type: 'text/plain' });

    const downloadedFiles: Map<string, chrome.downloads.DownloadOptions | null> = new Map();

    beforeAll(() => {
        global.chrome.downloads.download = jest.fn((options: chrome.downloads.DownloadOptions): Promise<number> => {
            const id = downloadedFiles.size + 1;
            downloadedFiles.set(options.filename || `${Date.now()}.file`, options);
            return Promise.resolve(id);
        })
    });

    afterAll(() => {
        (<jest.Mock>global.chrome.downloads.download).mockClear();
    });

    test(`exists`, () => {
        expect(downloadFile).not.toBeUndefined();
    });

    test(`is a function`, () => {
        expect(typeof downloadFile).toEqual('function');
    });

    test(`returns a promise`, () => {
        expect(downloadFile(textContent, 'test-return-promise.txt')).toBeInstanceOf(Promise);
    });

    for (const [ext, contentType] of [
        ['csv', 'text/csv'],
        ['html', 'text/html'],
        ['json', 'application/json'],
        ['txt', 'text/plain'],
        ['xls', 'application/vnd.ms-excel'],
        ['xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
        ['readme', 'text/plain'],
    ]) {
        test(`infers the correct content type for ${ext}`, async () => {
            const filename = `test-content-type.${ext}`;

            await expect(downloadFile(textContent, filename)).resolves;
            await new Promise(process.nextTick);

            expect(downloadedFiles.get(filename)).toEqual({
                url: `data:${contentType};base64,${base64Content}`,
                filename: filename,
                saveAs: false,
            });
        });
    }

    test(`accepts the contentType and saveAs options`, async () => {
        const filename = `test-options.txt`;

        await expect(downloadFile(textContent, filename, { contentType: 'text/html', saveAs: true })).resolves;
        await new Promise(process.nextTick);

        expect(downloadedFiles.get(filename)).toEqual({
            url: `data:text/html;base64,${base64Content}`,
            filename: filename,
            saveAs: true,
        });
    });

    test(`downloads an unencoded string`, async () => {
        const filename = 'test-unencoded-string.txt';

        await expect(downloadFile(textContent, filename)).resolves;
        await new Promise(process.nextTick);

        expect(downloadedFiles.get(filename)).toEqual({
            url: `data:text/plain;base64,${base64Content}`,
            filename: filename,
            saveAs: false,
        });
    });

    test(`downloads an unencoded data uri`, async () => {
        const filename = 'test-unencoded-data-uri.txt';

        await expect(downloadFile(`data:text/plain;${textContent}`, filename)).resolves;
        await new Promise(process.nextTick);

        expect(downloadedFiles.get(filename)).toEqual({
            url: `data:text/plain;base64,${base64Content}`,
            filename: filename,
            saveAs: false,
        });
    });

    test(`downloads an encoded data uri`, async () => {
        const filename = 'test-encoded-data-uri.txt';

        await expect(downloadFile(`data:text/plain;base64,${base64Content}`, filename)).resolves;
        await new Promise(process.nextTick);

        expect(downloadedFiles.get(filename)).toEqual({
            url: `data:text/plain;base64,${base64Content}`,
            filename: filename,
            saveAs: false,
        });
    });

    test(`downloads a ${Blob.name}`, async () => {
        const _FileReader = global.FileReader;

        const mockFileReader = jest.spyOn(global, 'FileReader').mockImplementation((): FileReader => {
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
            mockFileReader.mockReset();
        }
    });

    for (const content of [textContent, blobContent]) {
        const type = typeof content === 'object' ? content.constructor.name : typeof content;

        test(`downloads a ${type} using window.URL.createObjectURL`, async () => {
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

                expect(createdUrlCount).toBe(1);
                expect(createdUrls.length).toBe(0);
            } finally {
                (<jest.Mock>global.window.URL.revokeObjectURL).mockReset();
                (<jest.Mock>global.window.URL.createObjectURL).mockReset();
            }
        });
    }
});

describe(`parseCurrency`, () => {
    test(`exists`, () => {
        expect(parseCurrency).not.toBeUndefined();
    });

    test(`is a function`, () => {
        expect(typeof parseCurrency).toEqual('function');
    });

    test(`returns null when given null`, () => {
        expect(parseCurrency(<any>null)).toBeNull();
    });

    test(`properly converts strings to numbers`, () => {
        const values: NumberTestData[] = [
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
        ];

        for (const [value, expected] of values)
            expect(parseCurrency(value)).toEqual(expected);
    });
});

describe(`parseInt`, () => {
    test(`exists`, () => {
        expect(parseInt).not.toBeUndefined();
    });

    test(`is a function`, () => {
        expect(typeof parseInt).toEqual('function');
    });

    test(`returns null when given null`, () => {
        expect(parseInt(<any>null)).toBeNull();
    });

    test(`properly converts strings to numbers`, () => {
        const values: NumberTestData[] = [
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
        ];

        for (const [value, expected] of values)
            expect(parseInt(value)).toEqual(expected);
    });
});

describe(`reduceChanges`, () => {
    test(`exists`, () => {
        expect(reduceChanges).not.toBeUndefined();
    });

    test(`is a function`, () => {
        expect(typeof reduceChanges).toEqual('function');
    });

    test(`reduces changes as expected`, () => {
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

    test(`ignores change entries with no new value`, () => {
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

    test(`exists`, () => {
        expect(regexEscape).not.toBeUndefined();
    });

    test(`is a function`, () => {
        expect(typeof regexEscape).toEqual('function');
    });

    for (const value of specialCharacters) {
        test(`'regexEscape' properly escapes the special character '${value}'`, () => {
            expect(regexEscape(value)).toEqual(`\\${value}`);
        });
    }

    // Using extended ASCII instead of UTF-8 or Unicode due to the amount of time
    // it takes to iterate over 2-billion possible characters.
    test(`'regexEscape' does not escape non-special ASCII characters`, () => {
        for (const value of Array(256).fill(0).map((_, i) => String.fromCharCode(i)).filter(c => !specialCharacters.includes(c)))
            expect(regexEscape(value)).toEqual(value);
    });
});

describe(`removeAll`, () => {
    test(`exists`, () => {
        expect(removeAll).not.toBeUndefined();
    });

    test(`is a function`, () => {
        expect(typeof removeAll).toEqual('function');
    });

    test(`removes matching elements from the DOM`, () => {
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

describe(`sleep`, () => {
    test(`exists`, () => {
        expect(sleep).not.toBeUndefined();
    });

    test(`is a function`, () => {
        expect(typeof sleep).toEqual('function');
    });

    test(`sleeps for 100ms then returns`, async () => {
        const start = performance.now();
        await sleep(100);
        const time = Math.round(performance.now() - start);
        expect(time).toBeGreaterThanOrEqual(90);
        expect(time).toBeLessThanOrEqual(199);
    });

    test(`can be aborted`, async () => {
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
    test(`exists`, () => {
        expect(toDate).not.toBeUndefined();
    });

    test(`is a function`, () => {
        expect(typeof toDate).toEqual('function');
    });

    test(`returns a default value of new Date(0)`, () => {
        expect(toDate(undefined)).toEqual(new Date(0));
    });

    test(`converts a Timestamp object`, () => {
        expect(toDate(<Timestamp>{ seconds: 1730165342, nanoseconds: 322 })).toEqual(new Date(1730165342322));
    });
});

describe(`toPercentage`, () => {
    test(`exists`, () => {
        expect(toPercentage).not.toBeUndefined();
    });

    test(`is a function`, () => {
        expect(typeof toPercentage).toEqual('function');
    });

    test(`properly computes a percentage`, () => {
        const values: PercentageTestData[] = [
            [25, 100, '25.00%'],
            [50, 25, '200.00%'],
            [256, 287, '89.20%'],
            [239, 256, '93.36%'],
            [48, 256, '18.75%'],
            [5, 256, '1.95%'],
        ];

        for (const [nom, den, expected] of values)
            expect(toPercentage(nom, den)).toEqual(expected);
    });

    test(`returns 0.00% when given 0 as a denominator`, () => {
        expect(toPercentage(25, 0)).toEqual('0.00%');
    });
});

describe(`toTimestamp`, () => {
    test(`exists`, () => {
        expect(toTimestamp).not.toBeUndefined();
    });

    test(`is a function`, () => {
        expect(typeof toTimestamp).toEqual('function');
    });

    test(`returns the current timestamp if no value is given`, () => {
        jest.useFakeTimers('modern').setSystemTime(new Date(1_640_995_200_000))
        try {
            expect(toTimestamp()).toEqual('2022-01-01T00:00:00');
        } finally {
            jest.useRealTimers();
        }
    });

    test(`properly converts values to timestamps`, () => {
        const values: TimestampTestData[] = [
            [new Date('2022-01-01 00:00:00 +00:00'), '2022-01-01T00:00:00'],
            ['2022-01-01 00:00:00 +00:00', '2022-01-01T00:00:00'],
            [1_640_995_200_000, '2022-01-01T00:00:00'],
        ];

        for (const [value, expected] of values)
            expect(toTimestamp(value)).toEqual(expected);
    });
});