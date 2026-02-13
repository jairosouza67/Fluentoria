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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className={cn("bg-[#111111] border border-white/[0.06] rounded-xl w-full shadow-elevated animate-in zoom-in-95 duration-200 overflow-hidden", modalMaxWidth)}>
        <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
          <div>
            <h2 className="text-xl font-bold text-[#F3F4F6]">{title}</h2>
            {description && <div className="text-sm text-[#9CA3AF] mt-1">{description}</div>}
          </div>
          <button 
            onClick={onClose} 
            className="text-[#9CA3AF] hover:text-[#F3F4F6] transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {children}
        </div>

        {footer && (
          <div className="p-6 border-t border-white/[0.06] flex gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
