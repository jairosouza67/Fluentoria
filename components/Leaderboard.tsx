import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Award, Zap, TrendingUp } from 'lucide-react';
import { StudentProgress } from '../types';
import { getLeaderboard } from '../lib/gamification';
import LevelProgress from './LevelProgress';

interface LeaderboardProps {
  currentUserId?: string;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ currentUserId }) => {
  const [leaderboard, setLeaderboard] = useState<StudentProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    setLoading(true);
    const data = await getLeaderboard(20);
    setLeaderboard(data);
    setLoading(false);
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500 fill-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400 fill-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-orange-600 fill-orange-600" />;
      default:
        return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    if (rank === 2) return 'bg-gray-400/10 text-gray-400 border-gray-400/20';
    if (rank === 3) return 'bg-orange-600/10 text-orange-600 border-orange-600/20';
    return 'bg-muted text-muted-foreground border-border';
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        <div className="text-center py-12 text-muted-foreground">Carregando ranking...</div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <TrendingUp className="text-primary" size={32} />
          Ranking de Alunos
        </h1>
        <p className="text-muted-foreground mt-2">
          Veja como você se compara com outros estudantes
        </p>
      </div>

      {/* Top 3 Podium */}
      {leaderboard.length >= 3 && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {/* 2nd Place */}
          <div className="flex flex-col items-center pt-12">
            <div className="bg-card border border-gray-400/20 rounded-xl p-6 w-full shadow-card-custom hover:-translate-y-1 transition-all">
              <div className="flex flex-col items-center text-center">
                <Medal className="w-12 h-12 text-gray-400 fill-gray-400 mb-3" />
                <div className="w-16 h-16 rounded-full bg-gray-400/10 flex items-center justify-center text-2xl font-bold text-foreground mb-3">
                  {leaderboard[1].studentName.charAt(0)}
                </div>
                <h3 className="font-bold text-foreground truncate w-full">{leaderboard[1].studentName}</h3>
                <p className="text-sm text-muted-foreground mt-1">Nível {leaderboard[1].currentLevel}</p>
                <div className="flex items-center gap-1 mt-2 text-primary">
                  <Zap className="w-4 h-4 fill-primary" />
                  <span className="font-semibold">{leaderboard[1].currentXP} XP</span>
                </div>
              </div>
            </div>
          </div>

          {/* 1st Place */}
          <div className="flex flex-col items-center">
            <div className="bg-card border border-yellow-500/30 rounded-xl p-6 w-full shadow-elevated hover:-translate-y-1 transition-all relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-transparent" />
              <div className="relative z-10 flex flex-col items-center text-center">
                <Trophy className="w-16 h-16 text-yellow-500 fill-yellow-500 mb-3" />
                <div className="w-20 h-20 rounded-full bg-yellow-500/10 border-2 border-yellow-500/30 flex items-center justify-center text-3xl font-bold text-foreground mb-3">
                  {leaderboard[0].studentName.charAt(0)}
                </div>
                <h3 className="font-bold text-lg text-foreground truncate w-full">{leaderboard[0].studentName}</h3>
                <p className="text-sm text-muted-foreground mt-1">Nível {leaderboard[0].currentLevel}</p>
                <div className="flex items-center gap-1 mt-2 text-yellow-500">
                  <Zap className="w-5 h-5 fill-yellow-500" />
                  <span className="font-bold text-lg">{leaderboard[0].currentXP} XP</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3rd Place */}
          <div className="flex flex-col items-center pt-12">
            <div className="bg-card border border-orange-600/20 rounded-xl p-6 w-full shadow-card-custom hover:-translate-y-1 transition-all">
              <div className="flex flex-col items-center text-center">
                <Award className="w-12 h-12 text-orange-600 fill-orange-600 mb-3" />
                <div className="w-16 h-16 rounded-full bg-orange-600/10 flex items-center justify-center text-2xl font-bold text-foreground mb-3">
                  {leaderboard[2].studentName.charAt(0)}
                </div>
                <h3 className="font-bold text-foreground truncate w-full">{leaderboard[2].studentName}</h3>
                <p className="text-sm text-muted-foreground mt-1">Nível {leaderboard[2].currentLevel}</p>
                <div className="flex items-center gap-1 mt-2 text-primary">
                  <Zap className="w-4 h-4 fill-primary" />
                  <span className="font-semibold">{leaderboard[2].currentXP} XP</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full Leaderboard */}
      <div className="bg-card border border-border rounded-xl shadow-card-custom overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary/50 border-b border-border">
              <tr>
                <th className="text-left py-4 px-6 text-sm font-semibold text-muted-foreground">Posição</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-muted-foreground">Aluno</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-muted-foreground">Nível</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-muted-foreground">XP Total</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-muted-foreground">Aulas</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-muted-foreground">Sequência</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((student, index) => {
                const rank = index + 1;
                const isCurrentUser = currentUserId === student.studentId;

                return (
                  <tr
                    key={student.id}
                    className={`border-b border-border hover:bg-secondary/30 transition-colors ${
                      isCurrentUser ? 'bg-primary/5' : ''
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
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                          {student.studentName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-foreground flex items-center gap-2">
                            {student.studentName}
                            {isCurrentUser && (
                              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Você</span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">{student.studentEmail}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-primary fill-primary" />
                        <span className="font-semibold text-foreground">{student.currentLevel}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-medium text-primary">{student.currentXP.toLocaleString()}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-foreground">{student.totalCoursesCompleted}</span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <span className="text-foreground">{student.currentStreak} dias</span>
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
  );
};

export default Leaderboard;
