import React, { useEffect, useRef, Suspense, useState } from 'react';
import Sidebar from './components/Sidebar';
import Auth from './components/Auth';
import ErrorBoundary from './components/ErrorBoundary';

// Lazy-loaded route components (Phase 5 - Code Splitting)
const StudentDashboard = React.lazy(() => import('./components/StudentDashboard'));
const AdminCatalog = React.lazy(() => import('./components/AdminCatalog'));
const Students = React.lazy(() => import('./components/Students'));
const Reports = React.lazy(() => import('./components/Reports'));
const FinancialReports = React.lazy(() => import('./components/FinancialReports'));
const Settings = React.lazy(() => import('./components/Settings'));
const CourseList = React.lazy(() => import('./components/CourseList'));
const GalleryList = React.lazy(() => import('./components/GalleryList'));
const CourseDetail = React.lazy(() => import('./components/CourseDetail'));
const ModuleSelection = React.lazy(() => import('./components/ModuleSelection'));
const MindfulFlowList = React.lazy(() => import('./components/MindfulFlowList'));
const MusicList = React.lazy(() => import('./components/MusicList'));
const Profile = React.lazy(() => import('./components/Profile'));
const Achievements = React.lazy(() => import('./components/Achievements'));
const Leaderboard = React.lazy(() => import('./components/Leaderboard'));
const AttendanceTracker = React.lazy(() => import('./components/AttendanceTracker'));

import { Screen } from './types';
import { Eye, Loader2, User as UserIcon, LogOut as LogOutIcon } from 'lucide-react';
import { auth } from './lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import MobileNav from './components/MobileNav';
import { getUserRole, forceUpdateUserRole, checkUserAccess, isAdminEmail } from './lib/db';
import { useAppStore } from './lib/stores/appStore';
import { useCourseStore } from './lib/stores/courseStore';

// Loading fallback for Suspense
const LoadingSpinner = () => (
  <div className="min-h-[400px] flex items-center justify-center">
    <Loader2 className="animate-spin text-[#FF6A00]" size={32} />
  </div>
);

