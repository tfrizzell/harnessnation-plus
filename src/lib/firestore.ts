import { initializeApp } from '../vendor/firebasejs/firebase-app.js';
import {
    Firestore,
    getFirestore,
    initializeFirestore,
    persistentLocalCache,
    persistentSingleTabManager,
    terminate,
} from '../vendor/firebasejs/firebase-firestore.js';

try { self.window = self; } catch { /* Do nothing */ }

const firebase = initializeApp({
    apiKey: 'AIzaSyDKTO4YNgByizsu7px3a81-F-1BKkHoXYY',
    authDomain: 'harnessnation-plus.firebaseapp.com',
    projectId: 'harnessnation-plus',
    storageBucket: 'harnessnation-plus.appspot.com',
    messagingSenderId: '361661653814',
    appId: '1:361661653814:web:75feba30eb32b86f0d8997'
});

let firestoreInstance: Firestore | null;

export async function clearCache(): Promise<void> {
    if (firestoreInstance) {
        const firestore = firestoreInstance;
        firestoreInstance = null;
        await terminate(firestore);
    }
}

export function reinitializeFirestore(): Firestore {
    try {
        firestoreInstance = initializeFirestore(firebase, {
            localCache: persistentLocalCache({
                tabManager: persistentSingleTabManager({ forceOwnership: true }) ,
            }),
        });
    } catch (e: unknown) {
        console.groupCollapsed(`%cfirestore.ts%c     Failed to initialize Firestore, falling back to existing instance`, 'color:#406e8e;font-weight:bold;', '');

        if (e instanceof Error) {
            console.warn('Message:', e.message);
            console.warn('Stack Trace:', e);
        } else
            console.warn('Unknown Error:', e);

        console.groupEnd();
        firestoreInstance = getFirestore(firebase);
    }

    return firestoreInstance;
}

export function singleton(): Firestore {
    if (!firestoreInstance)
        return reinitializeFirestore();

    return firestoreInstance;
}