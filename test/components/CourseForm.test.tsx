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

  it('permite adicionar e salvar varios lembretes de uma vez', async () => {
    const onSaveMany = vi.fn().mockResolvedValue({ success: true });

    render(
      <CourseForm
        course={null}
        onSave={vi.fn().mockResolvedValue({ success: true })}
        onSaveMany={onSaveMany}
        onCancel={vi.fn()}
        activeTab="reminders"
        availableCourses={[]}
      />
    );

    // Comeca com um unico lembrete
    expect(screen.getByText('Novo Lembrete')).toBeInTheDocument();
    expect(screen.getByText('Lembrete 1')).toBeInTheDocument();
    expect(screen.queryByText('Lembrete 2')).not.toBeInTheDocument();

    // Adiciona um segundo lembrete
    fireEvent.click(screen.getByRole('button', { name: /Adicionar Lembrete/i }));
    expect(screen.getByText('Lembrete 2')).toBeInTheDocument();

    // Preenche os dois lembretes
    const titleInputs = screen.getAllByPlaceholderText('Ex: Aviso importante da semana');
    const urlInputs = screen.getAllByPlaceholderText('Cole a URL do vídeo do lembrete');
    const messageInputs = screen.getAllByPlaceholderText('Digite a mensagem completa do lembrete');
    expect(titleInputs).toHaveLength(2);

    fireEvent.change(titleInputs[0], { target: { value: 'Lembrete A' } });
    fireEvent.change(urlInputs[0], { target: { value: 'https://youtu.be/a' } });
    fireEvent.change(messageInputs[0], { target: { value: 'Mensagem A' } });

    fireEvent.change(titleInputs[1], { target: { value: 'Lembrete B' } });
    fireEvent.change(urlInputs[1], { target: { value: 'https://youtu.be/b' } });
    fireEvent.change(messageInputs[1], { target: { value: 'Mensagem B' } });

    fireEvent.click(screen.getByRole('button', { name: /Salvar Lembretes/i }));

    await waitFor(() => expect(onSaveMany).toHaveBeenCalledTimes(1));
    const savedDrafts = onSaveMany.mock.calls[0][0];
    expect(savedDrafts).toHaveLength(2);
    expect(savedDrafts[0]).toMatchObject({
      title: 'Lembrete A',
      videoUrl: 'https://youtu.be/a',
      description: 'Mensagem A',
    });
    expect(savedDrafts[1]).toMatchObject({
      title: 'Lembrete B',
      videoUrl: 'https://youtu.be/b',
      description: 'Mensagem B',
    });
  });

  it('permite remover um lembrete adicionado antes de salvar', () => {
    render(
      <CourseForm
        course={null}
        onSave={vi.fn()}
        onSaveMany={vi.fn()}
        onCancel={vi.fn()}
        activeTab="reminders"
        availableCourses={[]}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Adicionar Lembrete/i }));
    expect(screen.getByText('Lembrete 2')).toBeInTheDocument();

    fireEvent.click(screen.getAllByTitle('Remover lembrete')[1]);
    expect(screen.queryByText('Lembrete 2')).not.toBeInTheDocument();
    expect(screen.getByText('Lembrete 1')).toBeInTheDocument();
  });

  it('exibe erro identificando o lembrete incompleto ao salvar', async () => {
    const onSaveMany = vi.fn().mockResolvedValue({ success: true });

    render(
      <CourseForm
        course={null}
        onSave={vi.fn()}
        onSaveMany={onSaveMany}
        onCancel={vi.fn()}
        activeTab="reminders"
        availableCourses={[]}
      />
    );

    // Preenche com espacos para contornar a validacao nativa e exercitar a validacao do form
    fireEvent.change(screen.getByPlaceholderText('Ex: Aviso importante da semana'), {
      target: { value: '   ' },
    });
    fireEvent.change(screen.getByPlaceholderText('Cole a URL do vídeo do lembrete'), {
      target: { value: 'https://youtu.be/a' },
    });
    fireEvent.change(screen.getByPlaceholderText('Digite a mensagem completa do lembrete'), {
      target: { value: 'Mensagem valida' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Salvar Lembrete/i }));

    await waitFor(() =>
      expect(screen.getByText('Lembrete 1: informe o título.')).toBeInTheDocument()
    );
    expect(onSaveMany).not.toHaveBeenCalled();
  });
});
