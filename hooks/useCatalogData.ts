import { useState, useEffect, useCallback } from 'react';
import {
  Course,
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
} from '../lib/db';

export type TabType = 'courses' | 'gallery' | 'mindful' | 'music';

export const useCatalogData = () => {
  const [activeTab, setActiveTab] = useState<TabType>('courses');
  const [courses, setCourses] = useState<Course[]>([]);
  const [mindfulFlows, setMindfulFlows] = useState<Course[]>([]);
  const [musicList, setMusicList] = useState<Course[]>([]);
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

  useEffect(() => {
    if (activeTab === 'courses' || activeTab === 'gallery') {
      fetchCourses();
    } else if (activeTab === 'mindful') {
      fetchMindfulFlows();
    } else if (activeTab === 'music') {
      fetchMusic();
    }
  }, [activeTab, fetchCourses, fetchMindfulFlows, fetchMusic]);

  const getCurrentList = useCallback(() => {
    if (activeTab === 'courses') return courses;
    if (activeTab === 'gallery') return courses.filter(c => c.galleries && c.galleries.length > 0);
    if (activeTab === 'mindful') return mindfulFlows;
    if (activeTab === 'music') return musicList;
    return [];
  }, [activeTab, courses, mindfulFlows, musicList]);

  const handleSaveCourse = useCallback(async (course: Course) => {
    if (activeTab === 'courses' || activeTab === 'gallery') {
      if (editingCourse && editingCourse.id) {
        await updateCourse(editingCourse.id, course);
      } else {
        if (course.galleries && course.galleries.length > 0) {
          const existingCourses = await getCourses();
          const mainCourse = existingCourses.find(c =>
            c.galleries && c.galleries.length > 0 && c.title === course.title
          );

          if (mainCourse && mainCourse.id) {
            const updatedGalleries = [...(mainCourse.galleries || []), ...course.galleries];
            await updateCourse(mainCourse.id, {
              ...mainCourse,
              galleries: updatedGalleries,
            });
          } else {
            await addCourse(course);
          }
        } else {
          await addCourse(course);
        }
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
    }
    setIsFormOpen(false);
    setEditingCourse(null);
  }, [activeTab, editingCourse, fetchCourses, fetchMindfulFlows, fetchMusic]);

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
      }
    }
  }, [activeTab, fetchCourses, fetchMindfulFlows, fetchMusic]);

  const handleEditCourse = useCallback((course: Course) => {
    setEditingCourse(course);
    setIsFormOpen(true);
  }, []);

  const handleViewCourse = useCallback((course: Course) => {
    setViewingCourse(course);
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
