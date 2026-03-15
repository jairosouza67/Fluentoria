import { db } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { Course } from './types';
import { MINDFUL_FLOW_COLLECTION } from './config';
import { requireAdmin, checkUserAccess } from './admin';
import { getUserCourses } from './userCourses';

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

export const getMindfulFlowsForUser = async (userId: string): Promise<Course[]> => {
    try {
        const { authorized, role } = await checkUserAccess(userId);
        
        // Admin sees all
        if (role === 'admin') {
            return getMindfulFlows();
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
        
        const allFlows = await getMindfulFlows();
        
        // Filter by productId matching user's courses
        return allFlows.filter(flow => {
            const prodId = flow.productId;
            if (!prodId) {
                // Legacy content belongs to the 'default' product
                return activeCourseIds.includes('default');
            }
            return activeCourseIds.includes(String(prodId));
        });
    } catch (error) {
        console.error("Error fetching mindful flows for user:", error);
        return [];
    }
};
