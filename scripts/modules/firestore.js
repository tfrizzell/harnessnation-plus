import { enableIndexedDbPersistence, getFirestore } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js';
import { firebase } from './firebase.js';

export const firestore = getFirestore(firebase);
enableIndexedDbPersistence(firestore, { forceOwnership: true });