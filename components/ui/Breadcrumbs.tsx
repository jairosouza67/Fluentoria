import React from 'react';
import { ChevronRight } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, className = '' }) => {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Trilha de navegação" className={`flex items-center gap-1.5 text-sm overflow-hidden ${className}`}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <React.Fragment key={`${index}-${item.label}`}>
            {index > 0 && <ChevronRight size={14} className="text-[#9CA3AF]/60 shrink-0" />}
            {isLast || !item.onClick ? (
              <span
                className={isLast ? 'text-[#F3F4F6] font-medium truncate' : 'text-[#9CA3AF] truncate'}
                aria-current={isLast ? 'page' : undefined}
              >
                {item.label}
              </span>
            ) : (
              <button
                type="button"
                onClick={item.onClick}
                className="text-[#9CA3AF] hover:text-[#FF6A00] transition-colors truncate"
              >
                {item.label}
              </button>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumbs;