import { DocumentData, DocumentSnapshot, WriteBatch } from 'firebase/firestore';
import { collection, doc, getDocFromCache, getDocFromServer, getDocsFromCache, getDocsFromServer, limit, orderBy, query, serverTimestamp, setDoc, Timestamp, updateDoc, where, writeBatch } from '../../lib/firebasejs/firebase-firestore.js';

import { Action, ActionError, ActionResponse, ActionType, BreedingReportData, BreedingReportExportData, HorseSearchData } from '../../lib/actions.js';
import { AlarmType } from '../../lib/alarms.js';
import { calculateBloodlineScore, calculateBreedingScore, calculateRacingScore, calculateStudFee, generateBreedingReport as generateBreedingReportAsync, getHorse, Horse, StallionScore, calculateStallionScore } from '../../lib/horses.js';
import { downloadFile, regexEscape, sleep, toTimestamp } from '../../lib/utils.js';

import * as firestore from '../../lib/firestore.js';
let db = firestore.singleton();

chrome.runtime.onMessage.addListener((action: Action<any>, _sender, _sendResponse) => {
    // Firefox compatibility: `structuredClone` fails, so use `.toJSON()` to send a plain object
    const sendResponse = (response: ActionResponse<any> | ActionError): void =>
        _sendResponse(response.toJSON());

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

        case ActionType.ExportBroodmareReport:
            exportBroodmareReport(action.data)
                .then(() => sendResponse(new ActionResponse(action)))
                .catch((error: Error | string) => sendResponse(new ActionError(action, error)));
            break;

        case ActionType.ExportStallionReport:
            exportStallionReport(action.data)
                .then(() => sendResponse(new ActionResponse(action)))
                .catch((error: Error | string) => sendResponse(new ActionError(action, error)));
            break;

        case ActionType.GenerateBreedingReport:
            generateBreedingReport(action.data)
                .then((data: string) => sendResponse(new ActionResponse(action, data)))
                .catch((error: Error | string) => sendResponse(new ActionError(action, error)));
            break;

        case ActionType.GetHorse:
            getHorseById(action.data.id)
                .then((data: Horse | undefined) => sendResponse(new ActionResponse(action, data)))
                .catch((error: Error | string) => sendResponse(new ActionError(action, error)));
            break;

        case ActionType.GetHorses:
            getHorses()
                .then((data: Horse[]) => sendResponse(new ActionResponse(action, data)))
                .catch((error: Error | string) => sendResponse(new ActionError(action, error)));
            break;

        case ActionType.PreviewStallionScore:
            previewStallionScore(action.data.id)
                .then((data: StallionScore) => sendResponse(new ActionResponse(action, data)))
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

        case ActionType.UpdateStallionScores:
            updateStallionScores()
                .then(() => sendResponse(new ActionResponse(action)))
                .catch((error: Error | string) => sendResponse(new ActionError(action, error)));
            break;

        default:
            return;
    }

    return true;
});

type StallionScoreWithLastModified = StallionScore & {
    lastModified?: Timestamp;
}

type HorseWithGeneration = Horse & {
    generation: number;
}

type HorseWithLastModified = Horse & {
    stallionScore?: StallionScoreWithLastModified;
    lastModified?: Timestamp;
}

function addGeneration(horse: Horse | HorseWithGeneration, generation: number = 1): HorseWithGeneration {
    (<HorseWithGeneration>horse).generation = generation;
    return <HorseWithGeneration>horse;
}

async function clearHorseCache(): Promise<void> {
    await firestore.clearCache(db);
    db = await firestore.connect();
}

