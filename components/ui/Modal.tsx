import React, { useEffect } from 'react';
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
  // Prevent body scroll when modal is open (especially important on mobile)
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    const originalOverscroll = document.body.style.overscrollBehavior;
    document.body.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'none';
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.overscrollBehavior = originalOverscroll;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const modalMaxWidth = maxWidth.startsWith('max-w-') ? maxWidth : `max-w-${maxWidth}`;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-300">
      <div
        className={cn(
          // Mobile: bottom sheet using dynamic viewport height so the footer never
          // gets covered by the fixed bottom navigation bar.
          // Desktop: centered dialog as before.
          'bg-[#0B0B0B]/95 backdrop-blur-2xl border-t md:border border-white/[0.08] w-full shadow-2xl animate-in slide-in-from-bottom-5 md:zoom-in-95 duration-300 overflow-hidden flex flex-col',
          'h-[100dvh] rounded-none md:h-auto md:max-h-[90vh] md:rounded-2xl',
          modalMaxWidth
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4 p-4 md:p-6 border-b border-white/[0.06] flex-shrink-0 bg-white/[0.01]">
          <div className="min-w-0">
            <h2 className="text-base md:text-xl font-bold text-[#F3F4F6] tracking-tight truncate">{title}</h2>
            {description && <div className="text-xs md:text-sm text-[#9CA3AF] mt-1 font-medium">{description}</div>}
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="p-2 -mr-2 flex-shrink-0 text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-white/5 rounded-full transition-all active:scale-95"
          >
            <X size={22} className="md:w-6 md:h-6" />
          </button>
        </div>

        {/* Content (scrollable) */}
        <div className="p-3 md:p-6 overflow-y-auto flex-1 custom-scrollbar">
          {children}
        </div>

        {/* Footer - on mobile, leave room for the fixed bottom navigation bar */}
        {footer && (
          <div className="px-4 pt-3 md:p-6 border-t border-white/[0.06] flex-shrink-0 bg-[#0B0B0B] pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-6">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
