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
  setCurrentScreen: (currentScreen) => set({ currentScreen }),
  setViewMode: (viewMode) => set({ viewMode }),
  setShowProfileMenu: (showProfileMenu) => set({ showProfileMenu }),

  navigateTo: (screen) => {
    set({ currentScreen: screen });
    window.scrollTo(0, 0);
  },

  toggleViewMode: () => {
    const { userRole, viewMode } = get();
    if (userRole !== 'admin') {
      alert('Acesso negado. Apenas administradores podem acessar esta área.');
      return;
    }
    if (viewMode === 'student') {
      set({ viewMode: 'admin', currentScreen: 'admin-reports' });
    } else {
      set({ viewMode: 'student', currentScreen: 'dashboard' });
    }
  },

  reset: () => set(initialState),
}));
