import React, { useState, useEffect } from 'react';
import { Trophy, Lock } from 'lucide-react';
import { Achievement, StudentProgress } from '../types';
import { getAchievements, getStudentProgress } from '../lib/gamification';

interface AchievementsProps {
  studentId: string;
}

const Achievements: React.FC<AchievementsProps> = ({ studentId }) => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAchievements();
  }, [studentId]);

  const loadAchievements = async () => {
    setLoading(true);
    const [allAchievements, studentProgress] = await Promise.all([
      getAchievements(),
      getStudentProgress(studentId),
    ]);
    
    setAchievements(allAchievements);
    setProgress(studentProgress);
    setLoading(false);
  };

  const isUnlocked = (achievementId: string) => {
    return progress?.unlockedAchievements.includes(achievementId) || false;
  };

  const getProgressTowards = (achievement: Achievement) => {
    if (!progress) return 0;

    switch (achievement.condition.type) {
      case 'course_count':
        return Math.min((progress.totalCoursesCompleted / achievement.condition.threshold) * 100, 100);
      case 'streak_days':
        return Math.min((progress.currentStreak / achievement.condition.threshold) * 100, 100);
      case 'hours_studied':
        return Math.min((progress.totalHoursStudied / achievement.condition.threshold) * 100, 100);
      case 'first_course':
        return progress.totalCoursesCompleted >= 1 ? 100 : 0;
      default:
        return 0;
    }
  };

  const unlockedAchievements = achievements.filter(a => isUnlocked(a.id));
  const lockedAchievements = achievements.filter(a => !isUnlocked(a.id));

  if (loading) {
    return (
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        <div className="text-center py-12 text-muted-foreground">Carregando conquistas...</div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <Trophy className="text-primary" size={32} />
          Conquistas
        </h1>
        <p className="text-muted-foreground mt-2">
          {unlockedAchievements.length} de {achievements.length} conquistas desbloqueadas
        </p>
      </div>

      {/* Progress Bar */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-card-custom">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-foreground">Progresso Geral</span>
          <span className="text-sm text-muted-foreground">
            {Math.round((unlockedAchievements.length / achievements.length) * 100)}%
          </span>
        </div>
        <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-orange-400 transition-all duration-500"
            style={{ width: `${(unlockedAchievements.length / achievements.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Unlocked Achievements */}
      {unlockedAchievements.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-6">Desbloqueadas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {unlockedAchievements.map((achievement) => (
              <div
                key={achievement.id}
                className="bg-card border border-primary/30 rounded-xl p-6 shadow-card-custom hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-4xl">{achievement.icon}</div>
                    <div className="bg-primary/10 text-primary px-2.5 py-1 rounded-full text-xs font-medium">
                      +{achievement.xpReward} XP
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">{achievement.title}</h3>
                  <p className="text-sm text-muted-foreground">{achievement.description}</p>
                  <div className="mt-4 flex items-center gap-2 text-green-500">
                    <Trophy className="w-4 h-4" />
                    <span className="text-xs font-medium">Desbloqueada</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Locked Achievements */}
      {lockedAchievements.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-6">A Desbloquear</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lockedAchievements.map((achievement) => {
              const progressPercent = getProgressTowards(achievement);
              
              return (
                <div
                  key={achievement.id}
                  className="bg-card border border-border rounded-xl p-6 shadow-card-custom hover:-translate-y-1 transition-all duration-300 relative overflow-hidden opacity-70"
                >
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <div className="text-4xl grayscale">{achievement.icon}</div>
                      <div className="bg-muted text-muted-foreground px-2.5 py-1 rounded-full text-xs font-medium">
                        +{achievement.xpReward} XP
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-2">{achievement.title}</h3>
                    <p className="text-sm text-muted-foreground">{achievement.description}</p>
                    
                    {/* Progress Bar */}
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Lock className="w-3 h-3" />
                          <span>Progresso</span>
                        </div>
                        <span>{Math.round(progressPercent)}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-muted-foreground/50 transition-all duration-500"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Achievements;
