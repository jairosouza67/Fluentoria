import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle, Circle, TrendingUp, Activity } from 'lucide-react';
import { StudentActivity } from '../types';
import { getStudentActivities, calculateAttendanceStats, getRecentActivities } from '../lib/attendance';

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
      case 'daily_contact':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
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
      case 'daily_contact':
        return 'Daily Contact';
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
      <div className="bg-card border border-border rounded-xl shadow-card-custom p-6">
        <div className="text-center py-8 text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 shadow-card-custom">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Aulas</span>
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.completedCourses}</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-card-custom">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Daily Contact</span>
            <Activity className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.dailyContacts}</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-card-custom">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Mindful Flow</span>
            <Activity className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.mindfulFlows}</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-card-custom">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Sequência</span>
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.currentStreak} dias</p>
        </div>
      </div>

      {/* Activity Calendar */}
      <div className="bg-card border border-border rounded-xl shadow-card-custom p-6">
        <div className="flex items-center gap-3 mb-6">
          <Calendar className="w-6 h-6 text-primary" />
          <h3 className="text-xl font-semibold text-foreground">Calendário de Atividades</h3>
        </div>

        <div className="space-y-4">
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
      </div>

      {/* Recent Activities List */}
      <div className="bg-card border border-border rounded-xl shadow-card-custom p-6">
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
      </div>
    </div>
  );
};

export default AttendanceTracker;
