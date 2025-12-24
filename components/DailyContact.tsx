// Daily Contact disabled
//
// The original implementation is preserved below as a block comment so it can
// be restored later without re-creating the feature.
/*
import React, { useState, useEffect } from 'react';
import { PlayCircle, FileText, Mic, Clock, Filter, Loader2, ArrowLeft, CheckCircle, Download, Bookmark, Share2, Play } from 'lucide-react';
import { DailyContact as DailyContactType, getDailyContacts, getStudentCompletion, markContentComplete } from '../lib/db';
import { extractYouTubeId, getEmbedUrl, isGoogleDriveUrl, isYouTubeUrl, getYouTubeThumbnail } from '../lib/video';
import MediaUpload from './MediaUpload';
import CourseChat from './CourseChat';
import { logActivity } from '../lib/attendance';
import { addXP, XP_REWARDS } from '../lib/gamification';
import { auth } from '../lib/firebase';
import AnimatedInput from './ui/AnimatedInput';

interface DailyContactProps {
  onSelectDaily?: (daily: DailyContactType) => void;
  selectedDaily?: DailyContactType | null;
  onBack?: () => void;
}

const DailyContact: React.FC<DailyContactProps> = ({ onSelectDaily, selectedDaily, onBack }) => {
  const [dailyContacts, setDailyContacts] = useState<DailyContactType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'content' | 'media' | 'chat'>('content');
  const [isCompleted, setIsCompleted] = useState(false);
  const user = auth.currentUser;

  useEffect(() => {
    if (!selectedDaily) {
      loadDailyContacts();
    }
  }, [selectedDaily]);

  useEffect(() => {
    // Log daily contact started activity and load completion status
    const initializeDaily = async () => {
      if (user && selectedDaily?.id) {
        await logActivity(user.uid, 'course_started', selectedDaily.id, selectedDaily.title);

        // Load completion status
        const completion = await getStudentCompletion(user.uid, selectedDaily.id, 'daily');
        if (completion) {
          setIsCompleted(completion.completed);
        } else {
          setIsCompleted(false);
        }
      }
    };

    initializeDaily();
  }, [user, selectedDaily?.id]);

  const loadDailyContacts = async () => {
    setLoading(true);
    const data = await getDailyContacts();
    setDailyContacts(data);
    setLoading(false);
  };

  const handleMarkComplete = async () => {
    if (!user || !selectedDaily?.id) return;

    const newStatus = !isCompleted;

    if (newStatus) {
      // Save completion status
      await markContentComplete(user.uid, selectedDaily.id, 'daily', true);
      // Log daily contact completion
      await logActivity(user.uid, 'daily_contact', selectedDaily.id, selectedDaily.title);
      // Award XP
      await addXP(user.uid, XP_REWARDS.daily_contact, `Completed Daily Contact: ${selectedDaily.title}`);
      setIsCompleted(true);
    } else {
      // Allow unchecking
      await markContentComplete(user.uid, selectedDaily.id, 'daily', false);
      setIsCompleted(false);
    }
  };

  const filteredDailyContacts = dailyContacts.filter(daily =>
    daily.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    daily.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Detail View
  if (selectedDaily) {
    const videoId = selectedDaily.videoUrl ? extractYouTubeId(selectedDaily.videoUrl) : null;
    const embedUrl = getEmbedUrl(selectedDaily.videoUrl || '');

    return (
      <div className="max-w-container mx-auto min-h-screen bg-[#0B0B0B] flex flex-col">
        {/* Top Bar */}
        <div className="p-4 md:p-6 flex items-center gap-4 border-b border-white/[0.06] sticky top-0 bg-[#0B0B0B]/95 backdrop-blur-sm z-10">
          <button onClick={onBack} className="p-2 hover:bg-white/[0.02] rounded-xl text-[#9CA3AF] hover:text-[#F3F4F6] transition-all duration-200">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-[#F3F4F6]">{selectedDaily.title}</h1>
            <p className="text-xs text-[#9CA3AF]">{selectedDaily.author} • {selectedDaily.duration}</p>
          </div>
          <button
            onClick={handleMarkComplete}
            className={`px-4 py-2 rounded-xl font-medium text-sm flex items-center gap-2 transition-all duration-200 ${isCompleted
                ? 'bg-[#23D18B]/20 text-[#23D18B] border border-[#23D18B]/30'
                : 'bg-white/[0.02] text-[#9CA3AF] hover:bg-white/[0.04] border border-white/[0.06]'
              }`}
          >
            <CheckCircle size={16} />
            {isCompleted ? 'Concluída' : 'Marcar Concluída'}
          </button>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row">
          {/* Main Content Area (Player) */}
          <div className="flex-1 p-6 space-y-6">
            {/* Video Player */}
            <div className="aspect-video w-full bg-[#111111] rounded-xl overflow-hidden relative group border border-white/[0.06] shadow-card">
              {embedUrl ? (
                <iframe
                  className="w-full h-full"
                  src={embedUrl}
                  title={selectedDaily.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : selectedDaily.videoUrl ? (
                <div className="w-full h-full flex items-center justify-center">
                  <video
                    className="w-full h-full"
                    controls
                    src={selectedDaily.videoUrl}
                  >
                    Seu navegador não suporta a tag de vídeo.
                  </video>
                </div>
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
              <h2 className="text-xl font-bold text-[#F3F4F6] mb-4">Sobre este Daily Contact</h2>
              <p className="text-[#9CA3AF] leading-relaxed">
                {selectedDaily.description || 'Descrição não disponível.'}
              </p>
            </div>
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
                  <h3 className="text-sm font-semibold text-[#9CA3AF] uppercase tracking-wider mb-4">Daily Contact Atual</h3>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                    <div className="mt-1">
                      <Play size={16} className="text-[#FF6A00]" fill="currentColor" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-[#F3F4F6]">
                        {selectedDaily.title}
                      </h4>
                      <span className="text-xs text-[#9CA3AF]/60">{selectedDaily.duration}</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'media' && user && selectedDaily && (
                <MediaUpload
                  courseId={selectedDaily.id || ''}
                  courseName={selectedDaily.title}
                  studentId={user.uid}
                  studentName={user.displayName || user.email || 'User'}
                  isInstructor={user.email === 'jairosouza67@gmail.com'}
                />
              )}

              {activeTab === 'chat' && user && selectedDaily && (
                <CourseChat
                  courseId={selectedDaily.id || ''}
                  courseName={selectedDaily.title}
                  userId={user.uid}
                  userName={user.displayName || user.email || 'User'}
                  userEmail={user.email || ''}
                  isInstructor={user.email === 'jairosouza67@gmail.com'}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // List View
  return (
    <div className="p-8 max-w-container mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-[44px] leading-[1.05] font-bold text-[#F3F4F6]">Daily Contact</h1>
          <p className="text-[#9CA3AF] mt-1">Sua dose diária de evolução e aprendizado.</p>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <div className="flex-grow md:flex-grow-0 md:w-64">
            <AnimatedInput
              type="search"
              placeholder="Buscar daily contact..."
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDailyContacts.map((daily) => {
            const thumbnailUrl = daily.videoUrl ? getYouTubeThumbnail(daily.videoUrl) : null;

            return (
              <div
                key={daily.id}
                onClick={() => {
                  if (onSelectDaily) onSelectDaily(daily);
                }}
                className="group bg-[#111111] border border-white/[0.06] rounded-xl overflow-hidden hover:border-[#FF6A00]/50 hover:-translate-y-1 transition-all duration-200 cursor-pointer shadow-card hover:shadow-elevated"
              >
                {/* Thumbnail */}
                <div className={`h-40 w-full ${thumbnailUrl ? 'bg-black' : `bg-gradient-to-br ${daily.thumbnail}`} relative flex items-center justify-center overflow-hidden`}>
                  {thumbnailUrl ? (
                    <>
                      <img
                        src={thumbnailUrl}
                        alt={daily.title}
                        className="w-full h-full object-cover"
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
                    {daily.type === 'video' && <PlayCircle size={24} fill="white" className="text-white opacity-80" />}
                    {daily.type === 'pdf' && <FileText size={24} />}
                    {daily.type === 'audio' && <Mic size={24} />}
                  </div>

                  {/* Progress Bar overlay */}
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-black/30 z-10">
                    <div className="h-full bg-[#FF6A00]" style={{ width: `${daily.viewed ? 100 : 0}%` }}></div>
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-semibold text-[#FF6A00] uppercase tracking-wider">{daily.type}</span>
                    <div className="flex items-center gap-1 text-[#9CA3AF] text-xs">
                      <Clock size={12} />
                      <span>{daily.duration}</span>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-[#F3F4F6] mb-1 group-hover:text-[#FF6A00] transition-colors duration-200">{daily.title}</h3>
                  <p className="text-sm text-[#9CA3AF] mb-4">{daily.author}</p>

                  <button className="w-full py-3 rounded-xl bg-white/[0.02] text-[#9CA3AF] text-sm font-medium border border-white/[0.06] group-hover:bg-[#FF6A00] group-hover:text-white group-hover:border-transparent transition-all duration-200">
                    {daily.viewed ? 'Rever' : 'Assistir'}
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

export default DailyContact;
*/

export {};
