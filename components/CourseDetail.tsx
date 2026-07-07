import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ArrowLeft, CheckCircle, Download, MessageSquare, Share2, Bookmark, Play, ChevronDown, ChevronRight, FileText, Mic, PlayCircle, Image as ImageIcon, Paperclip, File, Maximize, Minimize, Circle } from 'lucide-react';
import { Course, CourseLesson, CourseModule, CourseGallery, getStudentCompletion, markContentComplete, isAdminEmail, getLessonProgress, setLastLesson, countLessons } from '../lib/db';
import { extractYouTubeId, getEmbedUrl, getGoogleDriveDirectVideoUrl, isGoogleDriveUrl, isYouTubeUrl, formatDuration } from '../lib/video';
import { formatFileSize } from '../lib/media';
import CourseChat from './CourseChat';
import MediaUpload from './MediaUpload';
import { logActivity } from '../lib/attendance';
import { addXP, XP_REWARDS, markLessonCompleteWithXP } from '../lib/gamification';
import { auth } from '../lib/firebase';
import { useAppStore } from '../lib/stores/appStore';
import { useCourseStore } from '../lib/stores/courseStore';
import { Breadcrumbs } from './ui/Breadcrumbs';

interface CourseDetailProps {
  onBack: () => void;
  course: Course | null;
  selectedModule?: CourseModule | null;
  contentType?: 'course' | 'mindful' | 'music';
}

