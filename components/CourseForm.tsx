import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, Plus, Trash, ChevronDown, ChevronRight, Video, Mic, FileText, Layers, Film, Upload } from 'lucide-react';
import { Course, CourseModule, CourseLesson } from '../lib/db';
import { uploadCourseCover } from '../lib/media';

interface CourseFormProps {
    course?: Course | null;
    onSave: (course: Course) => Promise<void>;
    onCancel: () => void;
}

type ContentMode = 'modules' | 'single';

const CourseForm: React.FC<CourseFormProps> = ({ course, onSave, onCancel }) => {
    const [formData, setFormData] = useState<Course>({
        title: '',
        author: '',
        duration: '',
        type: 'video',
        progress: 0,
        thumbnail: 'from-orange-900 to-stone-900',
        launchDate: '',
        description: '',
        videoUrl: '',
        modules: [],
        coverImage: ''
    });
    const [loading, setLoading] = useState(false);
    const [expandedModules, setExpandedModules] = useState<string[]>([]);
    const [contentMode, setContentMode] = useState<ContentMode>('modules');
    const [coverType, setCoverType] = useState<'link' | 'upload'>('link');
    const [uploadingCover, setUploadingCover] = useState(false);

    useEffect(() => {
        if (course) {
            setFormData({
                ...course,
                modules: course.modules || []
            });
            if (course.modules && course.modules.length > 0) {
                setExpandedModules([course.modules[0].id]);
                setContentMode('modules');
            } else if (course.videoUrl) {
                setContentMode('single');
            }
        }
    }, [course]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Clean up data based on mode
            const dataToSave = { ...formData };
            if (contentMode === 'modules') {
                dataToSave.videoUrl = ''; // Clear root video if in module mode
                // Calculate total duration from modules if needed, or leave manual
                if (dataToSave.modules && dataToSave.modules.length > 0) {
                    // Could calculate duration here, but user might want to set it manually for the course overview
                }
            } else {
                dataToSave.modules = []; // Clear modules if in single mode
            }
            await onSave(dataToSave);
        } catch (error) {
            console.error("Error saving course:", error);
        } finally {
            setLoading(false);
        }
    };


    const toggleModule = (moduleId: string) => {
        setExpandedModules(prev =>
            prev.includes(moduleId)
                ? prev.filter(id => id !== moduleId)
                : [...prev, moduleId]
        );
    };

    const addModule = () => {
        const newModule: CourseModule = {
            id: Math.random().toString(36).substr(2, 9),
            title: 'Novo Módulo',
            lessons: []
        };
        setFormData(prev => ({
            ...prev,
            modules: [...(prev.modules || []), newModule]
        }));
        setExpandedModules(prev => [...prev, newModule.id]);
    };

    const updateModule = (moduleId: string, updates: Partial<CourseModule>) => {
        setFormData(prev => ({
            ...prev,
            modules: prev.modules?.map(m =>
                m.id === moduleId ? { ...m, ...updates } : m
            )
        }));
    };

    const deleteModule = (moduleId: string) => {
        if (confirm('Tem certeza que deseja excluir este módulo e todas as suas aulas?')) {
            setFormData(prev => ({
                ...prev,
                modules: prev.modules?.filter(m => m.id !== moduleId)
            }));
        }
    };

    const addLesson = (moduleId: string) => {
        const newLesson: CourseLesson = {
            id: Math.random().toString(36).substr(2, 9),
            title: 'Nova Aula',
            duration: '00:00',
            type: 'video',
            videoUrl: '',
            description: ''
        };

        setFormData(prev => ({
            ...prev,
            modules: prev.modules?.map(m =>
                m.id === moduleId
                    ? { ...m, lessons: [...m.lessons, newLesson] }
                    : m
            )
        }));
    };

    const updateLesson = (moduleId: string, lessonId: string, updates: Partial<CourseLesson>) => {
        setFormData(prev => ({
            ...prev,
            modules: prev.modules?.map(m =>
                m.id === moduleId
                    ? {
                        ...m,
                        lessons: m.lessons.map(l =>
                            l.id === lessonId ? { ...l, ...updates } : l
                        )
                    }
                    : m
            )
        }));
    };

    const deleteLesson = (moduleId: string, lessonId: string) => {
        if (confirm('Remover esta aula?')) {
            setFormData(prev => ({
                ...prev,
                modules: prev.modules?.map(m =>
                    m.id === moduleId
                        ? { ...m, lessons: m.lessons.filter(l => l.id !== lessonId) }
                        : m
                )
            }));
        }
    };

    const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setUploadingCover(true);
            try {
                const url = await uploadCourseCover(e.target.files[0]);
                if (url) {
                    setFormData(prev => ({ ...prev, coverImage: url }));
                }
            } catch (error) {
                console.error("Error uploading cover:", error);
            } finally {
                setUploadingCover(false);
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#111111] border border-white/[0.06] rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-elevated">
                <div className="flex items-center justify-between p-6 border-b border-white/[0.06] sticky top-0 bg-[#111111] z-10">
                    <h2 className="text-xl font-bold text-[#F3F4F6]">
                        {course ? 'Editar Aula' : 'Nova Aula'}
                    </h2>
                    <button onClick={onCancel} className="text-[#9CA3AF] hover:text-[#F3F4F6] transition-colors duration-200">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-8">
                    {/* Basic Info - Course Metadata Only */}
                    <div className="space-y-6">
                        <h3 className="text-sm font-semibold text-[#FF6A00] uppercase tracking-wider">Dados do Curso</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-[#9CA3AF]">Título do Curso</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="input-pluma w-full"
                                    required
                                    placeholder="Ex: Curso Completo de Inglês"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-[#9CA3AF]">Autor</label>
                                <input
                                    type="text"
                                    value={formData.author}
                                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                                    className="input-pluma w-full"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-[#9CA3AF]">Thumbnail (Capa)</label>
                                <select
                                    value={formData.thumbnail}
                                    onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                                    className="input-pluma w-full"
                                >
                                    <option value="from-orange-900 to-stone-900">Laranja</option>
                                    <option value="from-blue-900 to-stone-900">Azul</option>
                                    <option value="from-emerald-900 to-stone-900">Verde</option>
                                    <option value="from-purple-900 to-stone-900">Roxo</option>
                                    <option value="from-red-900 to-stone-900">Vermelho</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-[#9CA3AF]">Data de Lançamento</label>
                                <input
                                    type="date"
                                    value={formData.launchDate}
                                    onChange={(e) => setFormData({ ...formData, launchDate: e.target.value })}
                                    className="input-pluma w-full"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-[#9CA3AF]">Descrição</label>
                            <textarea
                                value={formData.description || ''}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="input-pluma w-full h-24 resize-none"
                                placeholder="Sobre o que é este curso?"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-[#9CA3AF]">Capa do Curso</label>
                            <div className="flex gap-2 mb-2">
                                <button
                                    type="button"
                                    onClick={() => setCoverType('link')}
                                    className={`px-3 py-1 text-xs rounded-lg transition-colors ${coverType === 'link' ? 'bg-[#FF6A00] text-white' : 'bg-white/[0.05] text-[#9CA3AF]'}`}
                                >
                                    Link
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCoverType('upload')}
                                    className={`px-3 py-1 text-xs rounded-lg transition-colors ${coverType === 'upload' ? 'bg-[#FF6A00] text-white' : 'bg-white/[0.05] text-[#9CA3AF]'}`}
                                >
                                    Upload
                                </button>
                            </div>

                            {coverType === 'link' ? (
                                <input
                                    type="text"
                                    value={formData.coverImage || ''}
                                    onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                                    className="input-pluma w-full"
                                    placeholder="https://..."
                                />
                            ) : (
                                <div className="flex items-center gap-4">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleCoverUpload}
                                        className="hidden"
                                        id="cover-upload"
                                    />
                                    <label
                                        htmlFor="cover-upload"
                                        className="cursor-pointer px-4 py-2 bg-white/[0.05] hover:bg-white/[0.1] text-[#F3F4F6] rounded-lg text-sm transition-colors flex items-center gap-2"
                                    >
                                        {uploadingCover ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
                                        Escolher Imagem
                                    </label>
                                    {formData.coverImage && (
                                        <span className="text-xs text-[#23D18B]">Imagem selecionada</span>
                                    )}
                                </div>
                            )}

                            {formData.coverImage && (
                                <div className="mt-2 relative aspect-video w-40 rounded-lg overflow-hidden border border-white/[0.1]">
                                    <img src={formData.coverImage} alt="Preview" className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, coverImage: '' })}
                                        className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white hover:bg-red-500/80 transition-colors"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="h-px bg-white/[0.06]" />

                    {/* Content Mode Selection */}
                    <div className="space-y-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <h3 className="text-sm font-semibold text-[#FF6A00] uppercase tracking-wider">Estrutura do Conteúdo</h3>

                            <div className="flex bg-[#1A1A1A] p-1 rounded-lg border border-white/[0.06]">
                                <button
                                    type="button"
                                    onClick={() => setContentMode('modules')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${contentMode === 'modules' ? 'bg-[#FF6A00] text-white shadow-sm' : 'text-[#9CA3AF] hover:text-[#F3F4F6]'}`}
                                >
                                    <Layers size={16} />
                                    Módulos e Aulas
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setContentMode('single')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${contentMode === 'single' ? 'bg-[#FF6A00] text-white shadow-sm' : 'text-[#9CA3AF] hover:text-[#F3F4F6]'}`}
                                >
                                    <Film size={16} />
                                    Vídeo Único
                                </button>
                            </div>
                        </div>

                        {/* Modules Mode UI */}
                        {contentMode === 'modules' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-[#9CA3AF]">Organize seu curso em módulos e aulas.</p>
                                    <button
                                        type="button"
                                        onClick={addModule}
                                        className="flex items-center gap-2 text-sm text-[#FF6A00] hover:text-[#FF6A00]/80 font-medium px-3 py-1.5 rounded-lg hover:bg-[#FF6A00]/10 transition-colors"
                                    >
                                        <Plus size={16} />
                                        Adicionar Módulo
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {formData.modules?.map((module, index) => (
                                        <div key={module.id} className="border border-white/[0.06] rounded-xl overflow-hidden bg-[#0a0a0a]">
                                            {/* Module Header */}
                                            <div className="flex items-center gap-3 p-4 bg-white/[0.02]">
                                                <button
                                                    type="button"
                                                    onClick={() => toggleModule(module.id)}
                                                    className="text-[#9CA3AF] hover:text-[#F3F4F6]"
                                                >
                                                    {expandedModules.includes(module.id) ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                                </button>
                                                <div className="flex-1">
                                                    <input
                                                        type="text"
                                                        value={module.title}
                                                        onChange={(e) => updateModule(module.id, { title: e.target.value })}
                                                        className="bg-transparent border-none text-[#F3F4F6] font-medium focus:ring-0 w-full placeholder-[#9CA3AF]/50"
                                                        placeholder="Nome do Módulo (Ex: Introdução)"
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => deleteModule(module.id)}
                                                    className="text-[#9CA3AF] hover:text-red-500 transition-colors p-2"
                                                    title="Excluir Módulo"
                                                >
                                                    <Trash size={18} />
                                                </button>
                                            </div>

                                            {/* Lessons List */}
                                            {expandedModules.includes(module.id) && (
                                                <div className="p-4 pt-0 border-t border-white/[0.06] bg-[#050505]">
                                                    <div className="space-y-3 mt-4">
                                                        {module.lessons.length === 0 && (
                                                            <p className="text-xs text-[#9CA3AF]/50 text-center py-2">Este módulo ainda não tem aulas.</p>
                                                        )}

                                                        {module.lessons.map((lesson) => (
                                                            <div key={lesson.id} className="p-4 rounded-lg border border-white/[0.06] bg-white/[0.02] space-y-3">
                                                                <div className="flex gap-4">
                                                                    <div className="flex-1 space-y-1">
                                                                        <input
                                                                            type="text"
                                                                            value={lesson.title}
                                                                            onChange={(e) => updateLesson(module.id, lesson.id, { title: e.target.value })}
                                                                            className="input-pluma w-full text-sm"
                                                                            placeholder="Título da Aula"
                                                                        />
                                                                    </div>
                                                                    <div className="w-24 space-y-1">
                                                                        <input
                                                                            type="text"
                                                                            value={lesson.duration}
                                                                            onChange={(e) => updateLesson(module.id, lesson.id, { duration: e.target.value })}
                                                                            className="input-pluma w-full text-sm text-center"
                                                                            placeholder="00:00"
                                                                        />
                                                                    </div>
                                                                    <div className="w-32 space-y-1">
                                                                        <select
                                                                            value={lesson.type}
                                                                            onChange={(e) => updateLesson(module.id, lesson.id, { type: e.target.value as any })}
                                                                            className="input-pluma w-full text-sm"
                                                                        >
                                                                            <option value="video">Vídeo</option>
                                                                            <option value="audio">Áudio</option>
                                                                            <option value="pdf">PDF</option>
                                                                        </select>
                                                                    </div>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => deleteLesson(module.id, lesson.id)}
                                                                        className="text-[#9CA3AF] hover:text-red-500 transition-colors p-2 self-start mt-0.5"
                                                                        title="Excluir Aula"
                                                                    >
                                                                        <Trash size={16} />
                                                                    </button>
                                                                </div>

                                                                <div className="flex gap-4">
                                                                    <div className="flex-1">
                                                                        <input
                                                                            type="text"
                                                                            value={lesson.videoUrl || ''}
                                                                            onChange={(e) => updateLesson(module.id, lesson.id, { videoUrl: e.target.value })}
                                                                            className="input-pluma w-full text-sm font-mono text-[#9CA3AF]"
                                                                            placeholder="URL do Conteúdo (YouTube, MP4, PDF...)"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}

                                                        <button
                                                            type="button"
                                                            onClick={() => addLesson(module.id)}
                                                            className="w-full py-2 border border-dashed border-white/10 rounded-lg text-sm text-[#9CA3AF] hover:text-[#F3F4F6] hover:border-white/20 transition-colors flex items-center justify-center gap-2"
                                                        >
                                                            <Plus size={16} />
                                                            Adicionar Aula
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    {(!formData.modules || formData.modules.length === 0) && (
                                        <div className="text-center py-12 border border-dashed border-white/10 rounded-xl text-[#9CA3AF]">
                                            <div className="w-16 h-16 bg-[#1A1A1A] rounded-full flex items-center justify-center mx-auto mb-4 text-[#FF6A00]">
                                                <Layers size={32} />
                                            </div>
                                            <p className="text-lg font-medium text-[#F3F4F6]">Comece adicionando um módulo</p>
                                            <p className="text-sm opacity-60 mb-6">Módulos ajudam a organizar as aulas do seu curso.</p>
                                            <button onClick={addModule} className="btn-primary-pluma inline-flex items-center gap-2">
                                                <Plus size={18} />
                                                Criar Primeiro Módulo
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Single Video Mode UI */}
                        {contentMode === 'single' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
                                <p className="text-sm text-[#9CA3AF]">Use esta opção para cursos simples ou aulas avulsas que consistem em apenas um vídeo principal.</p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-[#9CA3AF]">URL do Vídeo/Conteúdo</label>
                                        <input
                                            type="text"
                                            value={formData.videoUrl || ''}
                                            onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                                            className="input-pluma w-full"
                                            placeholder="Cole o link do YouTube (ex: https://youtu.be/...)"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-[#9CA3AF]">Duração</label>
                                        <input
                                            type="text"
                                            value={formData.duration}
                                            onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                            className="input-pluma w-full"
                                            placeholder="Ex: 45 min"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-[#9CA3AF]">Tipo</label>
                                        <select
                                            value={formData.type}
                                            onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                                            className="input-pluma w-full"
                                        >
                                            <option value="video">Vídeo</option>
                                            <option value="audio">Áudio</option>
                                            <option value="pdf">PDF</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-white/[0.06]">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="btn-ghost-pluma"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary-pluma disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                            <span>Salvar Aula</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CourseForm;
