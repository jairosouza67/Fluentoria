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
  AlertCircle,
  X,
  Loader2,
  RefreshCw,
  Search
} from 'lucide-react';
import { getAdminEmails, addAdminByEmail, removeAdmin, exportStudentData, importStudentData, getStudentsWithAccessControl, updateStudentAccess, syncAllStudentsWithAsaas } from '../lib/db';
import { OrangeToggle } from './ui/toggle';

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

  // Admin management states
  const [adminEmails, setAdminEmails] = useState<string[]>([]);
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(false);
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);

  // Import/Export states
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Access Control states
  const [students, setStudents] = useState<any[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isSyncingAsaas, setIsSyncingAsaas] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // User & Role Management States
  const [studentAutoDelete, setStudentAutoDelete] = useState({ enabled: false, days: 90 });
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

  // Load admin emails on component mount
  useEffect(() => {
    loadAdminEmails();
    loadStudentsWithAccess();
  }, []);

  const loadAdminEmails = async () => {
    setIsLoadingAdmins(true);
    try {
      const emails = await getAdminEmails();
      setAdminEmails(emails);
    } catch (error) {
      console.error('Error loading admin emails:', error);
    } finally {
      setIsLoadingAdmins(false);
    }
  };

  const loadStudentsWithAccess = async () => {
    setIsLoadingStudents(true);
    try {
      const studentsData = await getStudentsWithAccessControl();
      setStudents(studentsData);
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setIsLoadingStudents(false);
    }
  };

  const handleAddAdmin = async () => {
    if (!newAdminEmail.trim()) {
      alert('Por favor, insira um email válido');
      return;
    }

    setIsAddingAdmin(true);
    try {
      const result = await addAdminByEmail(newAdminEmail);
      if (result.success) {
        alert(result.message);
        setNewAdminEmail('');
        setShowAddAdminModal(false);
        await loadAdminEmails(); // Reload the list
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Error adding admin:', error);
      alert('Erro ao adicionar administrador');
    } finally {
      setIsAddingAdmin(false);
    }
  };

  const handleRemoveAdmin = async (email: string) => {
    if (!confirm(`Tem certeza que deseja remover ${email} dos administradores?`)) {
      return;
    }

    try {
      const result = await removeAdmin(email);
      if (result.success) {
        alert(result.message);
        await loadAdminEmails(); // Reload the list
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Error removing admin:', error);
      alert('Erro ao remover administrador');
    }
  };

  const handleExportStudents = async () => {
    setIsExporting(true);
    try {
      const csvData = await exportStudentData();
      
      // Create download link
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `students_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      alert('✅ Dados exportados com sucesso!');
    } catch (error) {
      console.error('Error exporting students:', error);
      alert('❌ Erro ao exportar dados de alunos');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportStudents = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const csvData = e.target?.result as string;
          const result = await importStudentData(csvData);
          
          let message = `✅ Importação concluída!\n\nSucesso: ${result.success} aluno(s)`;
          
          if (result.errors.length > 0) {
            message += '\n\nErros (' + result.errors.length + '):\n' + result.errors.slice(0, 5).join('\n');
            if (result.errors.length > 5) {
              message += '\n... e mais ' + (result.errors.length - 5) + ' erro(s)';
            }
          }
          
          alert(message);
          await loadStudentsWithAccess(); // Reload students
        } catch (error: any) {
          console.error('Error importing students:', error);
          alert(`❌ Erro ao importar dados: ${error.message}`);
        } finally {
          setIsImporting(false);
          // Reset file input
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      };
      
      reader.readAsText(file);
    } catch (error) {
      console.error('Error reading file:', error);
      alert('❌ Erro ao ler arquivo');
      setIsImporting(false);
    }
  };

  const handleSyncAsaas = async () => {
    if (!confirm('Deseja sincronizar o status de pagamento de todos os alunos com o Asaas?\n\nEsta operação pode levar alguns minutos.')) {
      return;
    }

    setIsSyncingAsaas(true);
    try {
      const result = await syncAllStudentsWithAsaas();
      
      let message = `✅ Sincronização concluída!\n\nSucesso: ${result.success} aluno(s)`;
      
      if (result.failed > 0) {
        message += `\nFalhas: ${result.failed}`;
      }
      
      if (result.errors.length > 0) {
        message += '\n\nErros:\n' + result.errors.slice(0, 5).join('\n');
        if (result.errors.length > 5) {
          message += `\n... e mais ${result.errors.length - 5} erro(s)`;
        }
      }
      
      alert(message);
      await loadStudentsWithAccess(); // Reload students
    } catch (error: any) {
      console.error('Error syncing with Asaas:', error);
      alert(`❌ Erro ao sincronizar com Asaas: ${error.message}`);
    } finally {
      setIsSyncingAsaas(false);
    }
  };

  const handleToggleAccess = async (studentId: string, currentStatus: boolean, isManual: boolean) => {
    const newStatus = !currentStatus;
    const action = newStatus ? 'autorizar' : 'desautorizar';
    
    if (!confirm(`Deseja ${action} o acesso deste aluno?${isManual ? ' (Controle Manual)' : ''}`)) {
      return;
    }

    try {
      const result = await updateStudentAccess(studentId, newStatus, true);
      
      if (result.success) {
        alert(`✅ ${result.message}`);
        await loadStudentsWithAccess(); // Reload students
      } else {
        alert(`❌ ${result.message}`);
      }
    } catch (error: any) {
      console.error('Error toggling access:', error);
      alert('❌ Erro ao atualizar acesso');
    }
  };

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
      {/* Add Admin Modal */}
      <AddAdminModal
        isOpen={showAddAdminModal}
        onClose={() => {
          setShowAddAdminModal(false);
          setNewAdminEmail('');
        }}
        onAdd={handleAddAdmin}
        email={newAdminEmail}
        setEmail={setNewAdminEmail}
        isLoading={isAddingAdmin}
      />

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
                  <p className="text-sm text-[#9CA3AF]">
                    {isLoadingAdmins ? 'Carregando...' : `Total de Admins: ${adminEmails.length}`}
                  </p>
                  <button 
                    onClick={() => setShowAddAdminModal(true)}
                    className="bg-[#FF6A00]/10 border border-[#FF6A00]/20 text-[#FF6A00] px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#FF6A00]/20 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar Admin
                  </button>
                </div>
                
                <div className="space-y-3">
                  {isLoadingAdmins ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-[#FF6A00]" />
                    </div>
                  ) : adminEmails.length === 0 ? (
                    <p className="text-center text-[#9CA3AF] py-8">Nenhum administrador cadastrado</p>
                  ) : (
                    adminEmails.map((email, index) => {
                      const isPrimary = email === 'jairosouza67@gmail.com';
                      return (
                        <div key={index} className="bg-[#111111] border border-white/[0.06] rounded-lg p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-[#FF6A00] to-[#E15B00] rounded-full flex items-center justify-center text-white font-bold">
                              {email.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h4 className="text-[#F3F4F6] font-medium flex items-center gap-2">
                                {email}
                                {isPrimary && (
                                  <span className="text-[10px] bg-[#FF6A00]/20 text-[#FF6A00] px-2 py-0.5 rounded-full">
                                    Principal
                                  </span>
                                )}
                              </h4>
                              <p className="text-xs text-[#9CA3AF]">Administrador</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            {!isPrimary && (
                              <button 
                                onClick={() => handleRemoveAdmin(email)}
                                className="text-[#9CA3AF] hover:text-red-500 transition-colors"
                                title="Remover administrador"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
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
                  <OrangeToggle
                    checked={studentAutoDelete.enabled}
                    onChange={(e) => setStudentAutoDelete({...studentAutoDelete, enabled: e.target.checked})}
                  />
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

                <div className="flex gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleImportStudents}
                    className="hidden"
                  />
                  <button 
                    onClick={handleExportStudents}
                    disabled={isExporting}
                    className="flex-1 bg-white/[0.02] border border-white/[0.06] text-[#F3F4F6] px-4 py-3 rounded-lg hover:bg-white/[0.05] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isExporting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Exportando...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Exportar Dados de Alunos
                      </>
                    )}
                  </button>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isImporting}
                    className="flex-1 bg-white/[0.02] border border-white/[0.06] text-[#F3F4F6] px-4 py-3 rounded-lg hover:bg-white/[0.05] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isImporting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Importando...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Importar Alunos em Massa
                      </>
                    )}
                  </button>
                </div>
              </div>
            </SettingSection>

            {/* Access Control */}
            <SettingSection
              title="Controle de Acesso & Permissões (Asaas)"
              description="Gerencie autorizações de acesso baseadas em pagamento"
              icon={Lock}
              expanded={expandedSections.accessControl}
              onToggle={() => toggleSection('accessControl')}
            >
              <div className="space-y-6">
                {/* Sync Button */}
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[#FF6A00]/10 to-transparent rounded-lg border border-[#FF6A00]/20">
                  <div>
                    <h4 className="text-[#F3F4F6] font-medium mb-1 flex items-center gap-2">
                      <RefreshCw className="w-4 h-4" />
                      Sincronização Automática com Asaas
                    </h4>
                    <p className="text-sm text-[#9CA3AF]">
                      Alunos com pagamento em dia serão autorizados automaticamente
                    </p>
                  </div>
                  <button
                    onClick={handleSyncAsaas}
                    disabled={isSyncingAsaas}
                    className="bg-[#FF6A00] hover:bg-[#E15B00] text-white px-6 py-2.5 rounded-lg flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSyncingAsaas ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sincronizando...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        Sincronizar Agora
                      </>
                    )}
                  </button>
                </div>

                {/* Search */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#9CA3AF]">Buscar Aluno</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                    <input
                      type="text"
                      placeholder="Buscar aluno por nome ou email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-white/[0.02] border border-white/[0.06] text-[#F3F4F6] pl-15 pr-4 py-2.5 rounded-lg focus:outline-none focus:border-[#FF6A00]"
                    />
                  </div>
                </div>

                {/* Students List */}
                <div className="space-y-3">
                  {isLoadingStudents ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-[#FF6A00]" />
                    </div>
                  ) : students.filter(s => 
                    !searchTerm || 
                    s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    s.email?.toLowerCase().includes(searchTerm.toLowerCase())
                  ).length === 0 ? (
                    <div className="text-center py-12 text-[#9CA3AF]">
                      {searchTerm ? 'Nenhum aluno encontrado' : 'Nenhum aluno cadastrado'}
                    </div>
                  ) : (
                    students
                      .filter(s => 
                        !searchTerm || 
                        s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        s.email?.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((student) => {
                        const getStatusInfo = (status: string) => {
                          switch (status) {
                            case 'active':
                              return { color: 'text-green-500', bg: 'bg-green-500/10', label: 'Ativo' };
                            case 'overdue':
                              return { color: 'text-red-500', bg: 'bg-red-500/10', label: 'Atrasado' };
                            case 'no_payment':
                              return { color: 'text-yellow-500', bg: 'bg-yellow-500/10', label: 'Sem Pagamento' };
                            default:
                              return { color: 'text-[#9CA3AF]', bg: 'bg-white/[0.05]', label: 'Desconhecido' };
                          }
                        };

                        const statusInfo = getStatusInfo(student.paymentStatus);

                        return (
                          <div
                            key={student.id}
                            className="bg-[#111111] border border-white/[0.06] rounded-lg p-4 hover:border-white/[0.1] transition-all"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 flex-1">
                                <div className="w-12 h-12 bg-gradient-to-br from-[#FF6A00] to-[#E15B00] rounded-full flex items-center justify-center text-white font-bold text-lg">
                                  {student.name?.charAt(0).toUpperCase() || 'A'}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <h4 className="text-[#F3F4F6] font-medium">
                                      {student.name || student.displayName || 'Sem nome'}
                                    </h4>
                                    {student.manualAuthorization && (
                                      <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">
                                        Manual
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-[#9CA3AF]">{student.email}</p>
                                  <div className="flex items-center gap-3 mt-1">
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusInfo.bg} ${statusInfo.color}`}>
                                      {statusInfo.label}
                                    </span>
                                    {student.asaasCustomerId && (
                                      <span className="text-xs text-[#9CA3AF]">
                                        ID: {student.asaasCustomerId.slice(0, 12)}...
                                      </span>
                                    )}
                                    {student.lastAsaasSync && (
                                      <span className="text-xs text-[#9CA3AF]">
                                        Últ. Sync: {new Date(student.lastAsaasSync).toLocaleDateString()}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-4">
                                <div className="flex flex-col items-end gap-1">
                                  <span className="text-xs text-[#9CA3AF]">
                                    {student.accessAuthorized ? 'Autorizado' : 'Não Autorizado'}
                                  </span>
                                  <button
                                    onClick={() => handleToggleAccess(student.id, student.accessAuthorized, student.manualAuthorization)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                      student.accessAuthorized
                                        ? 'bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20'
                                        : 'bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20'
                                    }`}
                                  >
                                    {student.accessAuthorized ? 'Desautorizar' : 'Autorizar'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>

                {/* Stats Summary */}
                {!isLoadingStudents && students.length > 0 && (
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/[0.06]">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-[#F3F4F6]">
                        {students.filter(s => s.accessAuthorized).length}
                      </p>
                      <p className="text-xs text-[#9CA3AF]">Autorizados</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-[#F3F4F6]">
                        {students.filter(s => s.paymentStatus === 'active').length}
                      </p>
                      <p className="text-xs text-[#9CA3AF]">Pagamentos Ativos</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-[#F3F4F6]">
                        {students.filter(s => s.manualAuthorization).length}
                      </p>
                      <p className="text-xs text-[#9CA3AF]">Autorizações Manuais</p>
                    </div>
                  </div>
                )}
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
                      <OrangeToggle
                        checked={achievement.enabled}
                      />
                    </div>
                  </div>
                ))}
                <button className="w-full bg-white/[0.02] border border-white/[0.06] text-[#F3F4F6] px-4 py-3 rounded-lg hover:bg-white/[0.05] transition-all flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" />
                  Adicionar Nova Conquista
                </button>
              </div>
            </SettingSection>
          </>
        )}
      </div>


    </div>
  );
};

// Add Admin Modal Component
interface AddAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: () => void;
  email: string;
  setEmail: (email: string) => void;
  isLoading: boolean;
}

const AddAdminModal: React.FC<AddAdminModalProps> = ({ isOpen, onClose, onAdd, email, setEmail, isLoading }) => {
  if (!isOpen) return null;

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      onAdd();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#111111] border border-white/[0.06] rounded-xl w-full max-w-md shadow-elevated">
        <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
          <div>
            <h2 className="text-xl font-bold text-[#F3F4F6]">Adicionar Administrador</h2>
            <p className="text-sm text-[#9CA3AF] mt-1">Insira o email do novo administrador</p>
          </div>
          <button 
            onClick={onClose} 
            className="text-[#9CA3AF] hover:text-[#F3F4F6] transition-colors"
            disabled={isLoading}
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#9CA3AF]">
              Email do Administrador
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="exemplo@email.com"
              className="w-full bg-white/[0.02] border border-white/[0.06] text-[#F3F4F6] px-4 py-3 rounded-lg focus:outline-none focus:border-[#FF6A00] transition-colors"
              disabled={isLoading}
              autoFocus
            />
            <p className="text-xs text-[#9CA3AF]">
              O usuário receberá permissões de administrador ao fazer login
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-white/[0.02] border border-white/[0.06] text-[#F3F4F6] px-4 py-3 rounded-lg hover:bg-white/[0.05] transition-all font-medium"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              onClick={onAdd}
              disabled={isLoading || !email.trim()}
              className="flex-1 bg-[#FF6A00] hover:bg-[#E15B00] text-white px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Adicionando...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Adicionar
                </>
              )}
            </button>
          </div>
        </div>
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
