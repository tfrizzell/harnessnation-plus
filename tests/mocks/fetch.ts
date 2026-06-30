import fs from 'fs';
import path from 'path';

const originalFetch = global.fetch;

beforeAll(() => {
    global.fetch = jest.fn((input: string | URL | Request, init?: RequestInit | undefined): Promise<Response> => {
        const url = typeof input === 'string'
            ? input
            : input instanceof URL
                ? input.toString()
                : input.url;

        let file: fs.PathLike | undefined;

        if (url === 'https://www.harnessnation.com/api/progeny/list' && init?.method === 'POST') {
            // TODO: Add some progeny lists to test new reporting
            return Promise.resolve({
                ok: true,
                text: () => Promise.resolve(''),
            } as Response)
        } else if (url === 'https://www.harnessnation.com/api/progeny/report' && init?.method === 'POST') {
            const { horseId } = Object.fromEntries(new URLSearchParams(init!.body as string));
            file = path.join(__dirname, '..', 'fixtures', 'api', 'progeny', 'report', `${horseId}.html`);
        } else if (url === 'https://www.harnessnation.com/horse/api/race-history' && init?.method === 'POST') {
            const { horseId } = Object.fromEntries(new URLSearchParams(init!.body as string));
            file = path.join(__dirname, '..', 'fixtures', 'horse', 'api', 'race-history', `${horseId}.html`);
        } else if (url.startsWith('https://www.harnessnation.com/horse/')) {
            const horseId = url.split('/').pop()!;
            file = path.join(__dirname, '..', 'fixtures', 'horse', `${horseId}.html`);
        }

        if (!file)
            return Promise.reject(`${url} not found`);

        return new Promise((resolve, reject) => {
            fs.access(file!, undefined, (err) => {
                if (err) {
                    return resolve({
                        ok: true,
                        text: () => Promise.resolve('')
                    } as Response);
                }

                fs.readFile(file, { encoding: 'utf-8' }, (err: any, data: string) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    resolve({
                        ok: true,
                        text: () => Promise.resolve(data),
                    } as Response);
                });
            });
        });
    });
});

afterAll(() => {
    global.fetch = originalFetch;
});