import React, { useState, useEffect } from 'react';
import { TrendingUp, Clock, Award, ArrowUpRight, Sparkles, Trophy, Zap } from 'lucide-react';
import { Screen } from '../types';
import { auth } from '../lib/firebase';
import { getStudentProgress, createStudentProgress } from '../lib/gamification';
import LevelProgress from './LevelProgress';
import AttendanceTracker from './AttendanceTracker';

interface StudentDashboardProps {
  onNavigate: (screen: Screen) => void;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ onNavigate }) => {
  const [studentProgress, setStudentProgress] = useState<any>(null);
  const user = auth.currentUser;

  useEffect(() => {
    loadProgress();
    // Reload progress every 30 seconds to catch updates
    const interval = setInterval(loadProgress, 30000);
    return () => clearInterval(interval);
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

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="sticky top-0 z-30 -mx-6 -mt-6 px-6 py-6 md:-mx-8 md:-mt-8 md:px-8 bg-[#0B0B0B]/80 backdrop-blur-md border-b border-white/[0.06] flex items-start justify-between transition-all duration-300">
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

      {/* Stats Grid - Now shows real data */}
      {studentProgress && (
        <div className="grid gap-6 md:grid-cols-3">
          <div className="bg-card border-border rounded-xl p-6 shadow-card-custom hover:-translate-y-0.5 transition-transform duration-200">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-muted-foreground">Total XP</span>
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Zap className="h-5 w-5" />
              </div>
            </div>
            <div className="text-3xl font-bold text-foreground mb-1">{studentProgress.totalXP}</div>
            <p className="text-xs text-green-500 flex items-center gap-1">
              Nível {studentProgress.currentLevel} <ArrowUpRight className="w-3 h-3" />
            </p>
          </div>

          <div className="bg-card border-border rounded-xl p-6 shadow-card-custom hover:-translate-y-0.5 transition-transform duration-200">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-muted-foreground">Conquistas</span>
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Trophy className="h-5 w-5" />
              </div>
            </div>
            <div className="text-3xl font-bold text-foreground mb-1">{studentProgress.unlockedAchievements.length}</div>
            <p className="text-xs text-green-500 flex items-center gap-1">
              Desbloqueadas <ArrowUpRight className="w-3 h-3" />
            </p>
          </div>

          <div className="bg-card border-border rounded-xl p-6 shadow-card-custom hover:-translate-y-0.5 transition-transform duration-200">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-muted-foreground">Ranking</span>
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
            <div className="text-3xl font-bold text-foreground mb-1">#{studentProgress.rank || '-'}</div>
            <p className="text-xs text-green-500 flex items-center gap-1">
              Posição global <ArrowUpRight className="w-3 h-3" />
            </p>
          </div>
        </div>
      )}

      {/* Attendance Tracker */}
      {user && (
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-6">Frequência e Atividades</h2>
          <AttendanceTracker
            studentId={user.uid}
            studentName={user.displayName || user.email || 'Estudante'}
          />
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
