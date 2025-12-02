import React, { useState, useEffect } from 'react';
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
import MindfulFlow from './components/MindfulFlow';
import Profile from './components/Profile';
import { ViewMode, Screen } from './types';
import { Eye, Loader2 } from 'lucide-react';
import { auth } from './lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import MobileNav from './components/MobileNav';
import { Course } from './lib/db';

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('student');
  const [currentScreen, setCurrentScreen] = useState<Screen>('auth');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Only redirect to dashboard if currently on auth screen
        if (currentScreen === 'auth') {
          setCurrentScreen('dashboard');
        }
      } else {
        setCurrentScreen('auth');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentScreen]);

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
    if (viewMode === 'student') {
      // Check for admin privileges
      if (user?.email === 'jairosouza67@gmail.com') {
        setViewMode('admin');
        setCurrentScreen('admin-catalog');
      } else {
        alert('Acesso negado. Apenas administradores podem acessar esta área.');
      }
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
          return <AdminCatalog />;
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
        return <DailyContact />;
      case 'mindful':
        return <MindfulFlow />;
      case 'profile':
        return <Profile />;
      case 'music':
        // Reuse MindfulFlow style for now or create specific if needed later
        return <MindfulFlow />;
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
        {renderScreen()}

        {/* Floating Toggle Button for Demo Purposes - Only visible if logged in */}
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
      </main>

      <MobileNav currentScreen={currentScreen} onNavigate={navigateTo} />
    </div>
  );
};

export default App;
