import React, { useState, useEffect } from 'react';
import { BookOpen, Edit3, Activity, Music, TrendingUp, Clock, Award, ArrowUpRight, Sparkles, Trophy, Zap } from 'lucide-react';
import { Module, Recommendation, Screen } from '../types';
import { auth } from '../lib/firebase';
import { getStudentProgress, createStudentProgress } from '../lib/gamification';
import LevelProgress from './LevelProgress';

interface StudentDashboardProps {
  onNavigate: (screen: Screen) => void;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ onNavigate }) => {
  const [studentProgress, setStudentProgress] = useState<any>(null);
  const user = auth.currentUser;

  useEffect(() => {
    loadProgress();
  }, [user]);

  const loadProgress = async () => {
    if (!user) return;
    
    let progress = await getStudentProgress(user.uid);
    
    if (!progress) {
      // Create initial progress if doesn't exist
      await createStudentProgress(
        user.uid,
        user.displayName || user.email || 'Student',
        user.email || ''
      );
      progress = await getStudentProgress(user.uid);
    }
    
    setStudentProgress(progress);
  };
  const stats = [
    {
      title: "Aulas Concluídas",
      value: "12",
      change: "+3 este mês",
      icon: Award,
    },
    {
      title: "Horas de Estudo",
      value: "24h",
      change: "+5h esta semana",
      icon: Clock,
    },
    {
      title: "Sequência",
      value: "7 dias",
      change: "Melhor: 12 dias",
      icon: TrendingUp,
    },
  ];

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
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            Dashboard <Sparkles className="text-primary" size={24} />
          </h1>
          <p className="text-muted-foreground mt-2">Bem-vindo de volta! Continue sua jornada de aprendizado.</p>
        </div>
        {studentProgress && (
          <div className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3 shadow-card-custom">
            <Zap className="w-6 h-6 text-primary fill-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Nível</p>
              <p className="text-xl font-bold text-foreground">{studentProgress.currentLevel}</p>
            </div>
          </div>
        )}
      </div>

      {/* Level Progress */}
      {studentProgress && (
        <div className="bg-card border border-border rounded-xl p-6 shadow-card-custom">
          <LevelProgress 
            currentXP={studentProgress.currentXP}
            currentLevel={studentProgress.currentLevel}
            showDetails={true}
            size="lg"
          />
          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={() => onNavigate('achievements' as Screen)}
              className="flex items-center gap-2 text-primary hover:text-primary/80 text-sm font-medium transition-colors"
            >
              <Trophy className="w-4 h-4" />
              <span>{studentProgress.unlockedAchievements.length} Conquistas • Ver Ranking</span>
            </button>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-card border-border rounded-xl p-6 shadow-card-custom hover:-translate-y-0.5 transition-transform duration-200"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-muted-foreground">{stat.title}</span>
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
            <div className="text-3xl font-bold text-foreground mb-1">{stat.value}</div>
            <p className="text-xs text-green-500 flex items-center gap-1">
              {stat.change} <ArrowUpRight className="w-3 h-3" />
            </p>
          </div>
        ))}
      </div>

      {/* Continue Learning */}
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-6">Continue Aprendendo</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {activeModules.map((module) => (
            <div
              key={module.id}
              onClick={() => module.targetScreen && onNavigate(module.targetScreen)}
              className="group bg-card border-border rounded-xl p-6 shadow-card-custom hover:shadow-elevated hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                    {module.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">{module.subtitle}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  {module.iconType === 'book' && <BookOpen size={20} />}
                  {module.iconType === 'edit' && <Edit3 size={20} />}
                  {module.iconType === 'activity' && <Activity size={20} />}
                  {module.iconType === 'music' && <Music size={20} />}
                </div>
              </div>

              {module.progress !== undefined && (
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-muted-foreground mb-2">
                    <span>Progresso</span>
                    <span>{module.progress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${module.progress}%` }}
                    />
                  </div>
                </div>
              )}

              <button className="w-full bg-secondary/50 text-muted-foreground py-2.5 rounded-lg text-sm font-medium border border-transparent group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all mt-auto">
                {module.actionLabel}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-6">Recomendações para Você</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {recommendations.map((rec) => (
            <div
              key={rec.id}
              className="group relative bg-card border-border rounded-xl p-6 overflow-hidden cursor-pointer hover:-translate-y-1 transition-all duration-300 shadow-card-custom hover:shadow-elevated"
              onClick={() => onNavigate('courses')}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${rec.gradient} opacity-10 group-hover:opacity-20 transition-opacity`} />
              <div className="relative z-10">
                <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">{rec.title}</h3>
                <p className="text-sm text-muted-foreground">{rec.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
