import React from 'react';
import { LayoutDashboard, BookOpen, Trophy, Edit3, Activity, Music as MusicIcon, Users, Settings, FileText } from 'lucide-react';
import { Screen, ViewMode } from '../types';

interface MobileNavProps {
    currentScreen: Screen;
    onNavigate: (screen: Screen) => void;
    viewMode: ViewMode;
    hidden?: boolean;
}

const MobileNav: React.FC<MobileNavProps> = ({ currentScreen, onNavigate, viewMode, hidden = false }) => {
    // Admin navigation
    if (viewMode === 'admin') {
        return (
            <div className={`fixed bottom-0 left-0 w-full bg-sidebar/95 backdrop-blur-xl border-t border-sidebar-border px-1 py-2 grid grid-cols-5 items-center z-50 md:hidden pb-safe shadow-elevated transition-all duration-300 ${hidden ? 'translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}`}>
                <NavItem
                    icon={<LayoutDashboard size={20} />}
                    label="Painel"
                    active={currentScreen === 'admin-reports'}
                    onClick={() => onNavigate('admin-reports')}
                />
                <NavItem
                    icon={<FileText size={20} />}
                    label="Conteúdo"
                    active={currentScreen === 'admin-catalog'}
                    onClick={() => onNavigate('admin-catalog')}
                />
                <NavItem
                    icon={<Users size={20} />}
                    label="Alunos"
                    active={currentScreen === 'admin-students'}
                    onClick={() => onNavigate('admin-students')}
                />
                <NavItem
                    icon={<Activity size={20} />}
                    label="Finan"
                    active={currentScreen === 'admin-financial'}
                    onClick={() => onNavigate('admin-financial')}
                />
                <NavItem
                    icon={<Settings size={20} />}
                    label="Config"
                    active={currentScreen === 'admin-settings'}
                    onClick={() => onNavigate('admin-settings')}
                />
            </div>
        );
    }

    // Student navigation
    return (
        <div className={`fixed bottom-0 left-0 w-full bg-sidebar/95 backdrop-blur-xl border-t border-sidebar-border px-1 py-2 flex justify-around items-center z-50 md:hidden pb-safe shadow-elevated transition-all duration-300 ${hidden ? 'translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}`}>
            <NavItem
                icon={<LayoutDashboard size={20} />}
                label="Início"
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
                label="Daily"
                active={currentScreen === 'daily'}
                onClick={() => onNavigate('daily')}
            />
            */}
            <NavItem
                icon={<Activity size={20} />}
                label="Fluxo"
                active={currentScreen === 'mindful'}
                onClick={() => onNavigate('mindful')}
            />
            <NavItem
                icon={<MusicIcon size={20} />}
                label="Músicas"
                active={currentScreen === 'music'}
                onClick={() => onNavigate('music')}
            />
            <NavItem
                icon={<Trophy size={20} />}
                label="Conquistas"
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
            className={`flex flex-col items-center gap-0.5 transition-all duration-200 ${active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
        >
            <div className={`p-1.5 rounded-lg transition-all duration-200 ${active ? 'bg-primary/10 scale-110' : ''}`}>
                {icon}
            </div>
            <span className="text-[9px] font-medium leading-tight">{label}</span>
        </button>
    );
};

export default MobileNav;
