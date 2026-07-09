import { db } from './firebase';
import { collection, doc, getDoc, setDoc, updateDoc, query, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { Achievement, StudentProgress } from '../types';
import { getLessonProgress, toggleLessonComplete, getAllLessonProgress } from './db/lessonProgress';
import { logActivity, getStudentActivities, calculateAttendanceStats } from './attendance';

const PROGRESS_COLLECTION = 'student_progress';
const ACHIEVEMENTS_COLLECTION = 'achievements';

// XP and Level System
const XP_PER_LEVEL = 500;
export const XP_REWARDS = {
  course_completed: 100,
  // daily_contact: 20, // Daily Contact disabled
  mindful_flow: 15,
  lesson_completed: 50,
  media_upload: 10,
  streak_bonus: 50, // Per 7 days
};

export const calculateLevel = (xp: number): number => {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
};

export const getXPForNextLevel = (currentXP: number): number => {
  const currentLevel = calculateLevel(currentXP);
  return currentLevel * XP_PER_LEVEL;
};

export const getXPProgress = (currentXP: number): { current: number; required: number; percentage: number } => {
  const currentLevel = calculateLevel(currentXP);
  const xpForCurrentLevel = (currentLevel - 1) * XP_PER_LEVEL;
  const xpForNextLevel = currentLevel * XP_PER_LEVEL;
  const xpInCurrentLevel = currentXP - xpForCurrentLevel;
  const xpRequiredForLevel = XP_PER_LEVEL;
  
  return {
    current: xpInCurrentLevel,
    required: xpRequiredForLevel,
    percentage: (xpInCurrentLevel / xpRequiredForLevel) * 100,
  };
};

// Student Progress Management
export const getStudentProgress = async (studentId: string): Promise<StudentProgress | null> => {
  try {
    const docRef = doc(db, PROGRESS_COLLECTION, studentId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        lastActivityDate: data.lastActivityDate?.toDate(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as StudentProgress;
    }
    
    return null;
  } catch (error) {
    console.error("Error fetching student progress:", error);
    return null;
  }
};

export const createStudentProgress = async (
  studentId: string,
  studentName: string,
  studentEmail: string
): Promise<boolean> => {
  try {
    const progressData: Omit<StudentProgress, 'id'> = {
      studentId,
      studentName,
      studentEmail,
      currentXP: 0,
      currentLevel: 1,
      totalCoursesCompleted: 0,
      totalHoursStudied: 0,
      currentStreak: 0,
      longestStreak: 0,
      unlockedAchievements: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    await setDoc(doc(db, PROGRESS_COLLECTION, studentId), {
      ...progressData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    
    return true;
  } catch (error) {
    console.error("Error creating student progress:", error);
    return false;
  }
};

export const addXP = async (
  studentId: string,
  xpAmount: number,
  reason: string
): Promise<{ newLevel: number; leveledUp: boolean } | null> => {
  try {
    let progress = await getStudentProgress(studentId);
    
    if (!progress) {
      return null;
    }
    
    const oldLevel = progress.currentLevel;
    const newXP = progress.currentXP + xpAmount;
    const newLevel = calculateLevel(newXP);
    const leveledUp = newLevel > oldLevel;
    
    await updateDoc(doc(db, PROGRESS_COLLECTION, studentId), {
      currentXP: newXP,
      currentLevel: newLevel,
      updatedAt: Timestamp.now(),
      lastActivityDate: Timestamp.now(),
    });
    
    return { newLevel, leveledUp };
  } catch (error) {
    console.error("Error adding XP:", error);
    return null;
  }
};

export const unlockAchievement = async (studentId: string, achievementId: string): Promise<boolean> => {
  try {
    const progress = await getStudentProgress(studentId);
    
    if (!progress) {
      return false;
    }
    
    if (progress.unlockedAchievements.includes(achievementId)) {
      return false; // Already unlocked
    }
    
    const achievement = await getAchievement(achievementId);
    
    if (!achievement) {
      return false;
    }
    
    // Add achievement to unlocked list
    await updateDoc(doc(db, PROGRESS_COLLECTION, studentId), {
      unlockedAchievements: [...progress.unlockedAchievements, achievementId],
      updatedAt: Timestamp.now(),
    });
    
    // Award XP
    await addXP(studentId, achievement.xpReward, `Achievement unlocked: ${achievement.title}`);
    
    return true;
  } catch (error) {
    console.error("Error unlocking achievement:", error);
    return false;
  }
};

// Sync Student Progress stats with real DB records
export const syncProgressStats = async (studentId: string): Promise<void> => {
  try {
    // 1. Get all lesson progress to compute totalCoursesCompleted
    const allLessonProgress = await getAllLessonProgress(studentId);
    let totalCoursesCompleted = 0;
    allLessonProgress.forEach(p => {
      if (p.completedLessonIds) {
        totalCoursesCompleted += p.completedLessonIds.length;
      }
    });

    // 2. Get all student activities to compute streak stats
    const activities = await getStudentActivities(studentId);
    const attendanceStats = calculateAttendanceStats(activities);
    const currentStreak = attendanceStats.currentStreak;

    // Get existing progress to calculate longestStreak
    const progress = await getStudentProgress(studentId);
    let longestStreak = progress ? (progress.longestStreak || 0) : 0;
    if (currentStreak > longestStreak) {
      longestStreak = currentStreak;
    }

    // 3. Update Firestore student_progress document using merge to ensure creation
    const progressDocRef = doc(db, PROGRESS_COLLECTION, studentId);
    await setDoc(progressDocRef, {
      totalCoursesCompleted,
      currentStreak,
      longestStreak,
      updatedAt: Timestamp.now(),
    }, { merge: true });
  } catch (error) {
    console.error("Error syncing progress stats:", error);
  }
};

// Evaluate achievements and automatically unlock unlocked ones
export const evaluateAchievements = async (studentId: string): Promise<string[]> => {
  try {
    const progress = await getStudentProgress(studentId);
    if (!progress) {
      return [];
    }

    const achievements = await getAchievements();
    const unlockedList = progress.unlockedAchievements || [];
    const newlyUnlocked: string[] = [];

    // Evaluate each locked achievement sequentially to maintain state integrity
    for (const achievement of achievements) {
      if (unlockedList.includes(achievement.id)) {
        continue;
      }

      let met = false;
      const { type, threshold } = achievement.condition;

      switch (type) {
        case 'first_course':
          met = progress.totalCoursesCompleted >= threshold;
          break;
        case 'course_count':
          met = progress.totalCoursesCompleted >= threshold;
          break;
        case 'streak_days':
          met = progress.currentStreak >= threshold;
          break;
        case 'hours_studied':
          met = progress.totalHoursStudied >= threshold;
          break;
        default:
          break;
      }

      if (met) {
        const success = await unlockAchievement(studentId, achievement.id);
        if (success) {
          newlyUnlocked.push(achievement.id);
        }
      }
    }

    return newlyUnlocked;
  } catch (error) {
    console.error("Error evaluating achievements:", error);
    return [];
  }
};

// Achievements Management
export const getAchievements = async (): Promise<Achievement[]> => {
  try {
    const q = query(collection(db, ACHIEVEMENTS_COLLECTION), orderBy('xpReward', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Achievement));
  } catch (error) {
    console.error("Error fetching achievements:", error);
    return getDefaultAchievements();
  }
};

export const getAchievement = async (achievementId: string): Promise<Achievement | null> => {
  try {
    const docRef = doc(db, ACHIEVEMENTS_COLLECTION, achievementId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as Achievement;
    }
    
    return null;
  } catch (error) {
    console.error("Error fetching achievement:", error);
    return null;
  }
};

// Leaderboard
export const getLeaderboard = async (limit: number = 10): Promise<StudentProgress[]> => {
  try {
    const q = query(
      collection(db, PROGRESS_COLLECTION),
      orderBy('currentXP', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const leaderboard = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        lastActivityDate: data.lastActivityDate?.toDate(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as StudentProgress;
    });
    
    return leaderboard.slice(0, limit);
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return [];
  }
};

// Default achievements (can be seeded to Firestore)
export const getDefaultAchievements = (): Achievement[] => {
  return [
    {
      id: 'first_steps',
      title: 'Primeiros Passos',
      description: 'Complete sua primeira aula',
      icon: '🎯',
      xpReward: 50,
      condition: { type: 'first_course', threshold: 1 },
    },
    {
      id: 'dedicated_student',
      title: 'Estudante Dedicado',
      description: 'Mantenha uma sequência de 7 dias',
      icon: '🔥',
      xpReward: 100,
      condition: { type: 'streak_days', threshold: 7 },
    },
    {
      id: 'course_master',
      title: 'Mestre das Aulas',
      description: 'Complete 10 aulas',
      icon: '🏆',
      xpReward: 200,
      condition: { type: 'course_count', threshold: 10 },
    },
    {
      id: 'unstoppable',
      title: 'Imparável',
      description: 'Mantenha uma sequência de 30 dias',
      icon: '⚡',
      xpReward: 500,
      condition: { type: 'streak_days', threshold: 30 },
    },
    {
      id: 'scholar',
      title: 'Erudito',
      description: 'Complete 50 aulas',
      icon: '📚',
      xpReward: 1000,
      condition: { type: 'course_count', threshold: 50 },
    },
  ];
};

// Idempotent lesson completion: only award XP the FIRST time a lesson is marked complete.
// Re-marking an already-completed lesson is a no-op for XP; unmarking never removes XP.
export const markLessonCompleteWithXP = async (
  studentId: string,
  courseId: string,
  lessonId: string,
  completed: boolean
): Promise<boolean> => {
  const progress = await getLessonProgress(studentId, courseId);
  const alreadyCompleted = !!progress?.completedLessonIds?.includes(lessonId);

  // Only award XP on the genuine transition false -> true.
  if (completed && !alreadyCompleted) {
    await addXP(studentId, XP_REWARDS.lesson_completed, `Lesson completed: ${lessonId}`);
    await logActivity(studentId, 'lesson_completed', courseId, undefined, { lessonId });
    // Trigger sync and evaluation in the background without blocking the UI response
    syncProgressStats(studentId).then(() => evaluateAchievements(studentId));
  }

  return toggleLessonComplete(studentId, courseId, lessonId, completed);
};
