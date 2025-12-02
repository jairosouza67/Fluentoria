
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import StudentDashboard from './components/StudentDashboard';
import AdminCatalog from './components/AdminCatalog';
import Auth from './components/Auth';
import CourseList from './components/CourseList';
import CourseDetail from './components/CourseDetail';
import DailyContact from './components/DailyContact';
import MindfulFlow from './components/MindfulFlow';
import Profile from './components/Profile';
import { ViewMode, Screen } from './types';
import { Eye } from 'lucide-react';

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('student');
  const [currentScreen, setCurrentScreen] = useState<Screen>('auth');

  // Navegação simples baseada em estado
  const navigateTo = (screen: Screen) => {
    setCurrentScreen(screen);
    window.scrollTo(0, 0);
  };

  const handleLogin = () => {
    setCurrentScreen('dashboard');
  };

  const handleLogout = () => {
    setCurrentScreen('auth');
  };

  const toggleViewMode = () => {
    const newMode = viewMode === 'student' ? 'admin' : 'student';
    setViewMode(newMode);
    // Redireciona para a tela inicial apropriada do modo
    if (newMode === 'admin') {
      setCurrentScreen('admin-catalog');
    } else {
      setCurrentScreen('dashboard');
    }
  };

  if (currentScreen === 'auth') {
    return <Auth onLogin={handleLogin} />;
  }

  const renderScreen = () => {
    if (viewMode === 'admin') {
      // Modos Admin (Simplificado para o demo, focado no catálogo)
      return <AdminCatalog />;
    }

    // Modos Student
    switch (currentScreen) {
      case 'dashboard':
        return <StudentDashboard onNavigate={navigateTo} />;
      case 'courses':
        return <CourseList onNavigate={navigateTo} />;
      case 'course-detail':
        return <CourseDetail onBack={() => navigateTo('courses')} />;
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
    <div className="min-h-screen bg-[#12100e] text-stone-100 font-sans flex">
      <Sidebar 
        viewMode={viewMode} 
        currentScreen={currentScreen} 
        onNavigate={navigateTo}
        onLogout={handleLogout}
      />
      
      <main className="pl-64 w-full min-h-screen relative">
        {renderScreen()}
        
        {/* Floating Toggle Button for Demo Purposes - Only visible if logged in */}
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
           <div className="bg-stone-800 text-stone-400 text-xs py-1 px-3 rounded shadow-lg mb-1 pointer-events-none">
             Modo: {viewMode === 'student' ? 'Aluno' : 'Admin'}
           </div>
           <button 
            onClick={toggleViewMode}
            className="bg-white text-black p-4 rounded-full shadow-xl hover:bg-stone-200 transition-transform hover:scale-105 active:scale-95 flex items-center justify-center"
            title="Alternar entre visão de Aluno e Admin"
          >
            <Eye size={24} />
          </button>
        </div>
      </main>
    </div>
  );
};

export default App;
