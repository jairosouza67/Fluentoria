import { create } from 'zustand';
import { Course, CourseModule, CourseGallery } from '../db';

interface CourseState {
  selectedCourse: Course | null;
  selectedGallery: CourseGallery | null;
  selectedModule: CourseModule | null;
  setSelectedCourse: (course: Course | null) => void;
  setSelectedGallery: (gallery: CourseGallery | null) => void;
  setSelectedModule: (module: CourseModule | null) => void;
  clearSelection: () => void;
}

export const useCourseStore = create<CourseState>((set) => ({
  selectedCourse: null,
  selectedGallery: null,
  selectedModule: null,
  setSelectedCourse: (selectedCourse) => set({ selectedCourse }),
  setSelectedGallery: (selectedGallery) => set({ selectedGallery }),
  setSelectedModule: (selectedModule) => set({ selectedModule }),
  clearSelection: () => set({
    selectedCourse: null,
    selectedGallery: null,
    selectedModule: null,
  }),
}));
