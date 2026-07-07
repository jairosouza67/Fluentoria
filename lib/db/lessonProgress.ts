import { db } from '../firebase';
import { collection, doc, getDoc, getDocs, query, where, setDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { CourseLessonProgress, Course } from './types';
import { LESSON_PROGRESS_COLLECTION } from './config';

const buildDocId = (studentId: string, courseId: string): string => `${studentId}_${courseId}`;

export const getLessonProgress = async (
    studentId: string,
    courseId: string
): Promise<CourseLessonProgress | null> => {
    try {
        const docRef = doc(db, LESSON_PROGRESS_COLLECTION, buildDocId(studentId, courseId));
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) return null;

        const data = docSnap.data();
        return {
            ...data,
            updatedAt: data.updatedAt?.toDate(),
        } as CourseLessonProgress;
    } catch (error) {
        console.error("Error fetching lesson progress:", error);
        return null;
    }
};

export const getAllLessonProgress = async (
    studentId: string
): Promise<CourseLessonProgress[]> => {
    try {
        const q = query(
            collection(db, LESSON_PROGRESS_COLLECTION),
            where('studentId', '==', studentId)
        );
        const snap = await getDocs(q);
        return snap.docs.map(d => {
            const data = d.data();
            return { ...data, updatedAt: data.updatedAt?.toDate() } as CourseLessonProgress;
        });
    } catch (error) {
        console.error("Error fetching all lesson progress:", error);
        return [];
    }
};

export const toggleLessonComplete = async (
    studentId: string,
    courseId: string,
    lessonId: string,
    completed: boolean
): Promise<boolean> => {
    try {
        const docRef = doc(db, LESSON_PROGRESS_COLLECTION, buildDocId(studentId, courseId));
        await setDoc(docRef, {
            studentId,
            courseId,
            completedLessonIds: completed
                ? arrayUnion(lessonId)
                : arrayRemove(lessonId),
            updatedAt: new Date(),
        }, { merge: true });
        return completed;
    } catch (error) {
        console.error("Error toggling lesson complete:", error);
        return false;
    }
};

export const setLastLesson = async (
    studentId: string,
    courseId: string,
    lessonId: string,
    galleryId?: string,
    moduleId?: string
): Promise<void> => {
    try {
        const docRef = doc(db, LESSON_PROGRESS_COLLECTION, buildDocId(studentId, courseId));
        await setDoc(docRef, {
            studentId,
            courseId,
            lastLessonId: lessonId,
            lastGalleryId: galleryId ?? null,
            lastModuleId: moduleId ?? null,
            updatedAt: new Date(),
        }, { merge: true });
    } catch (error) {
        console.error("Error setting last lesson:", error);
    }
};

export const countLessons = (course: Course): number => {
    if (course.galleries && course.galleries.length > 0) {
        return course.galleries.reduce(
            (acc, g) => acc + (g.modules?.reduce(
                (accM, m) => accM + (m.lessons?.length || 0), 0
            ) || 0),
            0
        );
    }
    if (course.modules && course.modules.length > 0) {
        return course.modules.reduce(
            (acc, m) => acc + (m.lessons?.length || 0), 0
        );
    }
    return course.videoUrl ? 1 : 0;
};