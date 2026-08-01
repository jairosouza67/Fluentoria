import { create } from 'zustand';
import { Course, CourseGallery } from '../db';

export type CourseSort = 'none' | 'name-asc' | 'name-desc';

interface CourseState {
  selectedCourse: Course | null;
  selectedGallery: CourseGallery | null;
  courseSearchTerm: string;
  setCourseSearchTerm: (term: string) => void;
  courseSort: CourseSort;
  setCourseSort: (sort: CourseSort) => void;
  setSelectedCourse: (course: Course | null) => void;
  setSelectedGallery: (gallery: CourseGallery | null) => void;
  clearSelection: () => void;
}

export const useCourseStore = create<CourseState>((set) => ({
  selectedCourse: null,
  selectedGallery: null,
  courseSearchTerm: '',
  setCourseSearchTerm: (courseSearchTerm) => set({ courseSearchTerm }),
  courseSort: 'none',
  setCourseSort: (courseSort) => set({ courseSort }),
  // Deep copy all objects to avoid reference mutations
  setSelectedCourse: (selectedCourse) => set({
    selectedCourse: selectedCourse ? JSON.parse(JSON.stringify(selectedCourse)) : null
  }),
  setSelectedGallery: (selectedGallery) => set({
    selectedGallery: selectedGallery ? JSON.parse(JSON.stringify(selectedGallery)) : null
  }),
  clearSelection: () => set({
    selectedCourse: null,
    selectedGallery: null,
  }),
}));
