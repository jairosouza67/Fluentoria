// Barrel re-exports — maintains backward compatibility with `import { ... } from './lib/db'`

// Types
export type { Course, CourseLesson, CourseModule, CourseGallery, SupportMaterial, StudentCompletion, Student, UserCourse, Reminder, ReminderRead } from './types';

// Config
export { PRIMARY_ADMIN_EMAIL, ADMIN_EMAILS, isAdminEmail, isPrimaryAdmin } from './config';

// Courses
export { getCourses, addCourse, updateCourse, deleteCourse, getCoursesForUser } from './courses';

// Mindful
export { getMindfulFlows, addMindfulFlow, updateMindfulFlow, deleteMindfulFlow, getMindfulFlowsForUser } from './mindful';

// Music
export { getMusic, addMusic, updateMusic, deleteMusic, getMusicForUser } from './music';

// Reminders
export { getReminders, addReminder, updateReminder, deleteReminder, getRemindersForUser, getReminderReadsForUser, markReminderAsRead } from './reminders';

// Completions
export { getStudentCompletion, markContentComplete } from './completions';

// Students
export { getAllStudents, addStudent, updateStudent, deleteStudent, findAndMergeStudentByEmail, exportStudentData, importStudentData, getStudentsWithAccessControl } from './students';

// Admin / Auth
export { createOrUpdateUser, getUserRole, checkUserAccess, forceUpdateUserRole, addAdminByEmail, getAdminEmails, removeAdmin, updateStudentAccess } from './admin';

// Subscriptions
export { subscribeToStudents, subscribeToCourses, subscribeToRecentCompletions, subscribeToAllCompletions } from './subscriptions';

// Asaas
export { syncStudentWithAsaas, checkAsaasPaymentStatus, syncAllStudentsWithAsaas } from './asaas';

// User Courses
export { getUserCourses, grantCourseAccess, revokeCourseAccess, hasCourseAccess, hasAnyCourseAccess } from './userCourses';

// Migration
export { runAccessMigration } from './migration';
