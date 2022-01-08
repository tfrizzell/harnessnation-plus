import { clearIndexedDbPersistence, enableIndexedDbPersistence, getFirestore, terminate } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js';
import { firebase } from './firebase.js';

export async function clearCache(firestore) {
    await terminate(firestore);
    await clearIndexedDbPersistence(firestore);
};

export async function connect() {
    const firestore = getFirestore(firebase);
    await enableIndexedDbPersistence(firestore, { forceOwnership: true });
    return firestore;
};

export const firestore = await connect();