const CourseDetail: React.FC<CourseDetailProps> = ({ onBack, course, selectedModule, contentType = 'course' }) => {
  const isCourseContent = contentType === 'course';
  const [activeTab, setActiveTab] = useState<'content' | 'media' | 'chat'>('content');
  const [activeLesson, setActiveLesson] = useState<CourseLesson | null>(null);
  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  const [expandedGalleries, setExpandedGalleries] = useState<string[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);
  const [isImmersiveMode, setIsImmersiveMode] = useState(false);
  const [immersiveNotice, setImmersiveNotice] = useState<string | null>(null);
  const [lessonDurations, setLessonDurations] = useState<{ [key: string]: string }>({});
  const [driveVideoFailed, setDriveVideoFailed] = useState(false);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const footerHideTimeoutRef = useRef<number | null>(null);
  const user = auth.currentUser;

  const handleToggleLessonComplete = useCallback(async (lessonId: string, completed: boolean) => {
    if (!user || !course?.id) return;
    const newCompleted = await markLessonCompleteWithXP(user.uid, course.id, lessonId, completed);
    setCompletedLessonIds(prev => newCompleted
      ? Array.from(new Set([...prev, lessonId]))
      : prev.filter(id => id !== lessonId)
    );
  }, [user, course?.id]);

  const flatLessons = useMemo(() => {
    if (!course) return [] as Array<{ lesson: CourseLesson; galleryId?: string; moduleId: string }>;
    const out: Array<{ lesson: CourseLesson; galleryId?: string; moduleId: string }> = [];
    if (course.galleries && course.galleries.length > 0) {
      course.galleries.forEach(g => (g.modules || []).forEach(m =>
        (m.lessons || []).forEach(l => out.push({ lesson: l, galleryId: g.id, moduleId: m.id }))
      ));
    } else if (course.modules && course.modules.length > 0) {
      course.modules.forEach(m => (m.lessons || []).forEach(l => out.push({ lesson: l, moduleId: m.id })));
    } else if (course.videoUrl) {
      out.push({ lesson: { id: 'default', title: course.title, duration: course.duration, type: 'video', videoUrl: course.videoUrl }, moduleId: 'default' });
    }
    return out;
  }, [course]);

  const totalLessons = useMemo(() => (course ? countLessons(course) : 0), [course]);
  const courseProgress = totalLessons > 0 ? Math.round((completedLessonIds.length / totalLessons) * 100) : 0;

  const goToLessonByIndex = useCallback((index: number) => {
    const entry = flatLessons[index];
    if (!entry) return;
    setActiveLesson(entry.lesson);
    if (user && course?.id && isCourseContent) {
      setLastLesson(user.uid, course.id, entry.lesson.id, entry.galleryId, entry.moduleId);
    }
  }, [flatLessons, user, course?.id, isCourseContent]);

  const activeLessonIndex = useMemo(() => {
    if (!activeLesson) return -1;
    return flatLessons.findIndex(e => e.lesson.id === activeLesson.id);
  }, [flatLessons, activeLesson]);

  const hasNextLesson = activeLessonIndex >= 0 && activeLessonIndex < flatLessons.length - 1;
  const hasPrevLesson = activeLessonIndex > 0;

  const handleNext = useCallback(() => {
    if (hasNextLesson) goToLessonByIndex(activeLessonIndex + 1);
  }, [hasNextLesson, activeLessonIndex, goToLessonByIndex]);

  const handlePrev = useCallback(() => {
    if (hasPrevLesson) goToLessonByIndex(activeLessonIndex - 1);
  }, [hasPrevLesson, activeLessonIndex, goToLessonByIndex]);

  const handleCompleteAndAdvance = useCallback(async () => {
    if (!activeLesson) return;
    const isLast = !hasNextLesson;
    await handleToggleLessonComplete(activeLesson.id, true);
    if (!isLast) {
      handleNext();
    }
  }, [activeLesson, hasNextLesson, handleToggleLessonComplete, handleNext]);

  const isIOSDevice = (() => {
    if (typeof navigator === 'undefined') return false;

    return /iPad|iPhone|iPod/.test(navigator.userAgent)
      || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  })();

  const isStandaloneMode = (() => {
    if (typeof window === 'undefined') return false;

    const nav = navigator as Navigator & { standalone?: boolean };
    return window.matchMedia('(display-mode: standalone)').matches || Boolean(nav.standalone);
  })();

  useEffect(() => {
    if (!course) return;

    setActiveLesson(null);
    setExpandedModules([]);
    setExpandedGalleries([]);
    setDriveVideoFailed(false);
    setCompletedLessonIds([]);

    const applyInitialLesson = async () => {
      if (isCourseContent && user && course.id) {
        const progress = await getLessonProgress(user.uid, course.id);
        setCompletedLessonIds(progress?.completedLessonIds || []);

        const lastId = progress?.lastLessonId;
        const lastEntry = lastId ? flatLessons.find(e => e.lesson.id === lastId) : null;
        const entry = lastEntry || flatLessons[0];

        if (entry) {
          setActiveLesson(entry.lesson);
          if (entry.galleryId) {
            setExpandedGalleries(prev => Array.from(new Set([...prev, entry.galleryId!])));
          }
          setExpandedModules(prev => Array.from(new Set([...prev, entry.moduleId])));
        }
        return;
      }

      // Mindful/Music: original flow (first lesson of first module/gallery)
      if (course.galleries && course.galleries.length > 0) {
        const firstGallery = course.galleries[0];
        const firstModule = firstGallery.modules?.[0];
        const firstLesson = firstModule?.lessons?.[0];
        if (firstLesson) {
          setActiveLesson(firstLesson);
          setExpandedGalleries([firstGallery.id]);
          if (firstModule) setExpandedModules([firstModule.id]);
        }
      } else if (selectedModule && selectedModule.lessons?.length) {
        setActiveLesson(selectedModule.lessons[0]);
        setExpandedModules([selectedModule.id]);
      } else if (course.modules?.length) {
        const firstModule = course.modules[0];
        if (firstModule.lessons.length > 0) {
          setActiveLesson(firstModule.lessons[0]);
          setExpandedModules([firstModule.id]);
        }
      }
    };

    applyInitialLesson();
  }, [course?.id, selectedModule?.id, isCourseContent, user, flatLessons]);

  useEffect(() => {
    // Log course started activity and load completion status
    const initializeCourse = async () => {
      if (user && course?.id) {
        await logActivity(user.uid, 'course_started', course.id, course.title);

        if (!isCourseContent) {
          const completion = await getStudentCompletion(user.uid, course.id, contentType);
          if (completion) {
            setIsCompleted(completion.completed);
          }
        }
      }
    };

    initializeCourse();
  }, [user, course?.id, isCourseContent, contentType]);

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
      await markContentComplete(user.uid, course.id, contentType, true);
      await logActivity(user.uid, 'course_completed', course.id, course.title);
      await addXP(user.uid, XP_REWARDS.course_completed, `Completed: ${course.title}`);
      setIsCompleted(true);
    } else {
      await markContentComplete(user.uid, course.id, contentType, false);
      setIsCompleted(false);
    }
  };

  // Persist last watched lesson when active lesson changes (course content only)
  useEffect(() => {
    if (!isCourseContent || !user || !course?.id || !activeLesson) return;
    const entry = flatLessons.find(e => e.lesson.id === activeLesson.id);
    if (!entry) return;
    setLastLesson(user.uid, course.id, activeLesson.id, entry.galleryId, entry.moduleId);
  }, [activeLesson?.id, isCourseContent, user, course?.id, flatLessons]);

  // Determine what to show: active lesson or course default
  const currentTitle = activeLesson ? activeLesson.title : course?.title;
  const currentDescription = activeLesson ? activeLesson.description : course?.description;
  const currentVideoUrl = activeLesson ? activeLesson.videoUrl : course?.videoUrl;

  // Extract YouTube video ID if available or check for Drive URL
  const embedUrl = getEmbedUrl(currentVideoUrl || '');
  const isGoogleDriveVideo = activeLesson?.type === 'video' && isGoogleDriveUrl(currentVideoUrl || '');
  const googleDriveVideoUrl = isGoogleDriveVideo && !driveVideoFailed ? getGoogleDriveDirectVideoUrl(currentVideoUrl || '') : null;

  const lockOrientationForImmersive = async () => {
    if (!window.matchMedia('(max-width: 1024px)').matches) return;

    try {
      const orientationApi = screen.orientation as ScreenOrientation & {
        lock?: (orientation: 'any' | 'natural' | 'landscape' | 'portrait' | 'portrait-primary' | 'portrait-secondary' | 'landscape-primary' | 'landscape-secondary') => Promise<void>;
      };

      if (orientationApi?.lock) {
        await orientationApi.lock('landscape');
      }
    } catch {
      setImmersiveNotice('No iOS, a rotação automática pode ser bloqueada. Gire o aparelho manualmente para paisagem.');
    }
  };

  const unlockOrientation = () => {
    try {
      const orientationApi = screen.orientation as ScreenOrientation & {
        unlock?: () => void;
      };

      if (orientationApi?.unlock) {
        orientationApi.unlock();
      }
    } catch {
      // Ignore unlock failures.
    }
  };

  const setFooterVisibility = (active: boolean, visible: boolean) => {
    window.dispatchEvent(new CustomEvent('immersive-nav-visibility', {
      detail: { active, visible }
    }));
  };

  const clearFooterHideTimeout = () => {
    if (footerHideTimeoutRef.current) {
      window.clearTimeout(footerHideTimeoutRef.current);
      footerHideTimeoutRef.current = null;
    }
  };

  const showFooterTemporarily = () => {
    if (!isImmersiveMode) return;

    setFooterVisibility(true, true);
    clearFooterHideTimeout();

    footerHideTimeoutRef.current = window.setTimeout(() => {
      setFooterVisibility(true, false);
    }, 1800);
  };

  const toggleImmersiveMode = () => {
    if (isImmersiveMode) {
      setIsImmersiveMode(false);
      setImmersiveNotice(null);
      clearFooterHideTimeout();
      setFooterVisibility(false, true);
      unlockOrientation();
      return;
    }

    setIsImmersiveMode(true);
    setImmersiveNotice(null);
    setFooterVisibility(true, false);
    void lockOrientationForImmersive();
  };

  useEffect(() => {
    if (!isImmersiveMode) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsImmersiveMode(false);
      }
    };

    document.addEventListener('keydown', onEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onEscape);
      clearFooterHideTimeout();
      setFooterVisibility(false, true);
      unlockOrientation();
    };
  }, [isImmersiveMode]);

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

  const renderLessonCheck = (lesson: CourseLesson) => {
    if (!isCourseContent) return null;
    const done = completedLessonIds.includes(lesson.id);
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handleToggleLessonComplete(lesson.id, !done);
        }}
        className={`shrink-0 ${done ? 'text-[#23D18B]' : 'text-[#9CA3AF]/60 hover:text-[#9CA3AF]'} transition-colors`}
        aria-label={done ? 'Desmarcar aula como concluída' : 'Marcar aula como concluída'}
        title={done ? 'Aula concluída' : 'Marcar como concluída'}
      >
        {done ? <CheckCircle size={14} /> : <Circle size={14} />}
      </button>
    );
  };

  const navigateTo = useAppStore(state => state.navigateTo);
  const setSelectedCourse = useCourseStore(state => state.setSelectedCourse);
  const setSelectedGallery = useCourseStore(state => state.setSelectedGallery);
  const setSelectedModule = useCourseStore(state => state.setSelectedModule);

  const breadcrumbToCourses = () => {
    setSelectedCourse(null);
    setSelectedGallery(null);
    setSelectedModule(null);
    navigateTo('courses');
  };

  const breadcrumbToGalleries = () => {
    setSelectedGallery(null);
    setSelectedModule(null);
    navigateTo('gallery');
  };

  const breadcrumbToModules = () => {
    setSelectedModule(null);
    navigateTo('module-selection');
  };

  // Locate the active lesson's parent gallery/module to build the trail
  const activeBreadcrumbTrail = (() => {
    if (!course || !isCourseContent) return null;
    const activeId = activeLesson?.id;
    let foundGallery: CourseGallery | undefined;
    let foundModule: CourseModule | undefined;
    for (const g of course.galleries || []) {
      for (const m of g.modules || []) {
        if ((m.lessons || []).some(l => l.id === activeId)) {
          foundGallery = g;
          foundModule = m;
          break;
        }
      }
      if (foundGallery) break;
    }
    if (!foundGallery && !foundModule && course.modules) {
      for (const m of course.modules) {
        if ((m.lessons || []).some(l => l.id === activeId)) {
          foundModule = m;
          break;
        }
      }
    }
    const items: { label: string; onClick?: () => void }[] = [
      { label: 'Aulas', onClick: breadcrumbToCourses },
      { label: course.title, onClick: breadcrumbToGalleries },
    ];
    if (foundGallery) items.push({ label: foundGallery.title, onClick: breadcrumbToModules });
    if (foundModule && foundGallery) items.push({ label: foundModule.title });
    return items;
  })();

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
          {activeBreadcrumbTrail && activeBreadcrumbTrail.length > 1 && (
            <Breadcrumbs items={activeBreadcrumbTrail} className="mb-1 hidden md:flex" />
          )}
          <h1 className="text-base md:text-lg font-semibold text-[#F3F4F6] truncate">{course.title}</h1>
          <p className="text-xs text-[#9CA3AF]">{course.author} • {course.duration}</p>
        </div>
        {!isCourseContent && (
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
      )}
      </div>

      {/* Course progress bar (course content only) */}
      {isCourseContent && totalLessons > 0 && (
        <div className="px-4 md:px-6 py-2 border-b border-white/[0.06] bg-[#0B0B0B]/80">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-[#9CA3AF]">{completedLessonIds.length} de {totalLessons} aulas</span>
              <span className="text-xs font-medium text-[#FF6A00]">{courseProgress}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
              <div className="h-full bg-[#FF6A00] transition-all duration-500" style={{ width: `${courseProgress}%` }} />
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Main Content Area (Player) */}
        <div className="flex-1 p-6 space-y-6">
          {/* Video Player */}
          <div
            ref={playerContainerRef}
            className={`aspect-video w-full bg-[#111111] rounded-xl overflow-hidden relative group border border-white/[0.06] shadow-card ${isImmersiveMode ? 'fixed inset-0 z-50 h-[100dvh] w-screen max-w-none rounded-none border-0' : ''}`}
            onPointerMove={showFooterTemporarily}
            onTouchStart={showFooterTemporarily}
          >
            {(embedUrl || currentVideoUrl) && (
              <button
                type="button"
                onClick={toggleImmersiveMode}
                className="absolute bottom-3 right-3 z-10 p-2 rounded-lg bg-black/60 text-white hover:bg-black/80 transition-colors"
                aria-label={isImmersiveMode ? 'Sair do modo imersivo' : 'Entrar no modo imersivo'}
                title={isImmersiveMode ? 'Sair do modo imersivo' : 'Modo imersivo'}
              >
                {isImmersiveMode ? <Minimize size={16} /> : <Maximize size={16} />}
              </button>
            )}
            {googleDriveVideoUrl ? (
              <div className="w-full h-full flex items-center justify-center">
                <video
                  ref={videoRef}
                  className="w-full h-full block"
                  controls
                  playsInline
                  src={googleDriveVideoUrl}
                  poster={course.coverImage}
                  onError={() => setDriveVideoFailed(true)}
                >
                  Seu navegador não suporta a tag de vídeo.
                </video>
              </div>
            ) : embedUrl ? (
              <iframe
                ref={iframeRef}
                className="w-full h-full block"
                src={embedUrl}
                title={currentTitle}
                frameBorder="0"
                allow="fullscreen; accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              />
            ) : currentVideoUrl ? (
              <div className="w-full h-full flex items-center justify-center">
                <video
                  ref={videoRef}
                  className="w-full h-full block"
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
          {isImmersiveMode && isIOSDevice && isStandaloneMode && (
            <p className="text-xs text-[#F59E0B]">
              Em iOS/PWA, se não girar automaticamente, vire o aparelho manualmente para paisagem.
            </p>
          )}
          {immersiveNotice && (
            <p className="text-xs text-[#F59E0B]">{immersiveNotice}</p>
          )}

          {/* Lesson navigation (course content only) */}
          {isCourseContent && flatLessons.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-3 items-stretch">
              <button
                onClick={handlePrev}
                disabled={!hasPrevLesson}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-white/[0.04] text-sm font-medium flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white/[0.02] disabled:hover:text-[#9CA3AF]"
              >
                <ArrowLeft size={16} />
                <span>Aula anterior</span>
              </button>
              <button
                onClick={handleCompleteAndAdvance}
                disabled={!activeLesson}
                className={`flex-1 px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 ${
                  !hasNextLesson
                    ? 'bg-[#23D18B]/15 text-[#23D18B] border border-[#23D18B]/30 hover:bg-[#23D18B]/25'
                    : 'bg-[#FF6A00] text-white hover:bg-[#E15B00]'
                }`}
              >
                <CheckCircle size={16} />
                <span>{hasNextLesson ? 'Concluir e avançar' : 'Concluir aula'}</span>
              </button>
              <button
                onClick={handleNext}
                disabled={!hasNextLesson}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-white/[0.04] text-sm font-medium flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white/[0.02] disabled:hover:text-[#9CA3AF]"
              >
                <span>Próxima aula</span>
                <ChevronRight size={16} />
              </button>
            </div>
          )}

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
              Conteúdo
            </button>
            <button
              onClick={() => setActiveTab('media')}
              className={`flex-1 py-4 px-3 text-sm font-medium border-b-2 transition-all duration-200 whitespace-nowrap ${activeTab === 'media' ? 'border-[#FF6A00] text-[#FF6A00]' : 'border-transparent text-[#9CA3AF] hover:text-[#F3F4F6]'}`}
            >
              Mídia
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-4 px-3 text-sm font-medium border-b-2 transition-all duration-200 whitespace-nowrap ${activeTab === 'chat' ? 'border-[#FF6A00] text-[#FF6A00]' : 'border-transparent text-[#9CA3AF] hover:text-[#F3F4F6]'}`}
            >
              Dúvidas
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
                          <div className="flex items-center gap-2 min-w-0">
                            <ImageIcon size={14} className="text-[#FF6A00] shrink-0" />
                            <span className="font-semibold text-[#FF6A00] text-sm text-left truncate">{gallery.title}</span>
                            {isCourseContent && (() => {
                              const total = (gallery.modules || []).reduce((a, m) => a + (m.lessons?.length || 0), 0);
                              const done = (gallery.modules || []).reduce((a, m) => a + (m.lessons?.filter(l => completedLessonIds.includes(l.id)).length || 0), 0);
                              return total > 0 ? <span className="text-xs text-[#9CA3AF]/70 ml-1 shrink-0">{done}/{total}</span> : null;
                            })()}
                          </div>
                          {expandedGalleries.includes(gallery.id) ? (
                            <ChevronDown size={16} className="text-[#FF6A00] shrink-0" />
                          ) : (
                            <ChevronRight size={16} className="text-[#FF6A00] shrink-0" />
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
                                  <span className="font-medium text-[#F3F4F6] text-sm text-left flex items-center gap-2">
                                    <span className="truncate">{module.title}</span>
                                    {isCourseContent && module.lessons && module.lessons.length > 0 && (
                                      <span className="text-xs text-[#9CA3AF]/70">{module.lessons.filter(l => completedLessonIds.includes(l.id)).length}/{module.lessons.length}</span>
                                    )}
                                  </span>
                                  {expandedModules.includes(module.id) ? (
                                    <ChevronDown size={14} className="text-[#9CA3AF] shrink-0" />
                                  ) : (
                                    <ChevronRight size={14} className="text-[#9CA3AF] shrink-0" />
                                  )}
                                </button>

                                {expandedModules.includes(module.id) && (
                                  <div className="border-t border-white/[0.06] bg-black/30">
                                    {module.lessons.map(lesson => {
                                      const isActive = activeLesson?.id === lesson.id;
                                      const displayDuration = lessonDurations[lesson.id] || lesson.duration || '00:00';
                                      return (
                                        <div
                                          key={lesson.id}
                                          className={`w-full flex items-center gap-2 p-2 pl-3 transition-all duration-200 border-l-2 ${isActive
                                            ? 'bg-[#FF6A00]/10 border-[#FF6A00]'
                                            : 'hover:bg-white/[0.02] border-transparent'
                                            }`}
                                        >
                                          {renderLessonCheck(lesson)}
                                          <button
                                            onClick={() => setActiveLesson(lesson)}
                                            className="flex items-center gap-2 flex-1 min-w-0 text-left"
                                          >
                                            <div className={`mt-0.5 ${isActive ? 'text-[#FF6A00]' : 'text-[#9CA3AF]'}`}>
                                              {lesson.type === 'video' && <PlayCircle size={14} />}
                                              {lesson.type === 'audio' && <Mic size={14} />}
                                              {lesson.type === 'pdf' && <FileText size={14} />}
                                            </div>
                                            <div className="text-left flex-1 min-w-0">
                                              <h4 className={`text-xs font-medium truncate ${isActive ? 'text-[#FF6A00]' : 'text-[#9CA3AF]'}`}>
                                                {lesson.title}
                                              </h4>
                                              {displayDuration !== '00:00' && (
                                                <span className="text-xs text-[#9CA3AF]/60">{displayDuration}</span>
                                              )}
                                            </div>
                                          </button>
                                        </div>
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
                          <span className="font-medium text-[#F3F4F6] text-sm text-left flex items-center gap-2">
                            <span className="truncate">{module.title}</span>
                            {isCourseContent && module.lessons && module.lessons.length > 0 && (
                              <span className="text-xs text-[#9CA3AF]/70">{module.lessons.filter(l => completedLessonIds.includes(l.id)).length}/{module.lessons.length}</span>
                            )}
                          </span>
                          {expandedModules.includes(module.id) ? (
                            <ChevronDown size={16} className="text-[#9CA3AF] shrink-0" />
                          ) : (
                            <ChevronRight size={16} className="text-[#9CA3AF] shrink-0" />
                          )}
                        </button>

                        {expandedModules.includes(module.id) && (
                          <div className="border-t border-white/[0.06] bg-black/20">
                            {module.lessons.map(lesson => {
                              const isActive = activeLesson?.id === lesson.id;
                              const displayDuration = lessonDurations[lesson.id] || lesson.duration || '00:00';
                              return (
                                <div
                                  key={lesson.id}
                                  className={`w-full flex items-center gap-3 p-3 pl-4 transition-all duration-200 border-l-2 ${isActive
                                    ? 'bg-[#FF6A00]/10 border-[#FF6A00]'
                                    : 'hover:bg-white/[0.02] border-transparent'
                                    }`}
                                >
                                  {renderLessonCheck(lesson)}
                                  <button
                                    onClick={() => setActiveLesson(lesson)}
                                    className="flex items-center gap-3 flex-1 min-w-0 text-left"
                                  >
                                    <div className={`mt-0.5 ${isActive ? 'text-[#FF6A00]' : 'text-[#9CA3AF]'}`}>
                                      {lesson.type === 'video' && <PlayCircle size={16} />}
                                      {lesson.type === 'audio' && <Mic size={16} />}
                                      {lesson.type === 'pdf' && <FileText size={16} />}
                                    </div>
                                    <div className="text-left flex-1 min-w-0">
                                      <h4 className={`text-sm font-medium truncate ${isActive ? 'text-[#FF6A00]' : 'text-[#9CA3AF] group-hover:text-[#F3F4F6]'}`}>
                                        {lesson.title}
                                      </h4>
                                      {displayDuration !== '00:00' && (
                                        <span className="text-xs text-[#9CA3AF]/60">{displayDuration}</span>
                                      )}
                                    </div>
                                  </button>
                                </div>
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
