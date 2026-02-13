import React from 'react';
import { cn } from '../../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    const variants = {
      primary: 'btn-primary-pluma',
      secondary: 'bg-white/[0.05] border border-white/[0.1] text-white hover:bg-white/[0.1]',
      ghost: 'btn-ghost-pluma',
      destructive: 'bg-red-600/20 border border-red-600/30 text-red-500 hover:bg-red-600/30',
      outline: 'bg-transparent border border-[#FF6A00]/40 text-[#FF6A00] hover:bg-[#FF6A00]/10',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-5 py-3',
      lg: 'px-8 py-4 text-lg',
      icon: 'p-2 w-10 h-10',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
