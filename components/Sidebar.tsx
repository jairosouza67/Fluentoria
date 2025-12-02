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
    <aside className="hidden md:flex fixed left-0 top-0 h-full w-64 bg-card/30 backdrop-blur-xl border-r border-white/5 flex-col justify-between p-6 z-20 shadow-2xl">

      {/* User Profile Header */}
      <div>
        <div className="flex items-center gap-3 mb-10 px-2 cursor-pointer group" onClick={() => onNavigate('profile')}>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-stone-900 font-bold overflow-hidden ring-2 ring-white/10 group-hover:ring-primary transition-all shadow-lg`}>
            {user?.photoURL ? (
              <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary to-orange-700 flex items-center justify-center text-white text-lg">
                {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-white group-hover:text-primary transition-colors truncate">
              {user?.displayName || 'Usuário'}
            </h3>
            <p className="text-xs text-muted-foreground truncate">
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
              <NavItem icon={<Users size={20} />} label="Alunos" onClick={() => { }} />
              <NavItem icon={<BarChart3 size={20} />} label="Relatórios" onClick={() => { }} />
              <NavItem icon={<Settings size={20} />} label="Configurações" onClick={() => { }} />
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
            <NavItem icon={<HelpCircle size={20} />} label="Ajuda" onClick={() => { }} />
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-stone-400 hover:text-white rounded-xl transition-all bg-primary/10 hover:bg-primary hover:shadow-lg hover:shadow-primary/20 text-white mt-4 font-medium justify-center border border-primary/20"
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
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden ${active
        ? 'bg-primary/10 text-primary shadow-[0_0_20px_rgba(234,88,12,0.1)] border border-primary/20'
        : 'text-muted-foreground hover:text-white hover:bg-white/5'
        }`}
    >
      {active && <div className="absolute left-0 top-0 h-full w-1 bg-primary rounded-r-full" />}
      <span className={`relative z-10 transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>
        {icon}
      </span>
      <span className="font-medium text-sm relative z-10">{label}</span>
    </button>
  );
};

export default Sidebar;