async function createSearchPattern({ term, maxGenerations = 4 }: HorseSearchData): Promise<RegExp | string> {
    if (!term?.trim())
        return term ?? '';

    const horses = await getHorses();
    const pattern = new RegExp(term.replace(/\s+/g, '\\s*'), 'i');
    const matches = horses
        .filter((horse: Horse): boolean => pattern.test(horse.name!))
        .map((horse: Horse): HorseWithGeneration => addGeneration(horse));

    if (!matches.length)
        return term;

    for (const match of matches) {
        if (match.generation < maxGenerations)
            matches.push(...horses
                .filter(horse => horse.sireId == match.id && !matches.includes(<HorseWithGeneration>horse))
                .map((horse): HorseWithGeneration => addGeneration(horse, match.generation + 1)));
    }

    return `(${Array.from(new Set([term, ...matches
        .map((horse: Horse) => horse.name!)]
        .map((name: string) => regexEscape(name.trim()).replace(/\s+/g, '\\s*')))
    ).join('|')})`;
}

async function exportBroodmareReport(data: BreedingReportExportData): Promise<void> {
    try {
        downloadFile(
            await generateBreedingReport(data),
            data.filename?.trim() || `hn-plus-broodmare-report-${toTimestamp().replace(/\D/g, '')}.csv`
        );
    } catch (e: any) {
        console.error(`%chorses.ts%c     Failed to generate broodmare report: ${e.message}`, 'color:#406e8e;font-weight:bold;', '');
        console.error(e);
    }
}

async function exportStallionReport(data: BreedingReportExportData): Promise<void> {
    let report = await generateBreedingReport(data);
    const rows = window.atob(report.slice(21)).split('\n');

    if (rows.length > 1) {
        const horses = await getHorses();

        if (horses != null) {
            report = report.slice(0, 21) +
                window.btoa(rows.map((row, i) => {
                    if (i === 0)
                        return `${row},"Stallion Score"`;

                    const id = row.match(/^"(\d+)"/)?.slice(1)?.map(parseInt)?.[0] ?? 0;

                    if (id > 0) {
                        const horse = horses.find(horse => horse.id === id);

                        if (horse?.stallionScore?.value != null)
                            return `${row},"${Math.floor(horse.stallionScore.value)}"`;
                    }

                    return `${row},""`;
                }).join('\n'));
        }
    }

    try {
        downloadFile(
            report,
            data.filename?.trim() || `hn-plus-stallion-report-${toTimestamp().replace(/\D/g, '')}.csv`
        );
    } catch (e: any) {
        console.error(`%chorses.ts%c     Failed to generate stallion report: ${e.message}`, 'color:#406e8e;font-weight:bold;', '');
        console.error(e);
    }
}

async function generateBreedingReport(data: BreedingReportData): Promise<string> {
    const isRunning = (await chrome.storage.local.get('breeding.export'))?.['breeding.export'] ?? false;

    if (isRunning)
        throw 'A breeding report is already running. Please wait for it to finish before starting a new one. If you are certain there is not one running, or you want to cancel it, try restarting your browser.';

    await chrome.storage.local.set({ 'breeding.export': true });

    try {
        return await generateBreedingReportAsync(data);
    } finally {
        console.debug(`%chorses.ts%c     Clearing breeding export flag`, 'color:#406e8e;font-weight:bold;', '');
        await chrome.storage.local.remove('breeding.export');
    }
}

export async function getHorseById(id: number): Promise<Horse | undefined> {
    const colRef = collection(db, 'horses');
    const querySnapshot = await getDocsFromCache<HorseWithLastModified>(colRef);

    if (querySnapshot.docs.length < 1)
        await getDocsFromServer(colRef);

    const docRef = doc(db, 'horses', `${id}`);
    let _doc: DocumentSnapshot<HorseWithLastModified> | null;

    try {
        _doc = await getDocFromCache<HorseWithLastModified>(docRef);
    } catch (e: any) {
        if (!e.message.includes('Failed to get document from cache.')) {
            console.error(`%chorses.ts%c     Failed to load horse ${id}: ${e.message}`, 'color:#406e8e;font-weight:bold;', '');
            console.error(e);
            return;
        }

        _doc = null;
    }

    const data = _doc?.data();

    if (data != null) {
        const horse: HorseWithLastModified = {
            ...data,
            stallionScore: data.stallionScore == null ? data.stallionScore : { ...data.stallionScore },
        };

        delete horse.lastModified;
        delete horse.stallionScore?.lastModified;
        return horse;
    }
}

