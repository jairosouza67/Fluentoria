import { db } from './firebase';
import { collection, addDoc, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { StudentActivity } from '../types';

const ACTIVITIES_COLLECTION = 'student_activities';

export const logActivity = async (
  studentId: string,
  activityType: StudentActivity['activityType'],
  courseId?: string,
  courseName?: string,
  metadata?: Record<string, any>
): Promise<string | null> => {
  try {
    const activityData = {
      studentId,
      activityType,
      courseId: courseId || null,
      courseName: courseName || null,
      timestamp: Timestamp.now(),
      metadata: metadata || {},
    };

    const docRef = await addDoc(collection(db, ACTIVITIES_COLLECTION), activityData);
    return docRef.id;
  } catch (error) {
    console.error("Error logging activity:", error);
    return null;
  }
};

export const getStudentActivities = async (
  studentId: string,
  limit?: number
): Promise<StudentActivity[]> => {
  try {
    const q = query(
      collection(db, ACTIVITIES_COLLECTION),
      where('studentId', '==', studentId),
      orderBy('timestamp', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const activities = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        studentId: data.studentId,
        activityType: data.activityType,
        courseId: data.courseId,
        courseName: data.courseName,
        timestamp: data.timestamp?.toDate() || new Date(),
        metadata: data.metadata || {},
      } as StudentActivity;
    });

    return limit ? activities.slice(0, limit) : activities;
  } catch (error) {
    console.error("Error fetching student activities:", error);
    return [];
  }
};

export const getCourseActivities = async (courseId: string): Promise<StudentActivity[]> => {
  try {
    const q = query(
      collection(db, ACTIVITIES_COLLECTION),
      where('courseId', '==', courseId),
      orderBy('timestamp', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        studentId: data.studentId,
        activityType: data.activityType,
        courseId: data.courseId,
        courseName: data.courseName,
        timestamp: data.timestamp?.toDate() || new Date(),
        metadata: data.metadata || {},
      } as StudentActivity;
    });
  } catch (error) {
    console.error("Error fetching course activities:", error);
    return [];
  }
};

export const getActivitiesByType = async (
  studentId: string,
  activityType: StudentActivity['activityType']
): Promise<StudentActivity[]> => {
  try {
    const q = query(
      collection(db, ACTIVITIES_COLLECTION),
      where('studentId', '==', studentId),
      where('activityType', '==', activityType),
      orderBy('timestamp', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        studentId: data.studentId,
        activityType: data.activityType,
        courseId: data.courseId,
        courseName: data.courseName,
        timestamp: data.timestamp?.toDate() || new Date(),
        metadata: data.metadata || {},
      } as StudentActivity;
    });
  } catch (error) {
    console.error("Error fetching activities by type:", error);
    return [];
  }
};

export const calculateAttendanceStats = (activities: StudentActivity[]) => {
  const completedCourses = activities.filter(a => a.activityType === 'course_completed').length;
  const dailyContacts = activities.filter(a => a.activityType === 'daily_contact').length;
  const mindfulFlows = activities.filter(a => a.activityType === 'mindful_flow').length;
  
  // Calculate streak
  const sortedActivities = [...activities].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  
  let currentStreak = 0;
  let lastDate: Date | null = null;
  
  for (const activity of sortedActivities) {
    const activityDate = new Date(activity.timestamp);
    activityDate.setHours(0, 0, 0, 0);
    
    if (!lastDate) {
      currentStreak = 1;
      lastDate = activityDate;
    } else {
      const dayDiff = Math.floor((lastDate.getTime() - activityDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (dayDiff === 1) {
        currentStreak++;
        lastDate = activityDate;
      } else if (dayDiff > 1) {
        break;
      }
    }
  }
  
  return {
    completedCourses,
    dailyContacts,
    mindfulFlows,
    currentStreak,
    totalActivities: activities.length,
  };
};

export const getRecentActivities = async (studentId: string, days: number = 30): Promise<StudentActivity[]> => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const activities = await getStudentActivities(studentId);
    return activities.filter(activity => 
      new Date(activity.timestamp) >= startDate
    );
  } catch (error) {
    console.error("Error fetching recent activities:", error);
    return [];
  }
};
