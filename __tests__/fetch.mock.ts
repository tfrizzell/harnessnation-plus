import fs from 'fs';
import path from 'path';

beforeAll(() => {
    global.fetch = <jest.Mock>jest.fn((input: RequestInfo, init?: RequestInit): Promise<{ ok: boolean, text: () => Promise<string> }> => {
        const url = (input as Request).url ?? input;
        let file: fs.PathLike | undefined;

        if (url === 'https://www.harnessnation.com/api/progeny/report' && init?.method === 'POST') {
            const { horseId } = Object.fromEntries(new URLSearchParams(init!.body as string));
            file = path.join(__dirname, '__files__', 'api', 'progeny', 'report', `${horseId}.html`);
        } else if (url === 'https://www.harnessnation.com/horse/api/race-history' && init?.method === 'POST') {
            const { horseId } = Object.fromEntries(new URLSearchParams(init!.body as string));
            file = path.join(__dirname, '__files__', 'horse', 'api', 'race-history', `${horseId}.html`);
        } else if (url.startsWith('https://www.harnessnation.com/horse/')) {
            const horseId = url.split('/').pop()!;
            file = path.join(__dirname, '__files__', 'horse', `${horseId}.html`);
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