export async function getHorses(): Promise<Horse[]> {
    return (await getHorsesWithLastModified()).map(horse => {
        delete horse.lastModified;
        delete horse.stallionScore?.lastModified;
        return horse;
    });
}

async function getHorsesWithLastModified(): Promise<HorseWithLastModified[]> {
    const colRef = collection(db, 'horses');
    const qLastModified = query(colRef, orderBy('lastModified', 'desc'), limit(1));
    const qsLastModified = await getDocsFromCache<HorseWithLastModified>(qLastModified);
    const lastModified = qsLastModified?.docs?.[0]?.data()?.lastModified?.toDate?.() ?? new Date(0);

    const qRemote = query(colRef, where('lastModified', '>', lastModified));
    const qsRemote = await getDocsFromServer<HorseWithLastModified>(qRemote);
    qsRemote.size && console.debug(`%chorses.ts%c     Fetched ${qsRemote.size} new horse record${qsRemote.size === 1 ? '' : 's'} from firestore`, 'color:#406e8e;font-weight:bold;', '');

    const querySnapshot = await getDocsFromCache<HorseWithLastModified>(colRef);
    const horses: HorseWithLastModified[] = [];

    querySnapshot.forEach(doc => {
        const horse: HorseWithLastModified = { ...doc.data() };

        horses.push({
            ...horse,
            stallionScore: horse.stallionScore == null ? horse.stallionScore : { ...horse.stallionScore },
        });
    });

    return horses;
}

async function getStallionScore(horse: Horse): Promise<StallionScore> {
    const { score: breedingScore, confidence } = await calculateBreedingScore(horse.id!);
    const racingScore = await calculateRacingScore(horse.id!);
    const bloodlineScore = await calculateBloodlineScore(horse.id!, [horse, ...await getHorses()]);

    return {
        value: await calculateStallionScore({ confidence, racing: racingScore, breeding: breedingScore, bloodline: bloodlineScore }),
        confidence,
        racing: racingScore,
        breeding: breedingScore,
    };
}

async function previewStallionScore(id: number): Promise<StallionScore> {
    return getStallionScore(await getHorse(id));
}

async function saveHorse(horse: Horse, batch?: WriteBatch): Promise<number | undefined> {
    if (!horse?.id)
        return;

    const docRef = doc(db, 'horses', `${horse.id}`);
    let _doc: DocumentSnapshot<DocumentData>;

    try {
        _doc = await getDocFromCache(docRef);
    } catch (e: any) {
        if (!e.message.includes('Failed to get document from cache.')) {
            console.error(`%chorses.ts%c     Failed to save horse ${horse.id}: ${e.message}`, 'color:#406e8e;font-weight:bold;', '');
            console.error(e);
            return;
        }

        _doc = await getDocFromServer(docRef)
    }

    if (!_doc.exists()) {
        const { name, sireId, damId, retired }: Horse = await getHorse(horse.id);
        horse.name = name;
        horse.sireId = sireId;
        horse.damId = damId;
        horse.retired = retired;

        if (horse.stallionScore == null)
            horse.stallionScore = <StallionScoreWithLastModified>{ ...await getStallionScore(horse), lastModified: serverTimestamp() };

        console.debug(`%chorses.ts%c     Creating horse ${horse.id}${batch ? ' (batch)' : ''}`, 'color:#406e8e;font-weight:bold;', '');

        if (batch != null)
            batch.set(docRef, { ...horse, lastModified: serverTimestamp() });
        else
            await setDoc(docRef, { ...horse, lastModified: serverTimestamp() });

        if (horse.stallionScore != null)
            return horse.id;
    } else {
        const docData = _doc.data();
        const data: HorseWithLastModified = { id: horse.id, damId: null, };
        (horse.name != null) && (data.name = horse.name.trim());
        (horse.sireId != null) && (data.sireId = horse.sireId);
        (horse.damId != null) && (data.damId = horse.damId);
        (horse.retired != null) && (data.retired = horse.retired);
        (horse.stallionScore != null) && (data.stallionScore = horse.stallionScore);

        const changes = Object.entries(data)
            .filter(([key, value]) => !(key in docData) || JSON.stringify(value) !== JSON.stringify(docData[key]))
            .map(([key]) => key);

        if (changes.length < 1)
            return;

        console.debug(`%chorses.ts%c     Updating horse ${horse.id}${batch ? ' (batch)' : ''}`, 'color:#406e8e;font-weight:bold;', '');

        if (data.stallionScore != null && changes.includes('stallionScore'))
            data.stallionScore!.lastModified = <Timestamp>serverTimestamp();

        if (batch != null)
            batch.update(docRef, { ...data, lastModified: serverTimestamp() });
        else
            await updateDoc(docRef, { ...data, lastModified: serverTimestamp() });

        if (changes.includes('stallionScore'))
            return horse.id;
    }
}

