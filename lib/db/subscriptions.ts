import { db } from '../firebase';
import { collection, query, onSnapshot, where, orderBy, limit, getDoc, doc } from 'firebase/firestore';
import { Course } from './types';
import { COURSES_COLLECTION, STUDENT_COMPLETIONS_COLLECTION, USERS_COLLECTION } from './config';

export const subscribeToStudents = (callback: (count: number) => void): (() => void) => {
    const q = query(collection(db, USERS_COLLECTION));
    return onSnapshot(q, (snapshot) => {
        callback(snapshot.size);
    }, (error) => {
        console.error("Error subscribing to students:", error);
    });
};

export const subscribeToCourses = (callback: (count: number, courses: Course[]) => void): (() => void) => {
    const q = query(collection(db, COURSES_COLLECTION));
    return onSnapshot(q, (snapshot) => {
        const courses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
        callback(snapshot.size, courses);
    }, (error) => {
        console.error("Error subscribing to courses:", error);
    });
};

export const subscribeToRecentCompletions = (limitCount: number, callback: (completions: any[]) => void): (() => void) => {
    const q = query(
        collection(db, STUDENT_COMPLETIONS_COLLECTION),
        where('completed', '==', true),
        orderBy('completedAt', 'desc'),
        limit(limitCount)
    );

    return onSnapshot(q, async (snapshot) => {
        const completions = await Promise.all(snapshot.docs.map(async (docSnap) => {
            const data = docSnap.data();

            let studentName = 'Aluno';
            if (data.studentId) {
                try {
                    const userDoc = await getDoc(doc(db, USERS_COLLECTION, data.studentId));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        studentName = userData.displayName || userData.name || 'Aluno';
                    }
                } catch (e) {
                    console.error("Error fetching student details for completion:", e);
                }
            }

            let contentTitle = 'Conteúdo';
            if (data.contentId && data.contentType === 'course') {
                try {
                    const courseDoc = await getDoc(doc(db, COURSES_COLLECTION, data.contentId));
                    if (courseDoc.exists()) {
                        contentTitle = courseDoc.data().title;
                    }
                } catch (e) { }
            }

            return {
                id: docSnap.id,
                ...data,
                studentName,
                contentTitle,
                completedAt: data.completedAt?.toDate()
            };
        }));

        callback(completions);
    }, (error) => {
        console.error("Error subscribing to completions:", error);
    });
};

export const subscribeToAllCompletions = (limitCount: number, callback: (completions: any[]) => void): (() => void) => {
    const q = query(
        collection(db, STUDENT_COMPLETIONS_COLLECTION),
        where('completed', '==', true),
        orderBy('completedAt', 'desc'),
        limit(limitCount)
    );

    return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({
            ...doc.data(),
            completedAt: doc.data().completedAt?.toDate()
        }));
        callback(data);
    }, (error) => {
        console.error("Error subscribing to all completions:", error);
    });
};
