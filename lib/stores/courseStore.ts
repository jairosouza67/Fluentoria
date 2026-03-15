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
  // Deep copy all objects to avoid reference mutations
  setSelectedCourse: (selectedCourse) => set({ 
    selectedCourse: selectedCourse ? JSON.parse(JSON.stringify(selectedCourse)) : null 
  }),
  setSelectedGallery: (selectedGallery) => set({ 
    selectedGallery: selectedGallery ? JSON.parse(JSON.stringify(selectedGallery)) : null 
  }),
  setSelectedModule: (selectedModule) => set({ 
    selectedModule: selectedModule ? JSON.parse(JSON.stringify(selectedModule)) : null 
  }),
  clearSelection: () => set({
    selectedCourse: null,
    selectedGallery: null,
    selectedModule: null,
  }),
}));
