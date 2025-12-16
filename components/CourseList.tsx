import React, { useState, useEffect } from 'react';
import { PlayCircle, FileText, Mic, Clock, Filter, Loader2 } from 'lucide-react';
import { Screen } from '../types';
import { Course, getCourses } from '../lib/db';
import { getYouTubeThumbnail } from '../lib/video';
import AnimatedInput from './ui/AnimatedInput';

interface CourseListProps {
  onNavigate: (screen: Screen) => void;
  onSelectCourse: (course: Course) => void;
}

const CourseList: React.FC<CourseListProps> = ({ onNavigate, onSelectCourse }) => {
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

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-container mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-[44px] leading-[1.05] font-bold text-[#F3F4F6]">Minhas Aulas</h1>
          <p className="text-[#9CA3AF] mt-1">Explore o catálogo e continue seu aprendizado.</p>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <div className="flex-grow md:flex-grow-0 md:w-64">
            <AnimatedInput
              type="search"
              placeholder="Buscar aulas..."
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
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Courses - Left side */}
          <div className="w-full lg:w-[420px] lg:flex-none grid grid-cols-1 gap-6">
            {filteredCourses.map((course) => {
              // Priority: 1. coverImage, 2. YouTube thumbnail, 3. gradient
              const coverImage = course.coverImage;
              const thumbnailUrl = !coverImage && course.videoUrl ? getYouTubeThumbnail(course.videoUrl) : null;
              const displayImage = coverImage || thumbnailUrl;

              return (
                <div
                  key={course.id}
                  onClick={() => {
                    onSelectCourse(course);
                  }}
                  className="group bg-[#111111] border border-white/[0.06] rounded-xl overflow-hidden hover:border-[#FF6A00]/50 hover:-translate-y-1 transition-all duration-200 cursor-pointer shadow-card hover:shadow-elevated"
                >
                  {/* Thumbnail */}
                  <div className={`h-40 w-full ${displayImage ? 'bg-black' : `bg-gradient-to-br ${course.thumbnail}`} relative flex items-center justify-center overflow-hidden`}>
                    {displayImage ? (
                      <>
                        <img
                          src={displayImage}
                          alt={course.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback to gradient if image fails to load
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
                      </>
                    ) : (
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                    )}
                    <div className="absolute w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white group-hover:scale-110 transition-transform border border-white/20 z-10">
                      {course.type === 'video' && <PlayCircle size={24} fill="white" className="text-white opacity-80" />}
                      {course.type === 'pdf' && <FileText size={24} />}
                      {course.type === 'audio' && <Mic size={24} />}
                    </div>

                    {/* Progress Bar overlay */}
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-black/30 z-10">
                      <div className="h-full bg-[#FF6A00]" style={{ width: `${course.progress}%` }}></div>
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-semibold text-[#FF6A00] uppercase tracking-wider">{course.type}</span>
                      <div className="flex items-center gap-1 text-[#9CA3AF] text-xs">
                        <Clock size={12} />
                        <span>{course.duration}</span>
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-[#F3F4F6] mb-1 group-hover:text-[#FF6A00] transition-colors duration-200">{course.title}</h3>
                    <p className="text-sm text-[#9CA3AF] mb-4">{course.author}</p>

                    <button className="w-full py-3 rounded-xl bg-white/[0.02] text-[#9CA3AF] text-sm font-medium border border-white/[0.06] group-hover:bg-[#FF6A00] group-hover:text-white group-hover:border-transparent transition-all duration-200">
                      {course.progress === 0 ? 'Iniciar Aula' : course.progress === 100 ? 'Rever Aula' : 'Continuar'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Welcome Section - Right side */}
          <div className="min-w-0 flex-1">
            <div className="sticky top-8 bg-gradient-to-br from-[#FF6A00]/10 via-[#1A1A1A] to-[#0B0B0B] border border-[#FF6A00]/20 rounded-xl p-8 shadow-elevated">
              {/* Header */}
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-[#F3F4F6] mb-2">
                  Bem-vindo ao <span className="text-[#FF6A00]">Fluentoria</span>.
                </h2>
                <div className="h-1 w-20 bg-gradient-to-r from-[#FF6A00] to-[#E15B00] rounded-full"></div>
              </div>

              {/* Main Content */}
              <div className="space-y-6 text-[#D1D5DB]">
                <p className="text-base leading-relaxed">
                  Antes de qualquer coisa, é importante alinhar uma ideia fundamental:
                  <span className="block mt-2 text-[#F3F4F6] font-semibold">
                    você não entrou em um curso de inglês tradicional.
                  </span>
                </p>

                <div className="bg-black/30 border border-white/[0.06] rounded-lg p-4">
                  <p className="text-sm text-[#9CA3AF] mb-3">Aqui, você <span className="text-[#F3F4F6] font-medium">não vai:</span></p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-[#FF6A00] mt-1">×</span>
                      <span>decorar listas de palavras</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#FF6A00] mt-1">×</span>
                      <span>estudar regras gramaticais</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#FF6A00] mt-1">×</span>
                      <span>separar "tempo para o inglês" na sua rotina</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-gradient-to-r from-[#FF6A00]/10 to-transparent border-l-4 border-[#FF6A00] rounded-r-lg p-4">
                  <p className="text-sm leading-relaxed">
                    O Fluentoria parte de um princípio simples e poderoso:
                  </p>
                  <p className="text-lg font-bold text-[#FF6A00] mt-2 italic">
                    "Fluência não é conhecimento — é hábito."
                  </p>
                </div>

                <p className="text-base leading-relaxed">
                  Por isso, o que você vai desenvolver aqui não depende de memória, esforço excessivo ou disciplina forçada.
                  <span className="block mt-2 text-[#F3F4F6] font-medium">
                    Depende de como você ocupa sua mente nos momentos intermediários do dia.
                  </span>
                </p>

                <div className="pt-4 border-t border-white/[0.06]">
                  <p className="text-sm text-[#9CA3AF] leading-relaxed">
                    Mas isso é assunto pra nossa primeira Galeria, os primeiros passos que TODO fluente realizou.
                  </p>
                  <p className="text-lg font-bold text-[#FF6A00] mt-3">
                    Vai lá, arrebenta! 🚀
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseList;
