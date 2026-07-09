import React, { useState, useEffect } from 'react';
import { LayoutDashboard, BookOpen, Bell, Users, Settings, FileText, LayoutGrid, User, Activity, Music as MusicIcon, Trophy, X } from 'lucide-react';
import { Screen, ViewMode } from '../types';

interface MobileNavProps {
    currentScreen: Screen;
    onNavigate: (screen: Screen) => void;
    viewMode: ViewMode;
    hidden?: boolean;
}

const EXTRAS_SCREENS: Screen[] = ['mindful', 'mindful-detail', 'music', 'music-detail', 'achievements'];

const EXTRAS_ITEMS: Array<{ screen: Screen; label: string; icon: React.ReactNode; gradient: string }> = [
    { screen: 'mindful', label: 'Fluxo Mental', icon: <Activity size={22} />, gradient: 'from-[#FF6A00]/20 to-[#E15B00]/10' },
    { screen: 'music', label: 'Músicas', icon: <MusicIcon size={22} />, gradient: 'from-[#6366F1]/20 to-[#4F46E5]/10' },
    { screen: 'achievements', label: 'Conquistas', icon: <Trophy size={22} />, gradient: 'from-[#23D18B]/20 to-[#16A34A]/10' },
];

const MobileNav: React.FC<MobileNavProps> = ({ currentScreen, onNavigate, viewMode, hidden = false }) => {
    const [extrasOpen, setExtrasOpen] = useState(false);

    // Fecha o flyout ao mudar de tela
    useEffect(() => { setExtrasOpen(false); }, [currentScreen]);

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
                    icon={<LayoutGrid size={20} />}
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

    return (
        <>
            {/* Flyout de Extras (acima do bottom nav) */}
            {extrasOpen && (
                <div
                    className="fixed inset-0 z-40 md:hidden bg-black/60 backdrop-blur-sm"
                    onClick={() => setExtrasOpen(false)}
                >
                    <button
                        onClick={(e) => { e.stopPropagation(); setExtrasOpen(false); }}
                        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/5 border border-white/10 text-[#9CA3AF] hover:text-[#F3F4F6] flex items-center justify-center"
                        aria-label="Fechar Extras"
                    >
                        <X size={18} />
                    </button>

                    <div
                        className="absolute bottom-0 left-0 right-0 bg-[#111111]/95 backdrop-blur-xl border-t border-white/[0.06] rounded-t-3xl p-6 pb-28 animate-in fade-in slide-in-from-bottom duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="max-w-md mx-auto">
                            <div className="w-10 h-1 rounded-full bg-white/15 mx-auto mb-6" />
                            <h3 className="text-lg font-bold text-[#F3F4F6] mb-1 text-center">Extras</h3>
                            <p className="text-xs text-[#9CA3AF] mb-6 text-center">Recursos complementares</p>

                            <div className="grid grid-cols-3 gap-3">
                                {EXTRAS_ITEMS.map((item) => (
                                    <button
                                        key={item.screen}
                                        onClick={() => onNavigate(item.screen)}
                                        className="group relative overflow-hidden rounded-2xl p-4 border border-white/[0.08] hover:border-[#FF6A00]/50 transition-all duration-200 flex flex-col items-center gap-2 text-center"
                                    >
                                        <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-50 group-hover:opacity-100 transition-opacity`} />
                                        <div className="relative z-10 w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#FF6A00] group-hover:scale-110 transition-transform">
                                            {item.icon}
                                        </div>
                                        <span className="relative z-10 text-xs font-medium text-[#F3F4F6]">{item.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Student bottom nav — 5 itens */}
            <div className={`fixed bottom-0 left-0 w-full bg-sidebar/95 backdrop-blur-xl border-t border-sidebar-border px-1 py-2 grid grid-cols-5 items-center z-50 md:hidden pb-safe shadow-elevated transition-all duration-300 ${hidden ? 'translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}`}>
                <NavItem
                    icon={<LayoutDashboard size={20} />}
                    label="Início"
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
                    icon={<LayoutGrid size={20} />}
                    label="Extras"
                    active={EXTRAS_SCREENS.includes(currentScreen)}
                    onClick={() => setExtrasOpen(true)}
                />
                <NavItem
                    icon={<Bell size={20} />}
                    label="Lembretes"
                    active={currentScreen === 'reminders' || currentScreen === 'reminder-detail'}
                    onClick={() => onNavigate('reminders')}
                />
                <NavItem
                    icon={<User size={20} />}
                    label="Perfil"
                    active={currentScreen === 'profile'}
                    onClick={() => onNavigate('profile')}
                />
            </div>
        </>
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