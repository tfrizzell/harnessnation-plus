import { isMobileOS } from './utils.js';

/** Shared `TextEncoder` and `TextDecoder` instances used for encoding and decoding cached responses. */
const encoder = new TextEncoder();
const decoder = new TextDecoder();

/** Cache entry data structure. */
interface CacheEntry {
    key: string;
    response: Uint8Array;
    expiresAt: number;
}

/**
 * Logs a styled debug message to the console.
 * 
 * @param message -The message to output.
 */
function cacheDebug(message: string): void {
    console.debug(`%charnessnation.ts%c     ${message}`, 'color:#406e8e;font-weight:bold;', '');
}

/**
 * Logs a styled error message to the console.
 * 
 * @param message -The message to output.
 * @param error - An optional error object to provide extra context.
 */
function cacheError(message: string, error?: Error | null): void {
    console.error(`%charnessnation.ts%c     ${message}`, 'color:#406e8e;font-weight:bold;', '');

    if (error)
        console.error(error);
}

/**
 * Configuration options for the HarnessNationAPI client instance.
 */
export interface HarnessNationAPIOptions {
    /** 
     * The cooling period in milliseconds after hitting a `429 Too Many Requests` state. 
     * Must be >= 5,000ms. Defaults to 15,000ms.
     */
    backoffTimeout?: number;
    /** 
     * Cache retention length in milliseconds. Values under 60,000ms disable caching. 
     * Defaults to 14,400,000ms (4 hours).
     */
    cacheTTL?: number;
}

/**
 * Client interface for managing, routing, and caching HTTP requests to HarnessNation.
 */
export class HarnessNationAPI {
    #backoffTimeout: number = 15_000;
    #cacheTTL: number = 14_400_000;
    #lastRequestAt?: Date;
    #requestCount: number = 0;

    #backoff?: Promise<void>;
    #cache?: IDBDatabase;
    #csrfRequest?: Promise<string | undefined>;
    #retryCount: number = 0;
    #startUp?: Promise<void>;

