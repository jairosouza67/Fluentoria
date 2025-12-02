import React from 'react';
import { Search, BookOpen, Edit3, Activity, Music, ArrowRight, Sparkles } from 'lucide-react';
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
    { id: '2', title: 'Comunicação Assertiva', subtitle: 'Módulo intermediário', gradient: 'from-cyan-500 to-blue-900' },
    { id: '3', title: 'Gestão de Tempo', subtitle: 'Técnicas e ferramentas', gradient: 'from-orange-600 to-red-900' },
    { id: '4', title: 'Produtividade', subtitle: 'Maximize seu potencial', gradient: 'from-indigo-600 to-purple-900' },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12 animate-fade-in pb-24">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            Seu Painel <Sparkles className="text-primary animate-pulse" size={24} />
          </h1>
          <p className="text-muted-foreground text-lg">Continue sua jornada de aprendizado e evolução.</p>
        </div>
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={20} />
          <input
            type="text"
            placeholder="Buscar cursos ou módulos..."
            className="w-full bg-card/50 backdrop-blur-md border border-border text-white pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder-muted-foreground transition-all shadow-lg"
          />
        </div>
      </div>

      {/* Active Modules Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-white">Seus Módulos Ativos</h2>
          <button className="text-sm text-primary hover:text-orange-400 transition-colors">Ver todos</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {activeModules.map((module) => (
            <div
              key={module.id}
              onClick={() => module.targetScreen && onNavigate(module.targetScreen)}
              className="glass-card p-6 rounded-2xl flex flex-col justify-between h-64 hover:border-primary/50 transition-all duration-300 group cursor-pointer hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1 group-hover:text-primary transition-colors">{module.title}</h3>
                  <p className="text-sm text-muted-foreground">{module.subtitle}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-300 shadow-inner">
                  {module.iconType === 'book' && <BookOpen size={24} />}
                  {module.iconType === 'edit' && <Edit3 size={24} />}
                  {module.iconType === 'activity' && <Activity size={24} />}
                  {module.iconType === 'music' && <Music size={24} />}
                </div>
              </div>

              <div className="space-y-5">
                {module.progress !== undefined && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Progresso</span>
                      <span>{module.progress}%</span>
                    </div>
                    <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-primary h-full rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${module.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                <button className={`w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${module.actionLabel === 'Continuar' || module.actionLabel === 'Começar'
                    ? 'bg-primary hover:bg-orange-600 text-white shadow-lg shadow-primary/20'
                    : 'bg-secondary hover:bg-secondary/80 text-primary border border-primary/20 hover:border-primary/50'
                  }`}
                >
                  {module.actionLabel}
                  {module.actionLabel === 'Continuar' && <ArrowRight size={16} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recommended Section */}
      <section>
        <h2 className="text-2xl font-semibold text-white mb-6">Recomendado para Você</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {recommendations.map((item) => (
            <div key={item.id} className="group cursor-pointer" onClick={() => onNavigate('course-detail')}>
              <div className={`h-72 rounded-2xl bg-gradient-to-br ${item.gradient} mb-4 relative overflow-hidden transition-all duration-500 group-hover:shadow-2xl group-hover:shadow-primary/20 group-hover:-translate-y-1`}>
                {/* Overlay effect on hover */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />

                {/* Content inside card */}
                <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                  <h3 className="text-xl font-bold text-white mb-1 drop-shadow-md">{item.title}</h3>
                  <p className="text-sm text-white/80 mb-4 drop-shadow-md">{item.subtitle}</p>

                  <div className="bg-white/20 backdrop-blur-md p-3 rounded-xl border border-white/30 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0 flex items-center justify-between text-white font-medium">
                    <span>Ver Detalhes</span>
                    <div className="bg-white text-black rounded-full p-1">
                      <ArrowRight size={14} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};

export default StudentDashboard;
