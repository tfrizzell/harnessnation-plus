import { DocumentData, DocumentSnapshot, FieldValue, WriteBatch } from 'firebase/firestore';
import { collection, doc, getDocFromCache, getDocFromServer, getDocsFromCache, getDocsFromServer, limit, orderBy, query, serverTimestamp, setDoc, Timestamp, updateDoc, where, writeBatch } from '../../vendor/firebasejs/firebase-firestore.js';

import { Action, ActionError, ActionObjectUnion, ActionResponse, ActionResponseUnion, ActionType, BreedingReportData, HorseSearchData, PedigreeCatalogData } from '../../lib/actions.js';
import { AlarmType } from '../../lib/alarms.js';
import { HNPlusRuntimeError } from '../../lib/errors.js';
import { calculateStudFee, getHorse, Horse } from '../../lib/horses.js';
import { generatePedigreeCatalog as downloadPedigreeCatalog } from '../../lib/pedigree.js';
import { generateBreedingReport as generateBreedingReportAsync } from '../../lib/reporting.js';
import { calculateBloodlineScore, calculateBreedingScore, calculateRacingScore, calculateStallionScore, StallionScore } from '../../lib/stallion-scores.js';
import { TaskQueue } from '../../lib/task-queue.js';
import { downloadFile, isMobileOS, regexEscape, toTimestamp, waitFor } from '../../lib/utils.js';

import * as firestore from '../../lib/firestore.js';
let db = firestore.singleton();

chrome.runtime.onMessage.addListener((actionObj: ActionObjectUnion, _sender, _sendResponse) => {
    const action = Action.of(actionObj);

    const sendResponse = (response: ActionResponseUnion | ActionError): void =>
        _sendResponse(response.toJSON());

    const toError = (error: unknown): Error | string => {
        return error instanceof Error || typeof error === 'string'
            ? error
            : String(error);
    }

    // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
    switch (action?.type) {
        case ActionType.CalculateStudFee:
            waitFor(calculateStudFee(action.data))
                .then((data: number) => sendResponse(new ActionResponse(action, data)))
                .catch((error: unknown) => sendResponse(new ActionError(action, toError(error))));
            break;

        case ActionType.ClearHorseCache:
            clearHorseCache()
                .then(() => sendResponse(new ActionResponse(action)))
                .catch((error: unknown) => sendResponse(new ActionError(action, toError(error))));
            break;

        case ActionType.GenerateBroodmareReport:
            waitFor(generateBroodmareReport(action.data))
                .then(() => sendResponse(new ActionResponse(action)))
                .catch((error: unknown) => sendResponse(new ActionError(action, toError(error))));
            break;

        case ActionType.GeneratePedigreeCatalog:
            waitFor(generatePedigreeCatalog(action.data))
                .then(() => sendResponse(new ActionResponse(action)))
                .catch((error: unknown) => sendResponse(new ActionError(action, toError(error))));
            break;

        case ActionType.GenerateStallionReport:
            waitFor(generateStallionReport(action.data))
                .then(() => sendResponse(new ActionResponse(action)))
                .catch((error: unknown) => sendResponse(new ActionError(action, toError(error))));
            break;

        case ActionType.GetHorse:
            getHorseById(action.data.id)
                .then((data: Horse | undefined) => sendResponse(new ActionResponse(action, data)))
                .catch((error: unknown) => sendResponse(new ActionError(action, toError(error))));
            break;

        case ActionType.GetHorses:
            getHorses()
                .then((data: Array<Horse>) => sendResponse(new ActionResponse(action, data)))
                .catch((error: unknown) => sendResponse(new ActionError(action, toError(error))));
            break;

        case ActionType.PreviewStallionScore:
            previewStallionScore(action.data.id)
                .then((data: StallionScore) => sendResponse(new ActionResponse(action, data)))
                .catch((error: unknown) => sendResponse(new ActionError(action, toError(error))));
            break;

        case ActionType.SaveHorses:
            saveHorses(action.data)
                .then(() => sendResponse(new ActionResponse(action)))
                .catch((error: unknown) => sendResponse(new ActionError(action, toError(error))));
            break;

        case ActionType.SearchHorses:
            createSearchPattern(action.data)
                .then((data: RegExp | string) => sendResponse(new ActionResponse(action, data)))
                .catch((error: unknown) => sendResponse(new ActionError(action, toError(error))));
            break;

        case ActionType.UpdateStallionScores:
            waitFor(updateStallionScores())
                .then(() => sendResponse(new ActionResponse(action)))
                .catch((error: unknown) => sendResponse(new ActionError(action, toError(error))));
            break;

        default:
            return;
    }

    return true;
});

