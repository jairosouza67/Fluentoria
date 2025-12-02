
import React, { useState } from 'react';
import { ArrowLeft, CheckCircle, Download, MessageSquare, Share2, Bookmark, Play } from 'lucide-react';
import { Screen } from '../types';

interface CourseDetailProps {
  onBack: () => void;
}

const CourseDetail: React.FC<CourseDetailProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'content' | 'notes' | 'resources'>('content');
  const [isCompleted, setIsCompleted] = useState(false);

  return (
    <div className="max-w-7xl mx-auto min-h-screen bg-[#12100e] flex flex-col">
      {/* Top Bar */}
      <div className="p-4 md:p-6 flex items-center gap-4 border-b border-stone-800 sticky top-0 bg-[#12100e]/95 backdrop-blur-sm z-10">
        <button onClick={onBack} className="p-2 hover:bg-stone-800 rounded-full text-stone-400 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-white">Comunicação Não-Violenta</h1>
          <p className="text-xs text-stone-500">Aula 3 de 10 • Módulo 1</p>
        </div>
        <button 
          onClick={() => setIsCompleted(!isCompleted)}
          className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors ${
            isCompleted 
              ? 'bg-green-900/30 text-green-500 border border-green-900' 
              : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
          }`}
        >
          <CheckCircle size={16} />
          {isCompleted ? 'Concluída' : 'Marcar Concluída'}
        </button>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Main Content Area (Player) */}
        <div className="flex-1 p-6 space-y-6">
          {/* Video Player Placeholder */}
          <div className="aspect-video w-full bg-stone-900 rounded-2xl overflow-hidden relative group border border-stone-800 shadow-2xl">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center pl-1 cursor-pointer hover:scale-110 transition-transform shadow-lg shadow-orange-900/50">
                <Play size={24} className="text-white" fill="white" />
              </div>
            </div>
            {/* Fake Controls */}
            <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-black/80 to-transparent flex items-end px-4 pb-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-full h-1 bg-stone-600 rounded-full overflow-hidden">
                <div className="w-1/3 h-full bg-orange-500"></div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex gap-4">
               <button className="flex items-center gap-2 text-stone-400 hover:text-white text-sm font-medium transition-colors">
                 <Download size={18} />
                 <span>Material</span>
               </button>
               <button className="flex items-center gap-2 text-stone-400 hover:text-white text-sm font-medium transition-colors">
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
            <h2 className="text-xl font-bold text-white mb-4">Sobre esta aula</h2>
            <p className="text-stone-400 leading-relaxed">
              Nesta aula, exploraremos os quatro componentes da Comunicação Não-Violenta (CNV): observação, sentimento, necessidade e pedido. Aprenderemos como expressar nossos sentimentos de forma clara sem culpar os outros e como ouvir com empatia.
            </p>
            <h3 className="text-lg font-semibold text-white mt-6 mb-3">O que você vai aprender</h3>
            <ul className="space-y-2 text-stone-400 list-disc pl-5">
              <li>Diferenciar observações de julgamentos.</li>
              <li>Identificar e expressar sentimentos.</li>
              <li>Reconhecer as necessidades por trás dos sentimentos.</li>
            </ul>
          </div>
        </div>

        {/* Sidebar Context (Tabs) */}
        <div className="w-full lg:w-96 border-l border-stone-800 bg-[#151311] flex flex-col">
          <div className="flex border-b border-stone-800">
            <button 
              onClick={() => setActiveTab('content')}
              className={`flex-1 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'content' ? 'border-orange-500 text-orange-500' : 'border-transparent text-stone-400 hover:text-white'}`}
            >
              Conteúdo
            </button>
            <button 
              onClick={() => setActiveTab('notes')}
              className={`flex-1 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'notes' ? 'border-orange-500 text-orange-500' : 'border-transparent text-stone-400 hover:text-white'}`}
            >
              Anotações
            </button>
            <button 
              onClick={() => setActiveTab('resources')}
              className={`flex-1 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'resources' ? 'border-orange-500 text-orange-500' : 'border-transparent text-stone-400 hover:text-white'}`}
            >
              Recursos
            </button>
          </div>

          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === 'content' && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-4">Próximas Aulas</h3>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className={`flex items-start gap-3 p-3 rounded-lg hover:bg-stone-800/50 transition-colors cursor-pointer ${i === 1 ? 'bg-stone-800/80 border border-stone-700' : ''}`}>
                    <div className="mt-1">
                      {i === 1 ? <Play size={16} className="text-orange-500" /> : <div className="w-4 h-4 rounded-full border border-stone-600" />}
                    </div>
                    <div>
                      <h4 className={`text-sm font-medium ${i === 1 ? 'text-white' : 'text-stone-400'}`}>
                        {i === 1 ? 'Identificando Sentimentos' : `Aula Prática ${i}`}
                      </h4>
                      <span className="text-xs text-stone-600">12 min</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'notes' && (
              <div className="space-y-4 h-full flex flex-col">
                 <textarea 
                   className="w-full flex-1 bg-[#1c1917] border border-stone-800 rounded-lg p-4 text-stone-300 resize-none focus:outline-none focus:border-orange-500 transition-colors placeholder-stone-600"
                   placeholder="Digite suas anotações pessoais aqui..."
                 ></textarea>
                 <button className="w-full bg-stone-800 text-white py-2 rounded-lg hover:bg-stone-700 transition-colors">
                   Salvar Anotação
                 </button>
              </div>
            )}
             
            {activeTab === 'resources' && (
              <div className="space-y-3">
                 <div className="flex items-center gap-3 p-3 bg-stone-800/30 rounded-lg border border-stone-800 hover:border-orange-500/30 transition-colors cursor-pointer group">
                   <div className="p-2 bg-stone-800 rounded text-red-500">
                     <Download size={20} />
                   </div>
                   <div>
                     <h4 className="text-sm font-medium text-stone-300 group-hover:text-white">Slides da Aula.pdf</h4>
                     <p className="text-xs text-stone-600">2.4 MB</p>
                   </div>
                 </div>
                 <div className="flex items-center gap-3 p-3 bg-stone-800/30 rounded-lg border border-stone-800 hover:border-orange-500/30 transition-colors cursor-pointer group">
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
