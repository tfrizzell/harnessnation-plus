import { CollectionReference, DocumentData, DocumentReference, DocumentSnapshot, Firestore, Query, QuerySnapshot, WriteBatch } from '@firebase/firestore';
import { collection, doc, getDocFromCache, getDocFromServer, getDocsFromCache, getDocsFromServer, limit, orderBy, query, serverTimestamp, setDoc, Timestamp, updateDoc, where, writeBatch } from '../../lib/firebasejs/firebase-firestore.js';

import { Action, ActionError, ActionResponse, ActionType, BreedingReportData, HorseSearchData, SendResponse } from '../../lib/actions.js';
import { calculateBloodlineScore, calculateBreedingScore, calculateRacingScore, calculateStudFee, generateBreedingReport as generateBreedingReportAsync, getHorse, BreedingScore, Horse, StallionScore } from '../../lib/horses.js';
import { regexEscape } from '../../lib/utils.js';

import * as firestore from '../../lib/firestore.js';
let db: Firestore = firestore.singleton();

chrome.runtime.onMessage.addListener((action: Action<any>, _sender: chrome.runtime.MessageSender, sendResponse: SendResponse) => {
    switch (action?.type) {
        case ActionType.CalculateStudFee:
            calculateStudFee(action.data)
                .then((data: number) => sendResponse(new ActionResponse(action, data)))
                .catch((error: Error | string) => sendResponse(new ActionError(action, error)));
            break;

        case ActionType.ClearHorseCache:
            clearHorseCache()
                .then(() => sendResponse(new ActionResponse(action)))
                .catch((error: Error | string) => sendResponse(new ActionError(action, error)));
            break;

        case ActionType.GenerateBreedingReport:
            generateBreedingReport(action.data)
                .then((data: string) => sendResponse(new ActionResponse(action, data)))
                .catch((error: Error | string) => sendResponse(new ActionError(action, error)));
            break;

        case ActionType.GetHorses:
            getHorses()
                .then((data: Horse[]) => sendResponse(new ActionResponse(action, data)))
                .catch((error: Error | string) => sendResponse(new ActionError(action, error)));
            break;

        case ActionType.SaveHorses:
            saveHorses(action.data)
                .then(() => sendResponse(new ActionResponse(action)))
                .catch((error: Error | string) => sendResponse(new ActionError(action, error)));
            break;

        case ActionType.SearchHorses:
            createSearchPattern(action.data)
                .then((data: RegExp | string) => sendResponse(new ActionResponse(action, data)))
                .catch((error: Error | string) => sendResponse(new ActionError(action, error)));
            break;

        default:
            return;
    }

    return true;
});

type HorseWithGeneration = Horse & {
    generation: number;
}

type HorseWithLastModified = Horse & {
    stallionScore?: (StallionScore & {
        lastModified?: Timestamp;
    } | null);
    lastModified?: Timestamp;
}

function addGeneration(horse: Horse | HorseWithGeneration, generation: number = 1): HorseWithGeneration {
    (horse as HorseWithGeneration).generation = generation;
    return horse as HorseWithGeneration;
}

async function clearHorseCache(): Promise<void> {
    await firestore.clearCache(db);
    db = await firestore.connect();
}

async function createSearchPattern({ term, maxGenerations = 4 }: HorseSearchData): Promise<RegExp | string> {
    if (!term?.trim())
        return term ?? '';

    const horses: Horse[] = await getHorses();
    const pattern: RegExp = new RegExp(term.replace(/\s+/g, '\\s*'), 'i');
    const matches: HorseWithGeneration[] = horses
        .filter((horse: Horse): boolean => pattern.test(horse.name!))
        .map((horse: Horse): HorseWithGeneration => addGeneration(horse));

    if (!matches.length)
        return term;

    for (const match of matches) {
        if (match.generation < maxGenerations)
            matches.push(...horses
                .filter((horse: Horse): boolean => horse.sireId == match.id && !matches.includes(horse as HorseWithGeneration))
                .map((horse: Horse): HorseWithGeneration => addGeneration(horse, match.generation + 1)));
    }

    return `(${[...new Set([term, ...matches
        .map((horse: Horse) => horse.name!)]
        .map((name: string) => regexEscape(name.trim()).replace(/\s+/g, '\\s*')))]
        .join('|')})`;
}

async function generateBreedingReport(data: BreedingReportData): Promise<string> {
    const isRunning: boolean = (await chrome.storage.local.get('breeding.export'))?.['breeding.export'] ?? false;

    if (isRunning) {
        throw 'A breeding report is already running. Please wait for it to finish before starting a new one. If you are certain there is not one running, or you want to cancel it, try restarting your browser.';
    }

    await chrome.storage.local.set({ 'breeding.export': true });

    try {
        return await generateBreedingReportAsync(data);
    } finally {
        await chrome.storage.local.remove('breeding.export');
    }
}

