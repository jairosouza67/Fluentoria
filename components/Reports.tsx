import React from 'react';
import {
  TrendingUp,
  Users,
  DollarSign,
  PlayCircle,
  ArrowUpRight,
  Clock,
  Download,
  BarChart3
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Bar,
  BarChart as RechartsBarChart,
  Cell,
} from 'recharts';

const Reports: React.FC = () => {
  const revenueData = [
    { name: 'Jan', value: 4000 },
    { name: 'Fev', value: 3000 },
    { name: 'Mar', value: 5500 },
    { name: 'Abr', value: 4500 },
    { name: 'Mai', value: 6500 },
    { name: 'Jun', value: 5000 },
    { name: 'Jul', value: 7500 },
  ];

  const courseData = [
    { name: 'React Mastery', students: 240 },
    { name: 'UI/UX Design', students: 180 },
    { name: 'Financial Freedom', students: 156 },
    { name: 'Leadership', students: 120 },
    { name: 'Communication', students: 98 },
  ];

  const stats = [
    {
      title: 'Receita Total',
      value: 'R$ 45.230,00',
      change: '+15% do mês anterior',
      icon: DollarSign,
      trend: 'up'
    },
    {
      title: 'Alunos Ativos',
      value: '1.240',
      change: '+5% do mês anterior',
      icon: Users,
      trend: 'up'
    },
    {
      title: 'Vendas de Cursos',
      value: '345',
      change: '+12% do mês anterior',
      icon: TrendingUp,
      trend: 'up'
    },
    {
      title: 'Tempo de Visualização',
      value: '2.850h',
      change: '+8% do mês anterior',
      icon: Clock,
      trend: 'up'
    }
  ];

  const topCourses = [
    { name: 'Advanced React Patterns', revenue: 'R$ 15.450', students: 240, growth: '+18%' },
    { name: 'Modern UI/UX Design', revenue: 'R$ 12.300', students: 180, growth: '+12%' },
    { name: 'Financial Freedom 101', revenue: 'R$ 9.800', students: 156, growth: '+8%' },
  ];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Relatórios</h1>
          <p className="text-muted-foreground mt-2">Visão geral do desempenho da plataforma.</p>
        </div>
        <button className="bg-secondary/50 border border-border text-foreground px-5 py-3 rounded-md font-medium flex items-center gap-2 hover:bg-secondary/70 transition-all duration-200">
          <Download className="w-4 h-4" />
          Exportar Relatório
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
            <p className="text-xs text-green-500 flex items-center gap-1">
              {stat.change} <ArrowUpRight className="w-3 h-3" />
            </p>
          </div>
        ))}
      </div>

      {/* Main Charts */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Revenue Chart */}
        <div className="lg:col-span-4 bg-card border-border rounded-xl shadow-card-custom p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-foreground">Visão Geral de Receita</h2>
            <p className="text-sm text-muted-foreground mt-1">Receita mensal dos últimos 7 meses</p>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF6A00" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#FF6A00" stopOpacity={0}/>
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
                  tickFormatter={(value) => `R$${value}`}
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

        {/* Top Courses */}
        <div className="lg:col-span-3 bg-card border-border rounded-xl shadow-card-custom p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-foreground">Cursos Mais Vendidos</h2>
            <p className="text-sm text-muted-foreground mt-1">Top 3 por receita</p>
          </div>
          <div className="space-y-4">
            {topCourses.map((course, index) => (
              <div
                key={index}
                className="p-4 bg-secondary/30 rounded-lg border border-border hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground text-sm mb-1">{course.name}</h3>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {course.students} alunos
                      </span>
                      <span className="text-green-500">{course.growth}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-foreground">{course.revenue}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Course Performance Bar Chart */}
      <div className="bg-card border-border rounded-xl shadow-card-custom p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-foreground">Desempenho por Curso</h2>
          <p className="text-sm text-muted-foreground mt-1">Número de alunos matriculados</p>
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsBarChart data={courseData}>
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
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
              />
              <Bar dataKey="students" radius={[8, 8, 0, 0]}>
                {courseData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill="#FF6A00" opacity={1 - (index * 0.15)} />
                ))}
              </Bar>
            </RechartsBarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-card border-border rounded-xl shadow-card-custom p-6">
        <h2 className="text-xl font-bold text-foreground mb-6">Atividade Recente</h2>
        <div className="space-y-4">
          {[
            { text: 'Novo aluno inscrito em', course: 'React Mastery', time: '2 minutos atrás' },
            { text: 'Curso completado:', course: 'UI/UX Design', time: '15 minutos atrás' },
            { text: 'Nova compra de', course: 'Financial Freedom', time: '1 hora atrás' },
            { text: 'Aluno iniciou', course: 'Leadership Skills', time: '2 horas atrás' },
          ].map((activity, i) => (
            <div key={i} className="flex items-start gap-4 group p-3 rounded-lg hover:bg-secondary/30 transition-colors">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                <PlayCircle className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium text-foreground">
                  {activity.text} <span className="text-primary">{activity.course}</span>
                </p>
                <p className="text-xs text-muted-foreground">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Reports;
