import { afterAll, beforeAll, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const originalFetch = global.fetch;

beforeAll(() => {
    const mockResponse = (response: { ok: boolean, text: () => Promise<string> }): Response =>
        response as Response;

    global.fetch = vi.fn(
        (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
            const url = typeof input === 'string'
                ? input
                : input instanceof URL
                    ? input.toString()
                    : input.url;

            let file: fs.PathLike | undefined;

            if (url === 'https://www.harnessnation.com/api/progeny/list' && init?.method === 'POST') {
                // TODO: Add some progeny lists to test new reporting
                return Promise.resolve(mockResponse({
                    ok: true,
                    text: () => Promise.resolve(''),
                }));
            } else if (url === 'https://www.harnessnation.com/api/progeny/report' && init?.method === 'POST') {
                const { horseId } = Object.fromEntries(new URLSearchParams(init.body as string));
                file = path.join(__dirname, '..', 'fixtures', 'api', 'progeny', 'report', `${horseId}.html`);
            } else if (url === 'https://www.harnessnation.com/horse/api/race-history' && init?.method === 'POST') {
                const { horseId } = Object.fromEntries(new URLSearchParams(init.body as string));
                file = path.join(__dirname, '..', 'fixtures', 'horse', 'api', 'race-history', `${horseId}.html`);
            } else if (url.startsWith('https://www.harnessnation.com/horse/')) {
                const horseId = url.split('/').pop();
                file = path.join(__dirname, '..', 'fixtures', 'horse', `${horseId}.html`);
            }

            if (!file)
                return Promise.reject(new Error(`${url} not found`));

            return new Promise((resolve, reject) => {
                fs.access(file, undefined, err => {
                    if (err) {
                        resolve(mockResponse({
                            ok: true,
                            text: () => Promise.resolve('')
                        }));

                        return;
                    }

                    fs.readFile(file, { encoding: 'utf-8' }, (err, data) => {
                        if (err) {
                            reject(err);
                            return;
                        }

                        resolve(mockResponse({
                            ok: true,
                            text: () => Promise.resolve(data),
                        }));
                    });
                });
            });
        });
});

afterAll(() => {
    global.fetch = originalFetch;
});