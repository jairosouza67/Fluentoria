import React, { useState, useEffect } from 'react';
import { Search, Plus, Calendar, Clock, Edit2, ChevronDown, Trash2, Loader2 } from 'lucide-react';
import { Course, getCourses, addCourse, updateCourse, deleteCourse } from '../lib/db';
import CourseForm from './CourseForm';

const AdminCatalog: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchCourses = async () => {
    setLoading(true);
    const data = await getCourses();
    setCourses(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleSaveCourse = async (course: Course) => {
    if (editingCourse && editingCourse.id) {
      await updateCourse(editingCourse.id, course);
    } else {
      await addCourse(course);
    }
    await fetchCourses();
    setIsFormOpen(false);
    setEditingCourse(null);
  };

  const handleDeleteCourse = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta aula?')) {
      await deleteCourse(id);
      await fetchCourses();
    }
  };

  const handleEditCourse = (course: Course) => {
    setEditingCourse(course);
    setIsFormOpen(true);
  };

  const handleNewCourse = () => {
    setEditingCourse(null);
    setIsFormOpen(true);
  };

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">

      {/* Header & Controls */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Catálogo de Aulas</h1>
            <p className="text-stone-400">Gerencie, adicione e edite as aulas disponíveis.</p>
          </div>
          <button
            onClick={handleNewCourse}
            className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-medium transition-colors shadow-lg shadow-orange-900/20"
          >
            <Plus size={18} />
            <span>Nova Aula</span>
          </button>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-500" size={18} />
            <input
              type="text"
              placeholder="Buscar por nome da aula..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#292524] border border-transparent focus:border-orange-500/50 text-stone-200 pl-10 pr-4 py-3 rounded-lg focus:outline-none placeholder-stone-500 transition-all"
            />
          </div>
          <div className="flex gap-4">
            <button className="flex items-center gap-3 bg-[#292524] text-stone-300 px-4 py-3 rounded-lg hover:bg-[#35302e] transition-colors min-w-[180px] justify-between">
              <span>Data de Lançamento</span>
              <ChevronDown size={16} />
            </button>
            <button className="flex items-center gap-3 bg-[#292524] text-stone-300 px-4 py-3 rounded-lg hover:bg-[#35302e] transition-colors min-w-[140px] justify-between">
              <span>Duração</span>
              <ChevronDown size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Classes */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-orange-500" size={40} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredCourses.map((item) => (
            <div key={item.id} className="bg-[#1c1917] border border-stone-800 rounded-xl overflow-hidden hover:border-orange-500/40 transition-all group">
              {/* Gradient Cover */}
              <div className={`h-40 w-full bg-gradient-to-br ${item.thumbnail} relative`}>
                {/* Grainy overlay for texture */}
                <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className="text-lg font-bold text-white mb-4 line-clamp-2 leading-tight min-h-[3rem]">
                  {item.title}
                </h3>

                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2 text-stone-500 text-sm">
                    <Clock size={14} />
                    <span>Duração: <span className="text-stone-300">{item.duration}</span></span>
                  </div>
                  <div className="flex items-center gap-2 text-stone-500 text-sm">
                    <Calendar size={14} />
                    <span>Lançamento: <span className="text-stone-300">{item.launchDate || 'Em breve'}</span></span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-stone-800">
                  <button
                    onClick={() => handleDeleteCourse(item.id!)}
                    className="text-stone-500 hover:text-red-500 transition-colors p-2 hover:bg-red-500/10 rounded-full"
                    title="Excluir"
                  >
                    <Trash2 size={16} />
                  </button>
                  <button
                    onClick={() => handleEditCourse(item)}
                    className="text-stone-500 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full"
                    title="Editar"
                  >
                    <Edit2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isFormOpen && (
        <CourseForm
          course={editingCourse}
          onSave={handleSaveCourse}
          onCancel={() => setIsFormOpen(false)}
        />
      )}
    </div>
  );
};

export default AdminCatalog;
