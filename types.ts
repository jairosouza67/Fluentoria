
export type ViewMode = 'student' | 'admin';

export type Screen = 
  | 'auth'
  | 'dashboard' 
  | 'courses' 
  | 'course-detail' 
  | 'daily' 
  | 'mindful' 
  | 'music' 
  | 'profile'
  | 'admin-catalog'
  | 'admin-students'
  | 'admin-reports'
  | 'admin-settings'
  | 'admin-help';

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
