import React, { useState, useEffect } from 'react';
import { PlayCircle, FileText, Mic, Clock, Filter, Loader2, BookOpen } from 'lucide-react';
import { Screen } from '../types';
import { Course, getCourses } from '../lib/db';
import { getYouTubeThumbnail } from '../lib/video';
import AnimatedInput from './ui/AnimatedInput';
import { PageHeader } from './ui/PageHeader';
import { Card } from './ui/Card';
import { Button } from './ui/Button';

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
          <div className="w-full lg:w-[380px] lg:flex-none lg:sticky lg:top-8 lg:self-start">
            <div className="grid grid-cols-1 gap-6">
              {filteredCourses.length === 0 ? (
                <Card className="p-8 text-center bg-card/20 border-dashed">
                  <p className="text-muted-foreground">Nenhuma aula encontrada.</p>
                </Card>
              ) : (
                filteredCourses.map((course) => {
                  const coverImage = course.coverImage;
                  const thumbnailUrl = !coverImage && course.videoUrl ? getYouTubeThumbnail(course.videoUrl) : null;
                  const displayImage = coverImage || thumbnailUrl;

                  return (
                    <Card
                      key={course.id}
                      onClick={() => onSelectCourse(course)}
                      className="group overflow-hidden hover:border-primary/50 hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                    >
                      {/* Thumbnail */}
                      <div className={`h-44 w-full ${displayImage ? 'bg-black' : `bg-gradient-to-br ${course.thumbnail}`} relative flex items-center justify-center overflow-hidden`}>
                        {displayImage ? (
                          <>
                            <img
                              src={displayImage}
                              alt={course.title}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
                          </>
                        ) : (
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                        )}
                        <div className="absolute w-12 h-12 rounded-full bg-background/20 backdrop-blur-md flex items-center justify-center text-white group-hover:scale-110 transition-transform border border-white/20 z-10 shadow-lg">
                          {course.type === 'video' && <PlayCircle size={24} fill="white" className="opacity-90" />}
                          {course.type === 'pdf' && <FileText size={24} />}
                          {course.type === 'audio' && <Mic size={24} />}
                        </div>

                        {/* Progress Bar overlay */}
                        <div className="absolute bottom-0 left-0 w-full h-1.5 bg-black/30 z-10">
                          <div className="h-full bg-primary transition-all duration-500" style={{ width: `${course.progress}%` }}></div>
                        </div>
                      </div>

                      <div className="p-5 space-y-4">
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/10 px-2 py-0.5 rounded-full">{course.type}</span>
                          <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-medium">
                            <Clock size={12} className="text-primary/70" />
                            <span>{course.duration}</span>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-lg font-bold text-foreground mb-1 group-hover:text-primary transition-colors duration-200 line-clamp-1">{course.title}</h3>
                          <p className="text-sm text-muted-foreground font-medium">{course.author}</p>
                        </div>

                        <Button 
                          variant={course.progress === 100 ? "outline" : "primary"} 
                          className="w-full group-hover:shadow-[0_0_15px_rgba(255,106,0,0.3)]"
                        >
                          {course.progress === 0 ? 'Iniciar Aula' : course.progress === 100 ? 'Rever Aula' : 'Continuar'}
                        </Button>
                      </div>
                    </Card>
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
    </div>
  );
};

export default CourseList;
