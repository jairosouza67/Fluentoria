// Admin configuration - centralized admin email management
export const PRIMARY_ADMIN_EMAIL = 'jairosouza67@gmail.com';
export const ADMIN_EMAILS: string[] = [PRIMARY_ADMIN_EMAIL];

export const isAdminEmail = (email: string): boolean =>
    ADMIN_EMAILS.includes(email.toLowerCase());

export const isPrimaryAdmin = (email: string): boolean =>
    email.toLowerCase() === PRIMARY_ADMIN_EMAIL;

// Firestore collection names
export const COURSES_COLLECTION = 'courses';
export const MINDFUL_FLOW_COLLECTION = 'mindful_flow';
export const MUSIC_COLLECTION = 'music';
export const STUDENT_COMPLETIONS_COLLECTION = 'student_completions';
export const USERS_COLLECTION = 'users';
export const ADMIN_EMAILS_COLLECTION = 'adminEmails';
