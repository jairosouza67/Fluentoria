import React from 'react';
import { LayoutDashboard, BookOpen, Edit3, User } from 'lucide-react';
import { Screen } from '../types';

interface MobileNavProps {
    currentScreen: Screen;
    onNavigate: (screen: Screen) => void;
}

const MobileNav: React.FC<MobileNavProps> = ({ currentScreen, onNavigate }) => {
    return (
        <div className="fixed bottom-0 left-0 w-full bg-sidebar/95 backdrop-blur-xl border-t border-sidebar-border px-6 py-4 flex justify-between items-center z-50 md:hidden pb-safe shadow-elevated">
            <NavItem
                icon={<LayoutDashboard size={24} />}
                label="Home"
                active={currentScreen === 'dashboard'}
                onClick={() => onNavigate('dashboard')}
            />
            <NavItem
                icon={<BookOpen size={24} />}
                label="Aulas"
                active={currentScreen === 'courses' || currentScreen === 'course-detail'}
                onClick={() => onNavigate('courses')}
            />
            <NavItem
                icon={<Edit3 size={24} />}
                label="Daily"
                active={currentScreen === 'daily'}
                onClick={() => onNavigate('daily')}
            />
            <NavItem
                icon={<User size={24} />}
                label="Perfil"
                active={currentScreen === 'profile'}
                onClick={() => onNavigate('profile')}
            />
        </div>
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
            className={`flex flex-col items-center gap-1 transition-all duration-200 ${active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
        >
            <div className={`p-2 rounded-lg transition-all duration-200 ${active ? 'bg-primary/10 scale-110' : ''}`}>
                {icon}
            </div>
            <span className="text-[10px] font-medium">{label}</span>
        </button>
    );
};

export default MobileNav;
