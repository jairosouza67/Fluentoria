import React, { useState } from 'react';
import { Search, Eye, EyeOff, Mail, Lock, User } from 'lucide-react';

interface AnimatedInputProps {
  type?: 'text' | 'email' | 'password' | 'search';
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  icon?: 'search' | 'email' | 'password' | 'user' | 'none';
  className?: string;
  autoFocus?: boolean;
}

const AnimatedInput: React.FC<AnimatedInputProps> = ({
  type = 'text',
  placeholder = '',
  value,
  onChange,
  icon = 'none',
  className = '',
  autoFocus = false,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const getIcon = () => {
    const iconClass = "w-4 h-4"; // Ícones menores e mais discretos
    switch (icon) {
      case 'search':
        return <Search className={iconClass} />;
      case 'email':
        return <Mail className={iconClass} />;
      case 'password':
        return <Lock className={iconClass} />;
      case 'user':
        return <User className={iconClass} />;
      default:
        return null;
    }
  };

  const inputType = type === 'password' && showPassword ? 'text' : type;

  return (
    <div className={`relative group ${className}`}>
      {/* Glow effect on focus - mais sutil */}
      <div
        className={`absolute -inset-0.5 bg-gradient-to-r from-[#FF6A00] to-[#E15B00] rounded-lg opacity-0 group-hover:opacity-10 blur transition-all duration-300 ${
          isFocused ? 'opacity-20 blur-sm' : ''
        }`}
      />
      
      {/* Input container */}
      <div className="relative">
        {/* Icon - mais discreto */}
        {icon !== 'none' && (
          <div
            className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-all duration-300 pointer-events-none ${
              isFocused
                ? 'text-[#FF6A00]'
                : 'text-[#6B7280] group-hover:text-[#9CA3AF]'
            }`}
          >
            {getIcon()}
          </div>
        )}

        {/* Input field - menor e mais clean */}
        <input
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={`
            w-full bg-[#111111]/50 border border-white/[0.08] rounded-lg
            text-[#F3F4F6] placeholder-[#6B7280] text-sm
            transition-all duration-300 outline-none
            ${icon !== 'none' ? 'pl-13 pr-4' : 'px-4'}
            ${type === 'password' ? 'pr-13' : ''}
            py-2.5
            hover:border-white/[0.12]
            focus:border-[#FF6A00]/60 focus:bg-[#111111]
          `}
        />

        {/* Password toggle - mais discreto */}
        {type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#FF6A00] transition-colors"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Bottom glow line - mais sutil */}
      <div
        className={`absolute bottom-0 left-0 h-px bg-gradient-to-r from-[#FF6A00] to-[#E15B00] transition-all duration-300 ${
          isFocused ? 'w-full opacity-60' : 'w-0 opacity-0'
        }`}
      />
    </div>
  );
};

export default AnimatedInput;
