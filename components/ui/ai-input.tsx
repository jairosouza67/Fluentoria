import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

interface AIInputProps {
  onSubmit: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const AIInput: React.FC<AIInputProps> = ({
  onSubmit,
  placeholder = "Type your question or comment...",
  disabled = false
}) => {
  const [value, setValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [value]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && !disabled) {
      onSubmit(value.trim());
      setValue('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div
        className={`relative bg-secondary/50 backdrop-blur-sm rounded-2xl border-2 transition-all duration-300 ${
          isFocused
            ? 'border-primary/50 shadow-lg shadow-primary/10'
            : 'border-border hover:border-border/80'
        }`}
      >
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="w-full bg-transparent border-0 outline-none resize-none pl-4 pr-14 py-4 text-foreground placeholder-muted-foreground focus:outline-none min-h-[56px] max-h-[200px] overflow-y-auto"
          style={{ lineHeight: '1.5' }}
        />

        {/* Send Button */}
        <button
          type="submit"
          disabled={!value.trim() || disabled}
          className={`absolute right-3 bottom-3 transition-all duration-300 ${
            value.trim() && !disabled
              ? 'bg-primary hover:bg-primary/90 text-primary-foreground scale-100 opacity-100'
              : 'bg-muted text-muted-foreground scale-90 opacity-50 cursor-not-allowed'
          } w-10 h-10 rounded-xl flex items-center justify-center hover:scale-105 disabled:scale-90 disabled:hover:scale-90`}
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

      {/* Character hint */}
      {isFocused && (
        <div className="absolute -bottom-6 left-0 text-xs text-muted-foreground animate-in fade-in duration-200">
          Press Enter to send, Shift + Enter for new line
        </div>
      )}
    </form>
  );
};
