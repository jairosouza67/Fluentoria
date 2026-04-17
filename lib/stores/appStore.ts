import { create } from 'zustand';
import { Screen, ViewMode } from '../../types';
import { User } from 'firebase/auth';

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
  currentScreen: 'auth' as Screen,
  navigationHistory: [] as Screen[],
  viewMode: 'student' as ViewMode,
  showProfileMenu: false,
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
  setCurrentScreen: (currentScreen) => set({ currentScreen, navigationHistory: [] }),
  setViewMode: (viewMode) => set({ viewMode }),
  setShowProfileMenu: (showProfileMenu) => set({ showProfileMenu }),

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
    window.scrollTo(0, 0);
  },

  goBack: (fallbackScreen = 'dashboard') => {
    set((state) => {
      if (state.navigationHistory.length === 0) {
        if (state.currentScreen === fallbackScreen) {
          return {};
        }

        return {
          currentScreen: fallbackScreen,
          navigationHistory: [],
        };
      }

      const nextHistory = [...state.navigationHistory];
      const previousScreen = nextHistory.pop() as Screen;

      return {
        currentScreen: previousScreen,
        navigationHistory: nextHistory,
      };
    });
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
    } else {
      set({ viewMode: 'student', currentScreen: 'dashboard', navigationHistory: [] });
    }
  },

  reset: () => set(initialState),
}));
