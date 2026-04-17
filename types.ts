export type ViewMode = 'student' | 'admin';

export type Screen =

  | 'auth'
  | 'dashboard'
  | 'courses'
  | 'gallery'
  | 'module-selection'
  | 'course-detail'
  // | 'daily' // Daily Contact disabled
  // | 'daily-detail' // Daily Contact disabled
  | 'mindful'
  | 'mindful-detail'
  | 'music'
  | 'music-detail'
  | 'reminders'
  | 'reminder-detail'
  | 'profile'
  | 'achievements'
  | 'leaderboard'
  | 'attendance'
  | 'admin-catalog'
  | 'admin-students'
  | 'admin-reports'
  | 'admin-financial'
  | 'admin-settings';

export interface Module {
  id: string;
  title: string;
  subtitle: string;
  progress?: number;
  iconType: 'book' | 'edit' | 'activity' | 'music';
  actionLabel: string;
  targetScreen?: Screen;
}

export interface Recommendation {
  id: string;
  title: string;
  subtitle: string;
  gradient: string;
}

export interface ClassItem {
  id: string;
  title: string;
  duration: string;
  launchDate: string;
  gradient: string;
}

export interface UserStats {
  completedCourses: number;
  hoursStudied: number;
  streakDays: number;
}

// Chat/Messages
export interface Message {
  id?: string;
  courseId: string;
  userId: string;
  userName: string;
  userEmail: string;
  text: string;
  timestamp: Date;
  isInstructor: boolean;
}

// Media Submissions
export interface MediaSubmission {
  id?: string;
  courseId: string;
  studentId: string;
  studentName: string;
  fileName: string;
  fileType: 'image' | 'video' | 'audio' | 'pdf' | 'document';
  fileUrl: string;
  fileSize: number;
  uploadedAt: Date;
  description?: string;
}

// Student Activity/Attendance
export interface StudentActivity {
  id?: string;
  studentId: string;
  activityType: 'course_completed' | 'daily_contact' | 'mindful_flow' | 'course_started' | 'lesson_completed';
  courseId?: string;
  courseName?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// Gamification - Achievements
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  condition: {
    type: 'course_count' | 'streak_days' | 'daily_contact_count' | 'hours_studied' | 'first_course' | 'media_upload';
    threshold: number;
  };
}

// Gamification - Student Progress
export interface StudentProgress {
  id?: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  currentXP: number;
  currentLevel: number;
  totalCoursesCompleted: number;
  totalHoursStudied: number;
  currentStreak: number;
  longestStreak: number;
  unlockedAchievements: string[]; // Achievement IDs
  rank?: number;
  lastActivityDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}