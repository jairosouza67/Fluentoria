import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, Plus, Trash, ChevronDown, ChevronRight, Video, Mic, FileText, Layers, Film, Upload, Image as ImageIcon } from 'lucide-react';
import { Course, CourseModule, CourseLesson, CourseGallery } from '../lib/db';
import { uploadCourseCover } from '../lib/media';
import { getYouTubeThumbnail } from '../lib/video';

interface CourseFormProps {
    course?: Course | null;
    onSave: (course: Course) => Promise<void>;
    onCancel: () => void;
}

type ContentMode = 'modules' | 'single';
type ContentType = 'module' | 'video' | null;

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
        galleries: [],
        coverImage: ''
    });
    const [loading, setLoading] = useState(false);
    const [expandedModules, setExpandedModules] = useState<string[]>([]);
    const [expandedGalleries, setExpandedGalleries] = useState<string[]>([]);
    const [contentMode, setContentMode] = useState<ContentMode>('modules');
    const [contentType, setContentType] = useState<ContentType>(null);
    const [coverType, setCoverType] = useState<'link' | 'upload'>('link');
    const [uploadingCover, setUploadingCover] = useState(false);

    useEffect(() => {
        if (course) {
            setFormData({
                ...course,
                modules: course.modules || [],
                galleries: course.galleries || []
            });
            // Handle new gallery structure
            if (course.galleries && course.galleries.length > 0) {
                setExpandedGalleries([course.galleries[0].id]);
                if (course.galleries[0].modules && course.galleries[0].modules.length > 0) {
                    setExpandedModules([course.galleries[0].modules[0].id]);
                }
                setContentMode('modules');
                setContentType('module');
            }
            // Handle old module structure (backward compatibility)
            else if (course.modules && course.modules.length > 0) {
                setExpandedModules([course.modules[0].id]);
                setContentMode('modules');
                setContentType('module');
            } else if (course.videoUrl) {
                setContentMode('single');
                setContentType('video');
            }
        } else {
            // New content: start with module/gallery type by default
            setContentType('module');
            setContentMode('modules');
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
                // Clear old modules array if using galleries
                if (dataToSave.galleries && dataToSave.galleries.length > 0) {
                    dataToSave.modules = [];
                }
            } else {
                dataToSave.modules = []; // Clear modules if in single mode
                dataToSave.galleries = []; // Clear galleries if in single mode
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

    const toggleGallery = (galleryId: string) => {
        setExpandedGalleries(prev =>
            prev.includes(galleryId)
                ? prev.filter(id => id !== galleryId)
                : [...prev, galleryId]
        );
    };

    const addGallery = () => {
        const newGallery: CourseGallery = {
            id: Math.random().toString(36).substr(2, 9),
            title: 'Nova Galeria',
            coverImage: '',
            description: '',
            modules: []
        };
        setFormData(prev => ({
            ...prev,
            galleries: [...(prev.galleries || []), newGallery]
        }));
        setExpandedGalleries(prev => [...prev, newGallery.id]);
    };

    const updateGallery = (galleryId: string, updates: Partial<CourseGallery>) => {
        setFormData(prev => ({
            ...prev,
            galleries: prev.galleries?.map(g =>
                g.id === galleryId ? { ...g, ...updates } : g
            )
        }));
    };

    const deleteGallery = (galleryId: string) => {
        if (confirm('Tem certeza que deseja excluir esta galeria e todos os seus módulos/aulas?')) {
            setFormData(prev => ({
                ...prev,
                galleries: prev.galleries?.filter(g => g.id !== galleryId)
            }));
        }
    };

    const addModule = () => {
        const newModule: CourseModule = {
            id: Math.random().toString(36).substr(2, 9),
            title: 'Novo Módulo',
            coverImage: '',
            lessons: []
        };
        setFormData(prev => ({
            ...prev,
            modules: [...(prev.modules || []), newModule]
        }));
        setExpandedModules(prev => [...prev, newModule.id]);
    };

    const addModuleToGallery = (galleryId: string) => {
        const newModule: CourseModule = {
            id: Math.random().toString(36).substr(2, 9),
            title: 'Novo Módulo',
            coverImage: '',
            lessons: []
        };
        setFormData(prev => ({
            ...prev,
            galleries: prev.galleries?.map(g =>
                g.id === galleryId
                    ? { ...g, modules: [...g.modules, newModule] }
                    : g
            )
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

    const updateModuleInGallery = (galleryId: string, moduleId: string, updates: Partial<CourseModule>) => {
        setFormData(prev => ({
            ...prev,
            galleries: prev.galleries?.map(g =>
                g.id === galleryId
                    ? {
                        ...g,
                        modules: g.modules.map(m =>
                            m.id === moduleId ? { ...m, ...updates } : m
                        )
                    }
                    : g
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

    const deleteModuleFromGallery = (galleryId: string, moduleId: string) => {
        if (confirm('Tem certeza que deseja excluir este módulo e todas as suas aulas?')) {
            setFormData(prev => ({
                ...prev,
                galleries: prev.galleries?.map(g =>
                    g.id === galleryId
                        ? { ...g, modules: g.modules.filter(m => m.id !== moduleId) }
                        : g
                )
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

    const addLessonToGalleryModule = (galleryId: string, moduleId: string) => {
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
            galleries: prev.galleries?.map(g =>
                g.id === galleryId
                    ? {
                        ...g,
                        modules: g.modules.map(m =>
                            m.id === moduleId
                                ? { ...m, lessons: [...m.lessons, newLesson] }
                                : m
                        )
                    }
                    : g
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

    const updateLessonInGallery = (galleryId: string, moduleId: string, lessonId: string, updates: Partial<CourseLesson>) => {
        setFormData(prev => ({
            ...prev,
            galleries: prev.galleries?.map(g =>
                g.id === galleryId
                    ? {
                        ...g,
                        modules: g.modules.map(m =>
                            m.id === moduleId
                                ? {
                                    ...m,
                                    lessons: m.lessons.map(l =>
                                        l.id === lessonId ? { ...l, ...updates } : l
                                    )
                                }
                                : m
                        )
                    }
                    : g
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

    const deleteLessonFromGallery = (galleryId: string, moduleId: string, lessonId: string) => {
        if (confirm('Remover esta aula?')) {
            setFormData(prev => ({
                ...prev,
                galleries: prev.galleries?.map(g =>
                    g.id === galleryId
                        ? {
                            ...g,
                            modules: g.modules.map(m =>
                                m.id === moduleId
                                    ? { ...m, lessons: m.lessons.filter(l => l.id !== lessonId) }
                                    : m
                            )
                        }
                        : g
                )
            }));
        }
    };

    const handleModuleCoverUpload = async (moduleId: string, file: File) => {
        setUploadingCover(true);
        try {
            const url = await uploadCourseCover(file);
            if (url) {
                updateModule(moduleId, { coverImage: url });
            }
        } catch (error) {
            console.error("Error uploading module cover:", error);
        } finally {
            setUploadingCover(false);
        }
    };

    const handleModuleCoverUploadInGallery = async (galleryId: string, moduleId: string, file: File) => {
        setUploadingCover(true);
        try {
            const url = await uploadCourseCover(file);
            if (url) {
                updateModuleInGallery(galleryId, moduleId, { coverImage: url });
            }
        } catch (error) {
            console.error("Error uploading module cover:", error);
        } finally {
            setUploadingCover(false);
        }
    };

    const handleGalleryCoverUpload = async (galleryId: string, file: File) => {
        setUploadingCover(true);
        try {
            const url = await uploadCourseCover(file);
            if (url) {
                updateGallery(galleryId, { coverImage: url });
            }
        } catch (error) {
            console.error("Error uploading gallery cover:", error);
        } finally {
            setUploadingCover(false);
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
                    <div className="flex-1">
                        <h2 className="text-xl font-bold text-[#F3F4F6]">
                            {course ? 'Editar Conteúdo' : contentType === 'video' ? 'Novo Vídeo Solto' : 'Novo Curso'}
                        </h2>
                        {!course && contentType === 'module' && (
                            <button
                                type="button"
                                onClick={() => {
                                    setContentType('video');
                                    setContentMode('single');
                                }}
                                className="text-xs text-[#9CA3AF] hover:text-[#FF6A00] mt-1 transition-colors"
                            >
                                ou criar vídeo solto
                            </button>
                        )}
                        {!course && contentType === 'video' && (
                            <button
                                type="button"
                                onClick={() => {
                                    setContentType('module');
                                    setContentMode('modules');
                                }}
                                className="text-xs text-[#9CA3AF] hover:text-[#FF6A00] mt-1 transition-colors"
                            >
                                ou criar curso com galerias
                            </button>
                        )}
                    </div>
                    <button onClick={onCancel} className="text-[#9CA3AF] hover:text-[#F3F4F6] transition-colors duration-200">
                        <X size={24} />
                    </button>
                </div>

                {/* Form Content - Always shows (removed selection screen) */}
                <form onSubmit={handleSubmit} className="p-6 space-y-8">
                    {/* MODULE TYPE - Simplified fields */}
                    {contentType === 'module' && (
                        <>
                            {/* Basic Module Info */}
                            <div className="space-y-6">
                                <h3 className="text-sm font-semibold text-[#FF6A00] uppercase tracking-wider">Informações do Curso</h3>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-[#9CA3AF]">Título do Curso *</label>
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
                                        <label className="text-sm font-medium text-[#9CA3AF]">Autor *</label>
                                        <input
                                            type="text"
                                            value={formData.author}
                                            onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                                            className="input-pluma w-full"
                                            required
                                            placeholder="Nome do instrutor"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-[#9CA3AF]">Capa do Curso</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={formData.coverImage || ''}
                                                onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                                                className="input-pluma flex-1 text-sm"
                                                placeholder="URL da imagem ou fazer upload"
                                            />
                                            <label className="btn-secondary-pluma cursor-pointer px-4 flex items-center gap-2">
                                                {uploadingCover ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
                                                Upload
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={handleCoverUpload}
                                                />
                                            </label>
                                        </div>
                                        {formData.coverImage && (
                                            <div className="mt-2 relative w-40 h-24 rounded-lg overflow-hidden border border-white/[0.1]">
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

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-[#9CA3AF]">Descrição</label>
                                        <textarea
                                            value={formData.description || ''}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            className="input-pluma w-full h-20 resize-none text-sm"
                                            placeholder="Breve descrição do curso"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="h-px bg-white/[0.06]" />

                            {/* Galleries Section */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-semibold text-[#FF6A00] uppercase tracking-wider">Galerias, Módulos e Aulas</h3>
                                    {formData.galleries && formData.galleries.length === 0 && (
                                        <button
                                            type="button"
                                            onClick={addGallery}
                                            className="flex items-center gap-2 text-sm text-[#FF6A00] hover:text-[#FF6A00]/80 font-medium px-3 py-1.5 rounded-lg hover:bg-[#FF6A00]/10 transition-colors"
                                        >
                                            <Plus size={16} />
                                            Adicionar Galeria
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    {formData.galleries?.map((gallery, galleryIndex) => (
                                        <div key={gallery.id} className="border-2 border-[#FF6A00]/20 rounded-xl overflow-hidden bg-[#0a0a0a]">
                                            {/* Gallery Header */}
                                            <div className="p-4 bg-[#FF6A00]/5 space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleGallery(gallery.id)}
                                                        className="text-[#FF6A00]"
                                                    >
                                                        {expandedGalleries.includes(gallery.id) ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                                    </button>
                                                    <div className="flex-1">
                                                        <input
                                                            type="text"
                                                            value={gallery.title}
                                                            onChange={(e) => updateGallery(gallery.id, { title: e.target.value })}
                                                            className="bg-transparent border-none text-[#FF6A00] font-semibold focus:ring-0 w-full placeholder-[#FF6A00]/50 text-lg"
                                                            placeholder="Nome da Galeria"
                                                        />
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => deleteGallery(gallery.id)}
                                                        className="text-[#9CA3AF] hover:text-red-500 transition-colors p-2"
                                                        title="Excluir Galeria"
                                                    >
                                                        <Trash size={18} />
                                                    </button>
                                                </div>

                                                {/* Gallery Cover Image */}
                                                <div className="flex items-center gap-4">
                                                    {gallery.coverImage && (
                                                        <div className="w-32 h-32 rounded-lg overflow-hidden border border-white/[0.06] flex-shrink-0">
                                                            <img src={gallery.coverImage} alt={gallery.title} className="w-full h-full object-cover" />
                                                        </div>
                                                    )}
                                                    <div className="flex-1">
                                                        <label className="text-xs text-[#9CA3AF] mb-1 block">Imagem de Capa da Galeria</label>
                                                        <div className="flex gap-2">
                                                            <input
                                                                type="text"
                                                                value={gallery.coverImage || ''}
                                                                onChange={(e) => updateGallery(gallery.id, { coverImage: e.target.value })}
                                                                className="input-pluma flex-1 text-sm"
                                                                placeholder="URL da imagem ou fazer upload"
                                                            />
                                                            <label className="btn-secondary-pluma cursor-pointer px-3 flex items-center gap-2 text-sm">
                                                                <Upload size={16} />
                                                                Upload
                                                                <input
                                                                    type="file"
                                                                    accept="image/*"
                                                                    className="hidden"
                                                                    onChange={(e) => e.target.files?.[0] && handleGalleryCoverUpload(gallery.id, e.target.files[0])}
                                                                />
                                                            </label>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Gallery Description */}
                                                <div>
                                                    <label className="text-xs text-[#9CA3AF] mb-1 block">Descrição da Galeria</label>
                                                    <textarea
                                                        value={gallery.description || ''}
                                                        onChange={(e) => updateGallery(gallery.id, { description: e.target.value })}
                                                        className="input-pluma w-full text-sm resize-none"
                                                        placeholder="Descrição da galeria (opcional)"
                                                        rows={2}
                                                    />
                                                </div>
                                            </div>

                                            {/* Modules within Gallery */}
                                            {expandedGalleries.includes(gallery.id) && (
                                                <div className="p-4 border-t border-white/[0.06] bg-[#050505] space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <h4 className="text-sm font-medium text-[#9CA3AF]">Módulos</h4>
                                                        <button
                                                            type="button"
                                                            onClick={() => addModuleToGallery(gallery.id)}
                                                            className="flex items-center gap-2 text-xs text-[#FF6A00] hover:text-[#FF6A00]/80 font-medium px-2 py-1 rounded-lg hover:bg-[#FF6A00]/10 transition-colors"
                                                        >
                                                            <Plus size={14} />
                                                            Adicionar Módulo
                                                        </button>
                                                    </div>

                                                    {gallery.modules.length === 0 && (
                                                        <p className="text-xs text-[#9CA3AF]/50 text-center py-4">Esta galeria ainda não tem módulos.</p>
                                                    )}

                                                    {gallery.modules.map((module) => (
                                                        <div key={module.id} className="border border-white/[0.06] rounded-xl overflow-hidden bg-[#0a0a0a]">
                                                            {/* Module Header */}
                                                            <div className="p-4 bg-white/[0.02] space-y-4">
                                                                <div className="flex items-center gap-3">
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
                                                                            onChange={(e) => updateModuleInGallery(gallery.id, module.id, { title: e.target.value })}
                                                                            className="bg-transparent border-none text-[#F3F4F6] font-medium focus:ring-0 w-full placeholder-[#9CA3AF]/50"
                                                                            placeholder="Nome do Módulo"
                                                                        />
                                                                    </div>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => deleteModuleFromGallery(gallery.id, module.id)}
                                                                        className="text-[#9CA3AF] hover:text-red-500 transition-colors p-2"
                                                                        title="Excluir Módulo"
                                                                    >
                                                                        <Trash size={18} />
                                                                    </button>
                                                                </div>

                                                                {/* Module Cover Image */}
                                                                <div className="flex items-center gap-4">
                                                                    {module.coverImage && (
                                                                        <div className="w-24 h-24 rounded-lg overflow-hidden border border-white/[0.06] flex-shrink-0">
                                                                            <img src={module.coverImage} alt={module.title} className="w-full h-full object-cover" />
                                                                        </div>
                                                                    )}
                                                                    <div className="flex-1">
                                                                        <label className="text-xs text-[#9CA3AF] mb-1 block">Imagem de Capa do Módulo</label>
                                                                        <div className="flex gap-2">
                                                                            <input
                                                                                type="text"
                                                                                value={module.coverImage || ''}
                                                                                onChange={(e) => updateModuleInGallery(gallery.id, module.id, { coverImage: e.target.value })}
                                                                                className="input-pluma flex-1 text-sm"
                                                                                placeholder="URL da imagem ou fazer upload"
                                                                            />
                                                                            <label className="btn-secondary-pluma cursor-pointer px-3 flex items-center gap-2 text-sm">
                                                                                <Upload size={16} />
                                                                                Upload
                                                                                <input
                                                                                    type="file"
                                                                                    accept="image/*"
                                                                                    className="hidden"
                                                                                    onChange={(e) => e.target.files?.[0] && handleModuleCoverUploadInGallery(gallery.id, module.id, e.target.files[0])}
                                                                                />
                                                                            </label>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Module Description */}
                                                                <div>
                                                                    <label className="text-xs text-[#9CA3AF] mb-1 block">Descrição do Módulo</label>
                                                                    <textarea
                                                                        value={module.description || ''}
                                                                        onChange={(e) => updateModuleInGallery(gallery.id, module.id, { description: e.target.value })}
                                                                        className="input-pluma w-full text-sm resize-none"
                                                                        placeholder="Descrição do módulo (opcional)"
                                                                        rows={2}
                                                                    />
                                                                </div>
                                                            </div>

                                                            {/* Lessons List */}
                                                            {expandedModules.includes(module.id) && (
                                                                <div className="p-4 pt-0 border-t border-white/[0.06] bg-[#050505]">
                                                                    <div className="space-y-3 mt-4">
                                                                        {module.lessons.length === 0 && (
                                                                            <p className="text-xs text-[#9CA3AF]/50 text-center py-2">Este módulo ainda não tem aulas.</p>
                                                                        )}

                                                                        {module.lessons.map((lesson) => {
                                                                            const thumbnailUrl = lesson.videoUrl ? getYouTubeThumbnail(lesson.videoUrl) : null;
                                                                            
                                                                            return (
                                                                            <div key={lesson.id} className="p-4 rounded-lg border border-white/[0.06] bg-white/[0.02] space-y-3">
                                                                                {/* Lesson Header */}
                                                                                <div className="flex gap-4">
                                                                                    {/* Thumbnail Preview */}
                                                                                    {thumbnailUrl && (
                                                                                        <div className="w-32 h-20 rounded-lg overflow-hidden border border-white/[0.06] flex-shrink-0 bg-black">
                                                                                            <img src={thumbnailUrl} alt={lesson.title} className="w-full h-full object-cover" />
                                                                                        </div>
                                                                                    )}
                                                                                    
                                                                                    <div className="flex-1 space-y-3">
                                                                                        {/* Title */}
                                                                                        <input
                                                                                            type="text"
                                                                                            value={lesson.title}
                                                                                            onChange={(e) => updateLessonInGallery(gallery.id, module.id, lesson.id, { title: e.target.value })}
                                                                                            className="input-pluma w-full text-sm font-medium"
                                                                                            placeholder="Nome da Aula"
                                                                                        />
                                                                                        
                                                                                        {/* Video URL */}
                                                                                        <input
                                                                                            type="text"
                                                                                            value={lesson.videoUrl || ''}
                                                                                            onChange={(e) => updateLessonInGallery(gallery.id, module.id, lesson.id, { videoUrl: e.target.value })}
                                                                                            className="input-pluma w-full text-sm font-mono text-[#9CA3AF]"
                                                                                            placeholder="Link do Vídeo (YouTube, MP4, etc...)"
                                                                                        />
                                                                                    </div>
                                                                                    
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => deleteLessonFromGallery(gallery.id, module.id, lesson.id)}
                                                                                        className="text-[#9CA3AF] hover:text-red-500 transition-colors p-2 self-start"
                                                                                        title="Excluir Aula"
                                                                                    >
                                                                                        <Trash size={16} />
                                                                                    </button>
                                                                                </div>

                                                                                {/* Description */}
                                                                                <textarea
                                                                                    value={lesson.description || ''}
                                                                                    onChange={(e) => updateLessonInGallery(gallery.id, module.id, lesson.id, { description: e.target.value })}
                                                                                    className="input-pluma w-full text-sm resize-none"
                                                                                    placeholder="Descrição da aula (opcional)"
                                                                                    rows={2}
                                                                                />
                                                                            </div>
                                                                            );
                                                                        })}

                                                                        <button
                                                                            type="button"
                                                                            onClick={() => addLessonToGalleryModule(gallery.id, module.id)}
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
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    {(!formData.galleries || formData.galleries.length === 0) && (
                                        <div className="text-center py-12 border border-dashed border-white/10 rounded-xl text-[#9CA3AF]">
                                            <div className="w-16 h-16 bg-[#1A1A1A] rounded-full flex items-center justify-center mx-auto mb-4 text-[#FF6A00]">
                                                <Layers size={32} />
                                            </div>
                                            <p className="text-lg font-medium text-[#F3F4F6]">Comece adicionando uma galeria</p>
                                            <p className="text-sm opacity-60 mb-6">Galerias organizam módulos e aulas do seu curso.</p>
                                            <button onClick={addGallery} className="btn-primary-pluma inline-flex items-center gap-2">
                                                <Plus size={18} />
                                                Criar Primeira Galeria
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}

                    {/* VIDEO TYPE - Simplified form */}
                    {contentType === 'video' && (
                        <>
                            <div className="space-y-6">
                                <h3 className="text-sm font-semibold text-[#FF6A00] uppercase tracking-wider">Informações do Vídeo</h3>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-[#9CA3AF]">Título *</label>
                                        <input
                                            type="text"
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            className="input-pluma w-full"
                                            required
                                            placeholder="Nome da aula"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-[#9CA3AF]">Autor *</label>
                                        <input
                                            type="text"
                                            value={formData.author}
                                            onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                                            className="input-pluma w-full"
                                            required
                                            placeholder="Nome do instrutor"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-[#9CA3AF]">Link do Vídeo *</label>
                                        <input
                                            type="text"
                                            value={formData.videoUrl || ''}
                                            onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                                            className="input-pluma w-full font-mono text-sm"
                                            required
                                            placeholder="https://youtube.com/..."
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
                                        <label className="text-sm font-medium text-[#9CA3AF]">Descrição</label>
                                        <textarea
                                            value={formData.description || ''}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            className="input-pluma w-full h-20 resize-none text-sm"
                                            placeholder="Breve descrição do conteúdo"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-[#9CA3AF]">Capa</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={formData.coverImage || ''}
                                                onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                                                className="input-pluma flex-1 text-sm"
                                                placeholder="URL da imagem"
                                            />
                                            <label className="btn-secondary-pluma cursor-pointer px-4 flex items-center gap-2">
                                                {uploadingCover ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
                                                Upload
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={handleCoverUpload}
                                                />
                                            </label>
                                        </div>
                                        {formData.coverImage && (
                                            <div className="mt-2 relative w-40 h-24 rounded-lg overflow-hidden border border-white/[0.1]">
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
                            </div>
                        </>
                    )}

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
                            <span>Salvar</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CourseForm;
