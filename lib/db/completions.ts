import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { StudentCompletion } from './types';
import { STUDENT_COMPLETIONS_COLLECTION } from './config';

export const getStudentCompletion = async (
    studentId: string,
    contentId: string,
    contentType: 'course' | 'mindful' | 'music'
): Promise<StudentCompletion | null> => {
    try {
        const completionId = `${studentId}_${contentType}_${contentId}`;
        const docRef = doc(db, STUDENT_COMPLETIONS_COLLECTION, completionId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            return {
                ...data,
                completedAt: data.completedAt?.toDate(),
            } as StudentCompletion;
        }

        return null;
    } catch (error) {
        console.error("Error fetching student completion:", error);
        return null;
    }
};

export const markContentComplete = async (
    studentId: string,
    contentId: string,
    contentType: 'course' | 'mindful' | 'music',
    completed: boolean
): Promise<boolean> => {
    try {
        const completionId = `${studentId}_${contentType}_${contentId}`;
        const docRef = doc(db, STUDENT_COMPLETIONS_COLLECTION, completionId);

        const completionData: StudentCompletion = {
            studentId,
            contentId,
            contentType,
            completed,
            completedAt: completed ? new Date() : undefined,
        };

        await setDoc(docRef, completionData);
        return true;
    } catch (error) {
        console.error("Error marking content complete:", error);
        return false;
    }
};
