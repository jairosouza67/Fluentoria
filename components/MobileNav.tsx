import React from 'react';
import { LayoutDashboard, BookOpen, Trophy } from 'lucide-react';
import { Screen } from '../types';

interface MobileNavProps {
    currentScreen: Screen;
    onNavigate: (screen: Screen) => void;
}

const MobileNav: React.FC<MobileNavProps> = ({ currentScreen, onNavigate }) => {
    return (
        <div className="fixed bottom-0 left-0 w-full bg-sidebar/95 backdrop-blur-xl border-t border-sidebar-border px-1 py-2 flex justify-around items-center z-50 md:hidden pb-safe shadow-elevated">
            <NavItem
                icon={<LayoutDashboard size={20} />}
                label="Home"
                active={currentScreen === 'dashboard'}
                onClick={() => onNavigate('dashboard')}
            />
            <NavItem
                icon={<BookOpen size={20} />}
                label="Courses"
                active={currentScreen === 'courses' || currentScreen === 'course-detail'}
                onClick={() => onNavigate('courses')}
            />
            <NavItem
                icon={<Trophy size={20} />}
                label="Achievements"
                active={currentScreen === 'achievements'}
                onClick={() => onNavigate('achievements')}
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
            className={`flex flex-col items-center gap-0.5 transition-all duration-200 ${active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}
                }`}
        >
            <div className={`p-1.5 rounded-lg transition-all duration-200 ${active ? 'bg-primary/10 scale-110' : ''}`}>
                {icon}
            </div>
            <span className="text-[9px] font-medium leading-tight">{label}</span>
        </button>
    );
};

export default MobileNav;
