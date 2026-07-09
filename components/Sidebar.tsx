import React, { useState } from 'react';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  User,
  BarChart3,
  LogOut,
  Trophy,
  Activity,
  Bell,
  Music,
  Settings,
  Layers,
  ChevronDown
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

const EXTRAS_SCREENS: Screen[] = ['mindful', 'mindful-detail', 'music', 'music-detail', 'achievements'];

const Sidebar: React.FC<SidebarProps> = ({ viewMode, currentScreen, onNavigate, onLogout, user }) => {
  const isStudent = viewMode === 'student';
  // Auto-expande o grupo Extras se a tela ativa pertence ao grupo
  const [extrasOpen, setExtrasOpen] = useState(EXTRAS_SCREENS.includes(currentScreen));

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-full w-64 bg-[#111111]/95 backdrop-blur-xl border-r border-white/[0.06] flex-col justify-between p-6 z-20 shadow-elevated overflow-y-auto">

      {/* Logo or Brand */}
      <div className="w-full text-center flex-shrink-0">
        <div className="mb-10 px-2">
          <h1 className="text-xl font-bold text-[#FF6A00] leading-tight">Thiago Serpa - Fluentoria de Inglês</h1>
          <p className="text-xs text-[#9CA3AF] mt-1">Plataforma de Ensino</p>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-2">
          {isStudent ? (
            <>
              {/* Seção Principal */}
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

              {/* Extras (Plus) — botão que expande os boxes */}
              <div className="pt-4">
                <button
                  onClick={() => setExtrasOpen(o => !o)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden ${EXTRAS_SCREENS.includes(currentScreen)
                    ? 'bg-[#FF6A00]/10 text-[#FF6A00] shadow-[0_0_20px_rgba(255,106,0,0.1)] border border-[#FF6A00]/20'
                    : 'text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-white/[0.02]'
                    }`}
                  aria-expanded={extrasOpen}
                  aria-controls="sidebar-extras-group"
                >
                  {EXTRAS_SCREENS.includes(currentScreen) && <div className="absolute left-0 top-0 h-full w-1 bg-[#FF6A00] rounded-r-full" />}
                  <span className={`relative z-10 transition-transform duration-200 ${EXTRAS_SCREENS.includes(currentScreen) ? 'scale-110' : 'group-hover:scale-110'}`}>
                    <Layers size={20} />
                  </span>
                  <span className="font-medium text-sm relative z-10 flex-1 text-left">Extras</span>
                  <ChevronDown
                    size={16}
                    className={`relative z-10 transition-transform duration-200 ${extrasOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {extrasOpen && (
                  <div id="sidebar-extras-group" className="mt-2 ml-3 pl-3 border-l border-white/[0.06] space-y-1">
                    <NavItem
                      icon={<Activity size={18} />}
                      label="Fluxo Mental"
                      active={currentScreen === 'mindful' || currentScreen === 'mindful-detail'}
                      onClick={() => onNavigate('mindful')}
                    />
                    <NavItem
                      icon={<Music size={18} />}
                      label="Músicas"
                      active={currentScreen === 'music' || currentScreen === 'music-detail'}
                      onClick={() => onNavigate('music')}
                    />
                    <NavItem
                      icon={<Trophy size={18} />}
                      label="Conquistas"
                      active={currentScreen === 'achievements'}
                      onClick={() => onNavigate('achievements')}
                    />
                  </div>
                )}
              </div>

              {/* Lembretes fica no nível principal */}
              <div className="pt-4">
                <NavItem
                  icon={<Bell size={20} />}
                  label="Lembretes"
                  active={currentScreen === 'reminders' || currentScreen === 'reminder-detail'}
                  onClick={() => onNavigate('reminders')}
                />
              </div>

              <div className="h-px bg-white/[0.06] my-4 mx-2" />
              <NavItem
                icon={<User size={20} />}
                label="Meu Perfil"
                active={currentScreen === 'profile'}
                onClick={() => onNavigate('profile')}
              />
            </>
          ) : (
            <>
              <NavItem icon={<BarChart3 size={20} />} label="Painel" active={currentScreen === 'admin-reports'} onClick={() => onNavigate('admin-reports')} />
              <NavItem icon={<BookOpen size={20} />} label="Conteúdo" active={currentScreen === 'admin-catalog'} onClick={() => onNavigate('admin-catalog')} />
              <NavItem icon={<Users size={20} />} label="Alunos" active={currentScreen === 'admin-students'} onClick={() => onNavigate('admin-students')} />
              <NavItem icon={<Activity size={20} />} label="Financeiro" active={currentScreen === 'admin-financial'} onClick={() => onNavigate('admin-financial')} />
              <div className="h-px bg-white/[0.06] my-4 mx-2" />
              <NavItem icon={<Settings size={20} />} label="Configurações" active={currentScreen === 'admin-settings'} onClick={() => onNavigate('admin-settings')} />
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
