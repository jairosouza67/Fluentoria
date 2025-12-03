import { db } from './firebase';
import { collection, doc, getDoc, setDoc, updateDoc, query, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { Achievement, StudentProgress } from '../types';

const PROGRESS_COLLECTION = 'student_progress';
const ACHIEVEMENTS_COLLECTION = 'achievements';

// XP and Level System
const XP_PER_LEVEL = 500;
export const XP_REWARDS = {
  course_completed: 100,
  daily_contact: 20,
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

export const updateStreak = async (studentId: string, newStreak: number): Promise<boolean> => {
  try {
    const progress = await getStudentProgress(studentId);
    
    if (!progress) {
      return false;
    }
    
    const updateData: any = {
      currentStreak: newStreak,
      updatedAt: Timestamp.now(),
      lastActivityDate: Timestamp.now(),
    };
    
    if (newStreak > progress.longestStreak) {
      updateData.longestStreak = newStreak;
    }
    
    // Award streak bonus every 7 days
    if (newStreak % 7 === 0 && newStreak > 0) {
      await addXP(studentId, XP_REWARDS.streak_bonus, `${newStreak} day streak bonus`);
    }
    
    await updateDoc(doc(db, PROGRESS_COLLECTION, studentId), updateData);
    
    return true;
  } catch (error) {
    console.error("Error updating streak:", error);
    return false;
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

export const checkAndUnlockAchievements = async (
  studentId: string,
  progress: StudentProgress
): Promise<string[]> => {
  try {
    const achievements = await getAchievements();
    const newlyUnlocked: string[] = [];
    
    for (const achievement of achievements) {
      if (progress.unlockedAchievements.includes(achievement.id)) {
        continue;
      }
      
      let shouldUnlock = false;
      
      switch (achievement.condition.type) {
        case 'course_count':
          shouldUnlock = progress.totalCoursesCompleted >= achievement.condition.threshold;
          break;
        case 'streak_days':
          shouldUnlock = progress.currentStreak >= achievement.condition.threshold;
          break;
        case 'hours_studied':
          shouldUnlock = progress.totalHoursStudied >= achievement.condition.threshold;
          break;
        case 'first_course':
          shouldUnlock = progress.totalCoursesCompleted >= 1;
          break;
      }
      
      if (shouldUnlock) {
        const unlocked = await unlockAchievement(studentId, achievement.id);
        if (unlocked) {
          newlyUnlocked.push(achievement.id);
        }
      }
    }
    
    return newlyUnlocked;
  } catch (error) {
    console.error("Error checking achievements:", error);
    return [];
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
      title: 'Mestre dos Cursos',
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