interface HorseWithGeneration extends Horse {
    generation: number;
}

interface HorseWithLastModified extends Horse {
    stallionScore?: StallionScoreWithLastModified;
    lastModified?: Timestamp | FieldValue;
}

interface PedigreeTelemetry {
    totalRuns: number;
    totalRunTime: number;
    pagesGenerated: number;
}

interface StallionScoreWithLastModified extends StallionScore {
    lastModified?: Timestamp | FieldValue;
}

function addGeneration(
    horse: Horse | HorseWithGeneration,
    generation: number = 1
): HorseWithGeneration {
    const _horse = horse as HorseWithGeneration;
    _horse.generation = generation;
    return _horse;
}

async function clearHorseCache(): Promise<void> {
    await firestore.clearCache();
    db = firestore.reinitializeFirestore();
}

async function createSearchPattern(
    { term, maxGenerations = 4 }: HorseSearchData
): Promise<RegExp | string> {
    if (!term.trim())
        return term;

    const horses = await getHorses();
    const pattern = new RegExp(term.replace(/\s+/g, '\\s*'), 'i');

    const matches = horses
        .filter(horse => horse.name != null && pattern.test(horse.name))
        .map(addGeneration);

    if (!matches.length)
        return term;

    for (const match of matches) {
        if (match.generation < maxGenerations)
            matches.push(...horses
                .filter(horse => horse.sireId == match.id
                    && !matches.includes(horse as HorseWithGeneration))
                .map(horse => addGeneration(horse, match.generation + 1)));
    }

    return `(${Array.from(new Set(
        [
            term,
            ...matches.map(horse => horse.name)
        ]
            .filter(name => name != null)
            .map(name => regexEscape(name.trim()).replace(/\s+/g, '\\s*')))
    ).join('|')})`;
}

async function generateBreedingReport(data: BreedingReportData): Promise<string> {
    const isRunning = (await chrome.storage.local.get({
        'running.exports.breeding': false,
    }))['running.exports.breeding'] as boolean;

    if (isRunning)
        throw new HNPlusRuntimeError('A breeding report is already running. Please wait for it to finish before starting a new one. If you are certain there is not one running, or you want to cancel it, try restarting your browser.');

    await chrome.storage.local.set({ 'running.exports.breeding': true });

    try {
        return await generateBreedingReportAsync(data);
    } finally {
        console.debug(`%chorses.ts%c     Clearing breeding export flag`, 'color:#406e8e;font-weight:bold;', '');
        await chrome.storage.local.remove('running.exports.breeding');
    }
}

async function generateBroodmareReport(data: BreedingReportData): Promise<void> {
    try {
        await downloadFile(
            await generateBreedingReport({ mode: 'enhanced', ...data }),
            // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
            data.filename?.trim() || `hn-plus-broodmare-report-${toTimestamp().replace(/\D/g, '')}.csv`
        );
    } catch (e: unknown) {
        console.groupCollapsed(`%chorses.ts%c     Failed to generate broodmare report`, 'color:#406e8e;font-weight:bold;', '');
        let message: string;

        if (e instanceof Error) {
            console.warn('Message:', message = e.message);
            console.warn('Stack Trace:', e);
        } else {
            console.warn('Unknown Error:', e);
            message = String(e);
        }

        console.groupEnd();

        if (!(e instanceof HNPlusRuntimeError))
            await chrome.notifications.create({
                iconUrl: 'icons/hn-plus48.png',
                title: 'HarnessNation+ Error',
                message: `An unexpected error occurred while generating your broodmare report: ${message}`,
                type: 'basic',
                eventTime: Date.now(),
            });
    }
}

