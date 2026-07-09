import React, { useState, useEffect, useRef } from 'react';
import { PlayCircle, FileText, Mic, Filter, Loader2, BookOpen, Layers, CheckCircle2, Info, X } from 'lucide-react';
import { Screen } from '../types';
import { Course, getCoursesForUser, getAllLessonProgress, countLessons, CourseLessonProgress } from '../lib/db';
import { getYouTubeThumbnail } from '../lib/video';
import { useAppStore } from '../lib/stores/appStore';
import AnimatedInput from './ui/AnimatedInput';
import { PageHeader } from './ui/PageHeader';
import { Card } from './ui/Card';
import { Button } from './ui/Button';

interface CourseDetailsCardProps {
  course: Course;
  completed: number;
  total: number;
  percentage: number;
  onSelect: () => void;
  onClose?: () => void;
  isModal?: boolean;
}

const CourseDetailsCard: React.FC<CourseDetailsCardProps> = ({
  course,
  completed,
  total,
  percentage,
  onSelect,
  onClose,
  isModal = false,
}) => {
  const coverImage = course.coverImage;
  const thumbnailUrl = !coverImage && course.videoUrl ? getYouTubeThumbnail(course.videoUrl) : null;
  const displayImage = coverImage || thumbnailUrl;
  
  const galleryCount = course.galleries?.length || 0;
  const moduleCount = (course.galleries?.reduce((a, g) => a + (g.modules?.length || 0), 0) || 0) + (course.modules?.length || 0);

  const getCourseTypeLabel = (type: string) => {
    switch (type) {
      case 'video': return 'Vídeo';
      case 'pdf': return 'Documento PDF';
      case 'audio': return 'Áudio';
      default: return 'Aula';
    }
  };

  const getCourseTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <PlayCircle size={16} fill="white" className="opacity-80" />;
      case 'pdf': return <FileText size={16} />;
      case 'audio': return <Mic size={16} />;
      default: return <BookOpen size={16} />;
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Thumbnail Header */}
      <div className={`relative w-full rounded-lg overflow-hidden flex items-center justify-center bg-black border border-white/[0.04] ${isModal ? 'h-40 md:h-48' : 'h-32'}`}>
        {displayImage ? (
          <img
            src={displayImage}
            alt={course.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${course.thumbnail || 'from-[#FF6A00] to-[#E15B00]'} flex items-center justify-center`}>
            <span className="text-2xl font-bold text-white/50">{course.title.substring(0, 2).toUpperCase()}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        
        {/* Badges */}
        <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center text-xs">
          <span className="flex items-center gap-1 bg-black/60 backdrop-blur-md text-white/95 px-2.5 py-0.5 rounded-full font-medium border border-white/10">
            {getCourseTypeIcon(course.type)}
            <span>{getCourseTypeLabel(course.type)}</span>
          </span>
          {course.duration && (
            <span className="bg-black/60 backdrop-blur-md text-white/95 px-2.5 py-0.5 rounded-full font-medium border border-white/10">
              {course.duration}
            </span>
          )}
        </div>

        {/* Modal Close Button */}
        {isModal && onClose && (
          <button 
            onClick={onClose}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 backdrop-blur-md text-[#9CA3AF] hover:text-[#F3F4F6] border border-white/10 hover:bg-white/10 transition-all"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Title & Author */}
      <div>
        <h3 className={`font-black text-[#F3F4F6] tracking-tight leading-snug ${isModal ? 'text-lg md:text-xl' : 'text-base'}`}>
          {course.title}
        </h3>
        <p className="text-xs text-[#9CA3AF] font-semibold mt-1">
          Por {course.author}
        </p>
      </div>

      {/* Description */}
      {course.description && (
        <p className={`text-xs text-[#9CA3AF] leading-relaxed font-medium ${isModal ? 'line-clamp-4' : 'line-clamp-3'}`}>
          {course.description}
        </p>
      )}

      {/* Structure metadata */}
      {(galleryCount > 0 || moduleCount > 0 || total > 0) && (
        <div className="grid grid-cols-3 gap-2 bg-white/[0.02] border border-white/[0.04] p-2.5 rounded-lg text-center text-[10px] md:text-xs">
          <div>
            <div className="text-[#9CA3AF] font-medium">Galerias</div>
            <div className="text-[#F3F4F6] font-bold mt-0.5">{galleryCount}</div>
          </div>
          <div>
            <div className="text-[#9CA3AF] font-medium">Módulos</div>
            <div className="text-[#F3F4F6] font-bold mt-0.5">{moduleCount}</div>
          </div>
          <div>
            <div className="text-[#9CA3AF] font-medium">Atividades</div>
            <div className="text-[#F3F4F6] font-bold mt-0.5">{total}</div>
          </div>
        </div>
      )}

      {/* Progress */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-bold">
          <span className="text-[#9CA3AF]">Progresso do Conteúdo</span>
          <span className="text-primary">{percentage}%</span>
        </div>
        <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden border border-white/[0.04]">
          <div 
            className="h-full bg-gradient-to-r from-primary to-[#E15B00] transition-all duration-500 rounded-full"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="text-[10px] text-[#9CA3AF] font-semibold">
          {completed} de {total} atividades concluídas
        </div>
      </div>

      {/* Action Button */}
      <Button 
        className="w-full flex items-center justify-center gap-2 h-10 font-bold tracking-wide"
        onClick={onSelect}
      >
        <PlayCircle size={16} />
        <span>
          {percentage === 100 ? 'Rever Conteúdo' : percentage > 0 ? 'Continuar Aprendizado' : 'Iniciar Aula'}
        </span>
      </Button>
    </div>
  );
};

interface CourseListProps {
  onNavigate: (screen: Screen) => void;
  onSelectCourse: (course: Course) => void;
}

const CourseList: React.FC<CourseListProps> = ({ onNavigate, onSelectCourse }) => {
  const user = useAppStore(state => state.user);
  const [courses, setCourses] = useState<Course[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, CourseLessonProgress>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Hover popover states
  const [hoveredCourse, setHoveredCourse] = useState<Course | null>(null);
  const [popoverPosition, setPopoverPosition] = useState<{ top: number; left: number } | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      if (!user) return;
      setLoading(true);
      const [data, progress] = await Promise.all([
        getCoursesForUser(user.uid),
        getAllLessonProgress(user.uid),
      ]);
      setCourses(data);
      const map: Record<string, CourseLessonProgress> = {};
      progress.forEach(p => { if (p.courseId) map[p.courseId] = p; });
      setProgressMap(map);
      setLoading(false);
    };
    fetchCourses();

    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, [user]);

  const getCourseProgress = (course: Course): { completed: number; total: number; percentage: number } => {
    const total = countLessons(course);
    const p = course.id ? progressMap[course.id] : undefined;
    const completed = p?.completedLessonIds?.length || 0;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : (course.progress || 0);
    return { completed, total, percentage };
  };

  const handleMouseEnter = (course: Course, event: React.MouseEvent<HTMLDivElement>) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const isDesktop = window.innerWidth >= 1024;
    
    if (isDesktop) {
      const popoverHeight = 380; // Estimated popover height
      const popoverWidth = 320;
      const windowHeight = window.innerHeight;
      const windowWidth = window.innerWidth;
      
      let top = rect.top;
      
      // Prevent popover from going off-screen vertically
      if (top + popoverHeight > windowHeight) {
        top = Math.max(16, windowHeight - popoverHeight - 16);
      }

      let left = rect.right + 12; // 12px gap
      // If it would overflow the right edge, display on the left instead
      if (left + popoverWidth > windowWidth) {
        left = Math.max(16, rect.left - popoverWidth - 12);
      }

      setPopoverPosition({
        top,
        left,
      });
      setHoveredCourse(course);
    }
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredCourse(null);
      setPopoverPosition(null);
    }, 150); // small delay to move mouse smoothly to the popover
  };

  const handlePopoverMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  };

  const handlePopoverMouseLeave = () => {
    handleMouseLeave();
  };

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const searchAction = (
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
      <Button variant="outline" size="icon" className="h-10 w-10">
        <Filter size={20} />
      </Button>
    </div>
  );

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <PageHeader
        title="Minhas Aulas"
        description="Explore o catálogo e continue seu aprendizado."
        icon={<BookOpen size={24} />}
        action={searchAction}
      />

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row lg:items-start gap-8">
          {/* Courses - Left side */}
          <div className="w-full lg:w-[380px] lg:flex-none lg:sticky lg:top-8 lg:self-start z-30">
            <div className="grid grid-cols-1 gap-4">
              {filteredCourses.length === 0 ? (
                <Card className="p-8 text-center bg-card/20 border-dashed">
                  <p className="text-muted-foreground">Nenhuma aula encontrada.</p>
                </Card>
              ) : (
                filteredCourses.map((course) => {
                  const coverImage = course.coverImage;
                  const thumbnailUrl = !coverImage && course.videoUrl ? getYouTubeThumbnail(course.videoUrl) : null;
                  const displayImage = coverImage || thumbnailUrl;
                  const { completed, total, percentage } = getCourseProgress(course);
                  const isCompletedCourse = total > 0 && percentage === 100;

                  return (
                    <div
                      key={course.id}
                      onClick={() => onSelectCourse(course)}
                      onMouseEnter={(e) => handleMouseEnter(course, e)}
                      onMouseLeave={handleMouseLeave}
                      className="group relative flex items-center gap-3 p-3 bg-[#111111]/90 backdrop-blur-md border border-white/[0.06] hover:border-primary/50 hover:bg-[#151515]/95 rounded-xl transition-all duration-200 cursor-pointer overflow-hidden shadow-sm"
                    >
                      {/* Mini Thumbnail */}
                      <div className={`w-12 h-12 rounded-lg flex-shrink-0 relative overflow-hidden flex items-center justify-center ${displayImage ? 'bg-black' : `bg-gradient-to-br ${course.thumbnail || 'from-[#FF6A00] to-[#E15B00]'}`}`}>
                        {displayImage ? (
                          <img
                            src={displayImage}
                            alt={course.title}
                            className="w-full h-full object-cover block"
                          />
                        ) : (
                          <span className="text-[10px] font-bold text-white/50">{course.title.substring(0, 2).toUpperCase()}</span>
                        )}
                        <div className="absolute inset-0 bg-black/20" />
                        <div className="absolute inset-0 flex items-center justify-center text-white/90">
                          {course.type === 'video' && <PlayCircle size={14} fill="white" className="opacity-80" />}
                          {course.type === 'pdf' && <FileText size={14} />}
                          {course.type === 'audio' && <Mic size={14} />}
                        </div>
                      </div>

                      {/* Summary Info */}
                      <div className="flex-1 min-w-0 pr-1">
                        <h3 className="font-bold text-[#F3F4F6] text-sm group-hover:text-primary transition-colors truncate mb-0.5">
                          {course.title}
                        </h3>
                        <p className="text-[11px] text-[#9CA3AF] truncate font-medium">
                          {course.author}
                        </p>
                      </div>

                      {/* Compact Progress & Info Trigger */}
                      <div className="flex-shrink-0 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => {
                            setHoveredCourse(course);
                            setPopoverPosition(null); // Force modal style when clicking info button
                          }}
                          className="p-1.5 rounded-full text-muted-foreground hover:text-primary hover:bg-white/5 transition-all duration-150"
                          title="Detalhes da aula"
                        >
                          <Info size={15} />
                        </button>
                        
                        {isCompletedCourse ? (
                          <span className="text-[#23D18B] block mr-1" title="Concluído">
                            <CheckCircle2 size={16} />
                          </span>
                        ) : (
                          <div className="relative w-7 h-7 flex items-center justify-center mr-1">
                            <svg className="w-full h-full transform -rotate-90">
                              <circle
                                cx="14"
                                cy="14"
                                r="11"
                                className="stroke-white/10"
                                strokeWidth="2"
                                fill="transparent"
                              />
                              <circle
                                cx="14"
                                cy="14"
                                r="11"
                                className="stroke-[#FF6A00] transition-all duration-300"
                                strokeWidth="2"
                                fill="transparent"
                                strokeDasharray={2 * Math.PI * 11}
                                strokeDashoffset={2 * Math.PI * 11 * (1 - percentage / 100)}
                              />
                            </svg>
                            <span className="absolute text-[7px] font-bold text-[#F3F4F6]">{percentage}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Welcome Section - Right side */}
          <div className="min-w-0 flex-1">
            <Card className="sticky top-8 lg:max-h-[calc(100vh-6rem)] overflow-y-auto bg-gradient-to-br from-primary/5 via-card to-background border-primary/20 p-8 shadow-2xl">
              {/* Header */}
              <div className="mb-8">
                <h2 className="text-4xl font-black text-foreground mb-3 tracking-tight">
                  Bem-vindo ao <span className="text-primary">Fluentoria</span>.
                </h2>
                <div className="h-1.5 w-24 bg-primary rounded-full shadow-glow"></div>
              </div>

              {/* Main Content */}
              <div className="space-y-8 text-foreground/80">
                <p className="text-lg leading-relaxed">
                  Antes de qualquer coisa, é importante alinhar uma ideia fundamental:
                  <span className="block mt-3 text-foreground font-bold text-xl">
                    Você não entrou em um curso de inglês tradicional.
                  </span>
                </p>

                <div className="bg-muted/30 border border-border rounded-2xl p-6 space-y-4">
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Aqui, você <span className="text-destructive">não vai:</span></p>
                  <ul className="grid gap-3">
                    {[
                      'decorar listas de palavras',
                      'estudar regras gramaticais',
                      'separar "tempo para o inglês" na sua rotina'
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-foreground/90">
                        <div className="w-5 h-5 rounded-full bg-destructive/10 flex items-center justify-center text-destructive flex-shrink-0">
                          <span className="text-xs font-bold font-mono">×</span>
                        </div>
                        <span className="font-medium">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-primary/10 border-l-4 border-primary rounded-r-2xl p-6 shadow-sm">
                  <p className="text-sm text-primary font-semibold uppercase tracking-widest mb-2">O Princípio</p>
                  <p className="text-2xl font-black text-foreground italic leading-tight">
                    "Fluência não é conhecimento — é hábito."
                  </p>
                </div>

                <p className="text-lg leading-relaxed font-medium">
                  Por isso, o que você vai desenvolver aqui não depende de memória, esforço excessivo ou disciplina forçada.
                  <span className="block mt-3 text-primary font-bold">
                    Depende de como você ocupa sua mente nos momentos intermediários do dia.
                  </span>
                </p>

                <div className="pt-8 border-t border-border mt-8">
                  <p className="text-muted-foreground leading-relaxed italic">
                    Mas isso é assunto pra nossa primeira Galeria, os primeiros passos que TODO fluente realizou.
                  </p>
                  <div className="flex items-center gap-4 mt-6">
                    <p className="text-2xl font-black text-primary">
                      Vai lá, arrebenta! 🚀
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Desktop Hover Card */}
      {hoveredCourse && popoverPosition && (
        <div
          style={{
            position: 'fixed',
            top: `${popoverPosition.top}px`,
            left: `${popoverPosition.left}px`,
          }}
          onMouseEnter={handlePopoverMouseEnter}
          onMouseLeave={handlePopoverMouseLeave}
          className="z-50 w-80 bg-[#0B0B0B]/95 backdrop-blur-xl border border-white/[0.08] hover:border-primary/30 rounded-xl shadow-2xl p-4 text-[#F3F4F6] animate-in fade-in duration-200"
        >
          {(() => {
            const { completed, total, percentage } = getCourseProgress(hoveredCourse);
            return (
              <CourseDetailsCard
                course={hoveredCourse}
                completed={completed}
                total={total}
                percentage={percentage}
                onSelect={() => {
                  onSelectCourse(hoveredCourse);
                  setHoveredCourse(null);
                  setPopoverPosition(null);
                }}
              />
            );
          })()}
        </div>
      )}

      {/* Mobile Modal Info */}
      {hoveredCourse && !popoverPosition && (
        <div 
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => {
            setHoveredCourse(null);
          }}
        >
          <div 
            className="w-full max-w-sm bg-[#0B0B0B]/95 backdrop-blur-xl border border-white/[0.08] rounded-xl shadow-2xl p-5 text-[#F3F4F6] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const { completed, total, percentage } = getCourseProgress(hoveredCourse);
              return (
                <CourseDetailsCard
                  course={hoveredCourse}
                  completed={completed}
                  total={total}
                  percentage={percentage}
                  onSelect={() => {
                    onSelectCourse(hoveredCourse);
                    setHoveredCourse(null);
                  }}
                  onClose={() => {
                    setHoveredCourse(null);
                  }}
                  isModal={true}
                />
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseList;
