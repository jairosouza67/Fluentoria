import React from 'react';
import { Zap } from 'lucide-react';
import { getXPProgress } from '../lib/gamification';

interface LevelProgressProps {
  currentXP: number;
  currentLevel: number;
  showDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const LevelProgress: React.FC<LevelProgressProps> = ({
  currentXP,
  currentLevel,
  showDetails = true,
  size = 'md',
}) => {
  const progress = getXPProgress(currentXP);

  const sizeClasses = {
    sm: {
      container: 'h-2',
      text: 'text-xs',
      icon: 'w-4 h-4',
    },
    md: {
      container: 'h-3',
      text: 'text-sm',
      icon: 'w-5 h-5',
    },
    lg: {
      container: 'h-4',
      text: 'text-base',
      icon: 'w-6 h-6',
    },
  };

  return (
    <div className="space-y-2">
      {showDetails && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <Zap className={`${sizeClasses[size].icon} text-primary fill-primary`} />
              <span className={`${sizeClasses[size].text} font-bold text-foreground`}>
                Nível {currentLevel}
              </span>
            </div>
          </div>
          <span className={`${sizeClasses[size].text} text-muted-foreground`}>
            {progress.current} / {progress.required} XP
          </span>
        </div>
      )}

      <div className={`w-full ${sizeClasses[size].container} bg-muted rounded-full overflow-hidden`}>
        <div
          className="h-full bg-gradient-to-r from-primary to-orange-400 transition-all duration-500 ease-out"
          style={{ width: `${Math.min(progress.percentage, 100)}%` }}
        />
      </div>

      {showDetails && size !== 'sm' && (
        <p className="text-xs text-muted-foreground">
          {Math.round(progress.percentage)}% para o próximo nível
        </p>
      )}
    </div>
  );
};

export default LevelProgress;
