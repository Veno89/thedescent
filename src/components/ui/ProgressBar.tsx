import { clsx } from 'clsx';

type ProgressVariant = 'hp' | 'energy' | 'block' | 'xp' | 'custom';

interface ProgressBarProps {
  current: number;
  max: number;
  variant?: ProgressVariant;
  showLabel?: boolean;
  labelPosition?: 'inside' | 'outside' | 'none';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  customColor?: string;
  animated?: boolean;
}

const variantClasses = {
  hp: 'progress-hp',
  energy: 'progress-energy',
  block: 'progress-block',
  xp: 'bg-gradient-to-r from-purple-600 to-purple-400',
  custom: '',
};

const sizeClasses = {
  sm: 'h-3',
  md: 'h-6',
  lg: 'h-8',
};

export function ProgressBar({
  current,
  max,
  variant = 'hp',
  showLabel = true,
  labelPosition = 'inside',
  size = 'md',
  className,
  customColor,
  animated = true,
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (current / max) * 100));
  
  // Determine color based on HP percentage for HP bars
  const getHpColor = () => {
    if (variant !== 'hp') return variantClasses[variant];
    if (percentage > 60) return 'bg-gradient-to-r from-green-600 to-green-500';
    if (percentage > 30) return 'bg-gradient-to-r from-yellow-600 to-yellow-500';
    return 'bg-gradient-to-r from-red-600 to-red-500';
  };

  return (
    <div className={clsx('relative', className)}>
      {labelPosition === 'outside' && showLabel && (
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-400">
            {variant === 'hp' && '❤️'}
            {variant === 'energy' && '⚡'}
            {variant === 'block' && '🛡️'}
          </span>
          <span className="text-white font-mono">
            {current}/{max}
          </span>
        </div>
      )}
      
      <div
        className={clsx(
          'progress-bar overflow-hidden rounded-full',
          sizeClasses[size]
        )}
      >
        <div
          className={clsx(
            'progress-bar-fill h-full',
            variant === 'custom' ? customColor : getHpColor(),
            animated && 'transition-all duration-500 ease-out'
          )}
          style={{ width: `${percentage}%` }}
        />
        
        {labelPosition === 'inside' && showLabel && size !== 'sm' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white text-sm font-bold drop-shadow-lg">
              {current} / {max}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// Specialized HP bar with danger animations
export function HpBar({ 
  current, 
  max, 
  showDanger = true,
  ...props 
}: ProgressBarProps & { showDanger?: boolean }) {
  const percentage = (current / max) * 100;
  const isDanger = percentage < 30;
  
  return (
    <div className={clsx(isDanger && showDanger && 'animate-pulse')}>
      <ProgressBar
        current={current}
        max={max}
        variant="hp"
        {...props}
      />
    </div>
  );
}

// Energy orbs display
export function EnergyDisplay({ current, max }: { current: number; max: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="energy-orb">
        {current}
      </div>
      <span className="text-gray-400 text-sm">/ {max}</span>
    </div>
  );
}