const App: React.FC = () => {
  const [immersiveNavState, setImmersiveNavState] = useState({ active: false, visible: true });

  // --- Zustand stores ---
  const {
    user, setUser,
    userRole, setUserRole,
    roleLoaded, setRoleLoaded,
    hasAccess, setHasAccess,
    accessChecked, setAccessChecked,
    paymentStatus, setPaymentStatus,
    loading, setLoading,
    currentScreen, setCurrentScreen,
    viewMode,
    showProfileMenu, setShowProfileMenu,
    navigateTo,
    toggleViewMode,
  } = useAppStore();

  const {
    selectedCourse, setSelectedCourse,
    selectedGallery, setSelectedGallery,
    selectedModule, setSelectedModule,
  } = useCourseStore();

  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {

        // Only load role once per session
        if (!roleLoaded || user?.uid !== currentUser.uid) {
          // Force update role if admin email (ensures admin always has correct role)
          if (currentUser.email && isAdminEmail(currentUser.email)) {
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
        useAppStore.getState().setViewMode('student');
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
    if (!user) return;

    const params = new URLSearchParams(window.location.search);
    const shortcut = params.get('shortcut');

    if (shortcut) {
      console.log('[PWA Shortcut] Detected shortcut:', shortcut);
      
      const shortcutMap: Record<string, Screen> = {
        'dashboard': 'dashboard',
        'courses': 'courses',
        'achievements': 'achievements'
      };

      const targetScreen = shortcutMap[shortcut];
      if (targetScreen) {
        setCurrentScreen(targetScreen);
        window.history.replaceState({}, '', '/');
      }
    }
  }, [user]);

  useEffect(() => {
    const handleImmersiveNavVisibility = (event: Event) => {
      const customEvent = event as CustomEvent<{ active: boolean; visible: boolean }>;
      if (!customEvent.detail) return;

      setImmersiveNavState({
        active: Boolean(customEvent.detail.active),
        visible: Boolean(customEvent.detail.visible)
      });
    };

    window.addEventListener('immersive-nav-visibility', handleImmersiveNavVisibility as EventListener);

    return () => {
      window.removeEventListener('immersive-nav-visibility', handleImmersiveNavVisibility as EventListener);
    };
  }, []);

  const handleLogin = () => {
    // Handled by onAuthStateChanged
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
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
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[-10%] left-[-5%] w-[35%] h-[35%] bg-[#FF6A00]/15 rounded-full blur-[120px] animate-float" />
            <div className="absolute bottom-[-10%] right-[-5%] w-[35%] h-[35%] bg-[#E15B00]/15 rounded-full blur-[120px] animate-float" style={{ animationDelay: '2s' }} />
          </div>

          <div className="relative bg-[#0B0B0B]/70 backdrop-blur-3xl rounded-3xl p-8 border border-white/[0.2] shadow-2xl">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#FF6A00]/20 to-[#E15B00]/20 flex items-center justify-center border border-[#FF6A00]/30">
                <svg className="w-10 h-10 text-[#FF6A00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-center text-[#F3F4F6] mb-3">
              Acesso Pendente
            </h2>

            <p className="text-center text-[#9CA3AF] mb-6 leading-relaxed">
              Sua conta foi criada com sucesso, mas o acesso ao conteúdo está pendente de autorização.
            </p>

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

  // Top-level screens that should clear course context when navigated to (e.g. from sidebar)
  const TOP_LEVEL_SCREENS: Screen[] = ['dashboard', 'courses', 'mindful', 'music', 'achievements', 'leaderboard', 'attendance', 'profile'];

  const handleNavigate = (screen: Screen) => {
    // Clear course context when navigating to top-level screens (sidebar navigation)
    if (TOP_LEVEL_SCREENS.includes(screen)) {
      setSelectedCourse(null);
      setSelectedGallery(null);
      setSelectedModule(null);
    }
    navigateTo(screen);
  };

  const renderScreen = () => {
    if (viewMode === 'admin') {
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
          selectedCourse={selectedCourse}
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
          key={selectedCourse?.id || 'no-course'}
          onBack={() => navigateTo('module-selection')} 
          course={selectedCourse}
          selectedModule={selectedModule}
        />;
      case 'mindful':
        return <MindfulFlowList onNavigate={navigateTo} courseId={selectedCourse?.id} onSelectCourse={(course) => {
          setSelectedCourse(course);
          navigateTo('mindful-detail');
        }} />;
      case 'mindful-detail':
        return <CourseDetail 
          key={selectedCourse?.id || 'no-course'}
          onBack={() => navigateTo('mindful')} 
          course={selectedCourse}
          selectedModule={null}
        />;
      case 'music':
        return <MusicList onNavigate={navigateTo} courseId={selectedCourse?.id} onSelectCourse={(course) => {
          setSelectedCourse(course);
          navigateTo('music-detail');
        }} />;
      case 'music-detail':
        return <CourseDetail 
          key={selectedCourse?.id || 'no-course'}
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
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        user={user}
      />

      <main className="w-full min-h-screen relative z-10 pb-20 md:pb-0 md:pl-64 transition-all duration-300 pt-20">
        {/* Top Header with Avatar */}
        <div className="absolute top-0 left-0 w-full z-40 px-4 md:px-8 py-4 pointer-events-none">
          <div className="max-w-7xl mx-auto flex items-center justify-end pointer-events-auto">
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
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : null}
                  <div className={`absolute inset-0 bg-gradient-to-br from-[#FF6A00] to-[#E15B00] flex items-center justify-center text-white text-sm font-bold ${user?.photoURL ? 'z-[-1]' : ''}`}>
                    {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                  </div>
                </div>
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-[#111111]/95 backdrop-blur-xl border border-white/[0.08] rounded-lg shadow-2xl overflow-hidden animate-fade-in">
                  <div className="px-4 py-3 border-b border-white/[0.06]">
                    <p className="text-sm font-medium text-[#F3F4F6] truncate">{user?.displayName || 'Usuário'}</p>
                    <p className="text-xs text-[#9CA3AF] truncate">{user?.email}</p>
                  </div>

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

        {/* Phase 3: ErrorBoundary + Phase 5: Suspense */}
        <ErrorBoundary>
          <Suspense fallback={<LoadingSpinner />}>
            {renderScreen()}
          </Suspense>
        </ErrorBoundary>

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

      <MobileNav
        currentScreen={currentScreen}
        onNavigate={handleNavigate}
        viewMode={viewMode}
        hidden={immersiveNavState.active && !immersiveNavState.visible}
      />
    </div>
  );
};

export default App;