    /**
     * Initializes a new HarnessNation API client instance.
     * 
     * @param options - Configuration overrides for cache life and backoff behaviors.
     */
    constructor(options: HarnessNationAPIOptions = {}) {
        this.#cacheTTL = options?.cacheTTL ?? this.#cacheTTL;
        this.#backoffTimeout = options?.backoffTimeout ?? this.#backoffTimeout;

        if (this.#cacheTTL < 60_000)
            console.warn(`%charnessnation.ts%c     cacheTTL=${this.#cacheTTL} is below minimum value of 60_000`, 'color:#406e8e;font-weight:bold;', '');

        if (this.#backoffTimeout < 5_000)
            console.warn(`%charnessnation.ts%c     backoffTimeout=${this.#backoffTimeout} is below minimum value of 5_000`, 'color:#406e8e;font-weight:bold;', '');

        this.#startUp = (chrome?.runtime?.getPlatformInfo == null
            ? new Promise(resolve => {
                this.#cacheTTL = 0;
                resolve();
            })
            : isMobileOS().then(isMobile => {
                if (isMobile) {
                    cacheError('Mobile OS Detected: disabling api cache');
                    return;
                }

                if (this.#cacheTTL < 60_000) {
                    cacheDebug(`Setting cacheTTL=${this.#cacheTTL}: disabling api cache`);
                    return;
                }

                return new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => {
                        cacheError('Failed to open api cache: timed out');
                        resolve();
                    }, 5000);

                    const req = indexedDB.open('cache:api', 1);

                    req.addEventListener('error', e => {
                        clearTimeout(timeout);
                        const error = (e.target as IDBOpenDBRequest).error;
                        cacheError(`Failed to open api cache: ${error?.message}`, error);
                        resolve();
                    });

                    req.addEventListener('success', () => {
                        clearTimeout(timeout);
                        this.#cache = req.result;
                        resolve();
                    });

                    req.addEventListener('upgradeneeded', e => {
                        clearTimeout(timeout);
                        cacheDebug('Updating api cache');

                        const db: IDBDatabase = (e.target as IDBOpenDBRequest).result;

                        db.addEventListener('error', e => {
                            const error = (e.target as IDBRequest).error;
                            cacheError(`Failed to update api cache: ${error?.message}`, error);
                            resolve();
                        });

                        db.createObjectStore('responses', { keyPath: 'key' })
                            .createIndex('expiresAt', 'expiresAt', { unique: false });
                    });
                });
            })
        );
    }

    /** @returns The current cache time-to-live settings in milliseconds. */
    get cacheTTL(): number {
        return this.#cacheTTL;
    }

    /** @returns Timestamp of the last outbound request dispatch, if any. */
    get lastRequestAt(): Date | undefined {
        return this.#lastRequestAt;
    }

    /** @returns Total accumulation of requests executed during this instantiation lifecycle. */
    get requestCount(): number {
        return this.#requestCount;
    }

    /**
     * A wrapper around the native fetch API that intercepts retriable response codes to trigger automatic exponential backoff retries.
     * 
     * Response text is mutated to normalize some HTML entities such as `&nbsp;` and `&#039;`.

     * @param input - The URL or request to fetch.
     * @param init - The fetch request options.
     * @returns A promise that resolves with the normalized HTML string.
     */
    async #fetch(input: string | URL | globalThis.Request, init?: RequestInit): Promise<string> {
        await this.#backoff;

        const res = await fetch(input, init);
        this.#lastRequestAt = new Date();
        this.#requestCount++;

        if (!res.ok) {
            if (![408, 425, 429, 500, 502, 503, 504].includes(res.status))
                throw new Error(`${res.status} ${res.statusText}`);

            await this.#startBackoff(res);
            return this.#fetch(input, init);
        }

        if (this.#backoff == null)
            this.#retryCount = 0;

        return this.#normalizeHTML(await res.text());
    }

    /** Retrieves page content from the IndexedDB store. */
    async #getFromCache(key: string): Promise<string | undefined> {
        await this.#startUp;

        if (this.#cache == null || this.#cacheTTL === 0)
            return undefined;

        const transaction = this.#cache?.transaction(['responses'], 'readwrite');

        transaction?.addEventListener('error', e => {
            const error = (e.target as IDBTransaction).error;
            cacheError(`Failed to open api response cache transaction: ${error?.message}`, error);
        });

        const entry = await new Promise<CacheEntry | undefined>(resolve => {
            if (!transaction)
                return resolve(undefined);

            transaction.addEventListener('error', () => resolve(undefined));

            const req = transaction.objectStore('responses').get(key);

            req.addEventListener('error', e => {
                const error = (e.target as IDBRequest).error;
                cacheError(`Failed to read from api response cache: ${error?.message}`, error);
                resolve(undefined);
            });

            req.addEventListener('success', e => {
                const entry = (e.target as IDBRequest<CacheEntry>).result;

                if (entry && entry.expiresAt < Date.now())
                    transaction?.objectStore('responses').delete(key);

                resolve(entry)
            });
        });

        return entry == null ? undefined : decoder.decode(entry.response);
    }

    /** Provides a cache-first read method falling back to a network fetch on a cache miss. */
    async #getOrCreateFromCache(key: string, input: string | URL | globalThis.Request, init?: RequestInit): Promise<string> {
        await this.#startUp;
        const cached = await this.#getFromCache(key);

        if (cached != null)
            return cached;

        const value = await this.#fetch(input, init);

        if (this.#cache != null && this.#cacheTTL > 0) {
            const entry: CacheEntry = {
                key,
                response: encoder.encode(value),
                expiresAt: Date.now() + this.#cacheTTL,
            };

            const transaction = this.#cache.transaction(['responses'], 'readwrite');

            transaction.addEventListener('error', e => {
                const error = (e.target as IDBTransaction).error;
                cacheError(`Failed to write to api response cache: ${error?.message}`, error);
            });

            transaction.objectStore('responses').put(entry);
        }

        return value;
    }

    /** Normalizes HTML content. */
    #normalizeHTML(html: string): string {
        return html?.replace(/&nbsp;/g, ' ').replace(/&#039;/g, "'");
    }

    /** Removes a specific entry from the IndexedDB store. */
    async #removeFromCache(key: string): Promise<void> {
        await this.#startUp;

        if (this.#cache == null || this.#cacheTTL === 0)
            return;

        const transaction = this.#cache?.transaction(['responses'], 'readwrite');

        transaction?.addEventListener('error', e => {
            const error = (e.target as IDBTransaction).error;
            cacheError(`Failed to open api response cache transaction: ${error?.message}`, error);
        });

        return new Promise(resolve => {
            if (!transaction)
                return resolve();

            transaction.addEventListener('error', () => resolve());

            const req = transaction.objectStore('responses').delete(key);

            req.addEventListener('error', e => {
                const error = (e.target as IDBRequest).error;
                cacheError(`Failed to read from api response cache: ${error?.message}`, error);
                resolve();
            });

            req.addEventListener('success', e => resolve());
        });
    }

    /**
     * Initiates an exponential backoff cooling period after a retriable response status code.
     * 
     * Multiplies the baseline time by 2^retryCount.
     * 
     * @param res - The request response.
     * @throws {Error} If the maximum retry threshold is exceeded.
     */
    #startBackoff(res: Response): Promise<void> {
        if (this.#backoff != null)
            return this.#backoff;

        if (this.#retryCount >= 5) {
            this.#retryCount = 0;
            throw new Error('Unable to communicate with HarnessNation. Please wait a few minutes and try again.')
        }

        return this.#backoff = new Promise(resolve => {
            this.#retryCount++;
            let timeout: number;

            if (res.headers.has('Retry-After')) {
                timeout = (parseFloat(res.headers.get('Retry-After')!) + 1) * 1000;
                console.debug(`%charnessnation.ts%c     'Retry-After' header detected; retrying in ${Number(timeout / 1000).toFixed(0)} seconds...`, 'color:#406e8e;font-weight:bold;', '');
            } else {
                timeout = this.#backoffTimeout * Math.pow(2, this.#retryCount - 1);
                console.debug(`%charnessnation.ts%c     Backing off; retry #${this.#retryCount} in ${Number(timeout / 1000).toFixed(0)} seconds...`, 'color:#406e8e;font-weight:bold;', '');
            }

            setTimeout(() => {
                this.#backoff = undefined;
                resolve();
            }, timeout);
        });
    }

    /**
     * Clears all entries from the api response cache.
     * 
     * @returns A promise that resolves once the cache has been cleared.
     */
    async clearCache(): Promise<void> {
        await this.#startUp;

        return new Promise(resolve => {
            const transaction = this.#cache?.transaction(['responses'], 'readwrite');

            if (!transaction)
                return resolve();

            transaction.addEventListener('error', e => {
                const error = (e.target as IDBTransaction).error;
                cacheError(`Failed to open api response cache transaction: ${error?.message}`, error);
                resolve();
            });

            const req = transaction.objectStore('responses').clear();

            req.addEventListener('error', e => {
                const error = (e.target as IDBRequest).error;
                cacheError(`Failed to clear api response cache: ${error?.message}`, error);
                resolve();
            });

            req.addEventListener('success', () => resolve());
        });
    }

    /**
     * Fetches the session's CSRF token.
     * 
     * @returns A promise that resolves with the CSRF token.
     */
    async getCSRFToken(): Promise<string | undefined> {
        if (this.#csrfRequest)
            return this.#csrfRequest;

        let csrfToken = await this.#getFromCache('__x-csrf-token__')

        if (csrfToken == null) {
            this.#csrfRequest = (async () => {
                try {
                    const html = await this.#fetch(`https://www.harnessnation.com/stable/dashboard`);
                    const csrfToken = html?.match(/setRequestHeader\((["'])X-CSRF-TOKEN\1,\s*(["'])(.*?)\2\)/i)?.[3];

                    if (csrfToken != null && this.#cache != null && this.#cacheTTL > 0) {
                        const transaction = this.#cache?.transaction(['responses'], 'readwrite');

                        if (transaction) {
                            const entry: CacheEntry = {
                                key: '__x-csrf-token__',
                                response: encoder.encode(csrfToken),
                                expiresAt: Date.now() + this.#cacheTTL,
                            };

                            transaction.addEventListener('error', e => {
                                const error = (e.target as IDBTransaction).error;
                                cacheError(`Failed to open api response cache transaction: ${error?.message}`, error);
                            });

                            transaction.objectStore('responses').put(entry);
                        }
                    }

                    return csrfToken;
                } catch (err: any) {
                    console.error(`%charnessnation.ts%c     Failed to fetch CSRF token: ${err?.message}`, 'color:#406e8e;font-weight:bold;', '');

                    if (err)
                        console.error(err)

                    return undefined;
                }
            })();

            csrfToken = await this.#csrfRequest;
            this.#csrfRequest = undefined;
        }

        return csrfToken;
    }

    /**
     * Fetches a horse's info page.
     * 
     * @param id - The id of the horse.
     * @param refresh - A flag to control whether to force a cache refresh. Defaults to `false`.
     * @returns A promise that resolves with the HTML content of the info page.
     */
    async getHorse(id: number, refresh: boolean = false): Promise<string> {
        if (refresh)
            await this.#removeFromCache(`/horses/${id}`);

        return this.#getOrCreateFromCache(`/horses/${id}`, `https://www.harnessnation.com/horse/${id}`);
    }

    /**
     * Fetches a horse's pedigree.
     * 
     * @param id - The id of the horse.
     * @param csrfToken - The token used to sign the request.
     * @param refresh - A flag to control whether to force a cache refresh. Defaults to `false`.
     * @returns A promise that resolves with the HTML content of the pedigree page.
     */
    async getPedigree(id: number, csrfToken?: string, refresh: boolean = false): Promise<string> {
        if (refresh)
            await this.#removeFromCache(`/horses/${id}/pedigree`);

        csrfToken ||= await this.getCSRFToken() ?? '';

        return this.#getOrCreateFromCache(`/horses/${id}/pedigree`, 'https://www.harnessnation.com/horse/pedigree', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Referer': 'https://www.harnessnation.com/',
                'X-Csrf-Token': csrfToken,
                'X-Requested-With': 'XMLHttpRequest',
            },
            body: new URLSearchParams({ _token: csrfToken, horseId: id.toString() }),
        });
    }

    /**
     * Fetches a horse's progeny list.
     * 
     * @param id - The id of the horse.
     * @param csrfToken - The token used to sign the request.
     * @param refresh - A flag to control whether to force a cache refresh. Defaults to `false`.
     * @returns A promise that resolves with the HTML content of the progeny list page.
     */
    async getProgenyList(id: number, csrfToken?: string, refresh: boolean = false): Promise<string> {
        if (refresh)
            await this.#removeFromCache(`/horses/${id}/progeny/list`);

        csrfToken ||= await this.getCSRFToken() ?? '';

        return this.#getOrCreateFromCache(`/horses/${id}/progeny/list`, 'https://www.harnessnation.com/api/progeny/list', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Referer': 'https://www.harnessnation.com/',
                'X-Csrf-Token': csrfToken,
                'X-Requested-With': 'XMLHttpRequest',
            },
            body: new URLSearchParams({
                horseId: id.toString(),
                filterGait: '',
                filterAgeGroup: '',
                filterGender: '',
                filterStable: '',
            }),
        });
    }

    /**
     * Fetches a horse's progeny report.
     * 
     * @param id - The id of the horse.
     * @param refresh - A flag to control whether to force a cache refresh. Defaults to `false`.
     * @returns A promise that resolves with the HTML content of the progeny report page.
     */
    async getProgenyReport(id: number, refresh: boolean = false): Promise<string> {
        if (refresh)
            await this.#removeFromCache(`/horses/${id}/progeny/report`);

        return this.#getOrCreateFromCache(`/horses/${id}/progeny/report`, 'https://www.harnessnation.com/api/progeny/report', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Referer': 'https://www.harnessnation.com/',
            },
            body: new URLSearchParams({ horseId: id.toString() }),
        });
    }

    /**
     * Fetches a horse's race history.
     * 
     * @param id - The id of the horse.
     * @param csrfToken - The token used to sign the request.
     * @param refresh - A flag to control whether to force a cache refresh. Defaults to `false`.
     * @returns A promise that resolves with the HTML content of the race history page.
     */
    async getRaceHistory(id: number, csrfToken?: string, refresh: boolean = false): Promise<string> {
        if (refresh)
            await this.#removeFromCache(`/horses/${id}/races`);

        csrfToken ||= await this.getCSRFToken() ?? '';

        return this.#getOrCreateFromCache(`/horses/${id}/races`, 'https://www.harnessnation.com/horse/api/race-history', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Referer': 'https://www.harnessnation.com/',
                'X-Csrf-Token': csrfToken,
                'X-Requested-With': 'XMLHttpRequest',
            },
            body: new URLSearchParams({ _token: csrfToken, horseId: id.toString() }),
        });
    }

    /**
     * Fetches a horse's sibling list.
     * 
     * @param id - The id of the horse.
     * @param refresh - A flag to control whether to force a cache refresh. Defaults to `false`.
     * @returns A promise that resolves with the HTML content of the sibling list page.
     */
    async getSiblings(id: number, refresh: boolean = false): Promise<string> {
        if (refresh)
            await this.#removeFromCache(`/horses/${id}/siblings`);

        return this.#getOrCreateFromCache(`/horses/${id}/siblings`, 'https://www.harnessnation.com/horse/api/siblings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Referer': 'https://www.harnessnation.com/',
            },
            body: new URLSearchParams({ horseId: id.toString() }),
        });
    }

    /**
     * Prunes expired entries from the api response cache.
     * 
     * @returns A promise that resolves once the cache has been pruned.
     */
    async pruneCache(): Promise<void> {
        await this.#startUp;

        return new Promise(resolve => {
            const transaction = this.#cache?.transaction(['responses'], 'readwrite');

            if (!transaction)
                return resolve();

            transaction.addEventListener('error', e => {
                const error = (e.target as IDBTransaction).error;
                cacheError(`Failed to open api response cache transaction: ${error?.message}`, error);
                resolve();
            });

            transaction.addEventListener('complete', () => resolve());

            const store = transaction.objectStore('responses');
            const req = store.index('expiresAt').openCursor(IDBKeyRange.upperBound(Date.now()));

            req.addEventListener('error', e => {
                const error = (e.target as IDBRequest).error;
                cacheError(`Failed to open api response cache cursor: ${error?.message}`, error);
            });

            req.addEventListener('success', e => {
                const cursor: IDBCursorWithValue | null = (e.target as IDBRequest).result;

                if (!cursor)
                    return;

                store.delete(cursor.primaryKey);
                cursor.continue();
            });
        });
    }
}

export const api = new HarnessNationAPI();
export default api;
