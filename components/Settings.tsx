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
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card } from './ui/Card';
import { SettingSection } from './ui/SettingSection';
import { Modal } from './ui/Modal';
import { PageHeader } from './ui/PageHeader';

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
  // Daily Contact disabled
  // const [dailyContactFrequency, setDailyContactFrequency] = useState('daily');
  const [contentExpiration, setContentExpiration] = useState(365);

  // Gamification States
  const [xpValues, setXpValues] = useState({
    courseCompletion: 100,
    // dailyContact: 10, // Daily Contact disabled
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
    { id: 'courses', label: 'Aulas & Conteúdo', icon: BookOpen },
    { id: 'gamification', label: 'Gamificação', icon: Trophy },
  ];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Add Admin Modal */}
      <Modal
        isOpen={showAddAdminModal}
        onClose={() => {
          setShowAddAdminModal(false);
          setNewAdminEmail('');
        }}
        title="Adicionar Administrador"
        description="Insira o email do novo administrador"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setShowAddAdminModal(false)}
              className="flex-1"
              disabled={isAddingAdmin}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAddAdmin}
              disabled={isAddingAdmin || !newAdminEmail.trim()}
              isLoading={isAddingAdmin}
              className="flex-1"
            >
              <Plus className="w-5 h-5 mr-2" />
              Adicionar
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#9CA3AF]">
              Email do Administrador
            </label>
            <Input
              type="email"
              value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !isAddingAdmin && handleAddAdmin()}
              placeholder="exemplo@email.com"
              disabled={isAddingAdmin}
              autoFocus
            />
            <p className="text-xs text-[#9CA3AF]">
              O usuário receberá permissões de administrador ao fazer login
            </p>
          </div>
        </div>
      </Modal>

      {/* Header */}
      <PageHeader 
        title="Configurações do Sistema"
        description="Gerencie configurações administrativas e preferências da plataforma"
        action={
          <Button onClick={handleSaveSettings}>
            <Save className="w-4 h-4 mr-2" />
            Salvar Todas
          </Button>
        }
      />

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-white/[0.06]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 md:px-6 py-2.5 md:py-3 text-sm md:text-base font-medium transition-all duration-200 border-b-2 ${
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
                  <Button 
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowAddAdminModal(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Admin
                  </Button>
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
                        <Card key={index} className="p-4 flex items-center justify-between">
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
                        </Card>
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
                <Card className="flex items-center justify-between p-4 bg-white/[0.01]">
                  <div>
                    <h4 className="text-[#F3F4F6] font-medium mb-1">Auto-excluir contas inativas</h4>
                    <p className="text-sm text-[#9CA3AF]">Excluir automaticamente contas após período de inatividade</p>
                  </div>
                  <OrangeToggle
                    checked={studentAutoDelete.enabled}
                    onChange={(e) => setStudentAutoDelete({...studentAutoDelete, enabled: e.target.checked})}
                  />
                </Card>

                {studentAutoDelete.enabled && (
                  <div className="ml-4 space-y-2">
                    <label className="text-sm font-medium text-[#9CA3AF]">Período de inatividade (dias)</label>
                    <Input
                      type="number"
                      value={studentAutoDelete.days}
                      onChange={(e) => setStudentAutoDelete({...studentAutoDelete, days: parseInt(e.target.value)})}
                    />
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleImportStudents}
                    className="hidden"
                  />
                  <Button 
                    variant="secondary"
                    onClick={handleExportStudents}
                    disabled={isExporting}
                    className="flex-1"
                    isLoading={isExporting}
                  >
                    {!isExporting && <Download className="w-4 h-4 mr-2" />}
                    Exportar Dados de Alunos
                  </Button>
                  <Button 
                    variant="secondary"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isImporting}
                    className="flex-1"
                    isLoading={isImporting}
                  >
                    {!isImporting && <Upload className="w-4 h-4 mr-2" />}
                    Importar Alunos em Massa
                  </Button>
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
                <Card className="flex items-center justify-between p-4 bg-gradient-to-r from-[#FF6A00]/05 to-transparent border-[#FF6A00]/20">
                  <div>
                    <h4 className="text-[#F3F4F6] font-medium mb-1 flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 text-orange-400" />
                      Sincronização Automática com Asaas
                    </h4>
                    <p className="text-sm text-[#9CA3AF]">
                      Alunos com pagamento em dia serão autorizados automaticamente
                    </p>
                  </div>
                  <Button
                    onClick={handleSyncAsaas}
                    disabled={isSyncingAsaas}
                    isLoading={isSyncingAsaas}
                  >
                    {!isSyncingAsaas && <RefreshCw className="w-4 h-4 mr-2" />}
                    Sincronizar Agora
                  </Button>
                </Card>

                {/* Search */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#9CA3AF]">Buscar Aluno</label>
                  <Input
                    placeholder="Buscar aluno por nome ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    icon={<Search className="w-4 h-4 text-[#9CA3AF]" />}
                  />
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
                          <Card
                            key={student.id}
                            className="p-4 hover:border-white/[0.1] transition-all"
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
                                  <p className="text-sm text-[#9CA3AF] line-clamp-1">{student.email}</p>
                                  <div className="flex flex-wrap items-center gap-2 mt-1">
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusInfo.bg} ${statusInfo.color}`}>
                                      {statusInfo.label}
                                    </span>
                                    {student.asaasCustomerId && (
                                      <span className="text-[10px] text-[#9CA3AF]">
                                        ID: {student.asaasCustomerId.slice(0, 10)}...
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex flex-col items-end gap-2 ml-4">
                                <span className={`text-[10px] font-medium ${student.accessAuthorized ? 'text-green-400' : 'text-red-400'}`}>
                                  {student.accessAuthorized ? 'AUTORIZADO' : 'BLOQUEADO'}
                                </span>
                                <Button
                                  variant={student.accessAuthorized ? 'destructive' : 'secondary'}
                                  size="sm"
                                  onClick={() => handleToggleAccess(student.id, student.accessAuthorized, student.manualAuthorization)}
                                  className="h-8 py-0 px-3 text-xs"
                                >
                                  {student.accessAuthorized ? 'Desautorizar' : 'Autorizar'}
                                </Button>
                              </div>
                            </div>
                          </Card>
                        );
                      })
                  )}
                </div>

                {/* Stats Summary */}
                {!isLoadingStudents && students.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/[0.06]">
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
              title="Configurações Padrão de Aulas"
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
                      className="w-full bg-white/[0.02] border border-white/[0.06] text-[#F3F4F6] px-4 py-3 rounded-xl focus:outline-none focus:border-[#FF6A00] transition-colors"
                    >
                      <option value="private">Privado</option>
                      <option value="public">Público</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#9CA3AF]">Critério de Conclusão (%)</label>
                    <Input
                      type="number"
                      value={courseDefaults.completionCriteria}
                      onChange={(e) => setCourseDefaults({...courseDefaults, completionCriteria: parseInt(e.target.value)})}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#9CA3AF]">Tamanho Máx. de Mídia (MB)</label>
                    <Input
                      type="number"
                      value={courseDefaults.maxMediaSize}
                      onChange={(e) => setCourseDefaults({...courseDefaults, maxMediaSize: parseInt(e.target.value)})}
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
                    <Input
                      type="number"
                      value={xpValues.courseCompletion}
                      onChange={(e) => setXpValues({...xpValues, courseCompletion: parseInt(e.target.value)})}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#9CA3AF]">XP por Mindful Flow</label>
                    <Input
                      type="number"
                      value={xpValues.mindfulFlow}
                      onChange={(e) => setXpValues({...xpValues, mindfulFlow: parseInt(e.target.value)})}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#9CA3AF]">XP por Upload de Mídia</label>
                    <Input
                      type="number"
                      value={xpValues.mediaUpload}
                      onChange={(e) => setXpValues({...xpValues, mediaUpload: parseInt(e.target.value)})}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#9CA3AF]">XP por Presença Perfeita</label>
                    <Input
                      type="number"
                      value={xpValues.perfectAttendance}
                      onChange={(e) => setXpValues({...xpValues, perfectAttendance: parseInt(e.target.value)})}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#9CA3AF]">Nível Máximo</label>
                    <Input
                      type="number"
                      value={levelCap}
                      onChange={(e) => setLevelCap(parseInt(e.target.value))}
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
                  <Card key={achievement.id} className="p-4">
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
                  </Card>
                ))}
                <Button variant="secondary" className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Nova Conquista
                </Button>
              </div>
            </SettingSection>
          </>
        )}
      </div>


    </div>
  );
};

// Remove separate definitions since they are now imported
export default Settings;
