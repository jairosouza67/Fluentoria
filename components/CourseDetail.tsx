
import React, { useState } from 'react';
import { ArrowLeft, CheckCircle, Download, MessageSquare, Share2, Bookmark, Play } from 'lucide-react';
import { Screen } from '../types';
import { Course } from '../lib/db';
import { extractYouTubeId, getYouTubeEmbedUrl, isYouTubeUrl } from '../lib/youtube';

interface CourseDetailProps {
  onBack: () => void;
  course: Course | null;
}

const CourseDetail: React.FC<CourseDetailProps> = ({ onBack, course }) => {
  const [activeTab, setActiveTab] = useState<'content' | 'notes' | 'resources'>('content');
  const [isCompleted, setIsCompleted] = useState(false);

  // Extract YouTube video ID if available
  const videoId = course?.videoUrl ? extractYouTubeId(course.videoUrl) : null;
  const hasYouTubeVideo = videoId && isYouTubeUrl(course?.videoUrl || '');

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
    <div className="max-w-container mx-auto min-h-screen bg-[#0B0B0B] flex flex-col">
      {/* Top Bar */}
      <div className="p-4 md:p-6 flex items-center gap-4 border-b border-white/[0.06] sticky top-0 bg-[#0B0B0B]/95 backdrop-blur-sm z-10">
        <button onClick={onBack} className="p-2 hover:bg-white/[0.02] rounded-xl text-[#9CA3AF] hover:text-[#F3F4F6] transition-all duration-200">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-[#F3F4F6]">{course.title}</h1>
          <p className="text-xs text-[#9CA3AF]">{course.author} • {course.duration}</p>
        </div>
        <button 
          onClick={() => setIsCompleted(!isCompleted)}
          className={`px-4 py-2 rounded-xl font-medium text-sm flex items-center gap-2 transition-all duration-200 ${
            isCompleted 
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
            {hasYouTubeVideo ? (
              <iframe
                className="w-full h-full"
                src={getYouTubeEmbedUrl(videoId!)}
                title={course.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : course.videoUrl ? (
              <div className="w-full h-full flex items-center justify-center">
                <video
                  className="w-full h-full"
                  controls
                  src={course.videoUrl}
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
            <h2 className="text-xl font-bold text-[#F3F4F6] mb-4">Sobre esta aula</h2>
            <p className="text-[#9CA3AF] leading-relaxed">
              {course.description || 'Descrição não disponível.'}
            </p>
          </div>
        </div>

        {/* Sidebar Context (Tabs) */}
        <div className="w-full lg:w-96 border-l border-white/[0.06] bg-[#111111] flex flex-col">
          <div className="flex border-b border-white/[0.06]">
            <button 
              onClick={() => setActiveTab('content')}
              className={`flex-1 py-4 text-sm font-medium border-b-2 transition-all duration-200 ${activeTab === 'content' ? 'border-[#FF6A00] text-[#FF6A00]' : 'border-transparent text-[#9CA3AF] hover:text-[#F3F4F6]'}`}
            >
              Conteúdo
            </button>
            <button 
              onClick={() => setActiveTab('notes')}
              className={`flex-1 py-4 text-sm font-medium border-b-2 transition-all duration-200 ${activeTab === 'notes' ? 'border-[#FF6A00] text-[#FF6A00]' : 'border-transparent text-[#9CA3AF] hover:text-[#F3F4F6]'}`}
            >
              Anotações
            </button>
            <button 
              onClick={() => setActiveTab('resources')}
              className={`flex-1 py-4 text-sm font-medium border-b-2 transition-all duration-200 ${activeTab === 'resources' ? 'border-[#FF6A00] text-[#FF6A00]' : 'border-transparent text-[#9CA3AF] hover:text-[#F3F4F6]'}`}
            >
              Recursos
            </button>
          </div>

          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === 'content' && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-[#9CA3AF] uppercase tracking-wider mb-4">Próximas Aulas</h3>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className={`flex items-start gap-3 p-3 rounded-lg hover:bg-white/[0.02] transition-all duration-200 cursor-pointer ${i === 1 ? 'bg-white/[0.04] border border-white/[0.06]' : ''}`}>
                    <div className="mt-1">
                      {i === 1 ? <Play size={16} className="text-[#FF6A00]" /> : <div className="w-4 h-4 rounded-full border border-white/[0.2]" />}
                    </div>
                    <div>
                      <h4 className={`text-sm font-medium ${i === 1 ? 'text-[#F3F4F6]' : 'text-[#9CA3AF]'}`}>
                        {i === 1 ? 'Identificando Sentimentos' : `Aula Prática ${i}`}
                      </h4>
                      <span className="text-xs text-[#9CA3AF]/60">12 min</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'notes' && (
              <div className="space-y-4 h-full flex flex-col">
                 <textarea 
                   className="w-full flex-1 bg-[#111111] border border-white/[0.06] rounded-lg p-4 text-[#F3F4F6] resize-none focus:outline-none focus:border-[#FF6A00]/40 transition-colors duration-120 placeholder-[#9CA3AF]"
                   placeholder="Digite suas anotações pessoais aqui..."
                 ></textarea>
                 <button className="w-full bg-[#FF6A00] text-white py-3 rounded-xl hover:bg-[#E15B00] hover:-translate-y-0.5 transition-all duration-200 font-medium shadow-sm hover:shadow-[0_8px_24px_rgba(255,106,0,0.12)]">
                   Salvar Anotação
                 </button>
              </div>
            )}
             
            {activeTab === 'resources' && (
              <div className="space-y-3">
                 <div className="flex items-center gap-3 p-3 bg-white/[0.02] rounded-lg border border-white/[0.06] hover:border-[#FF6A00]/30 transition-all duration-200 cursor-pointer group">
                   <div className="p-2 bg-[#111111] rounded text-[#FF6A00]">
                     <Download size={20} />
                   </div>
                   <div>
                     <h4 className="text-sm font-medium text-[#9CA3AF] group-hover:text-[#F3F4F6]">Slides da Aula.pdf</h4>
                     <p className="text-xs text-[#9CA3AF]/60">2.4 MB</p>
                   </div>
                 </div>
                 <div className="flex items-center gap-3 p-3 bg-white/[0.02] rounded-lg border border-white/[0.06] hover:border-[#FF6A00]/30 transition-all duration-200 cursor-pointer group">
                   <div className="p-2 bg-stone-800 rounded text-blue-500">
                     <Download size={20} />
                   </div>
                   <div>
                     <h4 className="text-sm font-medium text-stone-300 group-hover:text-white">Exercício Prático.docx</h4>
                     <p className="text-xs text-stone-600">1.1 MB</p>
                   </div>
                 </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;
