import React, { useState, useEffect } from 'react';
import { Camera, Mail, User, LogOut, Award, Clock, Zap, Edit2, Check, X, Trash2 } from 'lucide-react';
import { UserStats } from '../types';
import { auth } from '../lib/firebase';
import { getStudentProgress, createStudentProgress } from '../lib/gamification';
import { signOut } from 'firebase/auth';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Input } from './ui/Input';
import { PageHeader } from './ui/PageHeader';

const Profile: React.FC = () => {
  const user = auth.currentUser;
  const [studentProgress, setStudentProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProgress();
    
    // Auto-refresh progress every 10 seconds
    const interval = setInterval(loadProgress, 10000);
    return () => clearInterval(interval);
  }, [user]);

  const loadProgress = async () => {
    if (!user) return;

    let progress = await getStudentProgress(user.uid);

    if (!progress) {
      // Create initial progress if doesn't exist
      await createStudentProgress(
        user.uid,
        user.displayName || user.email || 'Student',
        user.email || ''
      );
      progress = await getStudentProgress(user.uid);
    }

    setStudentProgress(progress);
    setLoading(false);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleNameEdit = () => {
    setNewName(userName);
    setEditingName(true);
  };

  const handleNameSave = async () => {
    if (!user || !newName.trim()) return;
    
    setSaving(true);
    try {
      const { updateProfile } = await import('firebase/auth');
      await updateProfile(user, {
        displayName: newName.trim()
      });
      
      // Also update in student progress
      const { updateDoc, doc } = await import('firebase/firestore');
      const { db } = await import('../lib/firebase');
      await updateDoc(doc(db, 'student_progress', user.uid), {
        studentName: newName.trim()
      });
      
      setEditingName(false);
      await loadProgress();
    } catch (error) {
      console.error("Error updating name:", error);
      alert('Erro ao atualizar nome. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoChange = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file || !user) return;
      
      setSaving(true);
      try {
        // Upload to Firebase Storage
        const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
        const { storage } = await import('../lib/firebase');
        
        const storageRef = ref(storage, `profile_photos/${user.uid}`);
        await uploadBytes(storageRef, file);
        const photoURL = await getDownloadURL(storageRef);
        
        // Update auth profile
        const { updateProfile } = await import('firebase/auth');
        await updateProfile(user, { photoURL });
        
        await loadProgress();
      } catch (error) {
        console.error("Error updating photo:", error);
        alert('Erro ao atualizar foto. Tente novamente.');
      } finally {
        setSaving(false);
      }
    };
    
    input.click();
  };

  const handlePhotoRemove = async () => {
    if (!user) return;
    
    const confirmed = window.confirm('Deseja remover sua foto de perfil?');
    if (!confirmed) return;
    
    setSaving(true);
    try {
      // Remove photo from auth profile
      const { updateProfile } = await import('firebase/auth');
      await updateProfile(user, { photoURL: null });
      
      // Try to delete from storage (ignore if doesn't exist)
      try {
        const { ref, deleteObject } = await import('firebase/storage');
        const { storage } = await import('../lib/firebase');
        const storageRef = ref(storage, `profile_photos/${user.uid}`);
        await deleteObject(storageRef);
      } catch (storageError) {
        // Ignore storage errors
      }
      
      await loadProgress();
    } catch (error) {
      console.error("Error removing photo:", error);
      alert('Erro ao remover foto. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  // User display data
  const userName = user?.displayName || user?.email?.split('@')[0] || 'Usuário';
  const userEmail = user?.email || '';
  const userPhoto = user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=FF6A00&color=fff&size=128`;

  // Stats from student progress
  const stats: UserStats = {
    completedCourses: studentProgress?.totalCoursesCompleted || 0,
    hoursStudied: studentProgress?.totalHoursStudied || 0,
    streakDays: studentProgress?.currentStreak || 0
  };

  if (loading) {
    return (
      <div className="p-8 max-w-5xl mx-auto space-y-10">
        <h1 className="text-3xl font-bold text-white">Meu Perfil</h1>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-10">
      <PageHeader 
        title="Meu Perfil"
        description="Gerencie suas informações e acompanhe seu progresso"
      />

      <div className="flex flex-col md:flex-row gap-8">
        {/* Left Column: Avatar & Stats - Mobile: Second, Desktop: First */}
        <div className="w-full md:w-1/3 space-y-6 order-2 md:order-1">
          <Card className="text-center space-y-4">
            <div className="relative w-28 h-28 mx-auto group/avatar">
              <img 
                src={userPhoto}
                alt="Profile" 
                className="w-full h-full rounded-full border-4 border-stone-800 object-cover"
                referrerPolicy="no-referrer"
              />
              <button 
                onClick={handlePhotoChange}
                disabled={saving}
                className="absolute bottom-0 right-0 bg-orange-500 p-2 rounded-full text-white hover:bg-orange-600 transition-colors border border-[#111111] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                title="Alterar foto"
              >
                <Camera size={16} />
              </button>
              {user?.photoURL && (
                <button 
                  onClick={handlePhotoRemove}
                  disabled={saving}
                  className="absolute bottom-0 left-0 bg-red-600 p-2 rounded-full text-white hover:bg-red-700 transition-all border border-[#111111] disabled:opacity-50 disabled:cursor-not-allowed opacity-0 group-hover/avatar:opacity-100 shadow-lg"
                  title="Remover foto"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{userName}</h2>
              <p className="text-sm text-stone-500">{userEmail}</p>
              {studentProgress && (
                <p className="text-xs text-orange-400 mt-2">Nível {studentProgress.currentLevel} • {studentProgress.currentXP} XP</p>
              )}
            </div>
          </Card>

          <Card className="space-y-4">
            <h3 className="text-sm font-semibold text-stone-400 uppercase tracking-wider mb-4">Estatísticas</h3>
            
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded bg-blue-900/30 text-blue-400 flex items-center justify-center">
                <Award size={20} />
              </div>
              <div>
                <p className="text-lg font-bold text-white">{stats.completedCourses}</p>
                <p className="text-xs text-stone-500">Aulas Completos</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded bg-purple-900/30 text-purple-400 flex items-center justify-center">
                <Clock size={20} />
              </div>
              <div>
                <p className="text-lg font-bold text-white">{stats.hoursStudied}h</p>
                <p className="text-xs text-stone-500">Tempo de Estudo</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded bg-orange-900/30 text-orange-400 flex items-center justify-center">
                <Zap size={20} />
              </div>
              <div>
                <p className="text-lg font-bold text-white">{stats.streakDays} dias</p>
                <p className="text-xs text-stone-500">Ofensiva Atual</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Settings Form - Mobile: First, Desktop: Second */}
        <div className="flex-1 bg-gradient-to-br from-[#111111] to-[#0b0b0b] border border-white/[0.06] rounded-xl p-8 order-1 md:order-2 shadow-2xl">
          <div className="flex items-center gap-4 mb-8 pb-6 border-b border-white/[0.06]">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
              <User className="text-white" size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">Informações Pessoais</h3>
              <p className="text-xs text-stone-500 mt-0.5">Gerencie seus dados pessoais</p>
            </div>
          </div>
          
          <form className="space-y-8">
            {/* Nome Completo - Full Width */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center gap-2">
                <span className="w-1 h-3 bg-orange-500 rounded-full"></span>
                Nome Completo
              </label>
              <div className="relative">
                {editingName ? (
                  <div className="flex gap-2">
                    <Input 
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Digite seu nome completo"
                      icon={<User size={18} className="text-orange-400" />}
                      autoFocus
                    />
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        onClick={handleNameSave}
                        disabled={saving || !newName.trim()}
                        isLoading={saving}
                        className="p-2 h-auto"
                        title="Salvar"
                      >
                        <Check size={16} />
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setEditingName(false)}
                        disabled={saving}
                        className="p-2 h-auto"
                        title="Cancelar"
                      >
                        <X size={16} />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="relative group">
                    <Input 
                      value={userName} 
                      readOnly
                      icon={<User size={18} className="text-stone-600 group-hover:text-orange-400" />}
                    />
                    <button
                      type="button"
                      onClick={handleNameEdit}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1.5 text-stone-500 hover:text-orange-400 transition-all flex items-center justify-center group/btn"
                      title="Editar nome"
                    >
                      <Edit2 size={14} className="group-hover/btn:scale-110 transition-transform" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Nível Atual - Full Width */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center gap-2">
                <span className="w-1 h-3 bg-orange-500 rounded-full"></span>
                Nível Atual
              </label>
              <div className="relative group">
                <Input 
                  value={studentProgress ? `Nível ${studentProgress.currentLevel}` : 'Carregando...'} 
                  readOnly
                  icon={
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
                      <Award className="text-white" size={15} />
                    </div>
                  }
                  className="font-bold bg-gradient-to-r from-[#0a0908] to-[#111111]"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center gap-2">
                <span className="w-1 h-3 bg-orange-500 rounded-full"></span>
                Email
              </label>
              <Input 
                type="email" 
                value={userEmail} 
                readOnly
                icon={<Mail size={18} className="text-stone-600 group-hover:text-orange-400" />}
              />
            </div>

            <div className="pt-6 mt-6 border-t border-white/[0.06]">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <button 
                  type="button" 
                  onClick={handleLogout}
                  className="text-red-500 hover:text-red-400 text-sm flex items-center gap-2 font-semibold transition-colors group"
                >
                  <LogOut size={18} className="group-hover:-translate-x-0.5 transition-transform" />
                  Sair da Conta
                </button>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.02] rounded-lg border border-white/[0.06]">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-xs text-stone-400">Online</span>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
