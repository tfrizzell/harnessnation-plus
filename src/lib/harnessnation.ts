import { isMobileOS } from './utils.js';

type CacheEntry = {
    response: string;
    expiresAt: number;
}

/**
 * Created an interface to request data from HarnessNation.
 * 
 * @param {number} cacheTTL The number of milliseconds to store responses in the cache. Must be at least 60_000 (1 minute),
 *                          anything under this will disable caching. Defaults to 3_600_000ms (1 hour).
 */
export class HarnessNationAPI {
    #cache?: IDBDatabase;
    #cacheTTL: number = 3_600_600;

    constructor() {
        isMobileOS().then(isMobile => {
            if (isMobile) {
                console.debug(`%cbackground.ts%c     Mobile OS Detected: disabling api cache`, 'color:#406e8e;font-weight:bold;', '');
                this.#cacheTTL = 0;
                return;
            }

            const req = indexedDB.open('cache:api', 1);

            req.addEventListener('error', e => {
                const error = <Error>(e.target as any).error;
                console.error(`%charnessnation.ts%c     Failed to open api cache: ${error.message}`, 'color:#406e8e;font-weight:bold;', '');
                console.error(error);
            });

            req.addEventListener('success', () => {
                console.debug(`%charnessnation.ts%c     Successfully opened api cache`, 'color:#406e8e;font-weight:bold;', '');
                this.#cache = req.result;
            });

            req.addEventListener('upgradeneeded', e => {
                console.debug(`%charnessnation.ts%c     Updating api cache`, 'color:#406e8e;font-weight:bold;', '');
                const db: IDBDatabase = (e.target as any).result;

                db.addEventListener('error', e => {
                    const error = <Error>(e.target as any).error;
                    console.error(`%charnessnation.ts%c     Failed to update api cache: ${error.message}`, 'color:#406e8e;font-weight:bold;', '');
                    console.error(error);
                });

                const store = db.createObjectStore('responses', { keyPath: 'key' });
                store.createIndex('response', 'response', { unique: false });
                store.createIndex('expiresAt', 'expiresAt', { unique: false });
            });
        });
    }

    get cacheTTL(): number {
        return this.#cacheTTL;
    }

    async #getFromCache(key: string): Promise<string | undefined> {
        this.pruneCache();

        if (this.#cacheTTL === 0)
            return undefined;

        const transaction = this.#cache?.transaction(['responses'], 'readwrite');

        transaction?.addEventListener('error', e => {
            const error = <Error>(e.target as any).error;
            console.error(`%charnessnation.ts%c     Failed to open api response cache transaction: ${error.message}`, 'color:#406e8e;font-weight:bold;', '');
            console.error(error);
        });

        const entry = await new Promise<CacheEntry | undefined>(resolve => {
            if (!transaction)
                return resolve(undefined);

            transaction.addEventListener('error', () => resolve(undefined));

            const req = transaction.objectStore('responses').get(key);

            req.addEventListener('error', e => {
                const error = <Error>(e.target as any).error;
                console.error(`%charnessnation.ts%c     Failed to read from api response cache: ${error.message}`, 'color:#406e8e;font-weight:bold;', '');
                console.error(error);
                resolve(undefined);
            });

            req.addEventListener('success', e => resolve((e.target as any).result));
        });

        if (entry && entry.expiresAt < Date.now()) {
            transaction?.objectStore('responses').delete(key);
            return undefined;
        }

        return entry == null ? undefined : atob(entry.response);
    }

    async #getOrCreateFromCache(key: string, generator: () => Promise<Response>): Promise<string> {
        const cached = await this.#getFromCache(key);

        if (cached != null)
            return cached;

        const res = await generator();

        if (!res.ok)
            throw new Error(`${res.status} ${res.statusText}`);

        const value = await res.text();

        if (this.#cacheTTL > 0) {
            const transaction = this.#cache?.transaction(['responses'], 'readwrite');

            transaction?.addEventListener('error', e => {
                const error = <Error>(e.target as any).error;
                console.error(`%charnessnation.ts%c     Failed to write to api response cache: ${error.message}`, 'color:#406e8e;font-weight:bold;', '');
                console.error(error);
            });

            transaction?.objectStore('responses')?.put(<CacheEntry>{
                key,
                response: btoa(value),
                expiresAt: Date.now() + this.#cacheTTL,
            });
        }

