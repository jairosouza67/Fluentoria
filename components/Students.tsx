import React, { useState } from 'react';
import { Search, MoreVertical, Mail, Phone, Calendar, Award, TrendingUp, Filter, UserPlus } from 'lucide-react';

interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  enrolledDate: string;
  coursesCompleted: number;
  progress: number;
  status: 'active' | 'inactive';
  avatar?: string;
}

const Students: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  const students: Student[] = [
    {
      id: '1',
      name: 'Ana Silva',
      email: 'ana.silva@email.com',
      phone: '+55 11 98765-4321',
      enrolledDate: '2024-01-15',
      coursesCompleted: 8,
      progress: 75,
      status: 'active',
    },
    {
      id: '2',
      name: 'Carlos Santos',
      email: 'carlos.santos@email.com',
      phone: '+55 11 91234-5678',
      enrolledDate: '2024-02-20',
      coursesCompleted: 5,
      progress: 45,
      status: 'active',
    },
    {
      id: '3',
      name: 'Maria Oliveira',
      email: 'maria.oliveira@email.com',
      phone: '+55 11 99876-5432',
      enrolledDate: '2023-11-10',
      coursesCompleted: 12,
      progress: 90,
      status: 'active',
    },
    {
      id: '4',
      name: 'João Costa',
      email: 'joao.costa@email.com',
      phone: '+55 11 92345-6789',
      enrolledDate: '2024-03-05',
      coursesCompleted: 2,
      progress: 20,
      status: 'inactive',
    },
  ];

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || student.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const stats = [
    { title: 'Total de Alunos', value: '1,240', icon: Award, color: 'primary' },
    { title: 'Alunos Ativos', value: '1,180', icon: TrendingUp, color: 'green' },
    { title: 'Novos este Mês', value: '42', icon: UserPlus, color: 'blue' },
  ];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Alunos</h1>
          <p className="text-muted-foreground mt-2">Gerencie e acompanhe seus estudantes.</p>
        </div>
        <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-3 rounded-md font-medium flex items-center gap-2 shadow-sm hover:-translate-y-0.5 transition-all duration-200">
          <UserPlus className="w-4 h-4" />
          Adicionar Aluno
        </button>
      </div>

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
            <div className="text-3xl font-bold text-foreground">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4 bg-card p-4 rounded-xl border border-border shadow-sm">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar alunos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 bg-secondary/50 border-transparent focus:border-primary/50 transition-all px-4 py-2.5 rounded-lg text-foreground placeholder-muted-foreground focus:outline-none"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === 'all' ? 'bg-primary text-primary-foreground' : 'bg-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilterStatus('active')}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === 'active' ? 'bg-primary text-primary-foreground' : 'bg-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Ativos
          </button>
          <button
            onClick={() => setFilterStatus('inactive')}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === 'inactive' ? 'bg-primary text-primary-foreground' : 'bg-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Inativos
          </button>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-card border-border rounded-xl shadow-card-custom overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary/50 border-b border-border">
              <tr>
                <th className="text-left py-4 px-6 text-sm font-semibold text-muted-foreground">Aluno</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-muted-foreground">Contato</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-muted-foreground">Inscrição</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-muted-foreground">Progresso</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-muted-foreground">Status</th>
                <th className="text-right py-4 px-6 text-sm font-semibold text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student, index) => (
                <tr
                  key={student.id}
                  className={`border-b border-border hover:bg-secondary/30 transition-colors ${
                    index === filteredStudents.length - 1 ? 'border-b-0' : ''
                  }`}
                >
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                        {student.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{student.name}</div>
                        <div className="text-xs text-muted-foreground">{student.coursesCompleted} aulas concluídas</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="w-3 h-3" />
                        {student.email}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="w-3 h-3" />
                        {student.phone}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      {new Date(student.enrolledDate).toLocaleDateString('pt-BR')}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{student.progress}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${student.progress}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        student.status === 'active'
                          ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                          : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                      }`}
                    >
                      {student.status === 'active' ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button className="text-muted-foreground hover:text-foreground p-2 rounded-lg hover:bg-secondary/50 transition-colors">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Students;
