import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle, Circle, TrendingUp, Activity, Flame, BookOpen, Wind } from 'lucide-react';
import { StudentActivity } from '../types';
import { getStudentActivities, calculateAttendanceStats, getRecentActivities } from '../lib/attendance';
import { Card } from './ui/Card';

interface AttendanceTrackerProps {
  studentId: string;
  studentName: string;
}

const AttendanceTracker: React.FC<AttendanceTrackerProps> = ({ studentId, studentName }) => {
  const [activities, setActivities] = useState<StudentActivity[]>([]);
  const [recentActivities, setRecentActivities] = useState<StudentActivity[]>([]);
  const [stats, setStats] = useState({
    completedCourses: 0,
    dailyContacts: 0,
    mindfulFlows: 0,
    currentStreak: 0,
    totalActivities: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivities();
  }, [studentId]);

  const loadActivities = async () => {
    setLoading(true);
    const allActivities = await getStudentActivities(studentId);
    const recent = await getRecentActivities(studentId, 30);
    
    setActivities(allActivities);
    setRecentActivities(recent);
    setStats(calculateAttendanceStats(allActivities));
    setLoading(false);
  };

  const getActivityIcon = (type: StudentActivity['activityType']) => {
    switch (type) {
      case 'course_completed':
      case 'lesson_completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'mindful_flow':
        return <CheckCircle className="w-4 h-4 text-purple-500" />;
      default:
        return <Circle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getActivityLabel = (type: StudentActivity['activityType']) => {
    switch (type) {
      case 'course_completed':
        return 'Aula Concluída';
      case 'lesson_completed':
        return 'Lição Concluída';
      case 'mindful_flow':
        return 'Mindful Flow';
      case 'course_started':
        return 'Aula Iniciada';
      default:
        return 'Atividade';
    }
  };

  const getDaysArray = () => {
    const days = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      days.push(date);
    }
    
    return days;
  };

  const hasActivityOnDate = (date: Date) => {
    return recentActivities.some(activity => {
      const activityDate = new Date(activity.timestamp);
      activityDate.setHours(0, 0, 0, 0);
      return activityDate.getTime() === date.getTime();
    });
  };

  const days = getDaysArray();

  if (loading) {
    return (
      <Card className="p-12 text-center animate-pulse">
        <div className="text-muted-foreground font-medium">Sincronizando atividades...</div>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-5 hover-elevate group">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Aulas</span>
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500 group-hover:scale-110 transition-transform">
              <BookOpen size={20} />
            </div>
          </div>
          <p className="text-3xl font-black text-foreground">{stats.completedCourses}</p>
        </Card>

        <Card className="p-5 hover-elevate group">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Mindful Flow</span>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform">
              <Wind size={20} />
            </div>
          </div>
          <p className="text-3xl font-black text-foreground">{stats.mindfulFlows}</p>
        </Card>

        <Card className="p-5 hover-elevate group border-primary/20">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Frequência</span>
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(255,106,0,0.1)]">
              <Flame size={20} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-black text-foreground">{stats.currentStreak}</p>
            <span className="text-sm font-bold text-muted-foreground">dias</span>
          </div>
        </Card>

        <Card className="p-5 hover-elevate group">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Total</span>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
              <Activity size={20} />
            </div>
          </div>
          <p className="text-3xl font-black text-foreground">{stats.totalActivities}</p>
        </Card>
      </div>

      {/* Activity Calendar */}
      <Card className="p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-[0_0_20px_rgba(255,106,0,0.1)]">
              <Calendar size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-foreground tracking-tight">Consistência</h3>
              <p className="text-sm font-medium text-muted-foreground">Últimos 30 dias de jornada</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 bg-muted/40 px-4 py-2 rounded-xl border border-border">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary shadow-[0_0_10px_rgba(255,106,0,0.5)]"></div>
              <span className="text-xs font-bold text-foreground">Ativo</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-muted-foreground/30"></div>
              <span className="text-xs font-bold text-muted-foreground">Inativo</span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Últimos 30 dias</span>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-muted rounded-sm"></div>
                <span className="text-xs text-muted-foreground">Sem atividade</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-primary rounded-sm"></div>
                <span className="text-xs text-muted-foreground">Com atividade</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-10 gap-2">
            {days.map((day, index) => {
              const hasActivity = hasActivityOnDate(day);
              const isToday = day.toDateString() === new Date().toDateString();
              
              return (
                <div
                  key={index}
                  className={`aspect-square rounded-md transition-all ${
                    hasActivity
                      ? 'bg-primary hover:scale-110'
                      : 'bg-muted hover:bg-muted/70'
                  } ${isToday ? 'ring-2 ring-primary ring-offset-2 ring-offset-card' : ''}`}
                  title={`${day.toLocaleDateString('pt-BR')}${hasActivity ? ' - Atividade realizada' : ''}`}
                />
              );
            })}
          </div>
        </div>
      </Card>

      {/* Recent Activities List */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold text-foreground mb-6">Atividades Recentes</h3>
        
        {recentActivities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma atividade registrada ainda
          </div>
        ) : (
          <div className="space-y-3">
            {recentActivities.slice(0, 10).map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-secondary/30 transition-colors"
              >
                <div className="mt-1">
                  {getActivityIcon(activity.activityType)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {getActivityLabel(activity.activityType)}
                  </p>
                  {activity.courseName && (
                    <p className="text-xs text-muted-foreground mt-1">{activity.courseName}</p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(activity.timestamp).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'short',
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default AttendanceTracker;
