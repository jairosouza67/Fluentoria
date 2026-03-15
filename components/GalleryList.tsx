import React, { useState, useEffect } from 'react';
import { ArrowLeft, Image as ImageIcon, BookOpen, PlayCircle, Filter, Loader2, ChevronRight } from 'lucide-react';
import { Screen } from '../types';
import { Course, getCoursesForUser, CourseGallery } from '../lib/db';
import { useAppStore } from '../lib/stores/appStore';
import AnimatedInput from './ui/AnimatedInput';

interface GalleryListProps {
  onNavigate: (screen: Screen) => void;
  onSelectGallery: (gallery: CourseGallery, course: Course) => void;
  selectedCourse?: Course | null;
}

const GalleryList: React.FC<GalleryListProps> = ({ onNavigate, onSelectGallery, selectedCourse }) => {
  const user = useAppStore(state => state.user);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // If a course is already selected, no need to fetch all courses
    if (selectedCourse) {
      setCourses([selectedCourse]);
      setLoading(false);
      return;
    }

    const fetchCourses = async () => {
      if (!user) return;
      setLoading(true);
      const data = await getCoursesForUser(user.uid);
      setCourses(data);
      setLoading(false);
    };
    fetchCourses();
  }, [user, selectedCourse]);

  // Flatten galleries from courses (when selectedCourse is set, only that course's galleries)
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
    <div className="p-8 max-w-container mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-[44px] leading-[1.05] font-bold text-[#F3F4F6]">Galeria de Aulas</h1>
          <p className="text-[#9CA3AF] mt-1">Explore as galerias disponíveis e escolha seus módulos.</p>
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
          <button className="bg-white/[0.02] border border-white/[0.06] text-[#9CA3AF] p-2.5 rounded-lg hover:bg-white/[0.04] hover:text-[#F3F4F6] transition-all duration-200">
            <Filter size={20} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-[#FF6A00]" size={40} />
        </div>
      ) : filteredGalleries.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-white/[0.06] rounded-xl">
          <ImageIcon size={48} className="text-[#9CA3AF] mx-auto mb-4" />
          <p className="text-[#9CA3AF] mb-2">Nenhuma galeria encontrada</p>
          <p className="text-sm text-[#9CA3AF]">As galerias aparecerão aqui quando forem adicionadas aos cursos.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGalleries.map(({ gallery, course }, index) => {
            const moduleCount = gallery.modules?.length || 0;
            const lessonCount = gallery.modules?.reduce((acc, mod) => acc + (mod.lessons?.length || 0), 0) || 0;

            return (
              <div
                key={`${course.id}-${gallery.id}`}
                onClick={() => onSelectGallery(gallery, course)}
                className="group bg-[#111111] border border-white/[0.06] rounded-xl overflow-hidden hover:border-[#FF6A00]/50 hover:-translate-y-1 transition-all duration-200 cursor-pointer shadow-card hover:shadow-elevated"
              >
                {/* Gallery Cover Image */}
                <div className={`w-full relative overflow-hidden ${gallery.coverImage ? '' : 'min-h-[160px]'} bg-gradient-to-br from-[#FF6A00]/20 to-[#E15B00]/20`}>
                  {gallery.coverImage ? (
                    <>
                      <img
                        src={gallery.coverImage}
                        alt={gallery.title}
                        className="w-full h-auto block group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    </>
                  ) : (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-br from-orange-900 to-stone-900" />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                      {/* Gallery Icon - only shown when no cover image */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white group-hover:scale-110 transition-transform border border-white/20">
                          <ImageIcon size={32} className="text-white" />
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Content */}
                <div className="p-5">
                  {/* Course Badge */}
                  <div className="mb-3">
                    <span className="text-[10px] font-semibold text-[#FF6A00] uppercase tracking-wider bg-[#FF6A00]/10 px-2 py-1 rounded">
                      {course.title}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-[#F3F4F6] mb-2 group-hover:text-[#FF6A00] transition-colors duration-200">
                    {gallery.title}
                  </h3>

                  {gallery.description && (
                    <p className="text-sm text-[#9CA3AF] mb-4 line-clamp-2">{gallery.description}</p>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-xs text-[#9CA3AF] mb-4">
                    <span className="flex items-center gap-1">
                      <BookOpen size={14} />
                      {moduleCount} {moduleCount === 1 ? 'módulo' : 'módulos'}
                    </span>
                    <span className="flex items-center gap-1">
                      <PlayCircle size={14} />
                      {lessonCount} {lessonCount === 1 ? 'aula' : 'aulas'}
                    </span>
                  </div>

                  <button className="w-full py-3 rounded-xl bg-white/[0.02] text-[#9CA3AF] text-sm font-medium border border-white/[0.06] group-hover:bg-[#FF6A00] group-hover:text-white group-hover:border-transparent transition-all duration-200 flex items-center justify-center gap-2">
                    Acessar Galeria
                    <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
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

export default GalleryList;