        return value;
    }

    /**
     * Clears the response cache.
     * @returns {Promise<void>} A `Promise` that resolves once the cache has been cleared.
     */
    clearCache(): Promise<void> {
        return new Promise<void>(resolve => {
            const transaction = this.#cache?.transaction(['responses'], 'readwrite');

            if (!transaction)
                return resolve();

            transaction.addEventListener('error', e => {
                const error = <Error>(e.target as any).error;
                console.error(`%charnessnation.ts%c     Failed to open api response cache transaction: ${error.message}`, 'color:#406e8e;font-weight:bold;', '');
                console.error(error);
                resolve();
            });

            const req = transaction.objectStore('responses').clear();

            req.addEventListener('error', e => {
                const error = <Error>(e.target as any).error;
                console.error(`%charnessnation.ts%c     Failed to clear api response cache: ${error.message}`, 'color:#406e8e;font-weight:bold;', '');
                console.error(error);
                resolve();
            });

            req.addEventListener('success', () => resolve());
        });
    }

    /**
     * Fetches the session's CSRF token.
     * @returns {Promise<string>} A `Promise` that resolves with the CSRF token.
     */
    async getCSRFToken(): Promise<string | undefined> {
        const regex = /setRequestHeader\((["'])X-CSRF-TOKEN\1,\s*(["'])(.*?)\2\)/i;

        let html: string | undefined = await new Promise<string | undefined>(resolve => {
            const transaction = this.#cache?.transaction(['responses']);

            if (!transaction)
                return resolve(undefined);

            transaction.addEventListener('error', e => {
                const error = <Error>(e.target as any).error;
                console.error(`%charnessnation.ts%c     Failed to open api response cache transaction: ${error.message}`, 'color:#406e8e;font-weight:bold;', '');
                console.error(error);
                resolve(undefined);
            });

            const store = transaction.objectStore('responses');
            const req = store.openCursor();

            req.addEventListener('error', e => {
                const error = <Error>(e.target as any).error;
                console.error(`%charnessnation.ts%c     Failed to open api response cache cursor: ${error.message}`, 'color:#406e8e;font-weight:bold;', '');
                console.error(error);
                resolve(undefined);
            });

            req.addEventListener('success', e => {
                const cursor: IDBCursorWithValue | null = (e.target as any).result;

                if (!cursor)
                    return resolve(undefined);

                const html = atob(cursor.value.response);

                if (regex.test(html))
                    return resolve(html);

                cursor.continue();
            });
        });

        html ??= await fetch(`https://www.harnessnation.com/stable/dashboard`).then(res => res.text());
        return html?.match(regex)?.[3];
    }

    /**
     * Fetches a horse's info page.
     * @param {number} id - the id of the horse.
     * @returns {Promise<string>} A `Promise` that resolves with the HTML content of the info page.
     */
    async getHorse(id: number): Promise<string> {
        return await this.#getOrCreateFromCache(`/horses/${id}`, () => fetch(`https://www.harnessnation.com/horse/${id}`));
    }

    /**
     * Fetches a horse's pedigree.
     * @param {number} id - the id of the horse.
     * @param {string} csrfToken - the token used to sign the request.
     * @returns {Promise<string>} A `Promise` that resolves with the HTML content of the pedigree.
     */
    async getPedigree(id: number, csrfToken?: string): Promise<string> {
        csrfToken ||= await this.getCSRFToken() ?? '';
        return await this.#getOrCreateFromCache(`/horses/${id}/pedigree`, () => fetch('https://www.harnessnation.com/horse/pedigree', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Referer': 'https://www.harnessnation.com/',
                'X-Csrf-Token': csrfToken!,
                'X-Requested-With': 'XMLHttpRequest',
            },
            body: new URLSearchParams({ _token: csrfToken!, horseId: id.toString() }),
        }));
    }

    /**
     * Fetches a horse's progeny list.
     * @param {number} id - the id of the horse.
     * @param {string} csrfToken - the token used to sign the request.
     * @returns {Promise<string>} A `Promise` that resolves with the HTML content of the progeny list.
     */
    async getProgenyList(id: number, csrfToken?: string): Promise<string> {
        csrfToken ||= await this.getCSRFToken() ?? '';
        return await this.#getOrCreateFromCache(`/horses/${id}/progeny/list`, () => fetch('https://www.harnessnation.com/api/progeny/list', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Referer': 'https://www.harnessnation.com/',
                'X-Csrf-Token': csrfToken!,
                'X-Requested-With': 'XMLHttpRequest',
            },
            body: new URLSearchParams({
                horseId: id.toString(),
                filterGait: '',
                filterAgeGroup: '',
                filterGender: '',
                filterStable: '',
            }),
        }));
    }

    /**
     * Fetches a horse's progeny report.
     * @param {number} id - the id of the horse.
     * @returns {Promise<string>} A `Promise` that resolves with the HTML content of the progeny report.
     */
    async getProgenyReport(id: number): Promise<string> {
        return await this.#getOrCreateFromCache(`/horses/${id}/progeny/report`, () => fetch('https://www.harnessnation.com/api/progeny/report', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Referer': 'https://www.harnessnation.com/',
            },
            body: new URLSearchParams({ horseId: id.toString() }),
        }));
    }

    /**
     * Fetches a horse's race history.
     * @param {number} id - the id of the horse.
     * @param {string} csrfToken - the token used to sign the request.
     * @returns {Promise<string>} A `Promise` that resolves with the HTML content of the race history.
     */
    async getRaceHistory(id: number, csrfToken?: string): Promise<string> {
        csrfToken ||= await this.getCSRFToken() ?? '';
        return await this.#getOrCreateFromCache(`/horses/${id}/races`, () => fetch('https://www.harnessnation.com/horse/api/race-history', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Referer': 'https://www.harnessnation.com/',
                'X-Csrf-Token': csrfToken!,
                'X-Requested-With': 'XMLHttpRequest',
            },
            body: new URLSearchParams({ _token: csrfToken!, horseId: id.toString() }),
        }));
    }

    /**
     * Fetches a horse's sibling list.
     * @param {number} id - the id of the horse.
     * @returns {Promise<string>} A `Promise` that resolves with the HTML content of the sibling list.
     */
    async getSiblings(id: number): Promise<string> {
        return await this.#getOrCreateFromCache(`/horses/${id}/siblings`, () => fetch('https://www.harnessnation.com/horse/api/siblings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Referer': 'https://www.harnessnation.com/',
            },
            body: new URLSearchParams({ horseId: id.toString() }),
        }));
    }

    /**
     * Prunes expired entries from the response cache.
     * @returns {Promise<void>} A `Promise` that resolves once the cache has been pruned.
     */
    pruneCache(): Promise<void> {
        return new Promise<void>(resolve => {
            const transaction = this.#cache?.transaction(['responses'], 'readwrite');

            if (!transaction)
                return resolve(undefined);

            transaction.addEventListener('error', e => {
                const error = <Error>(e.target as any).error;
                console.error(`%charnessnation.ts%c     Failed to open api response cache transaction: ${error.message}`, 'color:#406e8e;font-weight:bold;', '');
                console.error(error);
                resolve(undefined);
            });

            const store = transaction.objectStore('responses');
            const req = store.openCursor();

            req.addEventListener('error', e => {
                const error = <Error>(e.target as any).error;
                console.error(`%charnessnation.ts%c     Failed to open api response cache cursor: ${error.message}`, 'color:#406e8e;font-weight:bold;', '');
                console.error(error);
                resolve();
            });

            req.addEventListener('success', e => {
                const cursor: IDBCursorWithValue | null = (e.target as any).result;

                if (!cursor)
                    return resolve();

                if (cursor.value.expiresAt < Date.now())
                    store.delete(cursor.key);

                cursor.continue();
            });
        });
    }
}

export const api = new HarnessNationAPI();
export default api;