async function generatePedigreeCatalog(data: PedigreeCatalogData): Promise<void> {
    const isRunning = (await chrome.storage.local.get({
        'running.catalogs.pedigree': false,
    }))['running.catalogs.pedigree'] as boolean;

    if (isRunning)
        throw new HNPlusRuntimeError('A pedigree catalog is already being generated. Please wait for it to finish before starting a new one. If you are certain there is not one running, or you want to cancel it, try restarting your browser.');

    await chrome.storage.local.set({ 'running.catalogs.pedigree': true });

    try {
        const start = performance.now();

        const catalog = await downloadPedigreeCatalog(
            data.data,
            data.showHipNumbers,
            data.fullPedigrees
        );

        const runtime = performance.now() - start;
        const pagesGenerated = data.data.length;

        void chrome.storage.local.get('telemetry.pedigree').then(data => {
            const telemetry = (data['telemetry.pedigree'] ?? {
                totalRuns: 0,
                totalRunTime: 0,
                pagesGenerated: 0,
            }) as PedigreeTelemetry;

            void chrome.storage.local.set({
                'telemetry.pedigree': {
                    totalRuns: telemetry.totalRuns + 1,
                    totalRunTime: telemetry.totalRunTime + runtime,
                    pagesGenerated: telemetry.pagesGenerated + pagesGenerated,
                },
            });
        });

        await downloadFile(
            catalog,
            // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
            data.filename?.trim() || `hnplus-pedigree-catalog-${toTimestamp().replace(/\D/g, '')}.pdf`
        );
    } catch (e: unknown) {
        console.groupCollapsed(`%chorses.ts%c     Failed to generate pedigree catalog`, 'color:#406e8e;font-weight:bold;', '');
        let message: string;

        if (e instanceof Error) {
            console.warn('Message:', message = e.message);
            console.warn('Stack Trace:', e);
        } else {
            console.warn('Unknown Error:', e);
            message = String(e);
        }

        console.groupEnd();

        if (!(e instanceof HNPlusRuntimeError))
            await chrome.notifications.create({
                iconUrl: 'icons/hn-plus48.png',
                title: 'HarnessNation+ Error',
                message: `An unexpected error occurred while generating your pedigree catalog: ${message}`,
                type: 'basic',
                eventTime: Date.now(),
            });
    } finally {
        console.debug(`%chorses.ts%c     Clearing pedigree catalog flag`, 'color:#406e8e;font-weight:bold;', '');
        await chrome.storage.local.remove('running.catalogs.pedigree');
    }
}

async function generateStallionReport(data: BreedingReportData): Promise<void> {
    try {
        let report = await generateBreedingReport(data);
        const rows = window.atob(report.slice(21)).split('\n');

        if (rows.length > 1) {
            const horses = await getHorses();

            if (horses.length > 0) {
                report = report.slice(0, 21) +
                    window.btoa(rows.map((row, i) => {
                        if (i === 0)
                            return `${row},"Stallion Score"`;

                        const id = row.match(/^"(\d+)"/)?.slice(1).map(parseInt)[0] ?? 0;

                        if (id > 0) {
                            const horse = horses.find(horse => horse.id === id);

                            if (horse?.stallionScore?.value != null)
                                return `${row},"${Math.floor(horse.stallionScore.value)}"`;
                        }

                        return `${row},""`;
                    }).join('\n'));
            }
        }

        await downloadFile(
            report,
            // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
            data.filename?.trim() || `hn-plus-stallion-report-${toTimestamp().replace(/\D/g, '')}.csv`
        );
    } catch (e: unknown) {
        console.groupCollapsed(`%chorses.ts%c     Failed to generate stallion report`, 'color:#406e8e;font-weight:bold;', '');
        let message: string;

        if (e instanceof Error) {
            console.warn('Message:', message = e.message);
            console.warn('Stack Trace:', e);
        } else {
            console.warn('Unknown Error:', e);
            message = String(e);
        }

        console.groupEnd();

        if (!(e instanceof HNPlusRuntimeError))
            await chrome.notifications.create({
                iconUrl: 'icons/hn-plus48.png',
                title: 'HarnessNation+ Error',
                message: `An unexpected error occurred while generating your stallion report: ${message}`,
                type: 'basic',
                eventTime: Date.now(),
            });
    }
}

