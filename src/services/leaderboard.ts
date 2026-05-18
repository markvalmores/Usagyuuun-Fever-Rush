import { collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { db, auth, signInPlayer } from '../firebase';

export interface ScoreEntry {
    id?: string;
    playerName: string;
    score: number;
    distance: number;
    timestamp?: any;
    uid?: string;
}

export const submitScore = async (playerName: string, score: number, distance: number) => {
    // Always save locally
    const localScores = JSON.parse(localStorage.getItem('local_scores') || '[]');
    localScores.push({ playerName, score, distance, timestamp: Date.now() });
    localScores.sort((a: any, b: any) => b.score - a.score);
    localStorage.setItem('local_scores', JSON.stringify(localScores.slice(0, 10)));

    let user = auth.currentUser;
    if (!user) {
        try {
            user = await signInPlayer();
        } catch (e) {
            console.log("Offline or auth failed, score saved locally.");
            return;
        }
    }
    if (!user) return;

    try {
        await addDoc(collection(db, 'leaderboard'), {
            playerName,
            score,
            distance,
            timestamp: serverTimestamp(),
            uid: user.uid
        });
    } catch (e) {
        console.error("Error submitting score to Firestore", e);
    }
};

export const fetchLeaderboard = async (): Promise<ScoreEntry[]> => {
    const localScores = JSON.parse(localStorage.getItem('local_scores') || '[]');
    
    try {
        const q = query(
            collection(db, 'leaderboard'),
            orderBy('score', 'desc'),
            limit(10)
        );
        const querySnapshot = await getDocs(q);
        const firestoreScores = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...(doc.data() as ScoreEntry)
        }));
        
        // Merge and sort
        const combined = [...firestoreScores, ...localScores];
        combined.sort((a: any, b: any) => b.score - a.score);
        return combined.slice(0, 10);
    } catch (e) {
        console.error("Error fetching leaderboard from Firestore, returning local only", e);
        return localScores;
    }
};
