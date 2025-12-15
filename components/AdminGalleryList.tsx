import React, { useState, useEffect } from 'react';
import { ArrowLeft, Image as ImageIcon, BookOpen, PlayCircle, Filter, Loader2, ChevronRight, Edit2, Trash2, Eye } from 'lucide-react';
import { Course, getCourses, CourseGallery } from '../lib/db';
import AnimatedInput from './ui/AnimatedInput';

interface AdminGalleryListProps {
  onBack: () => void;
  onSelectGallery: (gallery: CourseGallery, course: Course) => void;
}

const AdminGalleryList: React.FC<AdminGalleryListProps> = ({ onBack, onSelectGallery }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      const data = await getCourses();
      setCourses(data);
      setLoading(false);
    };
    fetchCourses();
  }, []);

  // Flatten all galleries from all courses
  const allGalleries: Array<{ gallery: CourseGallery; course: Course }> = [];
  courses.forEach(course => {
    if (course.galleries && course.galleries.length > 0) {
      course.galleries.forEach(gallery => {
        allGalleries.push({ gallery, course });
      });
    }
  });

  const filteredGalleries = allGalleries.filter(({ gallery, course }) =>
    gallery.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Voltar ao Catálogo</span>
          </button>
          <h1 className="text-3xl font-bold text-foreground">Gerenciar Galerias</h1>
          <p className="text-muted-foreground mt-2">Visualize e gerencie todas as galerias dos cursos.</p>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <div className="flex-grow md:flex-grow-0 md:w-64">
            <AnimatedInput
              type="search"
              placeholder="Buscar galerias..."
              value={searchTerm}
              onChange={setSearchTerm}
              icon="search"
            />
          </div>
          <button className="bg-transparent border border-border text-muted-foreground hover:text-foreground p-2.5 rounded-lg transition-colors">
            <Filter size={20} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      ) : filteredGalleries.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-xl">
          <ImageIcon size={48} className="text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-2">Nenhuma galeria encontrada</p>
          <p className="text-sm text-muted-foreground">
            Adicione galerias aos cursos através do formulário de criação/edição de curso.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGalleries.map(({ gallery, course }) => {
            const moduleCount = gallery.modules?.length || 0;
            const lessonCount = gallery.modules?.reduce((acc, mod) => acc + (mod.lessons?.length || 0), 0) || 0;

            return (
              <div
                key={`${course.id}-${gallery.id}`}
                className="group bg-card border border-border rounded-xl overflow-hidden hover:shadow-elevated transition-all duration-300"
              >
                {/* Gallery Cover Image */}
                <div className="h-48 w-full relative overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5">
                  {gallery.coverImage ? (
                    <>
                      <img
                        src={gallery.coverImage}
                        alt={gallery.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                    </>
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/50 opacity-10" />
                  )}
                  
                  {/* Action Buttons */}
                  <div className="absolute top-3 right-3 flex gap-2">
                    <button
                      onClick={() => onSelectGallery(gallery, course)}
                      className="bg-card/80 backdrop-blur-sm text-muted-foreground hover:text-foreground p-2 rounded-lg transition-colors"
                      title="Visualizar"
                    >
                      <Eye size={16} />
                    </button>
                  </div>

                  {/* Gallery Icon */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white border border-white/20">
                      <ImageIcon size={32} />
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  {/* Course Badge */}
                  <div className="mb-3">
                    <span className="text-[10px] font-semibold text-primary uppercase tracking-wider bg-primary/10 px-2 py-1 rounded">
                      {course.title}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {gallery.title}
                  </h3>
                  
                  {gallery.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{gallery.description}</p>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                    <span className="flex items-center gap-1">
                      <BookOpen size={14} />
                      {moduleCount} {moduleCount === 1 ? 'módulo' : 'módulos'}
                    </span>
                    <span className="flex items-center gap-1">
                      <PlayCircle size={14} />
                      {lessonCount} {lessonCount === 1 ? 'aula' : 'aulas'}
                    </span>
                  </div>

                  <button 
                    onClick={() => onSelectGallery(gallery, course)}
                    className="w-full py-3 rounded-xl bg-transparent text-muted-foreground text-sm font-medium border border-border hover:bg-primary/10 hover:text-primary hover:border-primary transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    Ver Detalhes
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminGalleryList;
