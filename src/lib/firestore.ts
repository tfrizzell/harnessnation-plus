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
        await terminate(firestoreInstance);
        firestoreInstance = null;
    }
}

export function reinitializeFirestore(): Firestore {
    try {
        firestoreInstance = initializeFirestore(firebase, {
            localCache: persistentLocalCache({
                tabManager: persistentMultipleTabManager(),
            }),
        });
    } catch {
        firestoreInstance = getFirestore(firebase);
    }

    return firestoreInstance;
}

export function singleton(): Firestore {
    if (!firestoreInstance)
        return reinitializeFirestore();

    return firestoreInstance;
}