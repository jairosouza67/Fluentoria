import { db } from './firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, getDoc, setDoc, where, onSnapshot, limit } from 'firebase/firestore';

export interface CourseLesson {
    id: string;
    title: string;
    duration: string;
    videoUrl?: string;
    type: 'video' | 'audio' | 'pdf';
    description?: string;
}

export interface CourseModule {
    id: string;
    title: string;
    lessons: CourseLesson[];
}

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
    modules?: CourseModule[];
    coverImage?: string;
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
const STUDENT_COMPLETIONS_COLLECTION = 'student_completions';

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

// Student Completion Tracking
export interface StudentCompletion {
    studentId: string;
    contentId: string;
    contentType: 'course' | 'daily' | 'mindful' | 'music';
    completed: boolean;
    completedAt?: Date;
}

export const getStudentCompletion = async (
    studentId: string,
    contentId: string,
    contentType: 'course' | 'daily' | 'mindful' | 'music'
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
    contentType: 'course' | 'daily' | 'mindful' | 'music',
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

// Students Functions
export interface Student {
    id: string;
    name: string;
    email: string;
    photoURL?: string;
    createdAt?: Date;
    // Financial Data
    planType?: 'monthly' | 'annual' | 'lifetime';
    planStatus?: 'active' | 'expired' | 'pending';
    planStartDate?: Date;
    planEndDate?: Date;
    planValue?: number;
}

export const getAllStudents = async (): Promise<Student[]> => {
    try {
        const querySnapshot = await getDocs(collection(db, 'users'));

        const students = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data.name || data.displayName || 'Unknown',
                email: data.email || '',
                photoURL: data.photoURL,
                createdAt: data.createdAt?.toDate(),
            } as Student;
        });

        console.log('📂 DB - getAllStudents: Found', students.length, 'users in database');

        // Sort by name (client-side to avoid index requirement)
        students.sort((a, b) => a.name.localeCompare(b.name));

        return students;
    } catch (error) {
        console.error("Error fetching students:", error);
        return [];
    }
};

export const addStudent = async (name: string, email: string, photoURL?: string): Promise<string | null> => {
    try {
        const studentData = {
            name,
            email: email.toLowerCase(),
            displayName: name,
            photoURL: photoURL || '',
            createdAt: new Date(),
            role: 'student',
        };

        const docRef = await addDoc(collection(db, 'users'), studentData);
        console.log('Student added successfully:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error("Error adding student:", error);
        return null;
    }
};

export const updateStudent = async (id: string, updates: Partial<Student>): Promise<boolean> => {
    try {
        const docRef = doc(db, 'users', id);
        await updateDoc(docRef, updates as any);
        return true;
    } catch (error) {
        console.error("Error updating student:", error);
        return false;
    }
};

export const deleteStudent = async (id: string): Promise<boolean> => {
    try {
        const docRef = doc(db, 'users', id);
        await deleteDoc(docRef);
        return true;
    } catch (error) {
        console.error("Error deleting student:", error);
        return false;
    }
};

// Check if student exists by email and merge Google user data
export const findAndMergeStudentByEmail = async (email: string, googleUserData: any): Promise<boolean> => {
    try {
        const emailLower = email.toLowerCase();
        const q = query(collection(db, 'users'), where('email', '==', emailLower));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            // Student with this email already exists
            const studentDoc = querySnapshot.docs[0];
            const studentData = studentDoc.data();

            // Merge Google user data with existing student record
            const updates: any = {
                displayName: googleUserData.displayName || studentData.name,
                photoURL: googleUserData.photoURL || studentData.photoURL || '',
                lastLogin: new Date(),
            };

            // If student didn't have a name, use Google's
            if (!studentData.name && googleUserData.displayName) {
                updates.name = googleUserData.displayName;
            }

            await updateDoc(doc(db, 'users', studentDoc.id), updates);
            console.log('Merged Google user with existing student:', studentDoc.id);
            return true;
        }

        return false;
    } catch (error) {
        console.error("Error finding/merging student:", error);
        return false;
    }
};