async function saveHorses(horses: Horse[]): Promise<void> {
    if (horses?.length < 1)
        return;

    const _horses = Array.from(horses);
    const updatedIds: number[] = [];
    let chunk: Horse[];

    while ((chunk = _horses.splice(0, 25)) && chunk.length > 0) {
        const batch = writeBatch(db);
        updatedIds.push(...(await Promise.all(chunk.map((horse: Horse) => saveHorse(horse, batch)))).filter(id => id != null));
        await batch.commit();
    }

    if (updatedIds.length > 0) {
        horses = await getHorses();
        const updated: Horse[] = [];

        for (const horse of horses) {
            if (!updatedIds.includes(horse.id!))
                continue;

            horse.stallionScore!.bloodline = await calculateBloodlineScore(horse.id!, horses);
            horse.stallionScore!.value = await calculateStallionScore(horse.stallionScore!);
            updated.push(horse);
        }

        while ((chunk = updated.splice(0, 25)) && chunk.length > 0) {
            const batch = writeBatch(db);
            await Promise.all(chunk.map(horse => saveHorse(horse, batch)));
            await batch.commit();
        }
    }
}

export async function updateStallionScores(): Promise<void> {
    console.debug(`%chorses.ts%c     Updating stallion scores`, 'color:#406e8e;font-weight:bold;', '');

    const horses = await getHorsesWithLastModified();
    const updated: HorseWithLastModified[] = [];
    let chunk: HorseWithLastModified[];

    for (const horse of horses) {
        const lastModified = horse?.stallionScore?.lastModified?.toDate?.() ?? new Date(0);

        if (Date.now() - lastModified.valueOf() < 2419200000)
            continue;

        if (!horse.retired) {
            const info = await getHorse(horse.id!);
            horse.name = info.name;
            horse.sireId = info.sireId;
            horse.damId = info.damId;
            horse.retired = info.retired;
        }

        const { score: breedingScore, confidence } = await calculateBreedingScore(horse.id!);
        horse.stallionScore ??= {};
        horse.stallionScore!.breeding = breedingScore;
        horse.stallionScore!.confidence = confidence;

        if (horse.stallionScore!.racing === undefined)
            horse.stallionScore!.racing = await calculateRacingScore(horse.id!);

        if (updated.push(horse) % 10 === 0)
            await sleep(30000);
    }

    for (const horse of updated) {
        horse.stallionScore!.bloodline = await calculateBloodlineScore(horse.id!, horses);
        horse.stallionScore!.value = await calculateStallionScore(horse.stallionScore!);
    }

    while ((chunk = updated.splice(0, 25)) && chunk.length > 0) {
        const batch = writeBatch(db);
        await Promise.all(chunk.map(horse => saveHorse(horse, batch)));
        await batch.commit();
    }
}

chrome.alarms.onAlarm.addListener(async alarm => {
    switch (alarm.name) {
        case AlarmType.UpdateStallionScores:
            await updateStallionScores();
            break;
    }
});