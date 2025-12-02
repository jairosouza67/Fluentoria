import React, { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { Course } from '../lib/db';

interface CourseFormProps {
    course?: Course | null;
    onSave: (course: Course) => Promise<void>;
    onCancel: () => void;
}

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
        videoUrl: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (course) {
            setFormData(course);
        }
    }, [course]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave(formData);
        } catch (error) {
            console.error("Error saving course:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#111111] border border-white/[0.06] rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-elevated">
                <div className="flex items-center justify-between p-6 border-b border-white/[0.06] sticky top-0 bg-[#111111] z-10">
                    <h2 className="text-xl font-bold text-[#F3F4F6]">
                        {course ? 'Editar Aula' : 'Nova Aula'}
                    </h2>
                    <button onClick={onCancel} className="text-[#9CA3AF] hover:text-[#F3F4F6] transition-colors duration-200">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-[#9CA3AF]">Título</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="input-pluma w-full"
                                required
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
                            <label className="text-sm font-medium text-[#9CA3AF]">Duração</label>
                            <input
                                type="text"
                                value={formData.duration}
                                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                className="input-pluma w-full"
                                placeholder="Ex: 45 min"
                                required
                            />
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

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-[#9CA3AF]">Thumbnail (Gradiente)</label>
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
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-[#9CA3AF]">URL do Vídeo/Conteúdo</label>
                        <input
                            type="text"
                            value={formData.videoUrl || ''}
                            onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                            className="input-pluma w-full"
                            placeholder="Cole o link do YouTube (ex: https://youtu.be/...)"
                        />
                        <p className="text-xs text-[#9CA3AF]/60">Suporta links do YouTube, vídeos diretos ou outros formatos</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-[#9CA3AF]">Descrição</label>
                        <textarea
                            value={formData.description || ''}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="input-pluma w-full h-32 resize-none"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.06]">
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
