import React, { useState, useEffect } from 'react';
import { TrendingUp, Clock, Award, ArrowUpRight, Sparkles, Trophy, Zap } from 'lucide-react';
import { Screen } from '../types';
import { auth } from '../lib/firebase';
import { getStudentProgress, createStudentProgress } from '../lib/gamification';
import LevelProgress from './LevelProgress';
import AttendanceTracker from './AttendanceTracker';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { PageHeader } from './ui/PageHeader';

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
      <PageHeader
        title="Dashboard"
        description="Bem-vindo de volta! Continue sua jornada de aprendizado."
        icon={<Sparkles size={24} />}
        sticky
      />

      {/* Level Progress */}
      {studentProgress && (
        <Card className="p-6">
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
        </Card>
      )}

      {/* Stats Grid - Now shows real data */}
      {studentProgress && (
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="p-6 hover-elevate">
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
          </Card>

          <Card className="p-6 hover-elevate">
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
          </Card>

          <Card className="p-6 hover-elevate">
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
          </Card>
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
