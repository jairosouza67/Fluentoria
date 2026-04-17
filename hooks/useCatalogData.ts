import { useState, useEffect, useCallback } from 'react';
import {
  Course,
  Reminder,
  getCourses,
  addCourse,
  updateCourse,
  deleteCourse,
  getMindfulFlows,
  addMindfulFlow,
  updateMindfulFlow,
  deleteMindfulFlow,
  getMusic,
  addMusic,
  updateMusic,
  deleteMusic,
  getReminders,
  addReminder,
  updateReminder,
  deleteReminder,
} from '../lib/db';

export type TabType = 'courses' | 'gallery' | 'mindful' | 'music' | 'reminders';

export interface SaveCourseResult {
  success: boolean;
  error?: string;
}

const REMINDER_FALLBACK_AUTHOR = 'Equipe Fluentoria';
const REMINDER_FALLBACK_THUMBNAIL = 'from-orange-900 to-stone-900';

const toDateInputValue = (value: unknown): string => {
  if (!value) return '';

  if (value instanceof Date) {
    return value.toISOString().split('T')[0];
  }

  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    const dateValue = (value as { toDate?: () => Date }).toDate?.();
    if (dateValue instanceof Date) {
      return dateValue.toISOString().split('T')[0];
    }
  }

  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  return parsed.toISOString().split('T')[0];
};

const reminderToCourse = (reminder: Reminder): Course => ({
  id: reminder.id,
  title: reminder.title,
  author: REMINDER_FALLBACK_AUTHOR,
  duration: '',
  type: 'video',
  progress: 0,
  thumbnail: REMINDER_FALLBACK_THUMBNAIL,
  launchDate: toDateInputValue(reminder.updatedAt || reminder.createdAt),
  description: reminder.message,
  videoUrl: reminder.videoUrl,
  coverImage: reminder.coverImage || '',
});

const courseToReminder = (course: Course): Reminder => ({
  title: course.title,
  message: course.description?.trim() || '',
  videoUrl: course.videoUrl?.trim() || '',
  coverImage: course.coverImage?.trim() || '',
});

export const useCatalogData = () => {
  const [activeTab, setActiveTab] = useState<TabType>('courses');
  const [courses, setCourses] = useState<Course[]>([]);
  const [mindfulFlows, setMindfulFlows] = useState<Course[]>([]);
  const [musicList, setMusicList] = useState<Course[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [viewingCourse, setViewingCourse] = useState<Course | null>(null);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    const data = await getCourses();
    setCourses(data);
    setLoading(false);
  }, []);

  const fetchMindfulFlows = useCallback(async () => {
    setLoading(true);
    const data = await getMindfulFlows();
    setMindfulFlows(data);
    setLoading(false);
  }, []);

  const fetchMusic = useCallback(async () => {
    setLoading(true);
    const data = await getMusic();
    setMusicList(data);
    setLoading(false);
  }, []);

  const fetchReminders = useCallback(async () => {
    setLoading(true);
    const data = await getReminders();
    setReminders(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    // Always fetch courses for linking in mindful/music tabs
    fetchCourses();
    
    if (activeTab === 'courses' || activeTab === 'gallery') {
      // Courses already fetched above
    } else if (activeTab === 'mindful') {
      fetchMindfulFlows();
    } else if (activeTab === 'music') {
      fetchMusic();
    } else if (activeTab === 'reminders') {
      fetchReminders();
    }
  }, [activeTab, fetchCourses, fetchMindfulFlows, fetchMusic, fetchReminders]);

  const getCurrentList = useCallback(() => {
    if (activeTab === 'courses') return courses;
    if (activeTab === 'gallery') return courses.filter(c => c.galleries && c.galleries.length > 0);
    if (activeTab === 'mindful') return mindfulFlows;
    if (activeTab === 'music') return musicList;
    if (activeTab === 'reminders') return reminders.map(reminderToCourse);
    return [];
  }, [activeTab, courses, mindfulFlows, musicList, reminders]);

  const handleSaveCourse = useCallback(async (course: Course): Promise<SaveCourseResult> => {
    const operation = editingCourse?.id ? 'update' : 'create';

    try {
      if (activeTab === 'courses' || activeTab === 'gallery') {
        if (editingCourse && editingCourse.id) {
          await updateCourse(editingCourse.id, course);
        } else {
          // Always create a new course - no merging logic
          await addCourse(course);
        }
        await fetchCourses();
      } else if (activeTab === 'mindful') {
        if (editingCourse && editingCourse.id) {
          await updateMindfulFlow(editingCourse.id, course);
        } else {
          await addMindfulFlow(course);
        }
        await fetchMindfulFlows();
      } else if (activeTab === 'music') {
        if (editingCourse && editingCourse.id) {
          await updateMusic(editingCourse.id, course);
        } else {
          await addMusic(course);
        }
        await fetchMusic();
      } else if (activeTab === 'reminders') {
        const reminder = courseToReminder(course);
        if (editingCourse && editingCourse.id) {
          await updateReminder(editingCourse.id, reminder);
        } else {
          await addReminder(reminder);
        }
        await fetchReminders();
      } else {
        return { success: false, error: 'Aba de catalogo invalida para salvar.' };
      }

      setIsFormOpen(false);
      setEditingCourse(null);
      return { success: true };
    } catch (error) {
      console.error('[useCatalogData] failed to save catalog content', {
        activeTab,
        operation,
        editingCourseId: editingCourse?.id ?? null,
        submittedCourseId: course.id ?? null,
        error,
      });

      const message = error instanceof Error && error.message
        ? error.message
        : 'Nao foi possivel salvar o conteudo. Tente novamente.';

      return { success: false, error: message };
    }
  }, [activeTab, editingCourse, fetchCourses, fetchMindfulFlows, fetchMusic, fetchReminders]);

  const handleDeleteCourse = useCallback(async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este conteúdo?')) {
      if (activeTab === 'courses') {
        await deleteCourse(id);
        await fetchCourses();
      } else if (activeTab === 'mindful') {
        await deleteMindfulFlow(id);
        await fetchMindfulFlows();
      } else if (activeTab === 'music') {
        await deleteMusic(id);
        await fetchMusic();
      } else if (activeTab === 'reminders') {
        await deleteReminder(id);
        await fetchReminders();
      }
    }
  }, [activeTab, fetchCourses, fetchMindfulFlows, fetchMusic, fetchReminders]);

  const handleEditCourse = useCallback((course: Course) => {
    // Deep copy to avoid reference mutations
    setEditingCourse(JSON.parse(JSON.stringify(course)));
    setIsFormOpen(true);
  }, []);

  const handleViewCourse = useCallback((course: Course) => {
    // Deep copy to avoid reference mutations
    setViewingCourse(JSON.parse(JSON.stringify(course)));
  }, []);

  return {
    activeTab,
    setActiveTab,
    courses,
    mindfulFlows,
    musicList,
    loading,
    isFormOpen,
    setIsFormOpen,
    editingCourse,
    setEditingCourse,
    viewingCourse,
    setViewingCourse,
    getCurrentList,
    handleSaveCourse,
    handleDeleteCourse,
    handleEditCourse,
    handleViewCourse,
  };
};
