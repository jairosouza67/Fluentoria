import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCatalogData } from '../../hooks/useCatalogData';
import type { Course } from '../../lib/db/types';

const dbMocks = vi.hoisted(() => ({
  getCourses: vi.fn(),
  addCourse: vi.fn(),
  updateCourse: vi.fn(),
  deleteCourse: vi.fn(),
  getMindfulFlows: vi.fn(),
  addMindfulFlow: vi.fn(),
  updateMindfulFlow: vi.fn(),
  deleteMindfulFlow: vi.fn(),
  getMusic: vi.fn(),
  addMusic: vi.fn(),
  updateMusic: vi.fn(),
  deleteMusic: vi.fn(),
  getReminders: vi.fn(),
  addReminder: vi.fn(),
  updateReminder: vi.fn(),
  deleteReminder: vi.fn(),
}));

vi.mock('../../lib/db', () => ({
  ...dbMocks,
}));

const buildCourse = (overrides: Partial<Course> = {}): Course => ({
  id: 'course-30',
  title: 'Curso 30 Dias',
  author: 'Equipe',
  duration: '10:00',
  type: 'video',
  progress: 0,
  thumbnail: 'from-orange-900 to-stone-900',
  description: 'Descricao',
  videoUrl: 'https://youtu.be/video',
  coverImage: '',
  ...overrides,
});

describe('useCatalogData', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    Object.values(dbMocks).forEach((mockFn) => {
      mockFn.mockReset();
    });

    dbMocks.getCourses.mockResolvedValue([]);
    dbMocks.getMindfulFlows.mockResolvedValue([]);
    dbMocks.getMusic.mockResolvedValue([]);
    dbMocks.getReminders.mockResolvedValue([]);

    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('retorna erro e mantem modal aberto quando update falha', async () => {
    dbMocks.updateCourse.mockRejectedValueOnce(new Error('Firestore indisponivel'));

    const { result } = renderHook(() => useCatalogData());

    await waitFor(() => expect(dbMocks.getCourses).toHaveBeenCalled());

    act(() => {
      result.current.setEditingCourse(buildCourse());
      result.current.setIsFormOpen(true);
    });

    let saveResult: { success: boolean; error?: string } | undefined;

    await act(async () => {
      saveResult = await result.current.handleSaveCourse(
        buildCourse({ title: 'Curso 30 Dias atualizado' })
      );
    });

    expect(dbMocks.updateCourse).toHaveBeenCalledWith(
      'course-30',
      expect.objectContaining({ title: 'Curso 30 Dias atualizado' })
    );
    expect(saveResult).toEqual({ success: false, error: 'Firestore indisponivel' });
    expect(result.current.isFormOpen).toBe(true);
    expect(result.current.editingCourse?.id).toBe('course-30');
  });

  it('fecha modal quando save conclui com sucesso', async () => {
    dbMocks.updateCourse.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useCatalogData());

    await waitFor(() => expect(dbMocks.getCourses).toHaveBeenCalled());

    act(() => {
      result.current.setEditingCourse(buildCourse());
      result.current.setIsFormOpen(true);
    });

    let saveResult: { success: boolean; error?: string } | undefined;

    await act(async () => {
      saveResult = await result.current.handleSaveCourse(
        buildCourse({ title: 'Curso salvo com sucesso' })
      );
    });

    expect(saveResult).toEqual({ success: true });
    expect(result.current.isFormOpen).toBe(false);
    expect(result.current.editingCourse).toBeNull();
  });

  it('salva em lote todas as meditacoes e fecha o modal', async () => {
    dbMocks.addMindfulFlow.mockResolvedValueOnce('flow-1').mockResolvedValueOnce('flow-2');

    const { result } = renderHook(() => useCatalogData());

    await waitFor(() => expect(dbMocks.getCourses).toHaveBeenCalled());

    act(() => {
      result.current.setActiveTab('mindful');
    });

    await waitFor(() => expect(dbMocks.getMindfulFlows).toHaveBeenCalled());

    act(() => {
      result.current.setIsFormOpen(true);
    });

    const saveResult = await act(async () => {
      return await result.current.handleSaveMediaBatch([
        buildCourse({ id: undefined, title: 'Meditacao 1' }),
        buildCourse({ id: undefined, title: 'Meditacao 2' }),
      ]);
    });

    expect(saveResult).toEqual({ success: true });
    expect(dbMocks.addMindfulFlow).toHaveBeenCalledTimes(2);
    expect(dbMocks.addMindfulFlow).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Meditacao 1' })
    );
    expect(result.current.isFormOpen).toBe(false);
  });

  it('retorna erro quando uma meditacao falha no lote', async () => {
    dbMocks.addMindfulFlow.mockResolvedValueOnce('flow-1').mockResolvedValueOnce(null);

    const { result } = renderHook(() => useCatalogData());

    await waitFor(() => expect(dbMocks.getCourses).toHaveBeenCalled());

    act(() => {
      result.current.setActiveTab('mindful');
    });

    await waitFor(() => expect(dbMocks.getMindfulFlows).toHaveBeenCalled());

    act(() => {
      result.current.setIsFormOpen(true);
    });

    const saveResult = await act(async () => {
      return await result.current.handleSaveMediaBatch([
        buildCourse({ id: undefined, title: 'Meditacao 1' }),
        buildCourse({ id: undefined, title: 'Meditacao 2' }),
      ]);
    });

    expect(saveResult?.success).toBe(false);
    expect(saveResult?.error).toContain('Meditacao 2');
    expect(dbMocks.addMindfulFlow).toHaveBeenCalledTimes(2);
    expect(result.current.isFormOpen).toBe(true);
  });
});
