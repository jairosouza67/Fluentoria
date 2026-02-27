import React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SettingSectionProps {
  title: string;
  description: string;
  icon: React.ElementType;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  className?: string;
}

export const SettingSection: React.FC<SettingSectionProps> = ({ 
  title, 
  description, 
  icon: Icon, 
  expanded, 
  onToggle, 
  children,
  className 
}) => {
  return (
    <div className={cn("bg-[#111111]/50 border border-white/[0.06] rounded-xl overflow-hidden shadow-card", className)}>
      <button
        type="button"
        onClick={onToggle}
        className="w-full p-6 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-[#FF6A00]/10 flex items-center justify-center text-[#FF6A00]">
            <Icon className="w-6 h-6" />
          </div>
          <div className="text-left">
            <h3 className="text-lg font-bold text-[#F3F4F6]">{title}</h3>
            <p className="text-sm text-[#9CA3AF] mt-1">{description}</p>
          </div>
        </div>
        {expanded ? (
          <ChevronDown className="w-5 h-5 text-[#9CA3AF] transition-transform" />
        ) : (
          <ChevronRight className="w-5 h-5 text-[#9CA3AF] transition-transform" />
        )}
      </button>
      {expanded && (
        <div className="p-6 border-t border-white/[0.06] bg-[#0B0B0B]/50 animate-in fade-in slide-in-from-top-2 duration-200">
          {children}
        </div>
      )}
    </div>
  );
};
