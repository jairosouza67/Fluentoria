import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import StudentDashboard from './components/StudentDashboard';
import AdminCatalog from './components/AdminCatalog';
import Students from './components/Students';
import Reports from './components/Reports';
import Settings from './components/Settings';
import Help from './components/Help';
import Auth from './components/Auth';
import CourseList from './components/CourseList';
import CourseDetail from './components/CourseDetail';
import DailyContact from './components/DailyContact';
import MindfulFlowList from './components/MindfulFlowList';
import MusicList from './components/MusicList';
import Profile from './components/Profile';
import Achievements from './components/Achievements';
import Leaderboard from './components/Leaderboard';
import AttendanceTracker from './components/AttendanceTracker';
import { ViewMode, Screen } from './types';
import { Eye, Loader2, ChevronDown, User as UserIcon, LogOut as LogOutIcon } from 'lucide-react';
import { auth } from './lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import MobileNav from './components/MobileNav';
import { Course, getUserRole, forceUpdateUserRole } from './lib/db';
import { DailyContact as DailyContactType } from './lib/db';

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('student');
  const [currentScreen, setCurrentScreen] = useState<Screen>('auth');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedDaily, setSelectedDaily] = useState<DailyContactType | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'student'>('student');
  const [roleLoaded, setRoleLoaded] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        console.log('User logged in:', currentUser.email);
        
        // Only load role once per session
        if (!roleLoaded || user?.uid !== currentUser.uid) {
          // Force update role if admin email (ensures admin always has correct role)
          if (currentUser.email === 'jairosouza67@gmail.com') {
            await forceUpdateUserRole(currentUser.uid, currentUser.email);
          }
          
          // Get user role from Firestore
          const role = await getUserRole(currentUser.uid);
          setUserRole(role);
          setRoleLoaded(true);
          console.log('User role loaded:', role, 'for user:', currentUser.email);
        }
        
        setUser(currentUser);
        
        // Only redirect to dashboard if currently on auth screen
        if (currentScreen === 'auth') {
          setCurrentScreen('dashboard');
        }
      } else {
        console.log('User logged out');
        setUser(null);
        setUserRole('student');
        setRoleLoaded(false);
        setViewMode('student');
        setCurrentScreen('auth');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentScreen, user, roleLoaded]);

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };

    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileMenu]);

  // Navegação simples baseada em estado
  const navigateTo = (screen: Screen) => {
    setCurrentScreen(screen);
    window.scrollTo(0, 0);
  };

  const handleLogin = () => {
    // Handled by onAuthStateChanged
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // State update handled by onAuthStateChanged
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const toggleViewMode = () => {
    // Only allow admin users to toggle
    if (userRole !== 'admin') {
      alert('Acesso negado. Apenas administradores podem acessar esta área.');
      return;
    }
    
    if (viewMode === 'student') {
      setViewMode('admin');
      setCurrentScreen('admin-reports');
    } else {
      setViewMode('student');
      setCurrentScreen('dashboard');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#FF6A00]" size={48} />
      </div>
    );
  }

  if (!user || currentScreen === 'auth') {
    return <Auth onLogin={handleLogin} />;
  }

  const renderScreen = () => {
    if (viewMode === 'admin') {
      // Admin screens
      switch (currentScreen) {
        case 'admin-catalog':
          return <AdminCatalog />;
        case 'admin-students':
          return <Students />;
        case 'admin-reports':
          return <Reports />;
        case 'admin-settings':
          return <Settings />;
        case 'admin-help':
          return <Help />;
        default:
          return <Reports />;
      }
    }

    // Modos Student
    switch (currentScreen) {
      case 'dashboard':
        return <StudentDashboard onNavigate={navigateTo} />;
      case 'courses':
        return <CourseList onNavigate={navigateTo} onSelectCourse={setSelectedCourse} />;
      case 'course-detail':
        return <CourseDetail onBack={() => navigateTo('courses')} course={selectedCourse} />;
      case 'daily':
        return <DailyContact onSelectDaily={(daily) => { setSelectedDaily(daily); navigateTo('daily-detail'); }} selectedDaily={null} />;
      case 'daily-detail':
        return <DailyContact onBack={() => { setSelectedDaily(null); navigateTo('daily'); }} selectedDaily={selectedDaily} />;
      case 'mindful':
        return <MindfulFlowList onNavigate={navigateTo} onSelectCourse={setSelectedCourse} />;
      case 'mindful-detail':
        return <CourseDetail onBack={() => navigateTo('mindful')} course={selectedCourse} />;
      case 'music':
        return <MusicList onNavigate={navigateTo} onSelectCourse={setSelectedCourse} />;
      case 'music-detail':
        return <CourseDetail onBack={() => navigateTo('music')} course={selectedCourse} />;
      case 'profile':
        return <Profile />;
      case 'achievements':
        return user ? <Achievements studentId={user.uid} /> : null;
      case 'leaderboard':
        return user ? <Leaderboard currentUserId={user.uid} /> : null;
      case 'attendance':
        return user ? <AttendanceTracker studentId={user.uid} studentName={user.displayName || user.email || 'Student'} /> : null;
      default:
        return <StudentDashboard onNavigate={navigateTo} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-[#F3F4F6] font-sans flex flex-col md:flex-row">
      <Sidebar
        viewMode={viewMode}
        currentScreen={currentScreen}
        onNavigate={navigateTo}
        onLogout={handleLogout}
        user={user}
      />

      <main className="w-full min-h-screen relative pb-20 md:pb-0 md:pl-64 transition-all duration-300">
        {/* Top Header with Avatar - Mobile and Desktop */}
        <div className="sticky top-0 z-40 bg-[#0B0B0B]/95 backdrop-blur-xl border-b border-white/[0.06] px-4 md:px-8 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#F3F4F6]">
                {currentScreen === 'dashboard' && 'Dashboard'}
                {currentScreen === 'courses' && 'Cursos'}
                {currentScreen === 'course-detail' && 'Detalhes do Curso'}
                {currentScreen === 'daily' && 'Daily Contact'}
                {currentScreen === 'daily-detail' && 'Daily Contact'}
                {currentScreen === 'mindful' && 'Mindful Flow'}
                {currentScreen === 'mindful-detail' && 'Mindful Flow'}
                {currentScreen === 'music' && 'Músicas'}
                {currentScreen === 'music-detail' && 'Músicas'}
                {currentScreen === 'achievements' && 'Conquistas e Ranking'}
                {currentScreen === 'attendance' && 'Presença'}
                {currentScreen === 'profile' && 'Perfil'}
                {currentScreen === 'admin-catalog' && 'Catálogo de Aulas'}
                {currentScreen === 'admin-students' && 'Alunos'}
                {currentScreen === 'admin-reports' && 'Dashboard'}
                {currentScreen === 'admin-settings' && 'Configurações'}
                {currentScreen === 'admin-help' && 'Ajuda'}
              </h2>
            </div>
            
            {/* Avatar with Dropdown Menu */}
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] hover:border-[#FF6A00]/50 transition-all duration-200 group"
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden ring-2 ring-white/10 group-hover:ring-[#FF6A00] transition-all duration-200">
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#FF6A00] to-[#E15B00] flex items-center justify-center text-white text-sm font-bold">
                      {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                    </div>
                  )}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-semibold text-[#F3F4F6] group-hover:text-[#FF6A00] transition-colors">
                    {user?.displayName || 'Usuário'}
                  </p>
                  <p className="text-xs text-[#9CA3AF]">
                    {viewMode === 'student' ? 'Aluno' : 'Admin'}
                  </p>
                </div>
                <ChevronDown className={`w-4 h-4 text-[#9CA3AF] transition-transform duration-200 ${showProfileMenu ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-[#111111] border border-white/[0.1] rounded-xl shadow-elevated overflow-hidden animate-fade-in">
                  <div className="p-4 border-b border-white/[0.06]">
                    <p className="text-sm font-semibold text-[#F3F4F6]">{user?.displayName || 'Usuário'}</p>
                    <p className="text-xs text-[#9CA3AF] mt-1">{user?.email}</p>
                  </div>
                  
                  <div className="py-2">
                    <button
                      onClick={() => {
                        navigateTo('profile');
                        setShowProfileMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-[#F3F4F6] hover:bg-white/[0.05] transition-colors"
                    >
                      <UserIcon className="w-5 h-5 text-[#FF6A00]" />
                      <span className="text-sm">Perfil</span>
                    </button>
                  </div>
                  
                  <div className="p-2 border-t border-white/[0.06]">
                    <button
                      onClick={() => {
                        handleLogout();
                        setShowProfileMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <LogOutIcon className="w-5 h-5" />
                      <span className="text-sm font-medium">Sair</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {renderScreen()}

        {/* Floating Toggle Button - Only visible for admin users */}
        {userRole === 'admin' && (
          <div className="fixed bottom-24 md:bottom-6 right-6 z-50 flex flex-col items-end gap-2">
            <div className="bg-[#111111] border border-white/[0.06] text-[#9CA3AF] text-xs py-1 px-3 rounded-lg shadow-card mb-1 pointer-events-none">
              Modo: {viewMode === 'student' ? 'Aluno' : 'Admin'}
            </div>
            <button
              onClick={toggleViewMode}
              className="bg-[#FF6A00] text-white p-4 rounded-full shadow-elevated hover:bg-[#E15B00] hover:-translate-y-0.5 transition-all duration-200 hover:shadow-[0_8px_24px_rgba(255,106,0,0.12)] flex items-center justify-center"
              title="Alternar entre visão de Aluno e Admin"
            >
              <Eye size={24} />
            </button>
          </div>
        )}
      </main>

      <MobileNav currentScreen={currentScreen} onNavigate={navigateTo} />
    </div>
  );
};

export default App;
