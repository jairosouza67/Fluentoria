import React from 'react';
import { ArrowLeft, BookOpen, PlayCircle, ChevronRight } from 'lucide-react';
import { Course, CourseModule } from '../lib/db';

interface ModuleSelectionProps {
  onBack: () => void;
  course: Course | null;
  onSelectModule: (module: CourseModule) => void;
}

const ModuleSelection: React.FC<ModuleSelectionProps> = ({ onBack, course, onSelectModule }) => {
  if (!course) {
    return (
      <div className="max-w-7xl mx-auto min-h-screen bg-[#0B0B0B] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#9CA3AF] mb-4">Curso não encontrado</p>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-[#FF6A00] text-white rounded-lg hover:bg-[#E15B00] transition-colors"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  const hasModules = course.modules && course.modules.length > 0;

  return (
    <div className="max-w-7xl mx-auto min-h-screen bg-[#0B0B0B] p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[#9CA3AF] hover:text-[#F3F4F6] mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="text-sm font-medium">Voltar aos Cursos</span>
        </button>

        <div className="flex items-start gap-6">
          {course.coverImage && (
            <div className="hidden md:block w-32 h-32 rounded-xl overflow-hidden border border-white/[0.06] shadow-card flex-shrink-0">
              <img
                src={course.coverImage}
                alt={course.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-bold text-[#F3F4F6] mb-2">{course.title}</h1>
            <p className="text-[#9CA3AF] mb-4">{course.description}</p>
            <div className="flex flex-wrap gap-4 text-sm text-[#9CA3AF]">
              <span className="flex items-center gap-2">
                <BookOpen size={16} className="text-[#FF6A00]" />
                {course.author}
              </span>
              <span className="flex items-center gap-2">
                <PlayCircle size={16} className="text-[#FF6A00]" />
                {course.duration}
              </span>
              {hasModules && (
                <span className="flex items-center gap-2">
                  <BookOpen size={16} className="text-[#FF6A00]" />
                  {course.modules.length} {course.modules.length === 1 ? 'Módulo' : 'Módulos'}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modules List */}
      <div>
        <h2 className="text-xl font-semibold text-[#F3F4F6] mb-6">
          Selecione um Módulo
        </h2>

        {hasModules ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {course.modules.map((module, index) => {
              const lessonCount = module.lessons?.length || 0;
              const totalDuration = module.lessons?.reduce((acc, lesson) => {
                const minutes = parseInt(lesson.duration?.split(':')[0] || '0');
                return acc + minutes;
              }, 0) || 0;

              return (
                <button
                  key={module.id}
                  onClick={() => onSelectModule(module)}
                  className="group relative bg-[#111111] border border-white/[0.06] rounded-xl overflow-hidden hover:border-[#FF6A00]/50 hover:bg-white/[0.02] transition-all duration-200 text-left"
                >
                  {/* Module Cover Image */}
                  {module.coverImage && (
                    <div className="h-48 w-full bg-black relative overflow-hidden">
                      <img
                        src={module.coverImage}
                        alt={module.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                      
                      {/* Module Number Badge */}
                      <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-[#FF6A00] border-2 border-white/20 flex items-center justify-center shadow-lg">
                        <span className="text-sm font-bold text-white">{index + 1}</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Content */}
                  <div className="p-6">
                    {!module.coverImage && (
                      <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-[#FF6A00]/10 border border-[#FF6A00]/20 flex items-center justify-center">
                        <span className="text-sm font-bold text-[#FF6A00]">{index + 1}</span>
                      </div>
                    )}

                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-[#F3F4F6] mb-2 pr-12 group-hover:text-[#FF6A00] transition-colors">
                        {module.title}
                      </h3>
                      {module.description && (
                        <p className="text-sm text-[#9CA3AF] line-clamp-2">{module.description}</p>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-xs text-[#9CA3AF] mb-4">
                      <span className="flex items-center gap-1">
                        <PlayCircle size={14} />
                        {lessonCount} {lessonCount === 1 ? 'aula' : 'aulas'}
                      </span>
                      {totalDuration > 0 && (
                        <span>
                          {Math.floor(totalDuration / 60)}h {totalDuration % 60}min
                        </span>
                      )}
                    </div>

                    {/* Action */}
                    <div className="flex items-center gap-2 text-[#FF6A00] text-sm font-medium">
                      <span>Acessar Módulo</span>
                      <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 border border-dashed border-white/[0.06] rounded-xl">
            <BookOpen size={48} className="text-[#9CA3AF] mx-auto mb-4" />
            <p className="text-[#9CA3AF] mb-6">Este curso não possui módulos estruturados.</p>
            <button
              onClick={() => course.videoUrl && onSelectModule({ id: 'default', title: course.title, lessons: [] })}
              className="px-6 py-3 bg-[#FF6A00] text-white rounded-lg hover:bg-[#E15B00] transition-colors font-medium"
            >
              Assistir Conteúdo
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModuleSelection;
