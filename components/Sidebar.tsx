import React from 'react';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  User,
  Settings,
  HelpCircle,
  Home,
  BarChart3,
  LogOut,
  Edit3
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
    <aside className="hidden md:flex fixed left-0 top-0 h-full w-64 bg-[#111111]/95 backdrop-blur-xl border-r border-white/[0.06] flex-col justify-between p-6 z-20 shadow-elevated">

      {/* User Profile Header */}
      <div>
        <div className="flex items-center gap-3 mb-10 px-2 cursor-pointer group" onClick={() => onNavigate('profile')}>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-stone-900 font-bold overflow-hidden ring-2 ring-white/10 group-hover:ring-[#FF6A00] transition-all duration-200 shadow-lg`}>
            {user?.photoURL ? (
              <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#FF6A00] to-[#E15B00] flex items-center justify-center text-white text-lg">
                {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-[#F3F4F6] group-hover:text-[#FF6A00] transition-colors duration-200 truncate">
              {user?.displayName || 'Usuário'}
            </h3>
            <p className="text-xs text-[#9CA3AF] truncate">
              {isStudent ? 'Aluno' : 'Admin'}
            </p>
          </div>
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
                active={currentScreen === 'courses' || currentScreen === 'course-detail'}
                onClick={() => onNavigate('courses')}
              />
              <NavItem
                icon={<Edit3 size={20} />}
                label="Daily Contact"
                active={currentScreen === 'daily'}
                onClick={() => onNavigate('daily')}
              />
              <NavItem
                icon={<User size={20} />}
                label="Meu Perfil"
                active={currentScreen === 'profile'}
                onClick={() => onNavigate('profile')}
              />
            </>
          ) : (
            <>
              <NavItem icon={<Home size={20} />} label="Início" active={currentScreen === 'dashboard'} onClick={() => onNavigate('dashboard')} />
              <NavItem icon={<BookOpen size={20} />} label="Aulas" active={currentScreen === 'admin-catalog'} onClick={() => onNavigate('admin-catalog')} />
              <NavItem icon={<Users size={20} />} label="Alunos" active={currentScreen === 'admin-students'} onClick={() => onNavigate('admin-students')} />
              <NavItem icon={<BarChart3 size={20} />} label="Relatórios" active={currentScreen === 'admin-reports'} onClick={() => onNavigate('admin-reports')} />
              <NavItem icon={<Settings size={20} />} label="Configurações" active={currentScreen === 'admin-settings'} onClick={() => onNavigate('admin-settings')} />
            </>
          )}
        </nav>
      </div>

      {/* Footer Navigation */}
      <nav className="space-y-2">
        {isStudent ? (
          <>
            <NavItem icon={<Settings size={20} />} label="Configurações" onClick={() => onNavigate('profile')} />
            <NavItem icon={<LogOut size={20} />} label="Sair" onClick={onLogout} />
          </>
        ) : (
          <>
            <NavItem icon={<HelpCircle size={20} />} label="Ajuda" active={currentScreen === 'admin-help'} onClick={() => onNavigate('admin-help')} />
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
