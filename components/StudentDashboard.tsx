
import React from 'react';
import { Search, BookOpen, Edit3, Activity, Music, ArrowRight } from 'lucide-react';
import { Module, Recommendation, Screen } from '../types';

interface StudentDashboardProps {
  onNavigate: (screen: Screen) => void;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ onNavigate }) => {
  const activeModules: Module[] = [
    { id: '1', title: 'Aulas', subtitle: '15/30 Aulas Concluídas', progress: 50, iconType: 'book', actionLabel: 'Continuar', targetScreen: 'courses' },
    { id: '2', title: 'Daily Contact', subtitle: 'Comece sua atividade diária', iconType: 'edit', actionLabel: 'Começar', targetScreen: 'daily' },
    { id: '3', title: 'Mindful Flow', subtitle: 'Inicie seu exercício', iconType: 'activity', actionLabel: 'Iniciar Prática', targetScreen: 'mindful' },
    { id: '4', title: 'Músicas', subtitle: 'Playlists para foco', iconType: 'music', actionLabel: 'Ouvir Agora', targetScreen: 'music' },
  ];

  const recommendations: Recommendation[] = [
    { id: '1', title: 'Liderança Efetiva', subtitle: 'Desenvolva suas habilidades', gradient: 'from-orange-500 to-purple-900' },
    { id: '2', title: 'Comunicação Assertiva', subtitle: 'Módulo intermediário', gradient: 'from-cyan-100 via-sky-300 to-blue-900' },
    { id: '3', title: 'Gestão de Tempo', subtitle: 'Técnicas e ferramentas', gradient: 'from-orange-600 via-red-500 to-slate-900' },
    { id: '4', title: 'Produtividade', subtitle: 'Maximize seu potencial', gradient: 'from-indigo-900 via-purple-500 to-teal-300' },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Seu Painel de Controle</h1>
          <p className="text-stone-400">Continue sua jornada de aprendizado e desenvolvimento.</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-500" size={18} />
          <input 
            type="text" 
            placeholder="Buscar cursos ou módulos" 
            className="w-full bg-stone-800/50 border border-stone-700 text-stone-200 pl-10 pr-4 py-2.5 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 placeholder-stone-600 transition-all"
          />
        </div>
      </div>

      {/* Active Modules Section */}
      <section>
        <h2 className="text-xl font-semibold text-white mb-6">Seus Módulos Ativos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {activeModules.map((module) => (
            <div 
              key={module.id} 
              onClick={() => module.targetScreen && onNavigate(module.targetScreen)}
              className="bg-[#24201d] border border-white/5 p-6 rounded-xl flex flex-col justify-between h-56 hover:border-orange-500/30 transition-all group cursor-pointer hover:shadow-lg hover:shadow-orange-900/10"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">{module.title}</h3>
                  <p className="text-xs text-stone-400">{module.subtitle}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-[#3a3530] flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
                  {module.iconType === 'book' && <BookOpen size={20} />}
                  {module.iconType === 'edit' && <Edit3 size={20} />}
                  {module.iconType === 'activity' && <Activity size={20} />}
                  {module.iconType === 'music' && <Music size={20} />}
                </div>
              </div>

              <div className="space-y-4">
                {module.progress !== undefined && (
                  <div className="w-full bg-stone-700 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-orange-500 h-full rounded-full" 
                      style={{ width: `${module.progress}%` }}
                    />
                  </div>
                )}
                
                <button className={`w-full py-2.5 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2 ${
                    module.actionLabel === 'Continuar' || module.actionLabel === 'Começar' 
                    ? 'bg-orange-500 hover:bg-orange-600 text-white' 
                    : 'bg-[#3a3530] hover:bg-[#4a443e] text-orange-500 border border-transparent hover:border-orange-500/20'
                  }`}
                >
                  {module.actionLabel}
                  {module.actionLabel === 'Continuar' && <ArrowRight size={14} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recommended Section */}
      <section>
        <h2 className="text-xl font-semibold text-white mb-6">Recomendado para Você</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {recommendations.map((item) => (
            <div key={item.id} className="group cursor-pointer" onClick={() => onNavigate('course-detail')}>
              <div className={`h-64 rounded-xl bg-gradient-to-br ${item.gradient} mb-4 relative overflow-hidden transition-transform group-hover:scale-[1.02]`}>
                {/* Overlay effect on hover */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                
                {/* Content inside card */}
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="bg-white/10 backdrop-blur-md p-3 rounded-lg border border-white/20 translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                     <span className="text-xs text-white font-medium flex items-center gap-1">
                       Ver Curso <ArrowRight size={12} />
                     </span>
                  </div>
                </div>
              </div>
              <h3 className="text-lg font-medium text-white mb-1 group-hover:text-orange-500 transition-colors">{item.title}</h3>
              <p className="text-sm text-stone-500">{item.subtitle}</p>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};

export default StudentDashboard;
