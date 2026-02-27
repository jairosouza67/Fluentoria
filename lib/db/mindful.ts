import { db } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { Course } from './types';
import { MINDFUL_FLOW_COLLECTION } from './config';
import { requireAdmin } from './admin';

export const getMindfulFlows = async (): Promise<Course[]> => {
    try {
        const q = query(collection(db, MINDFUL_FLOW_COLLECTION), orderBy('title'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
    } catch (error) {
        console.error("Error fetching mindful flows:", error);
        return [];
    }
};

export const addMindfulFlow = async (flow: Course): Promise<string | null> => {
    try {
        await requireAdmin();
        const docRef = await addDoc(collection(db, MINDFUL_FLOW_COLLECTION), flow);
        return docRef.id;
    } catch (error) {
        console.error("Error adding mindful flow:", error);
        return null;
    }
};

export const updateMindfulFlow = async (id: string, updates: Partial<Course>): Promise<boolean> => {
    try {
        await requireAdmin();
        const docRef = doc(db, MINDFUL_FLOW_COLLECTION, id);
        await updateDoc(docRef, updates);
        return true;
    } catch (error) {
        console.error("Error updating mindful flow:", error);
        return false;
    }
};

export const deleteMindfulFlow = async (id: string): Promise<boolean> => {
    try {
        await requireAdmin();
        const docRef = doc(db, MINDFUL_FLOW_COLLECTION, id);
        await deleteDoc(docRef);
        return true;
    } catch (error) {
        console.error("Error deleting mindful flow:", error);
        return false;
    }
};
