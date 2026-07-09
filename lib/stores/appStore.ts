import { create } from 'zustand';
import { Screen, ViewMode } from '../../types';
import { User } from 'firebase/auth';
import type { Reminder } from '../db';

const SCREEN_STORAGE_KEY = 'fluentoria:screen';

// Telas top-level de aluno que podem ser restauradas no refresh.
const STUDENT_TOP_LEVEL: Screen[] = [
  'dashboard', 'courses', 'mindful', 'music', 'reminders', 'achievements', 'profile',
];

// Telas de detalhe não são persistidas diretamente: restauramos a lista pai.
const DETAIL_PARENT: Record<string, Screen> = {
  'course-detail': 'courses',
  'mindful-detail': 'mindful',
  'music-detail': 'music',
  'reminder-detail': 'reminders',
};

const persistScreen = (screen: Screen) => {
  if (typeof window === 'undefined') return;
  try {
    const persistable = STUDENT_TOP_LEVEL.includes(screen)
      ? screen
      : DETAIL_PARENT[screen];
    if (persistable) {
      window.localStorage.setItem(SCREEN_STORAGE_KEY, persistable);
    } else {
      // auth / admin-* / desconhecidos => limpa
      window.localStorage.removeItem(SCREEN_STORAGE_KEY);
    }
  } catch {
    // localStorage indisponível (modo privado etc.) — silencioso
  }
};

const restoreScreen = (): Screen => {
  if (typeof window === 'undefined') return 'auth';
  try {
    const saved = window.localStorage.getItem(SCREEN_STORAGE_KEY) as Screen | null;
    return saved && STUDENT_TOP_LEVEL.includes(saved) ? saved : 'auth';
  } catch {
    return 'auth';
  }
};

interface AppState {
  // Auth
  user: User | null;
  userRole: 'admin' | 'student';
  roleLoaded: boolean;
  hasAccess: boolean;
  accessChecked: boolean;
  paymentStatus: string;
  loading: boolean;
  // Navigation
  currentScreen: Screen;
  navigationHistory: Screen[];
  viewMode: ViewMode;
  // UI
  showProfileMenu: boolean;
  // Reminder selection
  selectedReminder: Reminder | null;
  selectedReminderRead: boolean;
  // Actions
  setUser: (user: User | null) => void;
  setUserRole: (role: 'admin' | 'student') => void;
  setRoleLoaded: (loaded: boolean) => void;
  setHasAccess: (access: boolean) => void;
  setAccessChecked: (checked: boolean) => void;
  setPaymentStatus: (status: string) => void;
  setLoading: (loading: boolean) => void;
  setCurrentScreen: (screen: Screen) => void;
  setViewMode: (mode: ViewMode) => void;
  setShowProfileMenu: (show: boolean) => void;
  setSelectedReminder: (reminder: Reminder | null) => void;
  setSelectedReminderRead: (read: boolean) => void;
  navigateTo: (screen: Screen) => void;
  goBack: (fallbackScreen?: Screen) => void;
  toggleViewMode: () => void;
  reset: () => void;
}

const initialState = {
  user: null,
  userRole: 'student' as const,
  roleLoaded: false,
  hasAccess: false,
  accessChecked: false,
  paymentStatus: 'pending',
  loading: true,
  currentScreen: restoreScreen(),
  navigationHistory: [] as Screen[],
  viewMode: 'student' as ViewMode,
  showProfileMenu: false,
  selectedReminder: null as Reminder | null,
  selectedReminderRead: false,
};

export const useAppStore = create<AppState>((set, get) => ({
  ...initialState,

  setUser: (user) => set({ user }),
  setUserRole: (userRole) => set({ userRole }),
  setRoleLoaded: (roleLoaded) => set({ roleLoaded }),
  setHasAccess: (hasAccess) => set({ hasAccess }),
  setAccessChecked: (accessChecked) => set({ accessChecked }),
  setPaymentStatus: (paymentStatus) => set({ paymentStatus }),
  setLoading: (loading) => set({ loading }),
  setCurrentScreen: (currentScreen) => {
    set({ currentScreen, navigationHistory: [] });
    persistScreen(currentScreen);
  },
  setViewMode: (viewMode) => set({ viewMode }),
  setShowProfileMenu: (showProfileMenu) => set({ showProfileMenu }),
  setSelectedReminder: (selectedReminder) => set({ selectedReminder }),
  setSelectedReminderRead: (selectedReminderRead) => set({ selectedReminderRead }),

  navigateTo: (screen) => {
    set((state) => {
      if (state.currentScreen === screen) {
        return {};
      }

      return {
        currentScreen: screen,
        navigationHistory: [...state.navigationHistory, state.currentScreen].slice(-30),
      };
    });
    persistScreen(screen);
    window.scrollTo(0, 0);
  },

  goBack: (fallbackScreen = 'dashboard') => {
    let landed: Screen | null = null;
    set((state) => {
      if (state.navigationHistory.length === 0) {
        if (state.currentScreen === fallbackScreen) {
          return {};
        }

        landed = fallbackScreen;
        return {
          currentScreen: fallbackScreen,
          navigationHistory: [],
        };
      }

      const nextHistory = [...state.navigationHistory];
      const previousScreen = nextHistory.pop() as Screen;
      landed = previousScreen;

      return {
        currentScreen: previousScreen,
        navigationHistory: nextHistory,
      };
    });
    if (landed) persistScreen(landed);
    window.scrollTo(0, 0);
  },

  toggleViewMode: () => {
    const { userRole, viewMode } = get();
    if (userRole !== 'admin') {
      alert('Acesso negado. Apenas administradores podem acessar esta área.');
      return;
    }
    if (viewMode === 'student') {
      set({ viewMode: 'admin', currentScreen: 'admin-reports', navigationHistory: [] });
      persistScreen('admin-reports');
    } else {
      set({ viewMode: 'student', currentScreen: 'dashboard', navigationHistory: [] });
      persistScreen('dashboard');
    }
  },

  reset: () => set(initialState),
}));
