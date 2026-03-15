import React, { useState, useEffect } from 'react';
import {
    X,
    Save,
    Loader2,
    Plus,
    Trash,
    ChevronDown,
    ChevronRight,
    Video,
    Mic,
    FileText,
    Layers,
    Film,
    Upload,
    Image as ImageIcon,
    Clock,
    Paperclip,
    File as FileIcon,
    Type,
    AlignLeft
} from 'lucide-react';
import { Course, CourseModule, CourseLesson, CourseGallery, SupportMaterial } from '../lib/db';
import { uploadCourseCover, uploadSupportMaterial, formatFileSize } from '../lib/media';
import { getYouTubeThumbnail, formatDuration } from '../lib/video';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Modal } from './ui/Modal';
import { Card } from './ui/Card';
import { cn } from '../lib/utils';

interface CourseFormProps {
    course?: Course | null;
    onSave: (course: Course) => Promise<void>;
    onCancel: () => void;
    activeTab?: 'courses' | 'gallery' | 'mindful' | 'music';
    availableCourses?: Course[];
}

type ContentMode = 'modules' | 'single';
type ContentType = 'module' | 'video' | null;

const CourseForm: React.FC<CourseFormProps> = ({ course, onSave, onCancel, activeTab, availableCourses }) => {
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
    const [uploadingMaterial, setUploadingMaterial] = useState<{ [key: string]: boolean }>({});

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
                    // Auto-fill title and author for gallery container if not editing
                    if (!course && !dataToSave.title) {
                        dataToSave.title = 'Minhas Galerias'; // Fixed container name
                    }
                    if (!course && !dataToSave.author) {
                        dataToSave.author = 'Instrutor';
                    }
                }
            } else {
                dataToSave.modules = []; // Clear modules if in single mode
                dataToSave.galleries = []; // Clear galleries if in single mode
            }
            if (dataToSave.productId === undefined) {
                delete dataToSave.productId;
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

    const capturVideoDuration = (videoUrl: string, galleryId: string, moduleId: string, lessonId: string) => {
        if (!videoUrl) return;

        const video = document.createElement('video');
        video.src = videoUrl;
        video.preload = 'metadata';

        video.onloadedmetadata = () => {
            const duration = formatDuration(video.duration);
            updateLessonInGallery(galleryId, moduleId, lessonId, { duration });
            video.remove();
        };

        video.onerror = () => {
            console.error('Error loading video metadata');
            video.remove();
        };
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

    const handleSupportMaterialUpload = async (
        file: File,
        galleryId: string,
        moduleId: string,
        lessonId: string
    ) => {
        const uploadKey = `${galleryId}-${moduleId}-${lessonId}`;
        setUploadingMaterial(prev => ({ ...prev, [uploadKey]: true }));

        try {
            const courseId = formData.id || 'temp';
            const url = await uploadSupportMaterial(file, courseId, lessonId);

            if (url) {
                // Determine file type
                let materialType: 'pdf' | 'image' | 'audio' = 'pdf';
                if (file.type.startsWith('image/')) materialType = 'image';
                else if (file.type.startsWith('audio/')) materialType = 'audio';

                const newMaterial: SupportMaterial = {
                    id: Math.random().toString(36).substr(2, 9),
                    name: file.name,
                    url: url,
                    type: materialType,
                    size: file.size,
                    uploadedAt: new Date().toISOString()
                };

                // Update lesson with new material
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
                                                l.id === lessonId
                                                    ? {
                                                        ...l,
                                                        supportMaterials: [...(l.supportMaterials || []), newMaterial]
                                                    }
                                                    : l
                                            )
                                        }
                                        : m
                                )
                            }
                            : g
                    )
                }));
            }
        } catch (error) {
            console.error('Error uploading support material:', error);
        } finally {
            setUploadingMaterial(prev => ({ ...prev, [uploadKey]: false }));
        }
    };

    const removeSupportMaterial = (
        galleryId: string,
        moduleId: string,
        lessonId: string,
        materialId: string
    ) => {
        if (!confirm('Remover este material de apoio?')) return;

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
                                        l.id === lessonId
                                            ? {
                                                ...l,
                                                supportMaterials: l.supportMaterials?.filter(mat => mat.id !== materialId)
                                            }
                                            : l
                                    )
                                }
                                : m
                        )
                    }
                    : g
            )
        }));
    };

    return (
        <Modal
            isOpen={true}
            onClose={onCancel}
            title={course ? 'Editar Conteúdo' : contentType === 'video' ? 'Novo Vídeo Solto' : 'Criar Galerias'}
            description={
                !course ? (
                    contentType === 'module' ? (
                        <button
                            type="button"
                            onClick={() => {
                                setContentType('video');
                                setContentMode('single');
                            }}
                            className="text-xs text-muted-foreground hover:text-primary transition-colors"
                        >
                            ou clique aqui para criar vídeo solto
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => {
                                setContentType('module');
                                setContentMode('modules');
                            }}
                            className="text-xs text-muted-foreground hover:text-primary transition-colors"
                        >
                            ou clique aqui para criar galerias
                        </button>
                    )
                ) : undefined
            }
            maxWidth="4xl"
            footer={
                <div className="flex flex-row justify-end gap-3 w-full">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onCancel}
                        className="h-10 px-5 text-sm"
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        form="course-form"
                        disabled={loading}
                        className="h-10 px-5 text-sm gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                        <span>Salvar {course ? 'Alterações' : 'Conteúdo'}</span>
                    </Button>
                </div>
            }
        >
            <form id="course-form" onSubmit={handleSubmit} className="space-y-6 p-0">
                {/* MODULE TYPE - Simplified fields */}
                {contentType === 'module' && (
                    <>
                        {/* Course Main Info */}
                        <div className="space-y-6">
                            <h3 className="text-sm font-semibold text-primary uppercase tracking-wider flex items-center gap-2">
                                <Film size={16} />
                                Informações do Curso
                            </h3>

                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Course Title */}
                                <Input
                                    label="Nome do Curso"
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                    placeholder="Ex: Curso de Inglês Avançado"
                                    required
                                    icon={<Type size={18} className="text-muted-foreground" />}
                                />

                                {(activeTab === 'mindful' || activeTab === 'music') ? (
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">
                                            Curso Vinculado *
                                        </label>
                                        <div className="relative">
                                            <select
                                                value={formData.productId || ''}
                                                onChange={(e) => setFormData(prev => ({ ...prev, productId: e.target.value === '' ? undefined : e.target.value }))}
                                                required
                                                className="w-full bg-white/[0.02] border border-white/[0.06] rounded-xl text-sm h-12 px-4 text-[#F3F4F6] focus:outline-none focus:border-[#FF6A00]/40 transition-colors duration-[120ms] cursor-pointer appearance-none"
                                            >
                                                <option value="" disabled className="bg-stone-900">Selecione um curso</option>
                                                {availableCourses?.map(c => (
                                                    <option key={c.id} value={c.id} className="bg-stone-900">
                                                        {c.title}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-muted-foreground">
                                                <ChevronDown size={16} />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">
                                            Produto (Opcional)
                                        </label>
                                        <div className="relative">
                                            <select
                                                value={formData.productId || 'all'}
                                                onChange={(e) => setFormData(prev => ({ ...prev, productId: e.target.value === 'all' ? undefined : e.target.value }))}
                                                className="w-full bg-white/[0.02] border border-white/[0.06] rounded-xl text-sm h-12 px-4 text-[#F3F4F6] focus:outline-none focus:border-[#FF6A00]/40 transition-colors duration-[120ms] cursor-pointer appearance-none"
                                            >
                                                <option value="all" className="bg-stone-900">Todos os Produtos</option>
                                                <option value="1" className="bg-stone-900">Fluentoria Mindful (ID 1)</option>
                                                <option value="2" className="bg-stone-900">Fluentoria Music (ID 2)</option>
                                            </select>
                                            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-muted-foreground">
                                                <ChevronDown size={16} />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Course Cover Image */}
                            <div className="grid md:grid-cols-4 gap-6 items-start">
                                {formData.coverImage && (
                                    <div className="md:col-span-1 rounded-xl overflow-hidden border border-white/[0.08] shadow-lg group relative">
                                        <img src={formData.coverImage} alt={formData.title} className="w-full h-auto block transition-transform duration-500 group-hover:scale-110" />
                                        <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                                    </div>
                                )}
                                <div className={cn("space-y-4", formData.coverImage ? "md:col-span-3" : "md:col-span-4")}>
                                    <Input
                                        label="Link da Imagem de Capa"
                                        type="text"
                                        value={formData.coverImage || ''}
                                        onChange={(e) => setFormData(prev => ({ ...prev, coverImage: e.target.value }))}
                                        placeholder="Cole a URL ou faça upload abaixo"
                                        icon={<ImageIcon size={18} />}
                                    />
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-1">
                                        <label className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#FF6A00]/10 text-[#FF6A00] hover:bg-[#FF6A00] hover:text-white cursor-pointer text-sm font-bold transition-all border border-[#FF6A00]/20 shadow-sm active:scale-95">
                                            {uploadingCover ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                                            {uploadingCover ? 'Enviando...' : 'Upload da Capa'}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={handleCoverUpload}
                                                disabled={uploadingCover}
                                            />
                                        </label>
                                        <p className="text-[10px] text-muted-foreground font-medium max-w-[200px] leading-tight">Sugestão: 1280x720px para melhor qualidade.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Galleries Section - Direct creation */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between border-b border-border pb-2">
                                <h3 className="text-sm font-semibold text-primary uppercase tracking-wider flex items-center gap-2">
                                    <Layers size={16} />
                                    Galerias, Módulos e Aulas
                                </h3>
                                {formData.galleries && formData.galleries.length === 0 && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={addGallery}
                                        className="text-primary hover:bg-primary/10"
                                    >
                                        <Plus size={16} className="mr-2" />
                                        Adicionar Galeria
                                    </Button>
                                )}
                            </div>

                            <div className="space-y-4">
                                {formData.galleries?.map((gallery, galleryIndex) => (
                                    <Card key={gallery.id} className="glass border-white/[0.08] overflow-hidden rounded-2xl shadow-elevated transition-all duration-300 hover:border-primary/30">
                                        {/* Gallery Header */}
                                        <div className="p-5 bg-white/[0.02] border-b border-white/[0.06] space-y-5">
                                            <div className="flex items-center gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => toggleGallery(gallery.id)}
                                                    className="text-primary hover:bg-primary/10 p-1 rounded transition-colors"
                                                >
                                                    {expandedGalleries.includes(gallery.id) ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                                </button>
                                                <div className="flex-1">
                                                    <Input
                                                        value={gallery.title}
                                                        onChange={(e) => updateGallery(gallery.id, { title: e.target.value })}
                                                        placeholder="Nome da Galeria"
                                                        className="text-primary font-bold text-lg"
                                                    />
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => deleteGallery(gallery.id)}
                                                    className="text-muted-foreground hover:text-destructive"
                                                    title="Excluir Galeria"
                                                >
                                                    <Trash size={18} />
                                                </Button>
                                            </div>

                                            {/* Gallery Cover & Description */}
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-1">Capa da Galeria</label>
                                                    <div className="flex gap-2">
                                                        <Input
                                                            type="text"
                                                            value={gallery.coverImage || ''}
                                                            onChange={(e) => updateGallery(gallery.id, { coverImage: e.target.value })}
                                                            placeholder="URL da imagem ou upload"
                                                            className="h-9 text-sm"
                                                        />
                                                        <label className="flex items-center justify-center p-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 cursor-pointer border border-border transition-colors">
                                                            <Upload size={16} />
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                className="hidden"
                                                                onChange={(e) => e.target.files?.[0] && handleGalleryCoverUpload(gallery.id, e.target.files[0])}
                                                            />
                                                        </label>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-1">Descrição</label>
                                                    <textarea
                                                        value={gallery.description || ''}
                                                        onChange={(e) => updateGallery(gallery.id, { description: e.target.value })}
                                                        className="w-full bg-background/50 border border-border rounded-lg text-sm p-2.5 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all resize-none h-[38px]"
                                                        placeholder="Breve descrição"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Modules within Gallery */}
                                        {expandedGalleries.includes(gallery.id) && (
                                            <div className="p-4 border-t border-border/50 bg-background/40 space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                                        <Layers size={14} className="text-primary/70" />
                                                        Módulos
                                                    </h4>
                                                    <Button
                                                        type="button"
                                                        variant="secondary"
                                                        size="sm"
                                                        onClick={() => addModuleToGallery(gallery.id)}
                                                        className="h-8 text-xs gap-1.5"
                                                    >
                                                        <Plus size={14} />
                                                        Add Módulo
                                                    </Button>
                                                </div>

                                                {gallery.modules.length === 0 && (
                                                    <div className="text-center py-8 border border-dashed border-border rounded-xl">
                                                        <p className="text-xs text-muted-foreground">Esta galeria ainda não tem módulos.</p>
                                                    </div>
                                                )}

                                                <div className="space-y-4">
                                                    {gallery.modules.map((module) => (
                                                        <div key={module.id} className="bg-white/[0.03] border border-white/[0.08] rounded-xl overflow-hidden shadow-sm transition-all hover:bg-white/[0.04]">
                                                            {/* Module Header */}
                                                            <div className="p-3 flex items-center gap-3 bg-white/[0.02]">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => toggleModule(module.id)}
                                                                    className="text-muted-foreground hover:text-foreground p-1 transition-colors"
                                                                >
                                                                    {expandedModules.includes(module.id) ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                                                </button>
                                                                <Input
                                                                    value={module.title}
                                                                    onChange={(e) => updateModuleInGallery(gallery.id, module.id, { title: e.target.value })}
                                                                    placeholder="Nome do Módulo"
                                                                    className="flex-1 h-10"
                                                                />
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => deleteModuleFromGallery(gallery.id, module.id)}
                                                                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                                                >
                                                                    <Trash size={16} />
                                                                </Button>
                                                            </div>

                                                            {/* Module Content */}
                                                            {expandedModules.includes(module.id) && (
                                                                <div className="p-4 space-y-4 bg-transparent">
                                                                    {/* Module Meta */}
                                                                    <div className="grid md:grid-cols-2 gap-4">
                                                                        <div className="space-y-2">
                                                                            <label className="text-[10px] font-bold text-muted-foreground uppercase px-1">Capa do Módulo</label>
                                                                            <div className="flex gap-2">
                                                                                <Input
                                                                                    type="text"
                                                                                    value={module.coverImage || ''}
                                                                                    onChange={(e) => updateModuleInGallery(gallery.id, module.id, { coverImage: e.target.value })}
                                                                                    placeholder="URL ou upload"
                                                                                    className="h-9 text-sm"
                                                                                />
                                                                                <label className="flex items-center justify-center p-2 rounded-lg bg-secondary hover:bg-secondary/80 cursor-pointer border border-border transition-colors">
                                                                                    <Upload size={16} />
                                                                                    <input
                                                                                        type="file"
                                                                                        accept="image/*"
                                                                                        className="hidden"
                                                                                        onChange={(e) => e.target.files?.[0] && handleModuleCoverUploadInGallery(gallery.id, module.id, e.target.files[0])}
                                                                                    />
                                                                                </label>
                                                                            </div>
                                                                        </div>
                                                                        <div className="space-y-2">
                                                                            <label className="text-[10px] font-bold text-muted-foreground uppercase px-1">Descrição</label>
                                                                            <Input
                                                                                value={module.description || ''}
                                                                                onChange={(e) => updateModuleInGallery(gallery.id, module.id, { description: e.target.value })}
                                                                                placeholder="Sobre o módulo"
                                                                                className="h-9 text-sm"
                                                                            />
                                                                        </div>
                                                                    </div>

                                                                    {/* Lessons List */}
                                                                    <div className="pt-2">
                                                                        <h5 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2 mb-3 px-1">
                                                                            <Film size={12} className="text-primary/50" />
                                                                            Aulas
                                                                        </h5>

                                                                        <div className="space-y-3">
                                                                            {module.lessons.map((lesson) => {
                                                                                const thumbnailUrl = lesson.videoUrl ? getYouTubeThumbnail(lesson.videoUrl) : null;
                                                                                return (
                                                                                    <div key={lesson.id} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 flex flex-col sm:flex-row items-start gap-4 transition-all hover:border-primary/20 hover:bg-white/[0.05] group">
                                                                                        <div className="flex gap-4">
                                                                                            {thumbnailUrl && (
                                                                                                <div className="w-24 h-14 rounded-lg overflow-hidden border border-border/50 flex-shrink-0 bg-black">
                                                                                                    <img src={thumbnailUrl} alt={lesson.title} className="w-full h-full object-cover" />
                                                                                                </div>
                                                                                            )}
                                                                                            <div className="flex-1 space-y-3">
                                                                                                <Input
                                                                                                    value={lesson.title}
                                                                                                    onChange={(e) => updateLessonInGallery(gallery.id, module.id, lesson.id, { title: e.target.value })}
                                                                                                    placeholder="Título da Aula"
                                                                                                    className="font-bold border-white/[0.05]"
                                                                                                />
                                                                                                <Input
                                                                                                    value={lesson.videoUrl || ''}
                                                                                                    onChange={(e) => updateLessonInGallery(gallery.id, module.id, lesson.id, { videoUrl: e.target.value })}
                                                                                                    placeholder="Link do Vídeo"
                                                                                                    className="font-mono text-xs text-muted-foreground border-white/[0.05]"
                                                                                                    icon={<Video size={14} />}
                                                                                                />
                                                                                            </div>
                                                                                            <Button
                                                                                                variant="ghost"
                                                                                                size="sm"
                                                                                                onClick={() => deleteLessonFromGallery(gallery.id, module.id, lesson.id)}
                                                                                                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive opacity-0 group-hover/lesson:opacity-100 transition-opacity"
                                                                                            >
                                                                                                <Trash size={14} />
                                                                                            </Button>
                                                                                        </div>

                                                                                        <div className="flex items-center gap-4">
                                                                                            <div className="flex items-center gap-2 flex-1">
                                                                                                <Clock size={12} className="text-muted-foreground" />
                                                                                                <Input
                                                                                                    value={lesson.duration || '00:00'}
                                                                                                    onChange={(e) => updateLessonInGallery(gallery.id, module.id, lesson.id, { duration: e.target.value })}
                                                                                                    placeholder="00:00"
                                                                                                    className="w-24 text-center"
                                                                                                    icon={<Clock size={12} />}
                                                                                                />
                                                                                            </div>
                                                                                            {/* Support Materials summary */}
                                                                                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                                                                <Paperclip size={10} />
                                                                                                {lesson.supportMaterials?.length || 0} anexos
                                                                                            </span>
                                                                                        </div>
                                                                                    </div>
                                                                                );
                                                                            })}

                                                                            <Button
                                                                                type="button"
                                                                                variant="outline"
                                                                                size="sm"
                                                                                onClick={() => addLessonToGalleryModule(gallery.id, module.id)}
                                                                                className="w-full border-dashed border-border/60 hover:border-primary/40 text-muted-foreground h-9"
                                                                            >
                                                                                <Plus size={14} className="mr-2" />
                                                                                Adicionar Aula
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </Card>
                                ))}
                            </div>

                            {(!formData.galleries || formData.galleries.length === 0) && (
                                <div className="text-center py-16 border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center gap-4 opacity-70">
                                    <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center text-primary/50">
                                        <Layers size={32} />
                                    </div>
                                    <div className="max-w-xs space-y-1">
                                        <p className="font-bold text-foreground">Prepare sua Galeria</p>
                                        <p className="text-xs text-muted-foreground">Comece criando uma galeria para organizar seus módulos e aulas de forma profissional.</p>
                                    </div>
                                    <Button onClick={addGallery} className="mt-2">
                                        <Plus size={18} className="mr-2" />
                                        Criar Primeira Galeria
                                    </Button>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* VIDEO TYPE - Simplified form */}
                {contentType === 'video' && (
                    <div className="grid gap-6">
                        <div className="flex items-center gap-2 border-b border-border pb-2">
                            <Film size={18} className="text-primary" />
                            <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">Informações do Vídeo</h3>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <Input
                                label="Título do Vídeo *"
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                required
                                placeholder="Ex: Introdução ao Curso"
                                icon={<Type size={18} className="text-muted-foreground" />}
                            />

                            <Input
                                label="Autor / Instrutor *"
                                type="text"
                                value={formData.author}
                                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                                required
                                placeholder="Nome do autor"
                                icon={<Type size={18} className="text-muted-foreground" />}
                            />

                            <div className="md:col-span-2">
                                <Input
                                    label="Link do Vídeo *"
                                    type="text"
                                    value={formData.videoUrl || ''}
                                    onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                                    required
                                    placeholder="YouTube link ou link direto (.mp4)"
                                    icon={<Film size={18} className="text-muted-foreground" />}
                                    className="font-mono text-sm"
                                />
                            </div>

                            <div className="md:col-span-2 grid md:grid-cols-2 gap-6">
                                <Input
                                    label="Duração"
                                    type="text"
                                    value={formData.duration}
                                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                    placeholder="Ex: 15:00"
                                    icon={<Clock size={18} className="text-muted-foreground" />}
                                />

                                {(activeTab === 'mindful' || activeTab === 'music') ? (
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">
                                            Curso Vinculado *
                                        </label>
                                        <div className="relative">
                                            <select
                                                value={formData.productId || ''}
                                                onChange={(e) => setFormData(prev => ({ ...prev, productId: e.target.value === '' ? undefined : e.target.value }))}
                                                required
                                                className="w-full bg-white/[0.02] border border-white/[0.06] rounded-xl text-sm h-12 px-4 text-[#F3F4F6] focus:outline-none focus:border-[#FF6A00]/40 transition-colors duration-[120ms] cursor-pointer appearance-none"
                                            >
                                                <option value="" disabled className="bg-stone-900">Selecione um curso</option>
                                                {availableCourses?.map(c => (
                                                    <option key={c.id} value={c.id} className="bg-stone-900">
                                                        {c.title}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-muted-foreground">
                                                <ChevronDown size={16} />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">
                                            Produto (Opcional)
                                        </label>
                                        <div className="relative">
                                            <select
                                                value={formData.productId || 'all'}
                                                onChange={(e) => setFormData(prev => ({ ...prev, productId: e.target.value === 'all' ? undefined : e.target.value }))}
                                                className="w-full bg-white/[0.02] border border-white/[0.06] rounded-xl text-sm h-12 px-4 text-[#F3F4F6] focus:outline-none focus:border-[#FF6A00]/40 transition-colors duration-[120ms] cursor-pointer appearance-none"
                                            >
                                                <option value="all" className="bg-stone-900">Todos os Produtos</option>
                                                <option value="1" className="bg-stone-900">Fluentoria Mindful (ID 1)</option>
                                                <option value="2" className="bg-stone-900">Fluentoria Music (ID 2)</option>
                                            </select>
                                            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-muted-foreground">
                                                <ChevronDown size={16} />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="md:col-span-2">
                                <Input
                                    label="Capa do Vídeo"
                                    type="text"
                                    value={formData.coverImage || ''}
                                    onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                                    placeholder="URL da imagem customizada"
                                    icon={<ImageIcon size={18} className="text-muted-foreground" />}
                                />
                                <div className="mt-3">
                                    <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 cursor-pointer text-sm font-medium transition-colors border border-border shadow-sm">
                                        <Upload size={16} />
                                        Upload
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleCoverUpload}
                                        />
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1 flex items-center gap-2">
                                <AlignLeft size={14} />
                                Descrição
                            </label>
                            <textarea
                                value={formData.description || ''}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full bg-white/[0.02] border border-white/[0.06] rounded-xl text-sm p-4 text-[#F3F4F6] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#FF6A00]/40 transition-colors duration-[120ms] resize-none h-32"
                                placeholder="Detalhes sobre este conteúdo..."
                            />
                        </div>
                    </div>
                )}

            </form>
        </Modal>
    );
};

export default CourseForm;
