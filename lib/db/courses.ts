import { db } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { Course } from './types';
import { COURSES_COLLECTION } from './config';
import { requireAdmin, checkUserAccess } from './admin';
import { getUserCourses } from './userCourses';

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
        await requireAdmin();
        const docRef = await addDoc(collection(db, COURSES_COLLECTION), course);
        return docRef.id;
    } catch (error) {
        console.error("Error adding course:", error);
        return null;
    }
};

export const updateCourse = async (id: string, updates: Partial<Course>): Promise<boolean> => {
    try {
        await requireAdmin();
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
        await requireAdmin();
        const docRef = doc(db, COURSES_COLLECTION, id);
        await deleteDoc(docRef);
        return true;
    } catch (error) {
        console.error("Error deleting course:", error);
        return false;
    }
};

export const getCoursesForUser = async (userId: string): Promise<Course[]> => {
    try {
        const { authorized, role } = await checkUserAccess(userId);
        
        // Admin sees all courses
        if (role === 'admin') {
            return getCourses();
        }
        
        // Not authorized = no courses
        if (!authorized) return [];

        // Get user's assigned courses
        const userCourses = await getUserCourses(userId);
        const activeCourseIds = userCourses
            .filter(uc => uc.status === 'active')
            .map(uc => uc.courseId);
        
        // No courses assigned = show nothing (user needs to be granted access)
        if (activeCourseIds.length === 0) {
            return [];
        }
        
        const allCourses = await getCourses();
        
        // Filter courses by user's assigned course IDs
        return allCourses.filter(c => {
            const courseId = c.id;
            if (courseId && activeCourseIds.includes(courseId)) {
                return true;
            }

            const productId = c.productId;
            if (productId && activeCourseIds.includes(String(productId))) {
                return true;
            }

            return false;
        });
    } catch (error) {
        console.error("Error fetching courses for user:", error);
        return [];
    }
};
