import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CourseForm from '../../components/CourseForm';
import type { Course } from '../../lib/db/types';

vi.mock('../../lib/media', () => ({
  uploadCourseCover: vi.fn(async () => null),
  uploadSupportMaterial: vi.fn(async () => null),
  formatFileSize: vi.fn(() => '0 B'),
}));

vi.mock('../../lib/video', () => ({
  getYouTubeThumbnail: vi.fn(() => ''),
  formatDuration: vi.fn(() => '00:00'),
}));

const buildCourse = (overrides: Partial<Course> = {}): Course => ({
  id: 'course-30',
  title: 'Curso 30 Dias',
  author: 'Equipe',
  duration: '10:00',
  type: 'video',
  progress: 0,
  thumbnail: 'from-orange-900 to-stone-900',
  launchDate: '',
  description: '',
  videoUrl: '',
  modules: [],
  galleries: [],
  coverImage: '',
  ...overrides,
});

describe('CourseForm', () => {
  it('aplica fallback para modo de galerias ao editar curso vazio na aba de cursos', () => {
    const emptyCourse = buildCourse({
      modules: undefined,
      galleries: undefined,
      videoUrl: '   ',
    });

    render(
      <CourseForm
        course={emptyCourse}
        onSave={vi.fn().mockResolvedValue({ success: true })}
        onCancel={vi.fn()}
        activeTab="courses"
        availableCourses={[]}
      />
    );

    expect(screen.getByText('Informações do Curso')).toBeInTheDocument();
    expect(screen.queryByText('Informações do Vídeo')).not.toBeInTheDocument();
  });

  it('mantem o modal com erro visivel quando o save retorna falha', async () => {
    const onSave = vi.fn().mockResolvedValue({
      success: false,
      error: 'Falha ao atualizar curso',
    });

    render(
      <CourseForm
        course={buildCourse({
          id: 'rem-1',
          title: 'Lembrete importante',
          description: 'Mensagem valida',
          videoUrl: 'https://youtu.be/video',
          author: '',
          duration: '',
        })}
        onSave={onSave}
        onCancel={vi.fn()}
        activeTab="reminders"
        availableCourses={[]}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Salvar Alterações/i }));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(screen.getByText('Falha ao atualizar curso')).toBeInTheDocument();
    expect(screen.getByText('Editar Lembrete')).toBeInTheDocument();
  });
});
