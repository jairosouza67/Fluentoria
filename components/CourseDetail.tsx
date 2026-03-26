import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, CheckCircle, Download, MessageSquare, Share2, Bookmark, Play, ChevronDown, ChevronRight, FileText, Mic, PlayCircle, Image as ImageIcon, Paperclip, File } from 'lucide-react';
import { Course, CourseLesson, CourseModule, CourseGallery, getStudentCompletion, markContentComplete, isAdminEmail } from '../lib/db';
import { extractYouTubeId, getEmbedUrl, isGoogleDriveUrl, isYouTubeUrl, formatDuration } from '../lib/video';
import { formatFileSize } from '../lib/media';
import CourseChat from './CourseChat';
import MediaUpload from './MediaUpload';
import { logActivity } from '../lib/attendance';
import { addXP, XP_REWARDS } from '../lib/gamification';
import { auth } from '../lib/firebase';

interface CourseDetailProps {
  onBack: () => void;
  course: Course | null;
  selectedModule?: CourseModule | null;
}

const CourseDetail: React.FC<CourseDetailProps> = ({ onBack, course, selectedModule }) => {
  const [activeTab, setActiveTab] = useState<'content' | 'media' | 'chat'>('content');
  const [activeLesson, setActiveLesson] = useState<CourseLesson | null>(null);
  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  const [expandedGalleries, setExpandedGalleries] = useState<string[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [lessonDurations, setLessonDurations] = useState<{ [key: string]: string }>({});
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const user = auth.currentUser;

  useEffect(() => {
    // Reset state when course changes
    setActiveLesson(null);
    setExpandedModules([]);
    setExpandedGalleries([]);

    // Handle new gallery structure
    if (course?.galleries && course.galleries.length > 0) {
      const firstGallery = course.galleries[0];
      if (firstGallery.modules && firstGallery.modules.length > 0) {
        const firstModule = firstGallery.modules[0];
        if (firstModule.lessons && firstModule.lessons.length > 0) {
          setActiveLesson(firstModule.lessons[0]);
          setExpandedGalleries([firstGallery.id]);
          setExpandedModules([firstModule.id]);
        }
      }
    }
    // Handle old module structure or selected module
    else if (selectedModule && selectedModule.lessons && selectedModule.lessons.length > 0) {
      setActiveLesson(selectedModule.lessons[0]);
      setExpandedModules([selectedModule.id]);
    } else if (course?.modules && course.modules.length > 0) {
      // Default to first lesson of first module if no specific module selected
      const firstModule = course.modules[0];
      if (firstModule.lessons.length > 0) {
        setActiveLesson(firstModule.lessons[0]);
        setExpandedModules([firstModule.id]);
      }
    }
  }, [course?.id, selectedModule?.id]);

  useEffect(() => {
    // Log course started activity and load completion status
    const initializeCourse = async () => {
      if (user && course?.id) {
        await logActivity(user.uid, 'course_started', course.id, course.title);

        // Load completion status
        const completion = await getStudentCompletion(user.uid, course.id, 'course');
        if (completion) {
          setIsCompleted(completion.completed);
        }
      }
    };

    initializeCourse();
  }, [user, course?.id]);

  // Capture video duration when video loads
  useEffect(() => {
    const videoElement = videoRef.current;
    if (videoElement && activeLesson?.id) {
      const handleLoadedMetadata = () => {
        const duration = formatDuration(videoElement.duration);
        if (duration && duration !== '00:00') {
          setLessonDurations(prev => ({
            ...prev,
            [activeLesson.id]: duration
          }));
        }
      };

      videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
      return () => {
        videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      };
    }
  }, [activeLesson?.id, activeLesson?.videoUrl]);

  // Try to capture duration for direct video URLs
  useEffect(() => {
    if (activeLesson?.videoUrl && activeLesson.id) {
      const videoUrl = activeLesson.videoUrl;

      // Skip YouTube and Drive URLs as they use iframes
      if (isYouTubeUrl(videoUrl) || isGoogleDriveUrl(videoUrl)) {
        return;
      }

      // Try to load direct video URLs (MP4, etc)
      if (videoUrl.match(/\.(mp4|webm|ogg)$/i)) {
        const video = document.createElement('video');
        video.src = videoUrl;
        video.preload = 'metadata';

        video.onloadedmetadata = () => {
          const duration = formatDuration(video.duration);
          if (duration && duration !== '00:00') {
            setLessonDurations(prev => ({
              ...prev,
              [activeLesson.id]: duration
            }));
          }
          video.remove();
        };

        video.onerror = () => {
          video.remove();
        };
      }
    }
  }, [activeLesson?.id, activeLesson?.videoUrl]);

  const handleMarkComplete = async () => {
    if (!user || !course?.id) return;

    const newStatus = !isCompleted;

    if (newStatus) {
      // Save completion status
      await markContentComplete(user.uid, course.id, 'course', true);
      // Log course completion
      await logActivity(user.uid, 'course_completed', course.id, course.title);
      // Award XP
      await addXP(user.uid, XP_REWARDS.course_completed, `Completed: ${course.title}`);
      setIsCompleted(true);
    } else {
      // Allow unchecking
      await markContentComplete(user.uid, course.id, 'course', false);
      setIsCompleted(false);
    }
  };

  // Determine what to show: active lesson or course default
  const currentTitle = activeLesson ? activeLesson.title : course?.title;
  const currentDescription = activeLesson ? activeLesson.description : course?.description;
  const currentVideoUrl = activeLesson ? activeLesson.videoUrl : course?.videoUrl;

  // Extract YouTube video ID if available or check for Drive URL
  const embedUrl = getEmbedUrl(currentVideoUrl || '');

  useEffect(() => {
    const iframeElement = iframeRef.current;

    if (!iframeElement || !embedUrl) {
      return;
    }

    // Add legacy fullscreen attributes for older iOS/WebView engines.
    iframeElement.setAttribute('allowfullscreen', '');
    iframeElement.setAttribute('webkitallowfullscreen', '');
    iframeElement.setAttribute('mozallowfullscreen', '');
  }, [embedUrl]);

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev =>
      prev.includes(moduleId)
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const toggleGallery = (galleryId: string) => {
    setExpandedGalleries(prev =>
      prev.includes(galleryId)
        ? prev.filter(id => id !== galleryId)
        : [...prev, galleryId]
    );
  };

  if (!course) {
    return (
      <div className="max-w-7xl mx-auto min-h-screen bg-[#12100e] flex items-center justify-center">
        <div className="text-center">
          <p className="text-stone-400 mb-4">Curso não encontrado</p>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#0B0B0B] flex flex-col">
      {/* Top Bar */}
      <div className="p-4 md:p-6 flex items-center gap-3 md:gap-4 border-b border-white/[0.06] sticky top-0 bg-[#0B0B0B]/95 backdrop-blur-sm z-10">
        <button onClick={onBack} className="p-2 hover:bg-white/[0.02] rounded-xl text-[#9CA3AF] hover:text-[#F3F4F6] transition-all duration-200">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-base md:text-lg font-semibold text-[#F3F4F6] truncate">{course.title}</h1>
          <p className="text-xs text-[#9CA3AF]">{course.author} • {course.duration}</p>
        </div>
        <button
          onClick={handleMarkComplete}
          className={`px-3 md:px-4 py-2 rounded-xl font-medium text-sm flex items-center gap-2 transition-all duration-200 shrink-0 ${isCompleted
            ? 'bg-[#23D18B]/20 text-[#23D18B] border border-[#23D18B]/30'
            : 'bg-white/[0.02] text-[#9CA3AF] hover:bg-white/[0.04] border border-white/[0.06]'
            }`}
        >
          <CheckCircle size={16} />
          <span className="hidden sm:inline">{isCompleted ? 'Concluída' : 'Marcar Concluída'}</span>
        </button>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Main Content Area (Player) */}
        <div className="flex-1 p-6 space-y-6">
          {/* Video Player */}
          <div className="aspect-video w-full bg-[#111111] rounded-xl overflow-hidden relative group border border-white/[0.06] shadow-card">
            {embedUrl ? (
              <iframe
                ref={iframeRef}
                className="w-full h-full"
                src={embedUrl}
                title={currentTitle}
                frameBorder="0"
                allow="fullscreen; accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : currentVideoUrl ? (
              <div className="w-full h-full flex items-center justify-center">
                <video
                  ref={videoRef}
                  className="w-full h-full"
                  controls
                  src={currentVideoUrl}
                  poster={course.coverImage}
                >
                  Seu navegador não suporta a tag de vídeo.
                </video>
              </div>
            ) : course.coverImage ? (
              <img
                src={course.coverImage}
                alt={course.title}
                className="w-full h-auto block"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-[#FF6A00]/20 rounded-full flex items-center justify-center pl-1 mb-4 mx-auto">
                    <Play size={24} className="text-[#FF6A00]" fill="currentColor" />
                  </div>
                  <p className="text-[#9CA3AF] text-sm">Vídeo não disponível</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex gap-4">
              <button className="flex items-center gap-2 text-[#9CA3AF] hover:text-[#F3F4F6] text-sm font-medium transition-colors duration-200">
                <Download size={18} />
                <span>Material</span>
              </button>
              <button className="flex items-center gap-2 text-[#9CA3AF] hover:text-[#F3F4F6] text-sm font-medium transition-colors duration-200">
                <Bookmark size={18} />
                <span>Salvar</span>
              </button>
            </div>
            <button className="flex items-center gap-2 text-stone-400 hover:text-white text-sm font-medium transition-colors">
              <Share2 size={18} />
              <span>Compartilhar</span>
            </button>
          </div>

          <div className="prose prose-invert max-w-none">
            <h2 className="text-xl font-bold text-[#F3F4F6] mb-4">Sobre esta aula</h2>
            <p className="text-[#9CA3AF] leading-relaxed">
              {currentDescription || 'Descrição não disponível.'}
            </p>
          </div>

          {/* Support Materials Section */}
          {activeLesson?.supportMaterials && activeLesson.supportMaterials.length > 0 && (
            <div className="mt-6 p-6 bg-[#111111] border border-white/[0.06] rounded-xl">
              <h3 className="text-lg font-semibold text-[#F3F4F6] mb-4 flex items-center gap-2">
                <Paperclip size={20} className="text-[#FF6A00]" />
                Materiais de Apoio
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activeLesson.supportMaterials.map((material) => {
                  const icon = material.type === 'pdf' ? <FileText size={18} /> :
                    material.type === 'image' ? <ImageIcon size={18} /> :
                      <Mic size={18} />;

                  return (
                    <a
                      key={material.id}
                      href={material.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      className="flex items-center gap-3 p-4 bg-white/[0.02] border border-white/[0.06] rounded-lg hover:bg-white/[0.04] hover:border-[#FF6A00]/50 transition-all duration-200 group"
                    >
                      <div className="text-[#FF6A00] group-hover:scale-110 transition-transform">
                        {icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#F3F4F6] truncate group-hover:text-[#FF6A00] transition-colors">
                          {material.name}
                        </p>
                        {material.size && (
                          <p className="text-xs text-[#9CA3AF]">{formatFileSize(material.size)}</p>
                        )}
                      </div>
                      <Download size={16} className="text-[#9CA3AF] group-hover:text-[#FF6A00] transition-colors" />
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Context (Tabs) */}
        <div className="w-full lg:w-96 border-l border-white/[0.06] bg-[#111111] flex flex-col">
          <div className="flex border-b border-white/[0.06] overflow-x-auto">
            <button
              onClick={() => setActiveTab('content')}
              className={`flex-1 py-4 px-3 text-sm font-medium border-b-2 transition-all duration-200 whitespace-nowrap ${activeTab === 'content' ? 'border-[#FF6A00] text-[#FF6A00]' : 'border-transparent text-[#9CA3AF] hover:text-[#F3F4F6]'}`}
            >
              Content
            </button>
            <button
              onClick={() => setActiveTab('media')}
              className={`flex-1 py-4 px-3 text-sm font-medium border-b-2 transition-all duration-200 whitespace-nowrap ${activeTab === 'media' ? 'border-[#FF6A00] text-[#FF6A00]' : 'border-transparent text-[#9CA3AF] hover:text-[#F3F4F6]'}`}
            >
              Media
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-4 px-3 text-sm font-medium border-b-2 transition-all duration-200 whitespace-nowrap ${activeTab === 'chat' ? 'border-[#FF6A00] text-[#FF6A00]' : 'border-transparent text-[#9CA3AF] hover:text-[#F3F4F6]'}`}
            >
              Questions
            </button>
          </div>

          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === 'content' && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-[#9CA3AF] uppercase tracking-wider mb-4">Conteúdo do Curso</h3>

                {/* New Gallery Structure */}
                {course.galleries && course.galleries.length > 0 ? (
                  <div className="space-y-3">
                    {course.galleries.map(gallery => (
                      <div key={gallery.id} className="border-2 border-[#FF6A00]/20 rounded-xl overflow-hidden bg-[#111111]">
                        {/* Gallery Header */}
                        <button
                          onClick={() => toggleGallery(gallery.id)}
                          className="w-full flex items-center justify-between p-4 hover:bg-[#FF6A00]/5 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <ImageIcon size={14} className="text-[#FF6A00]" />
                            <span className="font-semibold text-[#FF6A00] text-sm text-left">{gallery.title}</span>
                          </div>
                          {expandedGalleries.includes(gallery.id) ? (
                            <ChevronDown size={16} className="text-[#FF6A00]" />
                          ) : (
                            <ChevronRight size={16} className="text-[#FF6A00]" />
                          )}
                        </button>

                        {/* Gallery Modules */}
                        {expandedGalleries.includes(gallery.id) && (
                          <div className="border-t border-[#FF6A00]/10 bg-black/20 p-2 space-y-2">
                            {gallery.modules.map(module => (
                              <div key={module.id} className="border border-white/[0.06] rounded-lg overflow-hidden bg-[#0a0a0a]">
                                <button
                                  onClick={() => toggleModule(module.id)}
                                  className="w-full flex items-center justify-between p-3 hover:bg-white/[0.02] transition-colors"
                                >
                                  <span className="font-medium text-[#F3F4F6] text-sm text-left">{module.title}</span>
                                  {expandedModules.includes(module.id) ? (
                                    <ChevronDown size={14} className="text-[#9CA3AF]" />
                                  ) : (
                                    <ChevronRight size={14} className="text-[#9CA3AF]" />
                                  )}
                                </button>

                                {expandedModules.includes(module.id) && (
                                  <div className="border-t border-white/[0.06] bg-black/30">
                                    {module.lessons.map(lesson => {
                                      const isActive = activeLesson?.id === lesson.id;
                                      const displayDuration = lessonDurations[lesson.id] || lesson.duration || '00:00';
                                      return (
                                        <button
                                          key={lesson.id}
                                          onClick={() => setActiveLesson(lesson)}
                                          className={`w-full flex items-center gap-2 p-2 pl-3 transition-all duration-200 border-l-2 ${isActive
                                            ? 'bg-[#FF6A00]/10 border-[#FF6A00]'
                                            : 'hover:bg-white/[0.02] border-transparent'
                                            }`}
                                        >
                                          <div className={`mt-0.5 ${isActive ? 'text-[#FF6A00]' : 'text-[#9CA3AF]'}`}>
                                            {lesson.type === 'video' && <PlayCircle size={14} />}
                                            {lesson.type === 'audio' && <Mic size={14} />}
                                            {lesson.type === 'pdf' && <FileText size={14} />}
                                          </div>
                                          <div className="text-left flex-1">
                                            <h4 className={`text-xs font-medium ${isActive ? 'text-[#FF6A00]' : 'text-[#9CA3AF]'}`}>
                                              {lesson.title}
                                            </h4>
                                            {displayDuration !== '00:00' && (
                                              <span className="text-xs text-[#9CA3AF]/60">{displayDuration}</span>
                                            )}
                                          </div>
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : course.modules && course.modules.length > 0 ? (
                  // Old Module Structure (Backward Compatibility)
                  <div className="space-y-2">
                    {course.modules.map(module => (
                      <div key={module.id} className="border border-white/[0.06] rounded-xl overflow-hidden bg-[#111111]">
                        <button
                          onClick={() => toggleModule(module.id)}
                          className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
                        >
                          <span className="font-medium text-[#F3F4F6] text-sm text-left">{module.title}</span>
                          {expandedModules.includes(module.id) ? (
                            <ChevronDown size={16} className="text-[#9CA3AF]" />
                          ) : (
                            <ChevronRight size={16} className="text-[#9CA3AF]" />
                          )}
                        </button>

                        {expandedModules.includes(module.id) && (
                          <div className="border-t border-white/[0.06] bg-black/20">
                            {module.lessons.map(lesson => {
                              const isActive = activeLesson?.id === lesson.id;
                              const displayDuration = lessonDurations[lesson.id] || lesson.duration || '00:00';
                              return (
                                <button
                                  key={lesson.id}
                                  onClick={() => setActiveLesson(lesson)}
                                  className={`w-full flex items-center gap-3 p-3 pl-4 transition-all duration-200 border-l-2 ${isActive
                                    ? 'bg-[#FF6A00]/10 border-[#FF6A00]'
                                    : 'hover:bg-white/[0.02] border-transparent'
                                    }`}
                                >
                                  <div className={`mt-0.5 ${isActive ? 'text-[#FF6A00]' : 'text-[#9CA3AF]'}`}>
                                    {lesson.type === 'video' && <PlayCircle size={16} />}
                                    {lesson.type === 'audio' && <Mic size={16} />}
                                    {lesson.type === 'pdf' && <FileText size={16} />}
                                  </div>
                                  <div className="text-left flex-1">
                                    <h4 className={`text-sm font-medium ${isActive ? 'text-[#FF6A00]' : 'text-[#9CA3AF] group-hover:text-[#F3F4F6]'}`}>
                                      {lesson.title}
                                    </h4>
                                    {displayDuration !== '00:00' && (
                                      <span className="text-xs text-[#9CA3AF]/60">{displayDuration}</span>
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : course.videoUrl ? (
                  // Single Video
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                    <div className="mt-1">
                      <Play size={16} className="text-[#FF6A00]" fill="currentColor" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-[#F3F4F6]">
                        {course.title}
                      </h4>
                      <span className="text-xs text-[#9CA3AF]/60">{course.duration}</span>
                    </div>
                  </div>
                ) : (
                  // Empty Course - No Content
                  <div className="flex flex-col items-center justify-center py-12 px-6 bg-white/[0.02] border border-dashed border-white/[0.08] rounded-xl">
                    <div className="w-16 h-16 rounded-full bg-white/[0.04] flex items-center justify-center mb-4">
                      <Play size={24} className="text-[#9CA3AF]/50" />
                    </div>
                    <h4 className="text-sm font-medium text-[#9CA3AF] mb-1">
                      Curso em preparação
                    </h4>
                    <p className="text-xs text-[#9CA3AF]/60 text-center">
                      Este curso ainda não possui conteúdo disponível.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'media' && user && course && (
              <MediaUpload
                courseId={course.id || ''}
                courseName={course.title}
                studentId={user.uid}
                studentName={user.displayName || user.email || 'User'}
                isInstructor={!!user.email && isAdminEmail(user.email)}
              />
            )}

            {activeTab === 'chat' && user && course && (
              <CourseChat
                courseId={course.id || ''}
                courseName={course.title}
                userId={user.uid}
                userName={user.displayName || user.email || 'User'}
                userEmail={user.email || ''}
                isInstructor={!!user.email && isAdminEmail(user.email)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;