// Create user in Firestore if doesn't exist
export const createOrUpdateUser = async (uid: string, userData: any): Promise<void> => {
    try {
        const userRef = doc(db, 'users', uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            // Check if a student with this email was manually added
            const merged = await findAndMergeStudentByEmail(userData.email, userData);

            if (!merged) {
                // Determine role: only specific email is admin, all others are students
                const role = userData.email === 'jairosouza67@gmail.com' ? 'admin' : 'student';

                // No existing student, create new user
                await setDoc(userRef, {
                    name: userData.displayName || '',
                    displayName: userData.displayName || '',
                    email: userData.email.toLowerCase(),
                    photoURL: userData.photoURL || '',
                    createdAt: new Date(),
                    lastLogin: new Date(),
                    role: role,
                });
                console.log('Created new user with role:', role);
            }
        } else {
            // Update last login
            await updateDoc(userRef, {
                lastLogin: new Date(),
            });
        }
    } catch (error) {
        console.error("Error creating/updating user:", error);
    }
};

// Get user role from Firestore
export const getUserRole = async (uid: string): Promise<'admin' | 'student'> => {
    try {
        const userRef = doc(db, 'users', uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const userData = userSnap.data();
            console.log('User data from Firestore:', userData);
            return userData.role === 'admin' ? 'admin' : 'student';
        }

        console.log('User document not found in Firestore for uid:', uid);
        // Default to student if user not found
        return 'student';
    } catch (error) {
        console.error("Error getting user role:", error);
        return 'student';
    }
};

// Force update user role (for admin setup)
export const forceUpdateUserRole = async (uid: string, email: string): Promise<void> => {
    try {
        const role = email === 'jairosouza67@gmail.com' ? 'admin' : 'student';
        const userRef = doc(db, 'users', uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const updates: any = { role };

            // Update admin name if missing
            if (role === 'admin' && !userSnap.data().name) {
                updates.name = 'Administrador';
                updates.displayName = 'Administrador';
            }

            await updateDoc(userRef, updates);
            console.log('User role updated to:', role);
        } else {
            await setDoc(userRef, {
                name: role === 'admin' ? 'Administrador' : '',
                displayName: role === 'admin' ? 'Administrador' : '',
                email: email.toLowerCase(),
                role,
                createdAt: new Date(),
                lastLogin: new Date(),
            });
            console.log('User document created with role:', role);
        }
    } catch (error) {
        console.error("Error force updating user role:", error);
    }
};

// Real-time Subscriptions

export const subscribeToStudents = (callback: (count: number) => void): (() => void) => {
    const q = query(collection(db, 'users'));
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
    // Note: We might need an index for 'completedAt' descending.
    // If it fails without index, it will log an error with a link to create it.
    const q = query(
        collection(db, STUDENT_COMPLETIONS_COLLECTION),
        where('completed', '==', true),
        orderBy('completedAt', 'desc'),
        limit(limitCount)
    );

    return onSnapshot(q, async (snapshot) => {
        const completions = await Promise.all(snapshot.docs.map(async (docSnap) => {
            const data = docSnap.data();
            // Fetch student name if possible, or store it in completion record to save reads
            // For now, attempting to fetch user name might be too many reads if high volume.
            // A better approach is to store studentName in the completion document.
            // But strict to current schema, we'll try to get it or just return data.

            // Let's try to fetch the student name for the display
            let studentName = 'Aluno';
            if (data.studentId) {
                try {
                    const userDoc = await getDoc(doc(db, 'users', data.studentId));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        studentName = userData.displayName || userData.name || 'Aluno';
                    }
                } catch (e) {
                    console.error("Error fetching student details for completion:", e);
                }
            }

            // Fetch course/content title
            let contentTitle = 'Conteúdo';
            if (data.contentId && data.contentType === 'course') {
                try {
                    // Try to match with known course list or fetch
                    // Since we don't want N+1 reads here every time, we might ideally cache courses.
                    // For this MVP, we will try to fetch if not expensive, or just generic.
                    // Actually, let's just use a generic fetch since it's "Recent Activity" limited to small number
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
    // Fetches a larger set of completions for client-side aggregation (charts, popular courses)
    const q = query(
        collection(db, STUDENT_COMPLETIONS_COLLECTION),
        where('completed', '==', true),
        orderBy('completedAt', 'desc'),
        limit(limitCount)
    );

    return onSnapshot(q, (snapshot) => {
        // Just return raw data for aggregation
        const data = snapshot.docs.map(doc => ({
            ...doc.data(),
            completedAt: doc.data().completedAt?.toDate()
        }));
        callback(data);
    }, (error) => {
        console.error("Error subscribing to all completions:", error);
    });
};
