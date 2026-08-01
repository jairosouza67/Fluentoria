import { db, auth } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { SETTINGS_COLLECTION } from './config';
import { requireAdmin } from './admin';

export interface WelcomeVideoSettings {
    videoUrl: string;
    updatedAt?: Date;
    updatedBy?: string;
}

const WELCOME_VIDEO_DOC = 'welcome';

/**
 * Get the welcome video settings (shown on the Courses home for all students).
 * Returns null when not configured yet.
 */
export const getWelcomeVideo = async (): Promise<WelcomeVideoSettings | null> => {
    try {
        const docRef = doc(db, SETTINGS_COLLECTION, WELCOME_VIDEO_DOC);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            return null;
        }

        const data = docSnap.data() as WelcomeVideoSettings;
        if (!data.videoUrl) {
            return null;
        }

        return data;
    } catch (error) {
        console.error('Error fetching welcome video settings:', error);
        return null;
    }
};

/**
 * Save the welcome video URL. Admin only.
 * Pass an empty string to remove the video (student home falls back to the text version).
 */
export const saveWelcomeVideo = async (videoUrl: string): Promise<boolean> => {
    try {
        await requireAdmin();
        const docRef = doc(db, SETTINGS_COLLECTION, WELCOME_VIDEO_DOC);
        await setDoc(docRef, {
            videoUrl: videoUrl.trim(),
            updatedAt: new Date(),
            updatedBy: auth.currentUser?.email || '',
        });
        return true;
    } catch (error) {
        console.error('Error saving welcome video settings:', error);
        return false;
    }
};
