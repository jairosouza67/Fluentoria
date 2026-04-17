import { db } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, where, setDoc, getDoc } from 'firebase/firestore';
import { Reminder, ReminderRead } from './types';
import { REMINDERS_COLLECTION, REMINDER_READS_COLLECTION } from './config';
import { requireAdmin, checkUserAccess } from './admin';

export const getReminders = async (): Promise<Reminder[]> => {
    try {
        const q = query(collection(db, REMINDERS_COLLECTION), orderBy('title'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Reminder));
    } catch (error) {
        console.error('Error fetching reminders:', error);
        return [];
    }
};

export const addReminder = async (reminder: Reminder): Promise<string | null> => {
    try {
        await requireAdmin();
        const now = new Date();
        const payload: Reminder = {
            title: reminder.title,
            message: reminder.message,
            videoUrl: reminder.videoUrl,
            coverImage: reminder.coverImage || '',
            createdAt: now,
            updatedAt: now,
        };
        const docRef = await addDoc(collection(db, REMINDERS_COLLECTION), payload);
        return docRef.id;
    } catch (error) {
        console.error('Error adding reminder:', error);
        return null;
    }
};

export const updateReminder = async (id: string, updates: Partial<Reminder>): Promise<boolean> => {
    try {
        await requireAdmin();
        const docRef = doc(db, REMINDERS_COLLECTION, id);
        await updateDoc(docRef, {
            ...updates,
            updatedAt: new Date(),
        });
        return true;
    } catch (error) {
        console.error('Error updating reminder:', error);
        return false;
    }
};

export const deleteReminder = async (id: string): Promise<boolean> => {
    try {
        await requireAdmin();
        const docRef = doc(db, REMINDERS_COLLECTION, id);
        await deleteDoc(docRef);
        return true;
    } catch (error) {
        console.error('Error deleting reminder:', error);
        return false;
    }
};

export const getRemindersForUser = async (userId: string): Promise<Reminder[]> => {
    try {
        const { authorized, role } = await checkUserAccess(userId);

        // Admin sees all reminders.
        if (role === 'admin') {
            return getReminders();
        }

        // Unauthorized students cannot load reminder content.
        if (!authorized) {
            return [];
        }

        return getReminders();
    } catch (error) {
        console.error('Error fetching reminders for user:', error);
        return [];
    }
};

export const getReminderReadsForUser = async (userId: string): Promise<ReminderRead[]> => {
    try {
        const { authorized, role } = await checkUserAccess(userId);

        if (role !== 'admin' && !authorized) {
            return [];
        }

        const q = query(collection(db, REMINDER_READS_COLLECTION), where('userId', '==', userId));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as ReminderRead));
    } catch (error) {
        console.error('Error fetching reminder reads for user:', error);
        return [];
    }
};

export const markReminderAsRead = async (userId: string, reminderId: string): Promise<boolean> => {
    try {
        if (!userId || !reminderId) {
            return false;
        }

        const { authorized, role } = await checkUserAccess(userId);

        if (role !== 'admin' && !authorized) {
            return false;
        }

        const docId = `${userId}_${reminderId}`;
        const readRef = doc(db, REMINDER_READS_COLLECTION, docId);
        const readSnap = await getDoc(readRef);

        // Idempotent: once created, do not rewrite.
        if (readSnap.exists()) {
            return true;
        }

        await setDoc(readRef, {
            userId,
            reminderId,
            readAt: new Date(),
        });

        return true;
    } catch (error) {
        console.error('Error marking reminder as read:', error);
        return false;
    }
};
