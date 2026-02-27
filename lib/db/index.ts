// Barrel re-exports — maintains backward compatibility with `import { ... } from './lib/db'`

// Types
export type { Course, CourseLesson, CourseModule, CourseGallery, SupportMaterial, StudentCompletion, Student } from './types';

// Config
export { PRIMARY_ADMIN_EMAIL, ADMIN_EMAILS, isAdminEmail, isPrimaryAdmin } from './config';

// Courses
export { getCourses, addCourse, updateCourse, deleteCourse } from './courses';

// Mindful
export { getMindfulFlows, addMindfulFlow, updateMindfulFlow, deleteMindfulFlow } from './mindful';

// Music
export { getMusic, addMusic, updateMusic, deleteMusic } from './music';

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
