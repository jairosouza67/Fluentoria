import React, { useState, useEffect } from 'react';
import { Search, Plus, ChevronDown, Edit2, Trash2, Clock, Calendar, Loader2, MoreVertical, Eye } from 'lucide-react';
import { Course, getCourses, addCourse, updateCourse, deleteCourse, getDailyContacts, addDailyContact, updateDailyContact, deleteDailyContact, getMindfulFlows, addMindfulFlow, updateMindfulFlow, deleteMindfulFlow, getMusic, addMusic, updateMusic, deleteMusic, DailyContact } from '../lib/db';
import CourseForm from './CourseForm';
import CourseDetail from './CourseDetail';
import { getYouTubeThumbnail } from '../lib/youtube';

type TabType = 'courses' | 'daily' | 'mindful' | 'music';

const AdminCatalog: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('courses');
  const [courses, setCourses] = useState<Course[]>([]);
  const [dailyContacts, setDailyContacts] = useState<DailyContact[]>([]);
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

  const fetchDailyContacts = async () => {
    setLoading(true);
    const data = await getDailyContacts();
    setDailyContacts(data);
    setLoading(false);
  };

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
    if (activeTab === 'courses') {
      fetchCourses();
    } else if (activeTab === 'daily') {
      fetchDailyContacts();
    } else if (activeTab === 'mindful') {
      fetchMindfulFlows();
    } else if (activeTab === 'music') {
      fetchMusic();
    }
  }, [activeTab]);

  const handleSaveCourse = async (course: Course) => {
    if (activeTab === 'courses') {
      if (editingCourse && editingCourse.id) {
        await updateCourse(editingCourse.id, course);
      } else {
        await addCourse(course);
      }
      await fetchCourses();
    } else if (activeTab === 'daily') {
      // Convert Course to DailyContact
      const dailyContact: DailyContact = {
        ...course,
        date: course.launchDate || new Date().toISOString().split('T')[0],
        viewed: false
      };
      if (editingCourse && editingCourse.id) {
        await updateDailyContact(editingCourse.id, dailyContact);
      } else {
        await addDailyContact(dailyContact);
      }
      await fetchDailyContacts();
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
      } else if (activeTab === 'daily') {
        await deleteDailyContact(id);
        await fetchDailyContacts();
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
    if (activeTab === 'daily') return dailyContacts;
    if (activeTab === 'mindful') return mindfulFlows;
    if (activeTab === 'music') return musicList;
    return [];
  };

  const filteredCourses = getCurrentList().filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {activeTab === 'courses' && 'Minhas Aulas'}
            {activeTab === 'daily' && 'Daily Contact'}
            {activeTab === 'mindful' && 'Mindful Flow'}
            {activeTab === 'music' && 'Músicas'}
          </h1>
          <p className="text-muted-foreground mt-2">Gerencie seu conteúdo e listagens.</p>
        </div>
        <button
          onClick={() => {
            setEditingCourse(null);
            setIsFormOpen(true);
          }}
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-3 rounded-md font-medium flex items-center gap-2 shadow-sm hover:-translate-y-0.5 transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          Criar Novo Conteúdo
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab('courses')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            activeTab === 'courses'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Courses
        </button>
        <button
          onClick={() => setActiveTab('daily')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            activeTab === 'daily'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Daily Contact
        </button>
        <button
          onClick={() => setActiveTab('mindful')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            activeTab === 'mindful'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Mindful Flow
        </button>
        <button
          onClick={() => setActiveTab('music')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            activeTab === 'music'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Music
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-4 bg-card p-4 rounded-xl border border-border shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar conteúdo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 bg-secondary/50 border-transparent focus:border-primary/50 transition-all px-4 py-2.5 rounded-lg text-foreground placeholder-muted-foreground focus:outline-none"
          />
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 bg-transparent text-muted-foreground hover:text-foreground px-4 py-2.5 rounded-lg transition-colors">
            Data de Lançamento <ChevronDown size={16} />
          </button>
          <button className="flex items-center gap-2 bg-transparent text-muted-foreground hover:text-foreground px-4 py-2.5 rounded-lg transition-colors">
            Duração <ChevronDown size={16} />
          </button>
        </div>
      </div>

      {/* Course Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map((course) => {
            const thumbnailUrl = course.videoUrl ? getYouTubeThumbnail(course.videoUrl) : null;
            
            return (
              <div key={course.id} className="overflow-hidden bg-card border-border group hover:shadow-elevated transition-all duration-300 rounded-xl">
                {/* Thumbnail */}
                <div className="aspect-video relative overflow-hidden">
                  {thumbnailUrl ? (
                    <img 
                      src={thumbnailUrl} 
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${course.thumbnail}`} />
                  )}
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                  <div className="absolute top-3 right-3 flex gap-2">
                    <button
                      onClick={() => handleViewCourse(course)}
                      className="bg-card/80 backdrop-blur-sm text-muted-foreground hover:text-foreground p-2 rounded-lg transition-colors"
                      title="Visualizar"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => handleEditCourse(course)}
                      className="bg-card/80 backdrop-blur-sm text-muted-foreground hover:text-foreground p-2 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteCourse(course.id!)}
                      className="bg-card/80 backdrop-blur-sm text-muted-foreground hover:text-destructive p-2 rounded-lg transition-colors"
                      title="Excluir"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              
              {/* Content */}
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-lg line-clamp-2 text-foreground group-hover:text-primary transition-colors">
                    {course.title}
                  </h3>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {course.duration}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {course.launchDate || 'Em breve'}
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-1">Por {course.author}</p>
              </div>
              
              <div className="p-6 pt-0 flex justify-between items-center border-t border-border/50">
                <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{course.type}</span>
                <button 
                  onClick={() => handleViewCourse(course)}
                  className="border-primary/20 hover:bg-primary/10 hover:text-primary hover:border-primary px-4 py-2 rounded-lg text-sm font-medium border transition-all"
                >
                  Acessar
                </button>
              </div>
            </div>
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
        <div className="fixed inset-0 z-50 bg-[#0B0B0B]">
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
