import { db } from './firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';

export interface Course {
    id?: string;
    title: string;
    author: string;
    duration: string;
    launchDate?: string;
    type: 'video' | 'audio' | 'pdf';
    progress: number;
    thumbnail: string;
    description?: string;
    videoUrl?: string;
}

export interface DailyContact {
    id?: string;
    title: string;
    author: string;
    duration: string;
    date: string;
    type: 'video' | 'audio' | 'pdf';
    thumbnail: string;
    description?: string;
    videoUrl?: string;
    viewed?: boolean;
}

const COURSES_COLLECTION = 'courses';
const DAILY_CONTACTS_COLLECTION = 'daily_contacts';
const MINDFUL_FLOW_COLLECTION = 'mindful_flow';
const MUSIC_COLLECTION = 'music';

export const getCourses = async (): Promise<Course[]> => {
    try {
        const q = query(collection(db, COURSES_COLLECTION), orderBy('title'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
    } catch (error) {
        console.error("Error fetching courses:", error);
        return [];
    }
};

export const addCourse = async (course: Course): Promise<string | null> => {
    try {
        const docRef = await addDoc(collection(db, COURSES_COLLECTION), course);
        return docRef.id;
    } catch (error) {
        console.error("Error adding course:", error);
        return null;
    }
};

export const updateCourse = async (id: string, updates: Partial<Course>): Promise<boolean> => {
    try {
        const docRef = doc(db, COURSES_COLLECTION, id);
        await updateDoc(docRef, updates);
        return true;
    } catch (error) {
        console.error("Error updating course:", error);
        return false;
    }
};

export const deleteCourse = async (id: string): Promise<boolean> => {
    try {
        const docRef = doc(db, COURSES_COLLECTION, id);
        await deleteDoc(docRef);
        return true;
    } catch (error) {
        console.error("Error deleting course:", error);
        return false;
    }
};

// Mindful Flow Functions
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
        const docRef = await addDoc(collection(db, MINDFUL_FLOW_COLLECTION), flow);
        return docRef.id;
    } catch (error) {
        console.error("Error adding mindful flow:", error);
        return null;
    }
};

export const updateMindfulFlow = async (id: string, updates: Partial<Course>): Promise<boolean> => {
    try {
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
        const docRef = doc(db, MINDFUL_FLOW_COLLECTION, id);
        await deleteDoc(docRef);
        return true;
    } catch (error) {
        console.error("Error deleting mindful flow:", error);
        return false;
    }
};

// Music Functions
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

// Daily Contacts Functions
export const getDailyContacts = async (): Promise<DailyContact[]> => {
    try {
        const q = query(collection(db, DAILY_CONTACTS_COLLECTION), orderBy('date', 'desc'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DailyContact));
    } catch (error) {
        console.error("Error fetching daily contacts:", error);
        return [];
    }
};

export const addDailyContact = async (dailyContact: DailyContact): Promise<string | null> => {
    try {
        const docRef = await addDoc(collection(db, DAILY_CONTACTS_COLLECTION), dailyContact);
        return docRef.id;
    } catch (error) {
        console.error("Error adding daily contact:", error);
        return null;
    }
};

export const updateDailyContact = async (id: string, updates: Partial<DailyContact>): Promise<boolean> => {
    try {
        const docRef = doc(db, DAILY_CONTACTS_COLLECTION, id);
        await updateDoc(docRef, updates);
        return true;
    } catch (error) {
        console.error("Error updating daily contact:", error);
        return false;
    }
};

export const deleteDailyContact = async (id: string): Promise<boolean> => {
    try {
        const docRef = doc(db, DAILY_CONTACTS_COLLECTION, id);
        await deleteDoc(docRef);
        return true;
    } catch (error) {
        console.error("Error deleting daily contact:", error);
        return false;
    }
};
