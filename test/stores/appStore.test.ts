import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '../../lib/stores/appStore';

describe('appStore', () => {
  beforeEach(() => {
    // Reset store between tests
    useAppStore.getState().reset();
  });

  it('should have correct initial state', () => {
    const state = useAppStore.getState();
    expect(state.currentScreen).toBe('auth');
    expect(state.viewMode).toBe('student');
    expect(state.user).toBeNull();
    expect(state.userRole).toBe('student');
    expect(state.loading).toBe(true);
    expect(state.hasAccess).toBe(false);
  });

  it('should navigate to a screen', () => {
    useAppStore.getState().navigateTo('dashboard');
    expect(useAppStore.getState().currentScreen).toBe('dashboard');
  });

  it('should not toggle view mode for non-admin users', () => {
    // Mock alert
    const originalAlert = globalThis.alert;
    globalThis.alert = () => {};

    useAppStore.getState().setUserRole('student');
    useAppStore.getState().toggleViewMode();
    expect(useAppStore.getState().viewMode).toBe('student');

    globalThis.alert = originalAlert;
  });

  it('should toggle view mode for admin users', () => {
    useAppStore.getState().setUserRole('admin');
    useAppStore.getState().toggleViewMode();
    expect(useAppStore.getState().viewMode).toBe('admin');
    expect(useAppStore.getState().currentScreen).toBe('admin-reports');
  });

  it('should toggle back to student mode', () => {
    useAppStore.getState().setUserRole('admin');
    useAppStore.getState().toggleViewMode(); // to admin
    useAppStore.getState().toggleViewMode(); // back to student
    expect(useAppStore.getState().viewMode).toBe('student');
    expect(useAppStore.getState().currentScreen).toBe('dashboard');
  });

  it('should reset to initial state', () => {
    useAppStore.getState().setCurrentScreen('dashboard');
    useAppStore.getState().setUserRole('admin');
    useAppStore.getState().setLoading(false);
    useAppStore.getState().reset();

    const state = useAppStore.getState();
    expect(state.currentScreen).toBe('auth');
    expect(state.userRole).toBe('student');
    expect(state.loading).toBe(true);
  });
});
