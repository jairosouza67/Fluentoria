import React from 'react';
import { cn } from '../../lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  sticky?: boolean;
  icon?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ 
  title, 
  description, 
  action, 
  sticky = false,
  icon
}) => {
  return (
    <div className={cn(
      "flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8 pb-6 border-b border-white/[0.06]",
      sticky && "sticky top-0 z-30 bg-background/80 backdrop-blur-md -mx-6 md:-mx-8 px-6 md:px-8 py-6"
    )}>
      <div className="space-y-1">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          {title} {icon && <span className="text-primary">{icon}</span>}
        </h1>
        {description && <p className="text-muted-foreground">{description}</p>}
      </div>
      {action && (
        <div className="flex items-center gap-3">
          {action}
        </div>
      )}
    </div>
  );
};
