import React, { useState, useEffect } from 'react';
import {
  User,
  Bell,
  Lock,
  CreditCard,
  Mail,
  Globe,
  Shield,
  Eye,
  EyeOff,
  Save,
  Camera,
  Users,
  Settings as SettingsIcon,
  BookOpen,
  Trophy,
  Download,
  Upload,
  Trash2,
  Plus,
  Edit,
  Calendar,
  Clock,
  Award,
  Target,
  Zap,
  ChevronDown,
  ChevronRight,
  AlertCircle
} from 'lucide-react';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({
    adminUsers: true,
    studentSettings: false,
    accessControl: false,
    courseDefaults: false,
    contentLibrary: false,
    xpSystem: false,
    achievements: false,
    streaks: false,
  });

  // User & Role Management States
  const [adminUsers, setAdminUsers] = useState([
    { id: '1', name: 'Jairo Souza', email: 'jairosouza67@gmail.com', role: 'Super Admin', active: true },
  ]);
  const [studentAutoDelete, setStudentAutoDelete] = useState({ enabled: false, days: 90 });
  const [autoArchiveCourses, setAutoArchiveCourses] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState(30);

  // Course Management States
  const [courseDefaults, setCourseDefaults] = useState({
    visibility: 'private',
    autoPublish: false,
    certificateEnabled: true,
    completionCriteria: 80,
    maxMediaSize: 100,
    allowedFormats: ['video', 'audio', 'pdf'],
  });
  const [dailyContactFrequency, setDailyContactFrequency] = useState('daily');
  const [contentExpiration, setContentExpiration] = useState(365);

  // Gamification States
  const [xpValues, setXpValues] = useState({
    courseCompletion: 100,
    dailyContact: 10,
    mindfulFlow: 15,
    mediaUpload: 5,
    perfectAttendance: 50,
  });
  const [levelCap, setLevelCap] = useState(100);
  const [achievements, setAchievements] = useState([
    { id: '1', name: 'First Steps', enabled: true, condition: 'First course completion', xp: 50 },
    { id: '2', name: 'Dedicated Learner', enabled: true, condition: '7-day streak', xp: 100 },
    { id: '3', name: 'Course Master', enabled: true, condition: '10 courses completed', xp: 500 },
  ]);
  const [streakRules, setStreakRules] = useState({
    gracePeriod: 24,
    timezone: 'America/Sao_Paulo',
    bonusMultiplier: 1.5,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleSaveSettings = () => {
    // Save all settings to Firestore
    console.log('Saving settings...', {
      courseDefaults,
      xpValues,
      streakRules,
      studentAutoDelete,
    });
    alert('Configurações salvas com sucesso!');
  };

  const tabs = [
    { id: 'users', label: 'Usuários & Permissões', icon: Users },
    { id: 'courses', label: 'Cursos & Conteúdo', icon: BookOpen },
    { id: 'gamification', label: 'Gamificação', icon: Trophy },
  ];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#F3F4F6]">Configurações do Sistema</h1>
          <p className="text-[#9CA3AF] mt-2">Gerencie configurações administrativas e preferências da plataforma</p>
        </div>
        <button 
          onClick={handleSaveSettings}
          className="bg-[#FF6A00] hover:bg-[#E15B00] text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-all duration-200 shadow-[0_8px_24px_rgba(255,106,0,0.12)]"
        >
          <Save className="w-5 h-5" />
          Salvar Todas
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/[0.06] overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-all duration-200 border-b-2 whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-[#FF6A00] text-[#FF6A00]'
                : 'border-transparent text-[#9CA3AF] hover:text-[#F3F4F6]'
            }`}
          >
            <tab.icon className="w-5 h-5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Users & Permissions Tab */}
        {activeTab === 'users' && (
          <>
            {/* Admin User Management */}
            <SettingSection
              title="Gerenciamento de Administradores"
              description="Crie e gerencie contas de administradores"
              icon={Shield}
              expanded={expandedSections.adminUsers}
              onToggle={() => toggleSection('adminUsers')}
            >
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-[#9CA3AF]">Total de Admins: {adminUsers.length}</p>
                  <button className="bg-[#FF6A00]/10 border border-[#FF6A00]/20 text-[#FF6A00] px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#FF6A00]/20 transition-all">
                    <Plus className="w-4 h-4" />
                    Adicionar Admin
                  </button>
                </div>
                
                <div className="space-y-3">
                  {adminUsers.map((admin) => (
                    <div key={admin.id} className="bg-[#111111] border border-white/[0.06] rounded-lg p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#FF6A00] to-[#E15B00] rounded-full flex items-center justify-center text-white font-bold">
                          {admin.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="text-[#F3F4F6] font-medium">{admin.name}</h4>
                          <p className="text-xs text-[#9CA3AF]">{admin.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <select 
                          className="bg-white/[0.02] border border-white/[0.06] text-[#F3F4F6] px-3 py-1.5 rounded-lg text-sm focus:outline-none focus:border-[#FF6A00]"
                          value={admin.role}
                        >
                          <option value="Super Admin">Super Admin</option>
                          <option value="Content Admin">Content Admin</option>
                          <option value="Analytics Admin">Analytics Admin</option>
                        </select>
                        <button className="text-[#9CA3AF] hover:text-[#FF6A00] transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </SettingSection>

            {/* Student Account Settings */}
            <SettingSection
              title="Configurações de Contas de Alunos"
              description="Gerencie políticas de contas de estudantes"
              icon={Users}
              expanded={expandedSections.studentSettings}
              onToggle={() => toggleSection('studentSettings')}
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-[#111111] rounded-lg border border-white/[0.06]">
                  <div>
                    <h4 className="text-[#F3F4F6] font-medium mb-1">Auto-excluir contas inativas</h4>
                    <p className="text-sm text-[#9CA3AF]">Excluir automaticamente contas após período de inatividade</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={studentAutoDelete.enabled}
                      onChange={(e) => setStudentAutoDelete({...studentAutoDelete, enabled: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-[#1C1917] rounded-full peer peer-checked:bg-[#FF6A00] peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                  </label>
                </div>

                {studentAutoDelete.enabled && (
                  <div className="ml-4 space-y-2">
                    <label className="text-sm font-medium text-[#9CA3AF]">Período de inatividade (dias)</label>
                    <input
                      type="number"
                      value={studentAutoDelete.days}
                      onChange={(e) => setStudentAutoDelete({...studentAutoDelete, days: parseInt(e.target.value)})}
                      className="w-full bg-white/[0.02] border border-white/[0.06] text-[#F3F4F6] px-4 py-2.5 rounded-lg focus:outline-none focus:border-[#FF6A00]"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between p-4 bg-[#111111] rounded-lg border border-white/[0.06]">
                  <div>
                    <h4 className="text-[#F3F4F6] font-medium mb-1">Auto-arquivar cursos concluídos</h4>
                    <p className="text-sm text-[#9CA3AF]">Arquivar cursos automaticamente após conclusão</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoArchiveCourses}
                      onChange={(e) => setAutoArchiveCourses(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-[#1C1917] rounded-full peer peer-checked:bg-[#FF6A00] peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                  </label>
                </div>

                <div className="flex gap-3">
                  <button className="flex-1 bg-white/[0.02] border border-white/[0.06] text-[#F3F4F6] px-4 py-3 rounded-lg hover:bg-white/[0.05] transition-all flex items-center justify-center gap-2">
                    <Download className="w-4 h-4" />
                    Exportar Dados de Alunos
                  </button>
                  <button className="flex-1 bg-white/[0.02] border border-white/[0.06] text-[#F3F4F6] px-4 py-3 rounded-lg hover:bg-white/[0.05] transition-all flex items-center justify-center gap-2">
                    <Upload className="w-4 h-4" />
                    Importar Alunos em Massa
                  </button>
                </div>
              </div>
            </SettingSection>

            {/* Access Control */}
            <SettingSection
              title="Controle de Acesso & Permissões"
              description="Defina permissões e políticas de segurança"
              icon={Lock}
              expanded={expandedSections.accessControl}
              onToggle={() => toggleSection('accessControl')}
            >
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#9CA3AF]">Timeout de Sessão (minutos)</label>
                  <input
                    type="number"
                    value={sessionTimeout}
                    onChange={(e) => setSessionTimeout(parseInt(e.target.value))}
                    className="w-full bg-white/[0.02] border border-white/[0.06] text-[#F3F4F6] px-4 py-2.5 rounded-lg focus:outline-none focus:border-[#FF6A00]"
                  />
                  <p className="text-xs text-[#9CA3AF]">Usuários serão desconectados automaticamente após este período de inatividade</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#9CA3AF]">Whitelist de IPs (Admin)</label>
                  <textarea
                    placeholder="Ex: 192.168.1.1, 10.0.0.1"
                    rows={3}
                    className="w-full bg-white/[0.02] border border-white/[0.06] text-[#F3F4F6] px-4 py-2.5 rounded-lg focus:outline-none focus:border-[#FF6A00] resize-none"
                  />
                  <p className="text-xs text-[#9CA3AF]">Apenas IPs listados poderão acessar área administrativa</p>
                </div>
              </div>
            </SettingSection>
          </>
        )}

        {/* Courses & Content Tab */}
        {activeTab === 'courses' && (
          <>
            {/* Course Defaults */}
            <SettingSection
              title="Configurações Padrão de Cursos"
              description="Defina configurações padrão para novos cursos"
              icon={BookOpen}
              expanded={expandedSections.courseDefaults}
              onToggle={() => toggleSection('courseDefaults')}
            >
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#9CA3AF]">Visibilidade Padrão</label>
                    <select 
                      value={courseDefaults.visibility}
                      onChange={(e) => setCourseDefaults({...courseDefaults, visibility: e.target.value})}
                      className="w-full bg-white/[0.02] border border-white/[0.06] text-[#F3F4F6] px-4 py-2.5 rounded-lg focus:outline-none focus:border-[#FF6A00]"
                    >
                      <option value="private">Privado</option>
                      <option value="public">Público</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#9CA3AF]">Critério de Conclusão (%)</label>
                    <input
                      type="number"
                      value={courseDefaults.completionCriteria}
                      onChange={(e) => setCourseDefaults({...courseDefaults, completionCriteria: parseInt(e.target.value)})}
                      className="w-full bg-white/[0.02] border border-white/[0.06] text-[#F3F4F6] px-4 py-2.5 rounded-lg focus:outline-none focus:border-[#FF6A00]"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#9CA3AF]">Tamanho Máx. de Mídia (MB)</label>
                    <input
                      type="number"
                      value={courseDefaults.maxMediaSize}
                      onChange={(e) => setCourseDefaults({...courseDefaults, maxMediaSize: parseInt(e.target.value)})}
                      className="w-full bg-white/[0.02] border border-white/[0.06] text-[#F3F4F6] px-4 py-2.5 rounded-lg focus:outline-none focus:border-[#FF6A00]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-[#111111] rounded-lg border border-white/[0.06]">
                  <div>
                    <h4 className="text-[#F3F4F6] font-medium mb-1">Auto-publicação</h4>
                    <p className="text-sm text-[#9CA3AF]">Publicar cursos automaticamente ao criar</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={courseDefaults.autoPublish}
                      onChange={(e) => setCourseDefaults({...courseDefaults, autoPublish: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-[#1C1917] rounded-full peer peer-checked:bg-[#FF6A00] peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-[#111111] rounded-lg border border-white/[0.06]">
                  <div>
                    <h4 className="text-[#F3F4F6] font-medium mb-1">Certificados Habilitados</h4>
                    <p className="text-sm text-[#9CA3AF]">Gerar certificados ao concluir cursos</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={courseDefaults.certificateEnabled}
                      onChange={(e) => setCourseDefaults({...courseDefaults, certificateEnabled: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-[#1C1917] rounded-full peer peer-checked:bg-[#FF6A00] peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                  </label>
                </div>
              </div>
            </SettingSection>

            {/* Content Library */}
            <SettingSection
              title="Gerenciamento da Biblioteca de Conteúdo"
              description="Configure políticas de conteúdo e rotação"
              icon={Calendar}
              expanded={expandedSections.contentLibrary}
              onToggle={() => toggleSection('contentLibrary')}
            >
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#9CA3AF]">Frequência do Daily Contact</label>
                  <select 
                    value={dailyContactFrequency}
                    onChange={(e) => setDailyContactFrequency(e.target.value)}
                    className="w-full bg-white/[0.02] border border-white/[0.06] text-[#F3F4F6] px-4 py-2.5 rounded-lg focus:outline-none focus:border-[#FF6A00]"
                  >
                    <option value="daily">Diário</option>
                    <option value="weekly">Semanal</option>
                    <option value="biweekly">Quinzenal</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#9CA3AF]">Expiração de Conteúdo (dias)</label>
                  <input
                    type="number"
                    value={contentExpiration}
                    onChange={(e) => setContentExpiration(parseInt(e.target.value))}
                    className="w-full bg-white/[0.02] border border-white/[0.06] text-[#F3F4F6] px-4 py-2.5 rounded-lg focus:outline-none focus:border-[#FF6A00]"
                  />
                  <p className="text-xs text-[#9CA3AF]">Conteúdos antigos serão arquivados automaticamente</p>
                </div>
              </div>
            </SettingSection>
          </>
        )}

        {/* Gamification Tab */}
        {activeTab === 'gamification' && (
          <>
            {/* XP System */}
            <SettingSection
              title="Sistema de XP & Níveis"
              description="Configure valores de XP e progressão de níveis"
              icon={Zap}
              expanded={expandedSections.xpSystem}
              onToggle={() => toggleSection('xpSystem')}
            >
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#9CA3AF]">XP por Conclusão de Curso</label>
                    <input
                      type="number"
                      value={xpValues.courseCompletion}
                      onChange={(e) => setXpValues({...xpValues, courseCompletion: parseInt(e.target.value)})}
                      className="w-full bg-white/[0.02] border border-white/[0.06] text-[#F3F4F6] px-4 py-2.5 rounded-lg focus:outline-none focus:border-[#FF6A00]"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#9CA3AF]">XP por Daily Contact</label>
                    <input
                      type="number"
                      value={xpValues.dailyContact}
                      onChange={(e) => setXpValues({...xpValues, dailyContact: parseInt(e.target.value)})}
                      className="w-full bg-white/[0.02] border border-white/[0.06] text-[#F3F4F6] px-4 py-2.5 rounded-lg focus:outline-none focus:border-[#FF6A00]"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#9CA3AF]">XP por Mindful Flow</label>
                    <input
                      type="number"
                      value={xpValues.mindfulFlow}
                      onChange={(e) => setXpValues({...xpValues, mindfulFlow: parseInt(e.target.value)})}
                      className="w-full bg-white/[0.02] border border-white/[0.06] text-[#F3F4F6] px-4 py-2.5 rounded-lg focus:outline-none focus:border-[#FF6A00]"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#9CA3AF]">XP por Upload de Mídia</label>
                    <input
                      type="number"
                      value={xpValues.mediaUpload}
                      onChange={(e) => setXpValues({...xpValues, mediaUpload: parseInt(e.target.value)})}
                      className="w-full bg-white/[0.02] border border-white/[0.06] text-[#F3F4F6] px-4 py-2.5 rounded-lg focus:outline-none focus:border-[#FF6A00]"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#9CA3AF]">XP por Presença Perfeita</label>
                    <input
                      type="number"
                      value={xpValues.perfectAttendance}
                      onChange={(e) => setXpValues({...xpValues, perfectAttendance: parseInt(e.target.value)})}
                      className="w-full bg-white/[0.02] border border-white/[0.06] text-[#F3F4F6] px-4 py-2.5 rounded-lg focus:outline-none focus:border-[#FF6A00]"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#9CA3AF]">Nível Máximo</label>
                    <input
                      type="number"
                      value={levelCap}
                      onChange={(e) => setLevelCap(parseInt(e.target.value))}
                      className="w-full bg-white/[0.02] border border-white/[0.06] text-[#F3F4F6] px-4 py-2.5 rounded-lg focus:outline-none focus:border-[#FF6A00]"
                    />
                  </div>
                </div>
              </div>
            </SettingSection>

            {/* Achievements */}
            <SettingSection
              title="Configurações de Conquistas"
              description="Gerencie conquistas e recompensas"
              icon={Award}
              expanded={expandedSections.achievements}
              onToggle={() => toggleSection('achievements')}
            >
              <div className="space-y-4">
                {achievements.map((achievement) => (
                  <div key={achievement.id} className="bg-[#111111] border border-white/[0.06] rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <Trophy className="w-5 h-5 text-[#FF6A00]" />
                        <div className="flex-1">
                          <h4 className="text-[#F3F4F6] font-medium">{achievement.name}</h4>
                          <p className="text-sm text-[#9CA3AF]">{achievement.condition} • {achievement.xp} XP</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={achievement.enabled}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-[#1C1917] rounded-full peer peer-checked:bg-[#FF6A00] peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                      </label>
                    </div>
                  </div>
                ))}
                <button className="w-full bg-white/[0.02] border border-white/[0.06] text-[#F3F4F6] px-4 py-3 rounded-lg hover:bg-white/[0.05] transition-all flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" />
                  Adicionar Nova Conquista
                </button>
              </div>
            </SettingSection>

            {/* Streaks & Attendance */}
            <SettingSection
              title="Streaks & Presença"
              description="Configure regras de streaks e presença"
              icon={Target}
              expanded={expandedSections.streaks}
              onToggle={() => toggleSection('streaks')}
            >
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#9CA3AF]">Período de Graça (horas)</label>
                    <input
                      type="number"
                      value={streakRules.gracePeriod}
                      onChange={(e) => setStreakRules({...streakRules, gracePeriod: parseInt(e.target.value)})}
                      className="w-full bg-white/[0.02] border border-white/[0.06] text-[#F3F4F6] px-4 py-2.5 rounded-lg focus:outline-none focus:border-[#FF6A00]"
                    />
                    <p className="text-xs text-[#9CA3AF]">Tempo extra para manter o streak</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#9CA3AF]">Multiplicador de Bônus</label>
                    <input
                      type="number"
                      step="0.1"
                      value={streakRules.bonusMultiplier}
                      onChange={(e) => setStreakRules({...streakRules, bonusMultiplier: parseFloat(e.target.value)})}
                      className="w-full bg-white/[0.02] border border-white/[0.06] text-[#F3F4F6] px-4 py-2.5 rounded-lg focus:outline-none focus:border-[#FF6A00]"
                    />
                    <p className="text-xs text-[#9CA3AF]">XP extra para streaks longos</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#9CA3AF]">Fuso Horário</label>
                    <select 
                      value={streakRules.timezone}
                      onChange={(e) => setStreakRules({...streakRules, timezone: e.target.value})}
                      className="w-full bg-white/[0.02] border border-white/[0.06] text-[#F3F4F6] px-4 py-2.5 rounded-lg focus:outline-none focus:border-[#FF6A00]"
                    >
                      <option value="America/Sao_Paulo">São Paulo (BRT)</option>
                      <option value="America/New_York">New York (EST)</option>
                      <option value="Europe/London">London (GMT)</option>
                    </select>
                  </div>
                </div>
              </div>
            </SettingSection>
          </>
        )}
      </div>


    </div>
  );
};

// SettingSection Component
interface SettingSectionProps {
  title: string;
  description: string;
  icon: React.ElementType;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const SettingSection: React.FC<SettingSectionProps> = ({ title, description, icon: Icon, expanded, onToggle, children }) => {
  return (
    <div className="bg-[#111111]/50 border border-white/[0.06] rounded-xl overflow-hidden shadow-card">
      <button
        onClick={onToggle}
        className="w-full p-6 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-[#FF6A00]/10 flex items-center justify-center text-[#FF6A00]">
            <Icon className="w-6 h-6" />
          </div>
          <div className="text-left">
            <h3 className="text-lg font-bold text-[#F3F4F6]">{title}</h3>
            <p className="text-sm text-[#9CA3AF] mt-1">{description}</p>
          </div>
        </div>
        {expanded ? (
          <ChevronDown className="w-5 h-5 text-[#9CA3AF] transition-transform" />
        ) : (
          <ChevronRight className="w-5 h-5 text-[#9CA3AF] transition-transform" />
        )}
      </button>
      {expanded && (
        <div className="p-6 border-t border-white/[0.06] bg-[#0B0B0B]/50">
          {children}
        </div>
      )}
    </div>
  );
};

export default Settings;
