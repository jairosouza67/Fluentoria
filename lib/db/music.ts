import { db } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { Course } from './types';
import { MUSIC_COLLECTION } from './config';
import { requireAdmin, checkUserAccess } from './admin';
import { getUserCourses } from './userCourses';

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
        await requireAdmin();
        const docRef = await addDoc(collection(db, MUSIC_COLLECTION), music);
        return docRef.id;
    } catch (error) {
        console.error("Error adding music:", error);
        return null;
    }
};

export const updateMusic = async (id: string, updates: Partial<Course>): Promise<boolean> => {
    try {
        await requireAdmin();
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
        await requireAdmin();
        const docRef = doc(db, MUSIC_COLLECTION, id);
        await deleteDoc(docRef);
        return true;
    } catch (error) {
        console.error("Error deleting music:", error);
        return false;
    }
};

export const getMusicForUser = async (userId: string): Promise<Course[]> => {
    try {
        const { authorized, role } = await checkUserAccess(userId);
        
        // Admin sees all
        if (role === 'admin') {
            return getMusic();
        }
        
        // Not authorized = no content
        if (!authorized) return [];

        // Get user's assigned courses
        const userCourses = await getUserCourses(userId);
        const activeCourseIds = userCourses
            .filter(uc => uc.status === 'active')
            .map(uc => uc.courseId);
        
        // No courses assigned = show nothing
        if (activeCourseIds.length === 0) {
            return [];
        }
        
        const allMusic = await getMusic();
        
        // Filter by productId matching user's courses
        return allMusic.filter(m => {
            const prodId = m.productId;
            if (!prodId) {
                // Legacy content belongs to the 'default' product
                return activeCourseIds.includes('default');
            }
            return activeCourseIds.includes(String(prodId));
        });
    } catch (error) {
        console.error("Error fetching music for user:", error);
        return [];
    }
};
