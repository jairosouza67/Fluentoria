
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

interface SidebarProps {
  viewMode: ViewMode;
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ viewMode, currentScreen, onNavigate, onLogout }) => {
  const isStudent = viewMode === 'student';

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-[#151311] border-r border-stone-800 flex flex-col justify-between p-6 z-20">
      
      {/* User Profile Header */}
      <div>
        <div className="flex items-center gap-3 mb-10 px-2 cursor-pointer" onClick={() => onNavigate('profile')}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-stone-900 font-bold ${isStudent ? 'bg-stone-300' : 'bg-orange-100'}`}>
             {isStudent ? 
               <img src="https://ui-avatars.com/api/?name=Maria&background=random&color=fff" alt="User" className="rounded-full" /> : 
               <img src="https://ui-avatars.com/api/?name=Ana+Costa&background=fed7aa&color=c2410c" alt="Admin" className="rounded-full" />
             }
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white hover:text-orange-500 transition-colors">
              {isStudent ? 'Olá, Maria!' : 'Ana Costa'}
            </h3>
            <p className="text-xs text-stone-400">
              {isStudent ? 'Bem-vinda de volta' : 'Admin'}
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
              <NavItem icon={<Users size={20} />} label="Alunos" onClick={() => {}} />
              <NavItem icon={<BarChart3 size={20} />} label="Relatórios" onClick={() => {}} />
              <NavItem icon={<Settings size={20} />} label="Configurações" onClick={() => {}} />
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
            <NavItem icon={<HelpCircle size={20} />} label="Ajuda" onClick={() => {}} />
            <button 
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-stone-400 hover:text-white rounded-lg transition-colors bg-orange-500 hover:bg-orange-600 text-white mt-4 font-medium justify-center"
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
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
        active 
          ? 'bg-gradient-to-r from-orange-900/40 to-transparent text-orange-500 border-l-2 border-orange-500' 
          : 'text-stone-400 hover:text-white hover:bg-white/5'
      }`}
    >
      <span className={active ? 'text-orange-500' : 'text-stone-400 group-hover:text-white'}>
        {icon}
      </span>
      <span className="font-medium text-sm">{label}</span>
    </button>
  );
};

export default Sidebar;
