import React from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = 'max-w-md'
}) => {
  if (!isOpen) return null;

  const modalMaxWidth = maxWidth.startsWith('max-w-') ? maxWidth : `max-w-${maxWidth}`;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-300">
      <div className={cn("bg-[#0B0B0B]/95 backdrop-blur-2xl border-t md:border border-white/[0.08] w-full h-[95vh] md:h-auto md:rounded-2xl shadow-2xl animate-in slide-in-from-bottom-5 md:zoom-in-95 duration-300 overflow-hidden flex flex-col max-h-screen md:max-h-[90vh]", modalMaxWidth)}>
        <div className="flex items-center justify-between p-5 md:p-6 border-b border-white/[0.06] flex-shrink-0 bg-white/[0.01]">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-[#F3F4F6] tracking-tight">{title}</h2>
            {description && <div className="text-xs md:text-sm text-[#9CA3AF] mt-1 font-medium">{description}</div>}
          </div>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-white/5 rounded-full transition-all"
          >
            <X size={20} className="md:w-6 md:h-6" />
          </button>
        </div>

        <div className="p-5 md:p-6 overflow-y-auto flex-1 custom-scrollbar">
          {children}
        </div>

        {footer && (
          <div className="p-5 md:p-6 border-t border-white/[0.06] flex flex-col md:flex-row gap-3 flex-shrink-0 bg-white/[0.01]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