async function getHorseById(id: number): Promise<Horse | undefined> {
    const colRef = collection(db, 'horses');
    const querySnapshot = await getDocsFromCache<HorseWithLastModified, DocumentData>(colRef);

    if (querySnapshot.docs.length < 1)
        await getDocsFromServer(colRef);

    const docRef = doc(db, 'horses', `${id}`);
    let _doc: DocumentSnapshot<HorseWithLastModified> | null;

    try {
        _doc = await getDocFromCache<HorseWithLastModified, DocumentData>(docRef);
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);

        if (!message.includes('Failed to get document from cache.')) {
            console.groupCollapsed(`%chorses.ts%c     Failed to load horse ${id}`, 'color:#406e8e;font-weight:bold;', '');

            if (e instanceof Error) {
                console.warn('Message:', message);
                console.warn('Stack Trace:', e);
            } else
                console.warn('Unknown Error:', e);

            console.groupEnd();
            return;
        }

        _doc = null;
    }

    const data = _doc?.data();

    if (data != null) {
        const horse: HorseWithLastModified = {
            ...data,
            stallionScore: data.stallionScore == null
                ? data.stallionScore
                : { ...data.stallionScore },
        };

        delete horse.lastModified;
        delete horse.stallionScore?.lastModified;
        return horse;
    }
}

async function getHorses(): Promise<Array<Horse>> {
    return (await getHorsesWithLastModified()).map(horse => {
        delete horse.lastModified;
        delete horse.stallionScore?.lastModified;
        return horse;
    });
}

async function getHorsesWithLastModified(): Promise<Array<HorseWithLastModified>> {
    const colRef = collection(db, 'horses');
    const qLastModified = query(colRef, orderBy('lastModified', 'desc'), limit(1));
    const qsLastModified = await getDocsFromCache<
        HorseWithLastModified,
        DocumentData
    >(qLastModified);

    const lastModified = (qsLastModified.docs[0]?.data()?.lastModified as Timestamp | undefined)
        ?.toDate() ?? new Date(0);

    const qRemote = query(colRef, where('lastModified', '>', lastModified));
    const qsRemote = await getDocsFromServer<HorseWithLastModified, DocumentData>(qRemote);

    if (qsRemote.size > 0)
        console.debug(`%chorses.ts%c     Fetched ${qsRemote.size} new horse record${qsRemote.size === 1 ? '' : 's'} from firestore`, 'color:#406e8e;font-weight:bold;', '');

    const querySnapshot = await getDocsFromCache<HorseWithLastModified, DocumentData>(colRef);
    const horses: Array<HorseWithLastModified> = [];

    querySnapshot.forEach(doc => {
        const horse: HorseWithLastModified = { ...doc.data() };

        horses.push({
            ...horse,
            stallionScore: horse.stallionScore == null
                ? horse.stallionScore
                : { ...horse.stallionScore },
        });
    });

    return horses;
}

async function getStallionScore(horse: Horse): Promise<StallionScore> {
    if (horse.id == null)
        throw new Error(`Invalid stallion id: ${horse.id}`);

    const { score: breedingScore, confidence } = await calculateBreedingScore(horse.id);
    const racingScore = await calculateRacingScore(horse.id);
    const bloodlineScore = await calculateBloodlineScore(horse.id, [horse, ...await getHorses()]);

    return {
        value: await calculateStallionScore({
            confidence,
            racing: racingScore,
            breeding: breedingScore,
            bloodline: bloodlineScore,
        }),
        confidence,
        racing: racingScore,
        breeding: breedingScore,
    };
}

