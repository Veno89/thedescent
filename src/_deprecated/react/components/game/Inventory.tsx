import { useState } from 'react';
import { clsx } from 'clsx';
import type { Relic, Potion } from '@/types';

// Relic Display
interface RelicProps {
  relic: Relic;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

const relicRarityColors = {
  STARTER: 'from-gray-600 to-gray-700 border-gray-500',
  COMMON: 'from-gray-500 to-gray-600 border-gray-400',
  UNCOMMON: 'from-blue-800 to-blue-900 border-blue-500',
  RARE: 'from-yellow-700 to-yellow-800 border-yellow-500',
  SPECIAL: 'from-purple-700 to-purple-800 border-purple-500',
};

const sizeClasses = {
  sm: 'w-10 h-10 text-lg',
  md: 'w-14 h-14 text-2xl',
  lg: 'w-20 h-20 text-3xl',
};

export function RelicDisplay({ relic, size = 'md', onClick }: RelicProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div 
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div
        className={clsx(
          'rounded-lg bg-gradient-to-br border-2 flex items-center justify-center',
          'cursor-pointer transition-all duration-200 hover:scale-110',
          relicRarityColors[relic.rarity],
          sizeClasses[size],
          onClick && 'hover:brightness-125'
        )}
        onClick={onClick}
      >
        <span>🔮</span>
        {relic.counter !== undefined && relic.counter > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {relic.counter}
          </span>
        )}
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none">
          <div className="bg-gray-900 border border-yellow-600/50 rounded-lg p-3 shadow-xl min-w-48 max-w-64">
            <h4 className="font-bold text-yellow-400 mb-1">{relic.name}</h4>
            <p className="text-sm text-gray-400 mb-2">{relic.rarity}</p>
            <p className="text-sm text-gray-200">{relic.description}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Relic bar (horizontal list)
interface RelicBarProps {
  relics: Relic[];
  maxDisplay?: number;
}

export function RelicBar({ relics, maxDisplay = 10 }: RelicBarProps) {
  const displayRelics = relics.slice(0, maxDisplay);
  const overflow = relics.length - maxDisplay;

  return (
    <div className="flex items-center gap-2">
      {displayRelics.map((relic, index) => (
        <RelicDisplay key={`${relic.id}-${index}`} relic={relic} size="sm" />
      ))}
      {overflow > 0 && (
        <span className="text-gray-400 text-sm">+{overflow} more</span>
      )}
    </div>
  );
}

// Potion Display
interface PotionProps {
  potion: Potion | null;
  slotIndex: number;
  onClick?: () => void;
  disabled?: boolean;
}

const potionRarityColors = {
  STARTER: 'from-gray-500 to-gray-600',
  COMMON: 'from-blue-600 to-blue-700',
  UNCOMMON: 'from-purple-600 to-purple-700',
  RARE: 'from-yellow-600 to-yellow-700',
  SPECIAL: 'from-red-600 to-red-700',
};

export function PotionSlot({ potion, slotIndex, onClick, disabled }: PotionProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const isEmpty = potion === null;

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div
        className={clsx(
          'w-12 h-12 rounded-lg border-2 flex items-center justify-center',
          'transition-all duration-200',
          isEmpty && 'bg-gray-800/50 border-gray-700 border-dashed',
          !isEmpty && 'bg-gradient-to-br cursor-pointer hover:scale-110',
          !isEmpty && potionRarityColors[potion.rarity],
          !isEmpty && 'border-solid',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        onClick={!isEmpty && !disabled ? onClick : undefined}
      >
        {isEmpty ? (
          <span className="text-gray-600 text-xs">{slotIndex + 1}</span>
        ) : (
          <span className="text-2xl">🧪</span>
        )}
      </div>

      {/* Tooltip */}
      {showTooltip && potion && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none">
          <div className="bg-gray-900 border border-blue-600/50 rounded-lg p-3 shadow-xl min-w-48 max-w-64">
            <h4 className="font-bold text-blue-400 mb-1">{potion.name}</h4>
            <p className="text-sm text-gray-400 mb-2">{potion.rarity}</p>
            <p className="text-sm text-gray-200">{potion.description}</p>
            <p className="text-xs text-gray-500 mt-2">Click to use</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Potion bar (all potion slots)
interface PotionBarProps {
  potions: (Potion | null)[];
  onUsePotion: (index: number) => void;
  disabled?: boolean;
}

export function PotionBar({ potions, onUsePotion, disabled }: PotionBarProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-gray-400 text-sm mr-1">Potions:</span>
      {potions.map((potion, index) => (
        <PotionSlot
          key={index}
          potion={potion}
          slotIndex={index}
          onClick={() => onUsePotion(index)}
          disabled={disabled}
        />
      ))}
    </div>
  );
}

// Gold display
interface GoldDisplayProps {
  amount: number;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export function GoldDisplay({ amount, size = 'md', showIcon = true }: GoldDisplayProps) {
  const textSizes = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
  };

  return (
    <div className={clsx('flex items-center gap-1 text-yellow-400 font-bold', textSizes[size])}>
      {showIcon && <span>💰</span>}
      <span>{amount}</span>
    </div>
  );
}
