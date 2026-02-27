import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import StudentDashboard from './components/StudentDashboard';
import AdminCatalog from './components/AdminCatalog';
import Students from './components/Students';
import Reports from './components/Reports';
import FinancialReports from './components/FinancialReports';
import Settings from './components/Settings';
import Auth from './components/Auth';
import CourseList from './components/CourseList';
import GalleryList from './components/GalleryList';
import CourseDetail from './components/CourseDetail';
import ModuleSelection from './components/ModuleSelection';
// import DailyContact from './components/DailyContact';
import MindfulFlowList from './components/MindfulFlowList';
import MusicList from './components/MusicList';
import Profile from './components/Profile';
import Achievements from './components/Achievements';
import Leaderboard from './components/Leaderboard';
import AttendanceTracker from './components/AttendanceTracker';

import { ViewMode, Screen } from './types';
import { Eye, Loader2, User as UserIcon, LogOut as LogOutIcon } from 'lucide-react';
import { auth } from './lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import MobileNav from './components/MobileNav';
import { Course, CourseModule, CourseGallery, getUserRole, forceUpdateUserRole, checkUserAccess } from './lib/db';
// import { DailyContact as DailyContactType } from './lib/db';

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('student');
  const [currentScreen, setCurrentScreen] = useState<Screen>('auth');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedGallery, setSelectedGallery] = useState<CourseGallery | null>(null);
  const [selectedModule, setSelectedModule] = useState<CourseModule | null>(null);
  // const [selectedDaily, setSelectedDaily] = useState<DailyContactType | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'student'>('student');
  const [roleLoaded, setRoleLoaded] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [accessChecked, setAccessChecked] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string>('pending');
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {

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
          
          // Check user access authorization
          const accessInfo = await checkUserAccess(currentUser.uid);
          setHasAccess(accessInfo.authorized);
          setPaymentStatus(accessInfo.paymentStatus || 'pending');
          setAccessChecked(true);
        }

        setUser(currentUser);

        // Only redirect to dashboard if currently on auth
        if (currentScreen === 'auth') {
          setCurrentScreen('dashboard');
        }
      } else {
        setUser(null);
        setUserRole('student');
        setRoleLoaded(false);
        setHasAccess(false);
        setAccessChecked(false);
        setPaymentStatus('pending');
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

  // Handle PWA shortcuts
  useEffect(() => {
    if (!user) return; // Only handle shortcuts for logged-in users

    const params = new URLSearchParams(window.location.search);
    const shortcut = params.get('shortcut');

    if (shortcut) {
      console.log('[PWA Shortcut] Detected shortcut:', shortcut);
      
      // Map shortcut to screen
      const shortcutMap: Record<string, Screen> = {
        'dashboard': 'dashboard',
        'courses': 'courses',
        // 'daily': 'daily', // Daily Contact disabled
        'achievements': 'achievements'
      };

      const targetScreen = shortcutMap[shortcut];
      if (targetScreen) {
        setCurrentScreen(targetScreen);
        // Clean URL without reloading
        window.history.replaceState({}, '', '/');
      }
    }
  }, [user]);

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

  // Block access for unauthorized users (unless admin)
  if (accessChecked && !hasAccess && userRole !== 'admin') {
    return (
      <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[-10%] left-[-5%] w-[35%] h-[35%] bg-[#FF6A00]/15 rounded-full blur-[120px] animate-float" />
            <div className="absolute bottom-[-10%] right-[-5%] w-[35%] h-[35%] bg-[#E15B00]/15 rounded-full blur-[120px] animate-float" style={{ animationDelay: '2s' }} />
          </div>

          <div className="relative bg-[#0B0B0B]/70 backdrop-blur-3xl rounded-3xl p-8 border border-white/[0.2] shadow-2xl">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#FF6A00]/20 to-[#E15B00]/20 flex items-center justify-center border border-[#FF6A00]/30">
                <svg className="w-10 h-10 text-[#FF6A00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-center text-[#F3F4F6] mb-3">
              Acesso Pendente
            </h2>

            {/* Message */}
            <p className="text-center text-[#9CA3AF] mb-6 leading-relaxed">
              Sua conta foi criada com sucesso, mas o acesso ao conteúdo está pendente de autorização.
            </p>

            {/* Status */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-[#9CA3AF]">Status:</span>
                <span className="text-sm font-medium text-orange-400 capitalize">{paymentStatus}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#9CA3AF]">Email:</span>
                <span className="text-sm font-medium text-[#F3F4F6]">{user?.email}</span>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-gradient-to-r from-[#FF6A00]/10 to-transparent border border-[#FF6A00]/20 rounded-xl p-4 mb-6">
              <h3 className="text-sm font-semibold text-[#FF6A00] mb-2">Como obter acesso?</h3>
              <ul className="space-y-2 text-sm text-[#9CA3AF]">
                <li className="flex items-start gap-2">
                  <span className="text-[#FF6A00] mt-0.5">•</span>
                  <span>Realize o pagamento através do Asaas</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#FF6A00] mt-0.5">•</span>
                  <span>Aguarde a aprovação manual do administrador</span>
                </li>
              </ul>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="w-full bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] text-[#F3F4F6] py-3 rounded-xl transition-all font-medium flex items-center justify-center gap-2"
            >
              <LogOutIcon className="w-5 h-5" />
              Sair
            </button>
          </div>
        </div>
      </div>
    );
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
        case 'admin-financial':
          return <FinancialReports />;
        default:
          return <Reports />;
      }
    }

    // Modos Student
    switch (currentScreen) {
      case 'dashboard':
        return <StudentDashboard onNavigate={navigateTo} />;
      case 'courses':
        return <CourseList onNavigate={navigateTo} onSelectCourse={(course) => {
          setSelectedCourse(course);
          navigateTo('gallery');
        }} />;
      case 'gallery':
        return <GalleryList 
          onNavigate={navigateTo}
          onSelectGallery={(gallery, course) => {
            setSelectedGallery(gallery);
            setSelectedCourse(course);
            navigateTo('module-selection');
          }}
        />;
      case 'module-selection':
        return <ModuleSelection 
          onBack={() => navigateTo('gallery')} 
          course={selectedCourse}
          gallery={selectedGallery}
          onSelectModule={(module) => {
            setSelectedModule(module);
            navigateTo('course-detail');
          }}
        />;
      case 'course-detail':
        return <CourseDetail 
          onBack={() => navigateTo('module-selection')} 
          course={selectedCourse}
          selectedModule={selectedModule}
        />;
      // Daily Contact disabled
      // case 'daily':
      //   return <DailyContact onSelectDaily={(daily) => { setSelectedDaily(daily); navigateTo('daily-detail'); }} selectedDaily={null} />;
      // case 'daily-detail':
      //   return <DailyContact onBack={() => { setSelectedDaily(null); navigateTo('daily'); }} selectedDaily={selectedDaily} />;
      case 'mindful':
        return <MindfulFlowList onNavigate={navigateTo} onSelectCourse={(course) => {
          setSelectedCourse(course);
          navigateTo('mindful-detail');
        }} />;
      case 'mindful-detail':
        return <CourseDetail 
          onBack={() => navigateTo('mindful')} 
          course={selectedCourse}
          selectedModule={null}
        />;
      case 'music':
        return <MusicList onNavigate={navigateTo} onSelectCourse={(course) => {
          setSelectedCourse(course);
          navigateTo('music-detail');
        }} />;
      case 'music-detail':
        return <CourseDetail 
          onBack={() => navigateTo('music')} 
          course={selectedCourse}
          selectedModule={null}
        />;
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
    <div className="min-h-screen bg-[#0B0B0B] text-[#F3F4F6] font-sans flex flex-col md:flex-row relative">
      {/* Background Overlay */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B0B0B]/80 via-[#0B0B0B]/60 to-[#0B0B0B]/90 z-10" />
        <div
          className="absolute inset-0 opacity-40 mix-blend-overlay"
          style={{
            backgroundImage: 'url(/app-bg.png)',
            backgroundRepeat: 'repeat',
            backgroundSize: '30%'
          }}
        />
      </div>

      <Sidebar
        viewMode={viewMode}
        currentScreen={currentScreen}
        onNavigate={navigateTo}
        onLogout={handleLogout}
        user={user}
      />

      <main className="w-full min-h-screen relative z-10 pb-20 md:pb-0 md:pl-64 transition-all duration-300 pt-20">
        {/* Top Header with Avatar - Mobile and Desktop */}
        <div className="absolute top-0 left-0 w-full z-40 px-4 md:px-8 py-4 pointer-events-none">
          <div className="max-w-7xl mx-auto flex items-center justify-end pointer-events-auto">
            {/* Title removed as per request */}

            {/* Avatar with Dropdown Menu */}
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="relative group focus:outline-none"
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden ring-2 ring-white/10 group-hover:ring-[#FF6A00] transition-all duration-200 shadow-lg">
                  {user?.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt="User" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        // Hide image on error to show fallback
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : null}
                  {/* Fallback initial - always rendered but behind image */}
                  <div className={`absolute inset-0 bg-gradient-to-br from-[#FF6A00] to-[#E15B00] flex items-center justify-center text-white text-sm font-bold ${user?.photoURL ? 'z-[-1]' : ''}`}>
                    {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                  </div>
                </div>
              </button>

              {/* Dropdown Menu */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-[#111111]/95 backdrop-blur-xl border border-white/[0.08] rounded-lg shadow-2xl overflow-hidden animate-fade-in">
                  {/* User Info Header */}
                  <div className="px-4 py-3 border-b border-white/[0.06]">
                    <p className="text-sm font-medium text-[#F3F4F6] truncate">{user?.displayName || 'Usuário'}</p>
                    <p className="text-xs text-[#9CA3AF] truncate">{user?.email}</p>
                  </div>

                  {/* Menu Items - Compact List Style */}
                  <div className="py-1">
                    <button
                      onClick={() => {
                        navigateTo('profile');
                        setShowProfileMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-white/[0.04] transition-all duration-150"
                    >
                      <UserIcon className="w-4 h-4" />
                      <span className="text-sm">Perfil</span>
                    </button>

                    <div className="border-t border-white/[0.04] my-1" />

                    <button
                      onClick={() => {
                        handleLogout();
                        setShowProfileMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-red-400/80 hover:text-red-400 hover:bg-red-500/5 transition-all duration-150"
                    >
                      <LogOutIcon className="w-4 h-4" />
                      <span className="text-sm">Sair</span>
                    </button>
                  </div>

                  {/* Mode Indicator Footer */}
                  <div className="px-4 py-1.5 bg-white/[0.02] border-t border-white/[0.06]">
                    <span className="text-[10px] text-[#9CA3AF]/60 uppercase tracking-wider">
                      Modo: {viewMode === 'student' ? 'Aluno' : 'Admin'}
                    </span>
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

      <MobileNav currentScreen={currentScreen} onNavigate={navigateTo} viewMode={viewMode} />
    </div>
  );
};

export default App;