async function previewStallionScore(id: number): Promise<StallionScore> {
    return getStallionScore(await getHorse(id));
}

export function shouldUpdateStallionScore(horse: HorseWithLastModified): boolean {
    const lastModified = (horse.stallionScore?.lastModified as Timestamp | undefined)
        ?.toDate() ?? new Date(horse.retired === true ? Date.now() : 0);
    const daysSinceLastModified = (Date.now() - lastModified.valueOf()) / 86400000;

    return horse.retired === true
        ? (daysSinceLastModified < 365)
        : (daysSinceLastModified > 28);
}

async function saveHorse(horse: Horse, batch?: WriteBatch): Promise<number | undefined> {
    if (horse.id == null)
        return;

    const docRef = doc(db, 'horses', `${horse.id}`);
    let _doc: DocumentSnapshot;

    try {
        _doc = await getDocFromCache(docRef);
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);

        if (!message.includes('Failed to get document from cache.')) {
            console.groupCollapsed(`%chorses.ts%c     Failed to save horse ${horse.id}`, 'color:#406e8e;font-weight:bold;', '');

            if (e instanceof Error) {
                console.warn('Message:', message);
                console.warn('Stack Trace:', e);
            } else
                console.warn('Unknown Error:', e);

            console.groupEnd();
            return;
        }

        _doc = await getDocFromServer(docRef)
    }

    if (!_doc.exists()) {
        const { name, sireId, damId, retired } = await getHorse(horse.id);

        const data: HorseWithLastModified = {
            ...horse,
            name,
            sireId,
            damId,
            retired,
            stallionScore: ('lastModified' in (horse.stallionScore ?? {}))
                ? horse.stallionScore as StallionScoreWithLastModified
                : {
                    ...await getStallionScore(horse),
                    lastModified: serverTimestamp()
                },
        };

        console.debug(`%chorses.ts%c     Creating horse ${data.id}${batch ? ' (batch)' : ''}`, 'color:#406e8e;font-weight:bold;', '');

        if (batch != null)
            batch.set(docRef, { ...data, lastModified: serverTimestamp() });
        else
            await setDoc(docRef, { ...data, lastModified: serverTimestamp() });

        if (data.stallionScore != null)
            return data.id;
    } else {
        const docData = _doc.data();

        const data: HorseWithLastModified = {
            id: horse.id,
            damId: null,
            ...(horse.name != null && { name: horse.name.trim() }),
            ...(horse.sireId != null && { sireId: horse.sireId }),
            ...(horse.retired != null && { retired: horse.retired }),
            ...(horse.stallionScore != null && { stallionScore: horse.stallionScore }),
        };


        const changes = Object.entries(data)
            .filter(([key, value]) => !(key in docData)
                || JSON.stringify(value) !== JSON.stringify(docData[key]))
            .map(([key]) => key);

        if (changes.length < 1)
            return;

        console.debug(`%chorses.ts%c     Updating horse ${horse.id}${batch ? ' (batch)' : ''}`, 'color:#406e8e;font-weight:bold;', '');

        if (data.stallionScore != null && changes.includes('stallionScore'))
            data.stallionScore.lastModified = serverTimestamp();

        if (batch != null)
            batch.update(docRef, { ...data, lastModified: serverTimestamp() });
        else
            await updateDoc(docRef, { ...data, lastModified: serverTimestamp() });

        if (changes.includes('stallionScore'))
            return horse.id;
    }
}

async function saveHorses(horses: Array<Horse>): Promise<void> {
    if (horses.length < 1)
        return;

    const _horses = Array.from(horses);
    const updatedIds: Array<number> = [];
    let chunk: Array<Horse>;

    while ((chunk = _horses.splice(0, 25)).length > 0) {
        const batch = writeBatch(db);

        updatedIds.push(...(await Promise.all(
            chunk.map(horse => saveHorse(horse, batch))
        )).filter(id => id != null));

        await batch.commit();
    }

    if (updatedIds.length > 0) {
        horses = await getHorses();
        const updated: Array<Horse> = [];

        for (const horse of horses) {
            if (horse.id == null || horse.stallionScore == null || !updatedIds.includes(horse.id))
                continue;

            horse.stallionScore.bloodline = await calculateBloodlineScore(horse.id, horses);
            horse.stallionScore.value = await calculateStallionScore(horse.stallionScore);
            updated.push(horse);
        }

        while ((chunk = updated.splice(0, 25)).length > 0) {
            const batch = writeBatch(db);
            await Promise.all(chunk.map(horse => saveHorse(horse, batch)));
            await batch.commit();
        }
    }
}

