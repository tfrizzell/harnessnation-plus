import { initializeApp } from './firebasejs/firebase-app.js';
import { clearIndexedDbPersistence, enableIndexedDbPersistence, getFirestore, terminate } from './firebasejs/firebase-firestore.js';

const firebase = initializeApp({
    apiKey: 'AIzaSyDKTO4YNgByizsu7px3a81-F-1BKkHoXYY',
    authDomain: 'harnessnation-plus.firebaseapp.com',
    projectId: 'harnessnation-plus',
    storageBucket: 'harnessnation-plus.appspot.com',
    messagingSenderId: '361661653814',
    appId: '1:361661653814:web:75feba30eb32b86f0d8997'
});

export const firestore = await connect();

export async function clearCache(firestore) {
    await terminate(firestore);
    await clearIndexedDbPersistence(firestore);
}

export async function connect() {
    const firestore = getFirestore(firebase);
    await enableIndexedDbPersistence(firestore, { forceOwnership: true });
    return firestore;
}