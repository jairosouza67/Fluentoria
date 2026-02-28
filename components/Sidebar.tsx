import React from 'react';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  User,
  Home,
  BarChart3,
  LogOut,
  Edit3,
  Trophy,
  Activity,
  Music
} from 'lucide-react';
import { ViewMode, Screen } from '../types';
import { User as FirebaseUser } from 'firebase/auth';

interface SidebarProps {
  viewMode: ViewMode;
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
  onLogout: () => void;
  user?: FirebaseUser | null;
}

const Sidebar: React.FC<SidebarProps> = ({ viewMode, currentScreen, onNavigate, onLogout, user }) => {
  const isStudent = viewMode === 'student';

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-full w-64 bg-[#111111]/95 backdrop-blur-xl border-r border-white/[0.06] flex-col justify-between p-6 z-20 shadow-elevated overflow-y-auto">

      {/* Logo or Brand */}
      <div className="w-full text-center flex-shrink-0">
        <div className="mb-10 px-2">
          <h1 className="text-xl font-bold text-[#FF6A00] leading-tight">Thiago Serpa - Fluentoria de Inglês</h1>
          <p className="text-xs text-[#9CA3AF] mt-1">Learning Platform</p>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-2">
          {isStudent ? (
            <>
              <NavItem
                icon={<LayoutDashboard size={20} />}
                label="Dashboard"
                active={currentScreen === 'dashboard'}
                onClick={() => onNavigate('dashboard')}
              />
              <NavItem
                icon={<BookOpen size={20} />}
                label="Aulas"
                active={currentScreen === 'courses' || currentScreen === 'gallery' || currentScreen === 'module-selection' || currentScreen === 'course-detail'}
                onClick={() => onNavigate('courses')}
              />
              {/* Daily Contact disabled */}
              {/*
              <NavItem
                icon={<Edit3 size={20} />}
                label="Daily Contact"
                active={currentScreen === 'daily'}
                onClick={() => onNavigate('daily')}
              />
              */}
              <NavItem
                icon={<Activity size={20} />}
                label="Mindful Flow"
                active={currentScreen === 'mindful'}
                onClick={() => onNavigate('mindful')}
              />
              <NavItem
                icon={<Music size={20} />}
                label="Music"
                active={currentScreen === 'music'}
                onClick={() => onNavigate('music')}
              />
              <NavItem
                icon={<Trophy size={20} />}
                label="Achievements"
                active={currentScreen === 'achievements'}
                onClick={() => onNavigate('achievements')}
              />
              <div className="h-px bg-white/[0.06] my-4 mx-2" />
              <NavItem
                icon={<User size={20} />}
                label="Perfil"
                active={currentScreen === 'profile'}
                onClick={() => onNavigate('profile')}
              />
            </>
          ) : (
            <>
              <NavItem icon={<BarChart3 size={20} />} label="Dashboard" active={currentScreen === 'admin-reports'} onClick={() => onNavigate('admin-reports')} />
              <NavItem icon={<BookOpen size={20} />} label="Content" active={currentScreen === 'admin-catalog'} onClick={() => onNavigate('admin-catalog')} />
              <NavItem icon={<Users size={20} />} label="Alunos" active={currentScreen === 'admin-students'} onClick={() => onNavigate('admin-students')} />
              <NavItem icon={<Activity size={20} />} label="Financeiro" active={currentScreen === 'admin-financial'} onClick={() => onNavigate('admin-financial')} />
            </>
          )}
        </nav>
      </div>

      {/* Footer Navigation */}
      <nav className="space-y-2">
        {isStudent ? (
          <>
            <NavItem icon={<LogOut size={20} />} label="Sair" onClick={onLogout} />
          </>
        ) : (
          <>
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-white rounded-xl transition-all duration-200 bg-[#FF6A00]/10 hover:bg-[#FF6A00] hover:shadow-[0_8px_24px_rgba(255,106,0,0.12)] hover:-translate-y-0.5 mt-4 font-medium justify-center border border-[#FF6A00]/20"
            >
              <LogOut size={18} />
              <span>Sair</span>
            </button>
          </>
        )}
      </nav>
    </aside>
  );
};

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, active, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden ${active
        ? 'bg-[#FF6A00]/10 text-[#FF6A00] shadow-[0_0_20px_rgba(255,106,0,0.1)] border border-[#FF6A00]/20'
        : 'text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-white/[0.02]'
        }`}
    >
      {active && <div className="absolute left-0 top-0 h-full w-1 bg-[#FF6A00] rounded-r-full" />}
      <span className={`relative z-10 transition-transform duration-200 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>
        {icon}
      </span>
      <span className="font-medium text-sm relative z-10">{label}</span>
    </button>
  );
};

export default Sidebar;