async function updateStallionScores(): Promise<void> {
    if (await isMobileOS()) {
        console.debug(`%chorses.ts%c     Mobile OS Detected: skipping stallion score update`, 'color:#406e8e;font-weight:bold;', '');
        return;
    }

    console.debug(`%chorses.ts%c     Updating stallion scores`, 'color:#406e8e;font-weight:bold;', '');

    const horses = await getHorsesWithLastModified();
    const tq = new TaskQueue(3);

    const updated: Array<HorseWithLastModified> = (
        await Promise.all(
            horses.map(horse =>
                tq.add(async () => {
                    if (horse.id == null || !shouldUpdateStallionScore(horse))
                        return;

                    if (
                        !horse.retired
                        || ((horse.sireId !== undefined) !== (horse.damId !== undefined))
                    ) {
                        try {
                            const info = await getHorse(horse.id);
                            horse.name = info.name;
                            horse.sireId = info.sireId;
                            horse.damId = info.damId;
                            horse.retired = info.retired;
                        } catch (e: unknown) {
                            console.groupCollapsed(`%chorses.ts%c     Failed to fetch info for horse ${horse.id}`, 'color:#406e8e;font-weight:bold;', '')

                            if (e instanceof Error) {
                                console.error('Message:', e.message);
                                console.error('Stack Trace:', e);
                            } else
                                console.error('Unknown Error:', e);

                            console.groupEnd();
                            return;
                        }
                    }

                    try {
                        const {
                            score: breedingScore,
                            confidence
                        } = await calculateBreedingScore(horse.id);

                        horse.stallionScore ??= {};
                        horse.stallionScore.breeding = breedingScore;
                        horse.stallionScore.confidence = confidence;

                        if (horse.stallionScore.racing === undefined)
                            horse.stallionScore.racing = await calculateRacingScore(horse.id);

                        return horse;
                    } catch (e: unknown) {
                        console.groupCollapsed(`%chorses.ts%c     Failed to compute stallion score for horse ${horse.id}`, 'color:#406e8e;font-weight:bold;', '')

                        if (e instanceof Error) {
                            console.error('Message:', e.message);
                            console.error('Stack Trace:', e);
                        } else
                            console.error('Unknown Error:', e);

                        console.groupEnd();
                        return;
                    }
                })
            )
        )
    ).filter(horse => horse != null);

    await Promise.allSettled(
        updated.map(horse =>
            tq.add(async () => {
                if (horse.id == null || horse.stallionScore == null)
                    return;

                try {
                    horse.stallionScore.bloodline = await calculateBloodlineScore(horse.id, horses);
                    horse.stallionScore.value = await calculateStallionScore(horse.stallionScore);
                } catch (e: unknown) {
                    console.groupCollapsed(`%chorses.ts%c     Failed to compute stallion score for horse ${horse.id}`, 'color:#406e8e;font-weight:bold;', '')

                    if (e instanceof Error) {
                        console.error('Message:', e.message);
                        console.error('Stack Trace:', e);
                    } else
                        console.error('Unknown Error:', e);

                    console.groupEnd();
                }
            })
        )
    );

    let chunk: Array<HorseWithLastModified>;

    while ((chunk = updated.splice(0, 25)).length > 0) {
        const batch = writeBatch(db);
        await Promise.all(chunk.map(horse => saveHorse(horse, batch)));
        await batch.commit();
    }
}

chrome.alarms.onAlarm.addListener(alarm => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
    if (alarm.name === AlarmType.UpdateStallionScores)
        void updateStallionScores();
});