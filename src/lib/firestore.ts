import { initializeApp } from '../vendor/firebasejs/firebase-app.js';
import {
    Firestore,
    getFirestore,
    initializeFirestore,
    persistentLocalCache,
    persistentMultipleTabManager,
    terminate,
} from '../vendor/firebasejs/firebase-firestore.js';

try { self.window = self; } catch { }

const firebase = initializeApp({
    apiKey: '',
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
                tabManager: persistentMultipleTabManager(),
            }),
        });
    } catch (error: unknown) {
        console.warn(`%cfirestore.ts%c     Failed to initialize Firestore, falling back to existing instance`, 'color:#406e8e;font-weight:bold;', '');
        firestoreInstance = getFirestore(firebase);
    }

    return firestoreInstance;
}

export function singleton(): Firestore {
    if (!firestoreInstance)
        return reinitializeFirestore();

    return firestoreInstance;
}