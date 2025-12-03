import React, { useState, useEffect } from 'react';
import { Trophy, Lock, TrendingUp, Medal, Award, Zap } from 'lucide-react';
import { Achievement, StudentProgress } from '../types';
import { getAchievements, getStudentProgress, getLeaderboard } from '../lib/gamification';

interface AchievementsProps {
  studentId: string;
}

const Achievements: React.FC<AchievementsProps> = ({ studentId }) => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const [leaderboard, setLeaderboard] = useState<StudentProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAchievements();
  }, [studentId]);

  const loadAchievements = async () => {
    setLoading(true);
    const [allAchievements, studentProgress, leaderboardData] = await Promise.all([
      getAchievements(),
      getStudentProgress(studentId),
      getLeaderboard(20),
    ]);
    
    setAchievements(allAchievements);
    setProgress(studentProgress);
    setLeaderboard(leaderboardData);
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

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500 fill-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400 fill-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-orange-600 fill-orange-600" />;
      default:
        return <span className="text-lg font-bold text-[#9CA3AF]">#{rank}</span>;
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    if (rank === 2) return 'bg-gray-400/10 text-gray-400 border-gray-400/20';
    if (rank === 3) return 'bg-orange-600/10 text-orange-600 border-orange-600/20';
    return 'bg-white/[0.02] text-[#9CA3AF] border-white/[0.06]';
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        <div className="text-center py-12 text-[#9CA3AF]">Carregando conquistas e ranking...</div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#F3F4F6] flex items-center gap-3">
          <Trophy className="text-[#FF6A00]" size={32} />
          Conquistas e Ranking
        </h1>
        <p className="text-[#9CA3AF] mt-2">
          {unlockedAchievements.length} de {achievements.length} conquistas desbloqueadas
        </p>
      </div>

      {/* Progress Bar */}
      <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-6 shadow-card-custom">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-[#F3F4F6]">Progresso Geral</span>
          <span className="text-sm text-[#9CA3AF]">
            {Math.round((unlockedAchievements.length / achievements.length) * 100)}%
          </span>
        </div>
        <div className="w-full h-3 bg-white/[0.05] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#FF6A00] to-orange-400 transition-all duration-500"
            style={{ width: `${(unlockedAchievements.length / achievements.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Unlocked Achievements */}
      {unlockedAchievements.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-[#F3F4F6] mb-6">Desbloqueadas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {unlockedAchievements.map((achievement) => (
              <div
                key={achievement.id}
                className="bg-[#111111] border border-[#FF6A00]/30 rounded-xl p-6 shadow-card-custom hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#FF6A00]/5 to-transparent" />
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-4xl">{achievement.icon}</div>
                    <div className="bg-[#FF6A00]/10 text-[#FF6A00] px-2.5 py-1 rounded-full text-xs font-medium">
                      +{achievement.xpReward} XP
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-[#F3F4F6] mb-2">{achievement.title}</h3>
                  <p className="text-sm text-[#9CA3AF]">{achievement.description}</p>
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
          <h2 className="text-2xl font-bold text-[#F3F4F6] mb-6">A Desbloquear</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lockedAchievements.map((achievement) => {
              const progressPercent = getProgressTowards(achievement);
              
              return (
                <div
                  key={achievement.id}
                  className="bg-[#111111] border border-white/[0.06] rounded-xl p-6 shadow-card-custom hover:-translate-y-1 transition-all duration-300 relative overflow-hidden opacity-70"
                >
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <div className="text-4xl grayscale">{achievement.icon}</div>
                      <div className="bg-white/[0.05] text-[#9CA3AF] px-2.5 py-1 rounded-full text-xs font-medium">
                        +{achievement.xpReward} XP
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-[#F3F4F6] mb-2">{achievement.title}</h3>
                    <p className="text-sm text-[#9CA3AF]">{achievement.description}</p>
                    
                    {/* Progress Bar */}
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between text-xs text-[#9CA3AF]">
                        <div className="flex items-center gap-1.5">
                          <Lock className="w-3 h-3" />
                          <span>Progresso</span>
                        </div>
                        <span>{Math.round(progressPercent)}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#9CA3AF]/50 transition-all duration-500"
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

      {/* Leaderboard Section */}
      <div className="pt-8 border-t border-white/[0.06]">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-[#F3F4F6] flex items-center gap-3">
            <TrendingUp className="text-[#FF6A00]" size={32} />
            Ranking de Alunos
          </h2>
          <p className="text-[#9CA3AF] mt-2">
            Veja como você se compara com outros estudantes
          </p>
        </div>

        {/* Top 3 Podium */}
        {leaderboard.length >= 3 && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            {/* 2nd Place */}
            <div className="flex flex-col items-center pt-12">
              <div className="bg-[#111111] border border-gray-400/20 rounded-xl p-6 w-full shadow-card-custom hover:-translate-y-1 transition-all">
                <div className="flex flex-col items-center text-center">
                  <Medal className="w-12 h-12 text-gray-400 fill-gray-400 mb-3" />
                  <div className="w-16 h-16 rounded-full bg-gray-400/10 flex items-center justify-center text-2xl font-bold text-[#F3F4F6] mb-3">
                    {leaderboard[1].studentName.charAt(0)}
                  </div>
                  <h3 className="font-bold text-[#F3F4F6] truncate w-full">{leaderboard[1].studentName}</h3>
                  <p className="text-sm text-[#9CA3AF] mt-1">Nível {leaderboard[1].currentLevel}</p>
                  <div className="flex items-center gap-1 mt-2 text-[#FF6A00]">
                    <Zap className="w-4 h-4 fill-[#FF6A00]" />
                    <span className="font-semibold">{leaderboard[1].currentXP} XP</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 1st Place */}
            <div className="flex flex-col items-center">
              <div className="bg-[#111111] border border-yellow-500/30 rounded-xl p-6 w-full shadow-elevated hover:-translate-y-1 transition-all relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-transparent" />
                <div className="relative z-10 flex flex-col items-center text-center">
                  <Trophy className="w-16 h-16 text-yellow-500 fill-yellow-500 mb-3" />
                  <div className="w-20 h-20 rounded-full bg-yellow-500/10 border-2 border-yellow-500/30 flex items-center justify-center text-3xl font-bold text-[#F3F4F6] mb-3">
                    {leaderboard[0].studentName.charAt(0)}
                  </div>
                  <h3 className="font-bold text-lg text-[#F3F4F6] truncate w-full">{leaderboard[0].studentName}</h3>
                  <p className="text-sm text-[#9CA3AF] mt-1">Nível {leaderboard[0].currentLevel}</p>
                  <div className="flex items-center gap-1 mt-2 text-yellow-500">
                    <Zap className="w-5 h-5 fill-yellow-500" />
                    <span className="font-bold text-lg">{leaderboard[0].currentXP} XP</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3rd Place */}
            <div className="flex flex-col items-center pt-12">
              <div className="bg-[#111111] border border-orange-600/20 rounded-xl p-6 w-full shadow-card-custom hover:-translate-y-1 transition-all">
                <div className="flex flex-col items-center text-center">
                  <Award className="w-12 h-12 text-orange-600 fill-orange-600 mb-3" />
                  <div className="w-16 h-16 rounded-full bg-orange-600/10 flex items-center justify-center text-2xl font-bold text-[#F3F4F6] mb-3">
                    {leaderboard[2].studentName.charAt(0)}
                  </div>
                  <h3 className="font-bold text-[#F3F4F6] truncate w-full">{leaderboard[2].studentName}</h3>
                  <p className="text-sm text-[#9CA3AF] mt-1">Nível {leaderboard[2].currentLevel}</p>
                  <div className="flex items-center gap-1 mt-2 text-[#FF6A00]">
                    <Zap className="w-4 h-4 fill-[#FF6A00]" />
                    <span className="font-semibold">{leaderboard[2].currentXP} XP</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Full Leaderboard Table */}
        <div className="bg-[#111111] border border-white/[0.06] rounded-xl shadow-card-custom overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/[0.02] border-b border-white/[0.06]">
                <tr>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-[#9CA3AF]">Posição</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-[#9CA3AF]">Aluno</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-[#9CA3AF]">Nível</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-[#9CA3AF]">XP Total</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-[#9CA3AF]">Aulas</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-[#9CA3AF]">Sequência</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((student, index) => {
                  const rank = index + 1;
                  const isCurrentUser = studentId === student.studentId;

                  return (
                    <tr
                      key={student.id}
                      className={`border-b border-white/[0.06] hover:bg-white/[0.02] transition-colors ${
                        isCurrentUser ? 'bg-[#FF6A00]/5' : ''
                      }`}
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg border flex items-center justify-center ${getRankBadge(rank)}`}>
                            {getRankIcon(rank)}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#FF6A00]/10 flex items-center justify-center text-[#FF6A00] font-semibold">
                            {student.studentName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium text-[#F3F4F6] flex items-center gap-2">
                              {student.studentName}
                              {isCurrentUser && (
                                <span className="text-xs bg-[#FF6A00]/10 text-[#FF6A00] px-2 py-0.5 rounded-full">Você</span>
                              )}
                            </div>
                            <div className="text-xs text-[#9CA3AF]">{student.studentEmail}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-[#FF6A00] fill-[#FF6A00]" />
                          <span className="font-semibold text-[#F3F4F6]">{student.currentLevel}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-medium text-[#FF6A00]">{student.currentXP.toLocaleString()}</span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-[#F3F4F6]">{student.totalCoursesCompleted}</span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className="text-[#F3F4F6]">{student.currentStreak} dias</span>
                          {student.currentStreak >= 7 && (
                            <span className="text-orange-500">🔥</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Achievements;
