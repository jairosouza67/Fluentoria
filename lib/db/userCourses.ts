import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { USER_COURSES_COLLECTION } from './config';
import { UserCourse } from './types';
import { requireAdmin } from './admin';

export const getUserCourses = async (userId: string): Promise<UserCourse[]> => {
    try {
        const userCoursesRef = collection(db, USER_COURSES_COLLECTION);
        const q = query(userCoursesRef, where('userId', '==', userId));
        const querySnapshot = await getDocs(q);
        
        const courses: UserCourse[] = [];
        querySnapshot.forEach((doc) => {
            courses.push({ id: doc.id, ...doc.data() } as UserCourse);
        });
        
        return courses;
    } catch (error) {
        console.error("Error getting user courses:", error);
        return [];
    }
};

export const grantCourseAccess = async (
    userId: string, 
    courseId: string, 
    source: 'asaas' | 'manual', 
    asaasPaymentId?: string
): Promise<string | null> => {
    try {
        // Only admins can grant access (except for asaas webhook which uses admin SDK)
        if (source === 'manual') {
            await requireAdmin();
        }
        
        // Check if already has access
        const userCoursesRef = collection(db, USER_COURSES_COLLECTION);
        const q = query(userCoursesRef, where('userId', '==', userId), where('courseId', '==', courseId));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            // Already has this course, maybe update status/source if needed
            const existingDoc = querySnapshot.docs[0];
            await updateDoc(doc(db, USER_COURSES_COLLECTION, existingDoc.id), {
                status: 'active',
                source,
                ...(asaasPaymentId && { asaasPaymentId })
            });
            return existingDoc.id;
        }

        const newCourseData = {
            userId,
            courseId,
            status: 'active',
            purchaseDate: new Date(),
            source,
            ...(asaasPaymentId && { asaasPaymentId })
        };

        const docRef = await addDoc(userCoursesRef, newCourseData);
        return docRef.id;
    } catch (error) {
        console.error("Error granting course access:", error);
        return null;
    }
};

export const revokeCourseAccess = async (userId: string, courseId: string): Promise<boolean> => {
    try {
        await requireAdmin();
        const userCoursesRef = collection(db, USER_COURSES_COLLECTION);
        const q = query(userCoursesRef, where('userId', '==', userId), where('courseId', '==', courseId));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            const docId = querySnapshot.docs[0].id;
            await deleteDoc(doc(db, USER_COURSES_COLLECTION, docId));
            return true;
        }
        return false;
    } catch (error) {
        console.error("Error revoking course access:", error);
        return false;
    }
};

export const hasAnyCourseAccess = async (userId: string): Promise<boolean> => {
    try {
        const userCoursesRef = collection(db, USER_COURSES_COLLECTION);
        const q = query(userCoursesRef, where('userId', '==', userId), where('status', '==', 'active'));
        const querySnapshot = await getDocs(q);
        return !querySnapshot.empty;
    } catch (error) {
        console.error("Error checking course access:", error);
        return false;
    }
};

export const hasCourseAccess = async (userId: string, courseId: string): Promise<boolean> => {
    try {
        const userCoursesRef = collection(db, USER_COURSES_COLLECTION);
        const q = query(userCoursesRef, where('userId', '==', userId), where('courseId', '==', courseId), where('status', '==', 'active'));
        const querySnapshot = await getDocs(q);
        return !querySnapshot.empty;
    } catch (error) {
        console.error("Error checking specific course access:", error);
        return false;
    }
};
