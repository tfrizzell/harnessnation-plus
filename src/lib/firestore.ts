self.window = self;

import { FirebaseApp, initializeApp } from './firebasejs/firebase-app.js';
import { clearIndexedDbPersistence, enableIndexedDbPersistence, Firestore, getFirestore as initFirestore, terminate } from './firebasejs/firebase-firestore.js';

const firebase: FirebaseApp = initializeApp({
    apiKey: 'AIzaSyDKTO4YNgByizsu7px3a81-F-1BKkHoXYY',
    authDomain: 'harnessnation-plus.firebaseapp.com',
    projectId: 'harnessnation-plus',
    storageBucket: 'harnessnation-plus.appspot.com',
    messagingSenderId: '361661653814',
    appId: '1:361661653814:web:75feba30eb32b86f0d8997'
});

export async function clearCache(firestore: Firestore): Promise<void> {
    await terminate(firestore);
    await clearIndexedDbPersistence(firestore);
}

export async function connect(): Promise<Firestore> {
    const firestore: Firestore = initFirestore(firebase);
    await enableIndexedDbPersistence(firestore, { forceOwnership: true });
    return firestore;
}

const firestore: Firestore = initFirestore(firebase);
enableIndexedDbPersistence(firestore, { forceOwnership: true });

export function singleton(): Firestore {
    return firestore;
}