import { useState } from 'react';
import { clsx } from 'clsx';
import type { Card as CardType } from '@/types';

interface CardProps {
  card: CardType;
  size?: 'sm' | 'md' | 'lg';
  playable?: boolean;
  selected?: boolean;
  onClick?: () => void;
  onHover?: (hovering: boolean) => void;
  showTooltip?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'w-28 h-40',
  md: 'w-40 h-56',
  lg: 'w-52 h-72',
};

const typeGradients = {
  ATTACK: 'bg-gradient-to-br from-red-900 via-red-800 to-red-950',
  SKILL: 'bg-gradient-to-br from-green-900 via-green-800 to-green-950',
  POWER: 'bg-gradient-to-br from-blue-900 via-blue-800 to-blue-950',
  CURSE: 'bg-gradient-to-br from-purple-900 via-purple-800 to-purple-950',
  STATUS: 'bg-gradient-to-br from-gray-700 via-gray-600 to-gray-800',
};

const typeBorders = {
  ATTACK: 'border-red-600',
  SKILL: 'border-green-600',
  POWER: 'border-blue-600',
  CURSE: 'border-purple-600',
  STATUS: 'border-gray-500',
};

const rarityGlow = {
  STARTER: '',
  COMMON: '',
  UNCOMMON: 'shadow-blue-500/20',
  RARE: 'shadow-yellow-500/30 shadow-lg',
  SPECIAL: 'shadow-purple-500/30 shadow-lg',
};

export function Card({
  card,
  size = 'md',
  playable = true,
  selected = false,
  onClick,
  onHover,
  className,
}: CardProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Format description with effect values
  const formatDescription = () => {
    let desc = card.description;
    card.effects.forEach((effect, i) => {
      desc = desc.replace(`{${i}}`, String(effect.value));
    });
    return desc;
  };

  // Get keywords
  const keywords: string[] = [];
  if (card.exhaust) keywords.push('Exhaust');
  if (card.retain) keywords.push('Retain');
  if (card.ethereal) keywords.push('Ethereal');
  if (card.innate) keywords.push('Innate');

  const handleMouseEnter = () => {
    setIsHovered(true);
    onHover?.(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    onHover?.(false);
  };

  return (
    <div
      className={clsx(
        // Base styles
        'relative rounded-lg border-2 transition-all duration-200 cursor-pointer select-none',
        sizeClasses[size],
        typeGradients[card.type],
        typeBorders[card.type],
        rarityGlow[card.rarity],
        
        // Interactive states
        playable && 'hover:scale-110 hover:-translate-y-4 hover:z-50',
        playable && 'hover:shadow-xl hover:shadow-yellow-500/30',
        !playable && 'opacity-50 cursor-not-allowed grayscale',
        selected && 'ring-4 ring-yellow-400 scale-105',
        isHovered && playable && 'border-yellow-400',
        
        className
      )}
      onClick={playable ? onClick : undefined}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Energy cost */}
      <div className="absolute -top-2 -left-2 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 border-2 border-blue-300 flex items-center justify-center shadow-lg z-10">
        <span className="text-white font-bold text-lg">
          {card.isXCost ? 'X' : card.cost}
        </span>
      </div>

      {/* Upgraded indicator */}
      {card.upgraded && (
        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-sm z-10">
          +
        </div>
      )}

      {/* Card content */}
      <div className="h-full flex flex-col p-3 pt-5">
        {/* Card name */}
        <h4 className={clsx(
          'font-semibold text-white text-center leading-tight',
          size === 'sm' && 'text-xs',
          size === 'md' && 'text-sm',
          size === 'lg' && 'text-base',
        )}>
          {card.name}
        </h4>

        {/* Card type */}
        <p className={clsx(
          'text-center text-gray-400 mt-1',
          size === 'sm' && 'text-[10px]',
          size === 'md' && 'text-xs',
          size === 'lg' && 'text-sm',
        )}>
          {card.type}
        </p>

        {/* Card art placeholder */}
        <div className={clsx(
          'flex-shrink-0 bg-black/30 rounded border border-white/10 flex items-center justify-center my-2',
          size === 'sm' && 'h-12',
          size === 'md' && 'h-16',
          size === 'lg' && 'h-24',
        )}>
          <span className="text-gray-600 text-xs">[Art]</span>
        </div>

        {/* Description */}
        <p className={clsx(
          'text-gray-200 text-center flex-grow flex items-center justify-center leading-snug',
          size === 'sm' && 'text-[9px]',
          size === 'md' && 'text-xs',
          size === 'lg' && 'text-sm',
        )}>
          {formatDescription()}
        </p>

        {/* Keywords */}
        {keywords.length > 0 && (
          <p className={clsx(
            'text-yellow-400 text-center italic mt-1',
            size === 'sm' && 'text-[8px]',
            size === 'md' && 'text-[10px]',
            size === 'lg' && 'text-xs',
          )}>
            {keywords.join(' • ')}
          </p>
        )}

        {/* Rarity indicator */}
        <div className={clsx(
          'text-center text-gray-500 mt-auto',
          size === 'sm' && 'text-[8px]',
          size === 'md' && 'text-[10px]',
          size === 'lg' && 'text-xs',
        )}>
          {card.rarity}
        </div>
      </div>
    </div>
  );
}

// Card grid for displaying multiple cards
interface CardGridProps {
  cards: CardType[];
  onCardClick?: (card: CardType, index: number) => void;
  selectedIndex?: number | null;
  columns?: number;
  cardSize?: 'sm' | 'md' | 'lg';
}

export function CardGrid({ 
  cards, 
  onCardClick, 
  selectedIndex,
  columns = 5,
  cardSize = 'md',
}: CardGridProps) {
  return (
    <div 
      className="grid gap-4 justify-items-center"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {cards.map((card, index) => (
        <Card
          key={`${card.id}-${index}`}
          card={card}
          size={cardSize}
          selected={selectedIndex === index}
          onClick={() => onCardClick?.(card, index)}
        />
      ))}
    </div>
  );
}

// Tooltip for detailed card info
export function CardTooltip({ card }: { card: CardType }) {
  const formatDescription = () => {
    let desc = card.description;
    card.effects.forEach((effect, i) => {
      desc = desc.replace(`{${i}}`, String(effect.value));
    });
    return desc;
  };

  return (
    <div className="bg-gray-900 border border-gray-600 rounded-lg p-4 shadow-xl max-w-xs">
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-bold text-white">{card.name}</h4>
        <span className="bg-blue-600 text-white px-2 py-0.5 rounded text-sm">
          {card.isXCost ? 'X' : card.cost}
        </span>
      </div>
      <p className="text-gray-400 text-sm mb-2">{card.type} • {card.rarity}</p>
      <p className="text-gray-200 text-sm">{formatDescription()}</p>
      {card.exhaust && <p className="text-yellow-400 text-xs mt-2 italic">Exhaust.</p>}
      {card.retain && <p className="text-yellow-400 text-xs mt-1 italic">Retain.</p>}
      {card.ethereal && <p className="text-yellow-400 text-xs mt-1 italic">Ethereal.</p>}
      {card.innate && <p className="text-yellow-400 text-xs mt-1 italic">Innate.</p>}
    </div>
  );
}
