import { timestamp } from '../../lib/func.js';
import { generateBreedingReport } from '../../lib/reporting.js';

import * as firestore from '../../lib/firestore.js';
let db = firestore.firestore;

import {
    collection,
    doc,
    getDocFromCache,
    getDocFromServer,
    getDocsFromCache,
    getDocsFromServer,
    limit,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    where,
    writeBatch
} from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js';

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    switch (request?.action) {
        case 'BREEDING_REPORT': downloadBreedingReport(request.data.ids, request.data).then(sendResponse); break;
        case 'CLEAR_HORSE_CACHE': clearCache().then(sendResponse); break;
        case 'GET_HORSES': getHorses().then(sendResponse); break;
        case 'SAVE_HORSES': saveHorses(request.data.horses).then(sendResponse); break;
        default: return;
    }

    return true;
});

async function clearCache() {
    await firestore.clearCache(db);
    db = await firestore.connect();
}

function downloadBreedingReport(ids, { filename, headers } = {}) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get('breeding.export', ({ 'breeding.export': exportRunning }) => {
            if (exportRunning)
                return reject('A breeding report is already running. Please wait for it to finish before starting a new one.');

            chrome.storage.local.set({ 'breeding.export': true }, async () => {
                try {
                    const dl = document.createElement('a');
                    dl.setAttribute('href', await generateBreedingReport(ids, headers));
                    dl.setAttribute('download', `${(filename ?? 'hn-plus-breeding-report-${timestamp}.csv').replace(/\.[^\.]+$/, '').replace('${timestamp}', timestamp().replace(/\D/g, ''))}.csv`);
                    dl.click();
                } finally {
                    chrome.storage.local.remove('breeding.export', () => resolve());
                }
            })
        });
    });
}

async function fetchHorseInfo(id) {
    const html = await fetch(`https://www.harnessnation.com/horse/${id}`).then(res => res.text());

    return {
        sireId: +html?.match(/<b[^>]*>\s*Sire:\s*<\/b[^>]*>\s*<a[^>]*horse\/(\d+)[^>]*>/is)?.[1] || null,
        damId: +html?.match(/<b[^>]*>\s*Sire:\s*<\/b[^>]*>\s*<a[^>]*horse\/(\d+)[^>]*>/is)?.[1] || null,
        retired: !!html?.match(/<br[^>]*>\s*<br[^>]*>\s*Retired\s*<br[^>]>/is)?.[1],
    };
}

export async function getHorses() {
    const colRef = collection(db, 'horses');
    const qLastModified = query(colRef, orderBy('lastModified', 'desc'), limit(1));
    const qsLastModified = await getDocsFromCache(qLastModified);
    const lastModified = qsLastModified?.docs?.[0]?.data()?.lastModified?.toDate() ?? new Date(0);

    const qRemote = query(colRef, where('lastModified', '>', lastModified));
    const qsRemote = await getDocsFromServer(qRemote);
    qsRemote.size && console.debug(`%chorses.js%c     Fetched ${qsRemote.size} new horse record${qsRemote.size === 1 ? 's' : ''} from firestore`, 'color:#406e8e;font-weight:bold;', '');

    const querySnapshot = await getDocsFromCache(colRef);
    const horses = [];

    querySnapshot.forEach(doc => {
        const { lastModified, ...horse } = doc.data();
        horses.push(horse);
    });

    return horses;
}

async function saveHorse(horse, batch) {
    if (!horse?.id)
        return;

    const docRef = doc(db, 'horses', `${horse.id}`);
    let _doc;

    try {
        _doc = await getDocFromCache(docRef);
    } catch (e) {
        if (!e.message.includes('Failed to get document from cache.')) {
            console.error(`%chorses.js%c     Failed to save horse ${s.id}: ${e.message}`, 'color:#406e8e;font-weight:bold;', '');
            return;
        }

        _doc = await getDocFromServer(docRef)
    }

    if (!_doc.exists()) {
        const { sireId, retired } = await fetchHorseInfo(horse.id);
        horse.sireId = sireId;
        horse.retired = retired;

        console.debug(`%chorses.js%c     Creating horse ${horse.id}${batch ? ' (batch)' : ''}`, 'color:#406e8e;font-weight:bold;', '');
        batch ? batch.set(docRef, { ...horse, lastModified: serverTimestamp() })
            : await setDoc(docRef, { ...horse, lastModified: serverTimestamp() });
    } else {
        const docData = _doc.data();
        const data = { id: horse.id, name: horse.name };
        (horse.sireId != null) && (data.sireId = horse.sireId);
        (horse.retired != null) && (data.retired = horse.retired);

        if (!Object.entries(data).find(([key, value]) => !(key in docData) || value !== docData[key]))
            return;

        console.debug(`%chorses.js%c     Updating horse ${horse.id}${batch ? ' (batch)' : ''}`, 'color:#406e8e;font-weight:bold;', '');
        batch ? batch.update(docRef, { ...data, lastModified: serverTimestamp() })
            : await updateDoc(docRef, { ...data, lastModified: serverTimestamp() });
    }
}

async function saveHorses(horses) {
    if (horses?.length < 1)
        return;

    let chunk;

    while ((chunk = horses.splice(0, 100)) && chunk.length > 0) {
        const batch = writeBatch(db);
        await Promise.all(chunk.map(horse => saveHorse(horse, batch)));
        await batch.commit();
    }
}