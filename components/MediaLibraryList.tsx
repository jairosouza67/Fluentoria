import React, { useState, useEffect } from 'react';
import { PlayCircle, FileText, Mic, Clock, Filter, Loader2 } from 'lucide-react';
import { Screen } from '../types';
import { Course, getMindfulFlowsForUser, getMusicForUser } from '../lib/db';
import { getYouTubeThumbnail } from '../lib/video';
import { useAppStore } from '../lib/stores/appStore';
import AnimatedInput from './ui/AnimatedInput';

type ContentType = 'mindful' | 'music';

interface MediaLibraryListProps {
  contentType: ContentType;
  onNavigate: (screen: Screen) => void;
  onSelectCourse: (course: Course) => void;
  courseId?: string | null;
}

const CONTENT_CONFIG: Record<ContentType, {
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  detailScreen: Screen;
  emptyText: string;
  cta: { start: string; replay: string; resume: string };
}> = {
  mindful: {
    title: 'Fluxo Mental',
    subtitle: 'Pratique mindfulness e exercícios de meditação.',
    searchPlaceholder: 'Buscar fluxos...',
    detailScreen: 'mindful-detail',
    emptyText: 'Nenhum fluxo mental disponível.',
    cta: { start: 'Iniciar exercício', replay: 'Repetir exercício', resume: 'Continuar' },
  },
  music: {
    title: 'Músicas',
    subtitle: 'Explore músicas relaxantes e playlists para foco.',
    searchPlaceholder: 'Buscar músicas...',
    detailScreen: 'music-detail',
    emptyText: 'Nenhuma música disponível.',
    cta: { start: 'Tocar agora', replay: 'Repetir', resume: 'Continuar' },
  },
};

const MediaLibraryList: React.FC<MediaLibraryListProps> = ({ contentType, onNavigate, onSelectCourse, courseId }) => {
  const user = useAppStore(state => state.user);
  const config = CONTENT_CONFIG[contentType];
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchCourses = async () => {
      if (!user) return;
      setLoading(true);
      const fetcher = contentType === 'mindful' ? getMindfulFlowsForUser : getMusicForUser;
      const data = await fetcher(user.uid, courseId || undefined);
      setCourses(data);
      setLoading(false);
    };
    fetchCourses();
  }, [user, courseId, contentType]);

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-container mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-[44px] leading-[1.05] font-bold text-[#F3F4F6]">{config.title}</h1>
          <p className="text-[#9CA3AF] mt-1">{config.subtitle}</p>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <div className="flex-grow md:flex-grow-0 md:w-64">
            <AnimatedInput
              type="search"
              placeholder={config.searchPlaceholder}
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
      ) : filteredCourses.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-white/[0.06] rounded-xl">
          <p className="text-[#9CA3AF]">{config.emptyText}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => {
            // Priority: 1. coverImage, 2. YouTube thumbnail, 3. gradient
            const coverImage = course.coverImage;
            const thumbnailUrl = !coverImage && course.videoUrl ? getYouTubeThumbnail(course.videoUrl) : null;
            const displayImage = coverImage || thumbnailUrl;
            const ctaLabel = course.progress === 0
              ? config.cta.start
              : course.progress === 100
                ? config.cta.replay
                : config.cta.resume;

            return (
              <div
                key={course.id}
                onClick={() => {
                  onSelectCourse(course);
                  onNavigate(config.detailScreen);
                }}
                className="group bg-[#111111] border border-white/[0.06] rounded-xl overflow-hidden hover:border-[#FF6A00]/50 hover:-translate-y-1 transition-all duration-200 cursor-pointer shadow-card hover:shadow-elevated"
              >
                {/* Thumbnail */}
                <div className={`w-full ${displayImage ? 'bg-black' : `bg-gradient-to-br ${course.thumbnail} min-h-[160px]`} relative flex items-center justify-center overflow-hidden`}>
                  {displayImage ? (
                    <>
                      <img
                        src={displayImage}
                        alt={course.title}
                        className="w-full h-auto block"
                        onError={(e) => {
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
                    {ctaLabel}
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

export default MediaLibraryList;