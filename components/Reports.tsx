import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Users,
  PlayCircle,
  Clock,
  Download,
  Activity,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { subscribeToStudents, subscribeToCourses, subscribeToAllCompletions, subscribeToRecentCompletions } from '../lib/db';

const Reports: React.FC = () => {
  const [totalStudents, setTotalStudents] = useState(0);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [activityStats, setActivityStats] = useState<{
    totalCompletions: number;
    activityData: any[];
    popularCourses: any[];
  }>({ totalCompletions: 0, activityData: [], popularCourses: [] });

  useEffect(() => {
    // Subscribe to real-time data
    const unsubscribeStudents = subscribeToStudents(setTotalStudents);

    // Recent activity list (just last 5)
    const unsubscribeActivityList = subscribeToRecentCompletions(5, setRecentActivity);

    // Aggregate stats from larger set of completions (last 500)
    const unsubscribeAggregates = subscribeToAllCompletions(500, (completions) => {
      // 1. Total Completions (in this set)
      const total = completions.length;

      // 2. Activity Trends (Group by Month)
      const months: Record<string, number> = {};
      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

      // Initialize last 6 months 0
      const today = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const key = `${monthNames[d.getMonth()]}`;
        months[key] = 0;
      }

      completions.forEach(c => {
        if (c.completedAt) {
          const m = monthNames[c.completedAt.getMonth()];
          if (months[m] !== undefined) months[m]++;
        }
      });

      const chartData = Object.keys(months).map(key => ({
        name: key,
        value: months[key]
      }));

      // Popular courses section removed

      setActivityStats({
        totalCompletions: total,
        activityData: chartData,
        popularCourses: []
      });
    });

    return () => {
      unsubscribeStudents();
      unsubscribeActivityList();
      unsubscribeAggregates();
    };
  }, []);

  // Helper for time ago
  const getTimeAgo = (date: Date) => {
    if (!date) return '';
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " a";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " m";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " d";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " h";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " min";
    return Math.floor(seconds) + " s";
  };

  // Calculate additional metrics for better insights
  const calculateMetrics = () => {
    const now = new Date();

    // Get completions from activityData (last 6 months)
    const recentCompletions = activityStats.activityData.reduce((sum, month) => sum + (month.value || 0), 0);
    
    // Average per month (last 6 months)
    const avgPerMonth = activityStats.activityData.length > 0 
      ? Math.round(recentCompletions / activityStats.activityData.length)
      : 0;
    
    // Average per student
    const avgPerStudent = totalStudents > 0 
      ? (activityStats.totalCompletions / totalStudents).toFixed(1)
      : '0';

    // Engagement rate: count unique students who completed at least one lesson
    // Using recentActivity as proxy for active students (students with recent completions)
    const uniqueActiveStudents = new Set(
      recentActivity.map(activity => activity.studentId)
    ).size;
    
    const engagementRate = totalStudents > 0 
      ? Math.round((uniqueActiveStudents / totalStudents) * 100)
      : 0;

    return { avgPerMonth, avgPerStudent, engagementRate, uniqueActiveStudents };
  };

  const metrics = calculateMetrics();

  const stats = [
    {
      title: 'Conclusões (Total)',
      value: activityStats.totalCompletions.toString(),
      change: `Média: ${metrics.avgPerStudent} por aluno`,
      icon: Activity,
      trend: 'up'
    },
    {
      title: 'Conclusões/Mês',
      value: metrics.avgPerMonth.toString(),
      change: 'Média últimos 6 meses',
      icon: TrendingUp,
      trend: 'up'
    },
    {
      title: 'Alunos Cadastrados',
      value: totalStudents.toString(),
      change: 'Base total da plataforma',
      icon: Users,
      trend: 'up'
    },
    {
      title: 'Taxa de Engajamento',
      value: `${metrics.engagementRate}%`,
      change: `${metrics.uniqueActiveStudents} alunos ativos`,
      icon: PlayCircle,
      trend: metrics.engagementRate > 50 ? 'up' : 'neutral'
    }
  ];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Relatórios</h1>
          <p className="text-muted-foreground mt-2">Visão geral do engajamento em tempo real.</p>
        </div>
        <button className="bg-secondary/50 border border-border text-foreground px-5 py-3 rounded-md font-medium flex items-center gap-2 hover:bg-secondary/70 transition-all duration-200">
          <Download className="w-4 h-4" />
          Exportar Dados
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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
            <div className="text-2xl font-bold text-foreground mb-1">{stat.value}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {stat.change}
            </p>
          </div>
        ))}
      </div>

      {/* Main Charts */}
      <div className="grid gap-6">
        {/* Activity Chart */}
        <div className="bg-card border-border rounded-xl shadow-card-custom p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-foreground">Engajamento Mensal</h2>
            <p className="text-sm text-muted-foreground mt-1">Aulas concluídas nos últimos 6 meses</p>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityStats.activityData.length > 0 ? activityStats.activityData : [{ name: 'Sem dados', value: 0 }]}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF6A00" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#FF6A00" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#666"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#666"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px'
                  }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#FF6A00"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorValue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-card border-border rounded-xl shadow-card-custom p-6">
        <h2 className="text-xl font-bold text-foreground mb-6">Atividade Recente (Tempo Real)</h2>
        <div className="space-y-4">
          {recentActivity.length === 0 ? (
            <div className="text-muted-foreground text-sm italic py-4 text-center">
              Nenhuma atividade recente registrada.
            </div>
          ) : (
            recentActivity.map((activity, i) => (
              <div key={i} className="flex items-start gap-4 group p-3 rounded-lg hover:bg-secondary/30 transition-colors">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                  <PlayCircle className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    <span className="text-primary font-semibold">{activity.studentName}</span> completou{' '}
                    <span className="text-white">{activity.contentTitle}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{getTimeAgo(activity.completedAt)} atrás</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