export async function getHorses(): Promise<Horse[]> {
    const colRef: CollectionReference<DocumentData> = collection(db, 'horses');
    const qLastModified: Query<DocumentData | {}> = query(colRef, orderBy('lastModified', 'desc'), limit(1));
    const qsLastModified: QuerySnapshot<HorseWithLastModified> = await getDocsFromCache(qLastModified);
    const lastModified: Date = qsLastModified?.docs?.[0]?.data()?.lastModified?.toDate() ?? new Date(0);

    const qRemote: Query<DocumentData | {}> = query(colRef, where('lastModified', '>', lastModified));
    const qsRemote: QuerySnapshot<HorseWithLastModified> = await getDocsFromServer(qRemote);
    qsRemote.size && console.debug(`%chorses.ts%c     Fetched ${qsRemote.size} new horse record${qsRemote.size === 1 ? 's' : ''} from firestore`, 'color:#406e8e;font-weight:bold;', '');

    const querySnapshot: QuerySnapshot<Horse> = await getDocsFromCache(colRef);
    const horses: Horse[] = [];

    querySnapshot.forEach(doc => {
        const { lastModified, ...horse }: HorseWithLastModified = doc.data();
        delete horse.stallionScore?.lastModified;
        horses.push(horse);
    });

    return horses;
}

async function getStallionScore(id: number): Promise<StallionScore> {
    const { score: breedingScore, confidence }: BreedingScore = await calculateBreedingScore(id);
    const racingScore: number = await calculateRacingScore(id);
    const bloodlineScore: number | null = await calculateBloodlineScore(id, await getHorses());

    return {
        value: (1 - confidence) * ((racingScore + (bloodlineScore ?? 0) / (1 + +(bloodlineScore != null)))) + confidence * breedingScore,
        confidence,
        racing: racingScore,
        breeding: breedingScore,
        bloodline: bloodlineScore,
    };
}

async function saveHorse(horse: Horse, batch?: WriteBatch): Promise<void> {
    if (!horse?.id)
        return;

    const docRef: DocumentReference<DocumentData> = doc(db, 'horses', `${horse.id}`);
    let _doc: DocumentSnapshot<DocumentData>;

    try {
        _doc = await getDocFromCache(docRef);
    } catch (e: any) {
        if (!e.message.includes('Failed to get document from cache.')) {
            console.error(`%chorses.ts%c     Failed to save horse ${horse.id}: ${e.message}`, 'color:#406e8e;font-weight:bold;', '');
            return;
        }

        _doc = await getDocFromServer(docRef)
    }

    if (!_doc.exists()) {
        const { sireId, damId, retired }: Horse = await getHorse(horse.id);
        horse.sireId = sireId;
        horse.damId = damId;
        horse.retired = retired;

        if (horse.stallionScore == null)
            horse.stallionScore = await getStallionScore(horse.id);

        console.debug(`%chorses.ts%c     Creating horse ${horse.id}${batch ? ' (batch)' : ''}`, 'color:#406e8e;font-weight:bold;', '');

        // if (batch != null) {
        //     batch.set(docRef, {
        //         ...horse,
        //         stallionScore: horse.stallionScore == null ? null : { ...horse.stallionScore, lastModified: serverTimestamp() },
        //         lastModified: serverTimestamp(),
        //     });
        // } else {
        //     await setDoc(docRef, {
        //         ...horse,
        //         stallionScore: horse.stallionScore == null ? null : { ...horse.stallionScore, lastModified: serverTimestamp() },
        //         lastModified: serverTimestamp(),
        //     });
        // }
    } else {
        const docData: DocumentData = _doc.data();
        const data: Horse = { id: horse.id, name: horse.name };
        (horse.sireId != null) && (data.sireId = horse.sireId);
        (horse.damId != null) && (data.damId = horse.damId);
        (horse.retired != null) && (data.retired = horse.retired);
        (horse.stallionScore != null) && (data.stallionScore = horse.stallionScore);

        const changed = Object.entries(data).filter(([key, value]): boolean => !(key in docData) || JSON.stringify(value) !== JSON.stringify((docData as any)[key])).map(([key]) => key);
        console.log(changed);

        if (!Object.entries(data).find(([key, value]): boolean => !(key in docData) || JSON.stringify(value) !== JSON.stringify((docData as any)[key])))
            return;

        console.debug(`%chorses.ts%c     Updating horse ${horse.id}${batch ? ' (batch)' : ''}`, 'color:#406e8e;font-weight:bold;', '');

        // if (batch != null) {
        //     batch.update(docRef, { ...data, lastModified: serverTimestamp() });
        // } else {
        //     await updateDoc(docRef, { ...data, lastModified: serverTimestamp() });
        // }
    }
}

async function saveHorses(horses: Horse[]): Promise<void> {
    if (horses?.length < 1)
        return;

    const _horses: Horse[] = [...horses];
    let chunk: Horse[];

    while ((chunk = _horses.splice(0, 25)) && chunk.length > 0) {
        const batch: WriteBatch = writeBatch(db);
        await Promise.all(chunk.map((horse: Horse) => saveHorse(horse, batch)));
        await batch.commit();
    }
}

export async function updateStallionScores(): Promise<void> {
    const horses: Horse[] = await getHorses();
    let chunk: Horse[];

    for (const horse of horses) {
        horse.stallionScore ??= {};

        if (horse.stallionScore!.breeding == null) {
            const { score: breedingScore, confidence }: BreedingScore = await calculateBreedingScore(horse.id!);
            horse.stallionScore!.breeding = breedingScore;
            horse.stallionScore!.confidence = confidence;
        }

        if (horse.stallionScore!.racing == null)
            horse.stallionScore!.racing = await calculateRacingScore(horse.id!);
    }

    for (const horse of horses)
        horse.stallionScore!.bloodline = await calculateBloodlineScore(horse.id!, horses);

    while ((chunk = horses.splice(0, 25)) && chunk.length > 0) {
        const batch: WriteBatch = writeBatch(db);
        await Promise.all(chunk.map((horse: Horse) => saveHorse(horse, batch)));
        await batch.commit();
    }
}