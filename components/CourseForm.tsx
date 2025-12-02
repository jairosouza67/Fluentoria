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
            <div className="bg-[#1c1917] border border-stone-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="flex items-center justify-between p-6 border-b border-stone-800 sticky top-0 bg-[#1c1917] z-10">
                    <h2 className="text-xl font-bold text-white">
                        {course ? 'Editar Aula' : 'Nova Aula'}
                    </h2>
                    <button onClick={onCancel} className="text-stone-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-stone-300">Título</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full bg-[#292524] border border-stone-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-orange-500"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-stone-300">Autor</label>
                            <input
                                type="text"
                                value={formData.author}
                                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                                className="w-full bg-[#292524] border border-stone-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-orange-500"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-stone-300">Duração</label>
                            <input
                                type="text"
                                value={formData.duration}
                                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                className="w-full bg-[#292524] border border-stone-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-orange-500"
                                placeholder="Ex: 45 min"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-stone-300">Data de Lançamento</label>
                            <input
                                type="date"
                                value={formData.launchDate}
                                onChange={(e) => setFormData({ ...formData, launchDate: e.target.value })}
                                className="w-full bg-[#292524] border border-stone-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-orange-500"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-stone-300">Tipo</label>
                            <select
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                                className="w-full bg-[#292524] border border-stone-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-orange-500"
                            >
                                <option value="video">Vídeo</option>
                                <option value="audio">Áudio</option>
                                <option value="pdf">PDF</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-stone-300">Thumbnail (Gradiente)</label>
                            <select
                                value={formData.thumbnail}
                                onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                                className="w-full bg-[#292524] border border-stone-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-orange-500"
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
                        <label className="text-sm font-medium text-stone-300">URL do Vídeo/Conteúdo</label>
                        <input
                            type="text"
                            value={formData.videoUrl || ''}
                            onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                            className="w-full bg-[#292524] border border-stone-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-orange-500"
                            placeholder="https://..."
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-stone-300">Descrição</label>
                        <textarea
                            value={formData.description || ''}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full bg-[#292524] border border-stone-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-orange-500 h-32 resize-none"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-stone-800">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-6 py-2.5 rounded-lg text-stone-400 hover:text-white hover:bg-white/5 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
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
