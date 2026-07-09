import { create } from 'zustand';
import { Course, CourseGallery } from '../db';

interface CourseState {
  selectedCourse: Course | null;
  selectedGallery: CourseGallery | null;
  setSelectedCourse: (course: Course | null) => void;
  setSelectedGallery: (gallery: CourseGallery | null) => void;
  clearSelection: () => void;
}

export const useCourseStore = create<CourseState>((set) => ({
  selectedCourse: null,
  selectedGallery: null,
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
