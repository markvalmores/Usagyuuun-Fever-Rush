import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Simple anonymous sign-in for leaderboards
export const signInPlayer = async () => {
    // try {
    //     const result = await signInAnonymously(auth);
    //     return result.user;
    // } catch (e) {
    //     console.error("Anonymous auth failed", e);
    // }
    return null;
};
