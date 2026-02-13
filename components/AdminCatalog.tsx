import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  ChevronDown, 
  Edit2, 
  Trash2, 
  Clock, 
  Calendar, 
  Loader2, 
  Eye, 
  Search, 
  Filter,
  LayoutGrid,
  Film,
  Music,
  Zap
} from 'lucide-react';
import { 
  Course, 
  getCourses, 
  addCourse, 
  updateCourse, 
  deleteCourse, 
  getMindfulFlows, 
  addMindfulFlow, 
  updateMindfulFlow, 
  deleteMindfulFlow, 
  getMusic, 
  addMusic, 
  updateMusic, 
  deleteMusic 
} from '../lib/db';
import CourseForm from './CourseForm';
import CourseDetail from './CourseDetail';
import { getYouTubeThumbnail } from '../lib/video';
import { PageHeader } from './ui/PageHeader';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

type TabType =
  | 'courses'
  | 'gallery'
  // | 'daily' // Daily Contact disabled
  | 'mindful'
  | 'music';

const AdminCatalog: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('courses');
  const [courses, setCourses] = useState<Course[]>([]);
  // const [dailyContacts, setDailyContacts] = useState<DailyContact[]>([]);
  const [mindfulFlows, setMindfulFlows] = useState<Course[]>([]);
  const [musicList, setMusicList] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [viewingCourse, setViewingCourse] = useState<Course | null>(null);

  const fetchCourses = async () => {
    setLoading(true);
    const data = await getCourses();
    setCourses(data);
    setLoading(false);
  };

  // Daily Contact disabled
  // const fetchDailyContacts = async () => {
  //   setLoading(true);
  //   const data = await getDailyContacts();
  //   setDailyContacts(data);
  //   setLoading(false);
  // };

  const fetchMindfulFlows = async () => {
    setLoading(true);
    const data = await getMindfulFlows();
    setMindfulFlows(data);
    setLoading(false);
  };

  const fetchMusic = async () => {
    setLoading(true);
    const data = await getMusic();
    setMusicList(data);
    setLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'courses' || activeTab === 'gallery') {
      fetchCourses();
    } else if (activeTab === 'mindful') {
      fetchMindfulFlows();
    } else if (activeTab === 'music') {
      fetchMusic();
    }
  }, [activeTab]);

  const handleSaveCourse = async (course: Course) => {
    if (activeTab === 'courses' || activeTab === 'gallery') {
      if (editingCourse && editingCourse.id) {
        // Editing existing course
        await updateCourse(editingCourse.id, course);
      } else {
        // Creating new content with galleries
        if (course.galleries && course.galleries.length > 0) {
          // Check if there's already a main container course
          const existingCourses = await getCourses();
          const mainCourse = existingCourses.find(c => 
            c.galleries && c.galleries.length > 0 && c.title === course.title
          );

          if (mainCourse && mainCourse.id) {
            // Add galleries to existing course
            const updatedGalleries = [...(mainCourse.galleries || []), ...course.galleries];
            await updateCourse(mainCourse.id, {
              ...mainCourse,
              galleries: updatedGalleries
            });
          } else {
            // Create new course with galleries
            await addCourse(course);
          }
        } else {
          // Regular course creation
          await addCourse(course);
        }
      }
      await fetchCourses();
    } else if (activeTab === 'mindful') {
      if (editingCourse && editingCourse.id) {
        await updateMindfulFlow(editingCourse.id, course);
      } else {
        await addMindfulFlow(course);
      }
      await fetchMindfulFlows();
    } else if (activeTab === 'music') {
      if (editingCourse && editingCourse.id) {
        await updateMusic(editingCourse.id, course);
      } else {
        await addMusic(course);
      }
      await fetchMusic();
    }
    setIsFormOpen(false);
    setEditingCourse(null);
  };

  const handleDeleteCourse = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este conteúdo?')) {
      if (activeTab === 'courses') {
        await deleteCourse(id);
        await fetchCourses();
      } else if (activeTab === 'mindful') {
        await deleteMindfulFlow(id);
        await fetchMindfulFlows();
      } else if (activeTab === 'music') {
        await deleteMusic(id);
        await fetchMusic();
      }
    }
  };

  const handleEditCourse = (course: Course) => {
    setEditingCourse(course);
    setIsFormOpen(true);
  };

  const handleViewCourse = (course: Course) => {
    setViewingCourse(course);
  };

  const getCurrentList = () => {
    if (activeTab === 'courses') return courses;
    if (activeTab === 'gallery') return courses.filter(c => c.galleries && c.galleries.length > 0);
    // if (activeTab === 'daily') return dailyContacts; // Daily Contact disabled
    if (activeTab === 'mindful') return mindfulFlows;
    if (activeTab === 'music') return musicList;
    return [];
  };

  const filteredCourses = getCurrentList().filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const tabs = [
    { id: 'courses', label: 'Cursos & Vídeos', icon: Film },
    { id: 'gallery', label: 'Galerias', icon: LayoutGrid },
    { id: 'mindful', label: 'Mindful Flow', icon: Zap },
    { id: 'music', label: 'Músicas', icon: Music },
  ];

  return (
    <div className="space-y-8 pb-20">
      <PageHeader
        title="Catálogo de Conteúdo"
        description="Gerencie seus cursos, aulas, galerias e materiais audiovisuais."
        actions={
          <Button onClick={() => { setEditingCourse(null); setIsFormOpen(true); }} className="gap-2">
            <Plus size={20} />
            Novo Conteúdo
          </Button>
        }
      />

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 bg-card/50 p-1 rounded-xl border border-border w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${activeTab === tab.id 
                ? 'bg-primary text-primary-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}
            `}
          >
            <tab.icon size={16} />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Filter Bar */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1">
            <Input
              type="search"
              placeholder={activeTab === 'gallery' ? 'Buscar galerias...' : 'Buscar conteúdo...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search className="text-muted-foreground" size={18} />}
              className="max-w-md"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-muted-foreground gap-2">
              <Filter size={16} />
              Data de Lançamento
              <ChevronDown size={14} />
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground gap-2">
              Duração
              <ChevronDown size={14} />
            </Button>
          </div>
        </div>
      </Card>

      {/* Course Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="animate-spin text-primary" size={40} />
          <p className="text-muted-foreground animate-pulse">Carregando catálogo...</p>
        </div>
      ) : filteredCourses.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-20 bg-card/30 border-dashed">
          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
            <Search className="text-muted-foreground/50" size={32} />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1">
            {activeTab === 'gallery' ? 'Nenhuma galeria encontrada' : 'Nenhum conteúdo encontrado'}
          </h3>
          <p className="text-muted-foreground text-center max-w-xs mb-6">
            {activeTab === 'gallery' 
              ? 'Tente ajustar sua busca ou crie uma nova galeria para começar.' 
              : 'Comece criando novos conteúdos para popular sua plataforma.'}
          </p>
          <Button variant="outline" onClick={() => setSearchTerm('')}>
            Limpar Filtros
          </Button>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
          {filteredCourses.map((course) => {
            const thumbnailUrl = course.videoUrl ? getYouTubeThumbnail(course.videoUrl) : null;
            const displayImage = course.coverImage || thumbnailUrl;
            const galleryCount = activeTab === 'gallery' ? (course.galleries?.length || 0) : 0;
            const totalModules = activeTab === 'gallery' ? (course.galleries?.reduce((acc, g) => acc + g.modules.length, 0) || 0) : 0;

            return (
              <Card key={course.id} className="group overflow-hidden flex flex-col h-full border-white/5 hover:border-primary/20 transition-all duration-300 rounded-xl shadow-sm">
                {/* Thumbnail Area */}
                <div className="aspect-video relative overflow-hidden bg-muted">
                  {displayImage ? (
                    <img
                      src={displayImage}
                      alt={course.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${course.thumbnail} opacity-60`} />
                  )}
                  
                  {/* Overlay Actions */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2 px-4 text-center">
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="bg-white/10 backdrop-blur-md border-white/10 hover:bg-white/20"
                      onClick={() => handleViewCourse(course)}
                    >
                      <Eye size={16} className="mr-2" />
                      Ver
                    </Button>
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="bg-white/10 backdrop-blur-md border-white/10 hover:bg-white/20"
                      onClick={() => handleEditCourse(course)}
                    >
                      <Edit2 size={16} className="mr-2" />
                      Editar
                    </Button>
                  </div>

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className="bg-black/60 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded text-white border border-white/10 shadow-sm">
                      {course.type}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => handleDeleteCourse(course.id!)}
                    className="absolute top-3 right-3 p-2 rounded-lg bg-black/60 backdrop-blur-md text-white/70 hover:text-destructive hover:bg-destructive/20 transition-all border border-white/10 shadow-sm"
                    title="Excluir"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="font-bold text-lg mb-2 text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                    {course.title}
                  </h3>
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                    {activeTab === 'gallery' ? (
                      <>
                        <div className="flex items-center gap-1.5">
                          <LayoutGrid size={13} className="text-primary/70" />
                          {galleryCount} {galleryCount === 1 ? 'galeria' : 'galerias'}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar size={13} className="text-primary/70" />
                          {totalModules} {totalModules === 1 ? 'módulo' : 'módulos'}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-1.5">
                          <Clock size={13} className="text-primary/70" />
                          {course.duration || '00:00'}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar size={13} className="text-primary/70" />
                          {course.launchDate || 'Em breve'}
                        </div>
                      </>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground mb-5 line-clamp-2">
                    {course.description || `Conteúdo produzido por ${course.author}`}
                  </p>

                  <div className="mt-auto pt-4 border-t border-border/40 flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase opacity-70">
                      ID: {course.id?.substring(0, 8)}...
                    </span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-primary hover:bg-primary/10 -mr-2"
                      onClick={() => handleViewCourse(course)}
                    >
                      {activeTab === 'courses' ? 'Acessar Curso' : activeTab === 'gallery' ? 'Ver Galerias' : 'Visualizar'}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {isFormOpen && (
        <CourseForm
          course={editingCourse}
          onSave={handleSaveCourse}
          onCancel={() => setIsFormOpen(false)}
        />
      )}

      {viewingCourse && (
        <div className="fixed inset-0 z-[100] bg-background">
          <CourseDetail
            course={viewingCourse}
            onBack={() => setViewingCourse(null)}
          />
        </div>
      )}
    </div>
  );
};

export default AdminCatalog;
