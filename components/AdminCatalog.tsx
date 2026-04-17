import React, { useState, useRef, useEffect } from 'react';
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
  Bell,
  Zap,
  MoreVertical
} from 'lucide-react';
import { Course } from '../lib/db';
import { useCatalogData, TabType } from '../hooks/useCatalogData';
import { useCatalogFilters } from '../hooks/useCatalogFilters';
import CourseForm from './CourseForm';
import CourseDetail from './CourseDetail';
import { getYouTubeThumbnail } from '../lib/video';
import { PageHeader } from './ui/PageHeader';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

const tabs = [
  { id: 'courses', label: 'Cursos & Vídeos', icon: Film },
  { id: 'gallery', label: 'Galerias', icon: LayoutGrid },
  { id: 'mindful', label: 'Mindful Flow', icon: Zap },
  { id: 'music', label: 'Músicas', icon: Music },
  { id: 'reminders', label: 'Lembretes', icon: Bell },
];

const AdminCatalog: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    loading,
    courses,
    isFormOpen,
    setIsFormOpen,
    editingCourse,
    setEditingCourse,
    viewingCourse,
    setViewingCourse,
    getCurrentList,
    handleSaveCourse,
    handleDeleteCourse,
    handleEditCourse,
    handleViewCourse,
  } = useCatalogData();

  const {
    searchTerm,
    setSearchTerm,
    dateFilterOpen,
    setDateFilterOpen,
    durationFilterOpen,
    setDurationFilterOpen,
    dateFilter,
    setDateFilter,
    durationFilter,
    setDurationFilter,
    filteredCourses,
    clearFilters,
  } = useCatalogFilters({ getCurrentList });

  const createLabel = activeTab === 'reminders' ? 'Novo Lembrete' : 'Novo Conteudo';
  const headerDescription = activeTab === 'reminders'
    ? 'Gerencie lembretes globais para os alunos autorizados.'
    : 'Gerencie seus cursos, aulas, galerias e materiais audiovisuais.';

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8">
      <PageHeader
        title="Catálogo de Conteúdo"
        description={headerDescription}
        action={
          <Button onClick={() => { setEditingCourse(null); setIsFormOpen(true); }} className="gap-2 w-full sm:w-auto">
            <Plus size={20} />
            {createLabel}
          </Button>
        }
      />

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 bg-[#111111]/50 p-1 rounded-xl border border-white/[0.06] w-full overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as TabType);
              setIsFormOpen(false);
              setEditingCourse(null);
              setViewingCourse(null);
            }}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all shrink-0
              ${activeTab === tab.id
                ? 'bg-[#FF6A00] text-white shadow-sm'
                : 'text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-white/5'}
            `}
          >
            <tab.icon size={16} />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-4 shadow-card">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex-1">
            <Input
              type="search"
              placeholder={activeTab === 'gallery' ? 'Buscar galerias...' : activeTab === 'reminders' ? 'Buscar lembretes...' : 'Buscar conteudo...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search className="text-[#9CA3AF]" size={18} />}
              className="w-full lg:max-w-md"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Date Filter Dropdown */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                className={`gap-2 ${dateFilter ? 'text-[#FF6A00]' : 'text-[#9CA3AF]'}`}
                onClick={() => {
                  setDateFilterOpen(!dateFilterOpen);
                  setDurationFilterOpen(false);
                }}
              >
                <Filter size={16} />
                Data de Lançamento
                <ChevronDown size={14} className={`transition-transform ${dateFilterOpen ? 'rotate-180' : ''}`} />
              </Button>
              {dateFilterOpen && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-[#1a1a1a] border border-white/[0.08] rounded-xl shadow-xl z-50 py-2">
                  {[
                    { value: '', label: 'Todos' },
                    { value: 'recent', label: 'Lançados recentemente (30 dias)' },
                    { value: 'upcoming', label: 'Em breve' },
                    { value: 'past', label: 'Já lançados' },
                  ].map(option => (
                    <button
                      key={option.value}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-white/5 transition-colors ${dateFilter === option.value ? 'text-[#FF6A00]' : 'text-[#F3F4F6]'}`}
                      onClick={() => { setDateFilter(option.value); setDateFilterOpen(false); }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Duration Filter Dropdown */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                className={`gap-2 ${durationFilter ? 'text-[#FF6A00]' : 'text-[#9CA3AF]'}`}
                onClick={() => {
                  setDurationFilterOpen(!durationFilterOpen);
                  setDateFilterOpen(false);
                }}
              >
                Duração
                <ChevronDown size={14} className={`transition-transform ${durationFilterOpen ? 'rotate-180' : ''}`} />
              </Button>
              {durationFilterOpen && (
                <div className="absolute top-full left-0 mt-2 w-40 bg-[#1a1a1a] border border-white/[0.08] rounded-xl shadow-xl z-50 py-2">
                  {[
                    { value: '', label: 'Todas' },
                    { value: 'short', label: 'Curta (< 10 min)' },
                    { value: 'medium', label: 'Média (10-30 min)' },
                    { value: 'long', label: 'Longa (> 30 min)' },
                  ].map(option => (
                    <button
                      key={option.value}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-white/5 transition-colors ${durationFilter === option.value ? 'text-[#FF6A00]' : 'text-[#F3F4F6]'}`}
                      onClick={() => { setDurationFilter(option.value); setDurationFilterOpen(false); }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Clear Filters */}
            {(dateFilter || durationFilter) && (
              <Button
                variant="ghost"
                size="sm"
                className="text-[#9CA3AF] hover:text-[#FF6A00]"
                onClick={() => { setDateFilter(''); setDurationFilter(''); }}
              >
                Limpar filtros
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Course Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="animate-spin text-[#FF6A00]" size={40} />
          <p className="text-[#9CA3AF] animate-pulse">Carregando catálogo...</p>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-[#111111]/30 border border-dashed border-white/[0.06] rounded-xl">
          <div className="w-16 h-16 rounded-full bg-[#9CA3AF]/10 flex items-center justify-center mb-4">
            <Search className="text-[#9CA3AF]/50" size={32} />
          </div>
          <h3 className="text-lg font-semibold text-[#F3F4F6] mb-1">
            {activeTab === 'gallery' ? 'Nenhuma galeria encontrada' : activeTab === 'reminders' ? 'Nenhum lembrete encontrado' : 'Nenhum conteudo encontrado'}
          </h3>
          <p className="text-[#9CA3AF] text-center max-w-xs mb-6">
            {activeTab === 'gallery'
              ? 'Tente ajustar sua busca ou crie uma nova galeria para começar.'
              : activeTab === 'reminders'
                ? 'Crie seu primeiro lembrete para comunicar avisos globais aos alunos.'
                : 'Comece criando novos conteudos para popular sua plataforma.'}
          </p>
          <Button variant="outline" onClick={clearFilters}>
            Limpar Filtros
          </Button>
        </div>
      ) : (
        <CatalogGrid
          courses={filteredCourses}
          activeTab={activeTab}
          onView={activeTab === 'reminders' ? handleEditCourse : handleViewCourse}
          onEdit={handleEditCourse}
          onDelete={handleDeleteCourse}
        />
      )}

      {isFormOpen && (
        <CourseForm
          key={`${activeTab}-${editingCourse?.id || 'new-course'}`}
          course={editingCourse}
          onSave={handleSaveCourse}
          onCancel={() => setIsFormOpen(false)}
          activeTab={activeTab}
          availableCourses={courses}
        />
      )}

      {viewingCourse && activeTab !== 'reminders' && (
        <div className="fixed inset-0 md:left-64 z-[100] bg-[#0B0B0B] overflow-y-auto overscroll-contain">
          <CourseDetail
            key={viewingCourse.id || 'no-course'}
            course={viewingCourse}
            onBack={() => setViewingCourse(null)}
          />
        </div>
      )}
    </div>
  );
};

// Extracted sub-component for the course grid
interface CatalogGridProps {
  courses: Course[];
  activeTab: TabType;
  onView: (course: Course) => void;
  onEdit: (course: Course) => void;
  onDelete: (id: string) => void;
}

const CatalogGrid: React.FC<CatalogGridProps> = ({ courses, activeTab, onView, onEdit, onDelete }) => {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
      {courses.map((course) => {
        const thumbnailUrl = course.videoUrl ? getYouTubeThumbnail(course.videoUrl) : null;
        const displayImage = course.coverImage || thumbnailUrl;
        const galleryCount = activeTab === 'gallery' ? (course.galleries?.length || 0) : 0;
        const totalModules = activeTab === 'gallery' ? (course.galleries?.reduce((acc, g) => acc + g.modules.length, 0) || 0) : 0;
        const isMenuOpen = openMenuId === course.id;

        return (
          <Card key={course.id} className="group overflow-hidden flex flex-col h-full border-white/[0.05] hover:border-[#FF6A00]/20 transition-all duration-300 rounded-xl shadow-sm">
            {/* Thumbnail Area */}
            <div className="w-full relative overflow-hidden bg-muted cursor-pointer" onClick={() => onView(course)}>
              {displayImage ? (
                <img
                  src={displayImage}
                  alt={course.title}
                  className="w-full h-auto block transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className={`w-full min-h-[120px] bg-gradient-to-br ${course.thumbnail} opacity-60`} />
              )}

              {/* Top Badges */}
              <div className="absolute top-3 left-3 flex gap-2 flex-wrap max-w-full pr-3">
                {activeTab === 'reminders' ? (
                  <span className="bg-[#FF6A00]/90 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded text-white border border-[#FF6A00]/20 shadow-sm">
                    Lembrete Global
                  </span>
                ) : (
                  <>
                    <span className="bg-black/80 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded text-white border border-white/10 shadow-sm">
                      {course.type}
                    </span>
                    {course.productId === '1' && (
                      <span className="bg-[#FF6A00]/80 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded text-white border border-[#FF6A00]/20 shadow-sm">
                        Mindful
                      </span>
                    )}
                    {course.productId === '2' && (
                      <span className="bg-[#8B5CF6]/80 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded text-white border border-[#8B5CF6]/20 shadow-sm">
                        Music
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="p-5 flex-1 flex flex-col">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-bold text-lg text-[#F3F4F6] line-clamp-1 group-hover:text-[#FF6A00] transition-colors">
                  {course.title}
                </h3>

                {/* Three-dot menu */}
                <div className="relative flex-shrink-0" ref={isMenuOpen ? menuRef : undefined}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(isMenuOpen ? null : course.id!);
                    }}
                    className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-white/[0.06] transition-all"
                    title="Opções"
                  >
                    <MoreVertical size={18} />
                  </button>

                  {isMenuOpen && (
                    <div className="absolute right-0 top-full mt-1 w-40 bg-[#1a1a1a] border border-white/[0.1] rounded-xl shadow-2xl z-50 py-1.5 animate-in fade-in zoom-in-95 duration-150">
                      <button
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#F3F4F6] hover:bg-white/[0.06] transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(null);
                          onView(course);
                        }}
                      >
                        <Eye size={15} className="text-[#9CA3AF]" />
                        Visualizar
                      </button>
                      <button
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#F3F4F6] hover:bg-white/[0.06] transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(null);
                          onEdit(course);
                        }}
                      >
                        <Edit2 size={15} className="text-[#9CA3AF]" />
                        Editar
                      </button>
                      <div className="mx-3 my-1 border-t border-white/[0.06]" />
                      <button
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(null);
                          onDelete(course.id!);
                        }}
                      >
                        <Trash2 size={15} />
                        Excluir
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-[#9CA3AF] mb-4">
                {activeTab === 'gallery' ? (
                  <>
                    <div className="flex items-center gap-1.5">
                      <LayoutGrid size={13} className="text-[#FF6A00]/70" />
                      {galleryCount} {galleryCount === 1 ? 'galeria' : 'galerias'}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar size={13} className="text-[#FF6A00]/70" />
                      {totalModules} {totalModules === 1 ? 'módulo' : 'módulos'}
                    </div>
                  </>
                ) : activeTab === 'reminders' ? (
                  <>
                    <div className="flex items-center gap-1.5">
                      <Bell size={13} className="text-[#FF6A00]/70" />
                      Global
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar size={13} className="text-primary/70" />
                      {course.launchDate || 'Sem data'}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-1.5">
                      <Clock size={13} className="text-[#FF6A00]/70" />
                      {course.duration || '00:00'}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar size={13} className="text-primary/70" />
                      {course.launchDate || 'Em breve'}
                    </div>
                  </>
                )}
              </div>

              <p className="text-sm text-[#9CA3AF] mb-5 line-clamp-2">
                {activeTab === 'reminders'
                  ? (course.description || 'Lembrete sem mensagem definida.')
                  : (course.description || `Conteudo produzido por ${course.author}`)}
              </p>

              <div className="mt-auto pt-4 border-t border-white/[0.06] flex items-center justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[#FF6A00] hover:bg-[#FF6A00]/10"
                  onClick={() => onView(course)}
                >
                  {activeTab === 'courses'
                    ? 'Acessar Curso'
                    : activeTab === 'gallery'
                      ? 'Ver Galerias'
                      : activeTab === 'reminders'
                        ? 'Editar Lembrete'
                        : 'Visualizar'}
                </Button>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default AdminCatalog;
