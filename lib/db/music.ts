import { db } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { Course } from './types';
import { MUSIC_COLLECTION } from './config';

export const getMusic = async (): Promise<Course[]> => {
    try {
        const q = query(collection(db, MUSIC_COLLECTION), orderBy('title'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
    } catch (error) {
        console.error("Error fetching music:", error);
        return [];
    }
};

export const addMusic = async (music: Course): Promise<string | null> => {
    try {
        const docRef = await addDoc(collection(db, MUSIC_COLLECTION), music);
        return docRef.id;
    } catch (error) {
        console.error("Error adding music:", error);
        return null;
    }
};

export const updateMusic = async (id: string, updates: Partial<Course>): Promise<boolean> => {
    try {
        const docRef = doc(db, MUSIC_COLLECTION, id);
        await updateDoc(docRef, updates);
        return true;
    } catch (error) {
        console.error("Error updating music:", error);
        return false;
    }
};

export const deleteMusic = async (id: string): Promise<boolean> => {
    try {
        const docRef = doc(db, MUSIC_COLLECTION, id);
        await deleteDoc(docRef);
        return true;
    } catch (error) {
        console.error("Error deleting music:", error);
        return false;
    }
};
