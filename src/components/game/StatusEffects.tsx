import { clsx } from 'clsx';
import type { StatusEffects } from '@/types';

interface StatusDisplayProps {
  effects: StatusEffects;
  compact?: boolean;
  className?: string;
}

interface StatusInfo {
  key: keyof StatusEffects;
  icon: string;
  name: string;
  type: 'buff' | 'debuff' | 'neutral';
  description: string;
}

const statusConfig: StatusInfo[] = [
  // Buffs
  { key: 'strength', icon: '⚔️', name: 'Might', type: 'buff', description: 'Deal additional damage with attacks' },
  { key: 'dexterity', icon: '🏃', name: 'Agility', type: 'buff', description: 'Gain additional block from cards' },
  { key: 'artifact', icon: '💎', name: 'Warding', type: 'buff', description: 'Negates next debuff applied' },
  { key: 'platedArmor', icon: '🪨', name: 'Ore Plating', type: 'buff', description: 'Gain block at end of turn, reduced when hit' },
  { key: 'thorns', icon: '⚡', name: 'Reactive', type: 'buff', description: 'Deal damage back when attacked' },
  { key: 'ritual', icon: '🔥', name: 'Building Power', type: 'buff', description: 'Gain Might each turn' },
  { key: 'intangible', icon: '👻', name: 'Phased', type: 'buff', description: 'All damage reduced to 1' },
  // Debuffs
  { key: 'weak', icon: '💫', name: 'Weakened', type: 'debuff', description: 'Deal 25% less damage' },
  { key: 'vulnerable', icon: '🎯', name: 'Exposed', type: 'debuff', description: 'Take 50% more damage' },
  { key: 'frail', icon: '💔', name: 'Brittle', type: 'debuff', description: 'Gain 25% less block' },
  { key: 'poison', icon: '☠️', name: 'Corroded', type: 'debuff', description: 'Take damage at start of turn, then decreases' },
];

export function StatusDisplay({ effects, compact = false, className }: StatusDisplayProps) {
  const activeEffects = statusConfig.filter(s => effects[s.key] !== 0);

  if (activeEffects.length === 0) return null;

  return (
    <div className={clsx('flex flex-wrap gap-1', className)}>
      {activeEffects.map(status => (
        <StatusBadge
          key={status.key}
          status={status}
          value={effects[status.key]}
          compact={compact}
        />
      ))}
    </div>
  );
}

interface StatusBadgeProps {
  status: StatusInfo;
  value: number;
  compact?: boolean;
}

export function StatusBadge({ status, value, compact }: StatusBadgeProps) {
  const isNegativeValue = value < 0;
  const displayValue = Math.abs(value);
  const effectiveType = isNegativeValue ? 'debuff' : status.type;

  return (
    <div
      className={clsx(
        'status-badge group relative',
        effectiveType === 'buff' && 'status-buff',
        effectiveType === 'debuff' && 'status-debuff',
        effectiveType === 'neutral' && 'bg-gray-700 text-gray-300 border-gray-600',
      )}
      title={`${status.name}: ${status.description}`}
    >
      <span>{status.icon}</span>
      <span className="font-mono">{isNegativeValue ? '-' : ''}{displayValue}</span>
      
      {/* Tooltip on hover */}
      {!compact && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50">
          <div className="bg-gray-900 border border-gray-600 rounded px-3 py-2 text-xs whitespace-nowrap shadow-xl">
            <p className="font-semibold text-white">{status.name}</p>
            <p className="text-gray-400">{status.description}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Block display component
interface BlockDisplayProps {
  block: number;
  size?: 'sm' | 'md' | 'lg';
}

export function BlockDisplay({ block, size = 'md' }: BlockDisplayProps) {
  if (block <= 0) return null;

  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-12 h-12 text-lg',
    lg: 'w-16 h-16 text-2xl',
  };

  return (
    <div
      className={clsx(
        'rounded-full bg-gradient-to-br from-cyan-500 to-cyan-700',
        'border-2 border-cyan-300 flex items-center justify-center',
        'font-bold text-white shadow-lg shadow-cyan-500/30',
        sizeClasses[size]
      )}
    >
      {block}
    </div>
  );
}

// Combined player stats display
interface PlayerStatsProps {
  hp: number;
  maxHp: number;
  block: number;
  energy: number;
  maxEnergy: number;
  effects: StatusEffects;
  compact?: boolean;
}

export function PlayerStats({ hp, maxHp, block, energy, maxEnergy, effects, compact }: PlayerStatsProps) {
  return (
    <div className="space-y-3">
      {/* HP Bar */}
      <div className="flex items-center gap-3">
        <span className="text-red-400">❤️</span>
        <div className="flex-1 h-6 bg-gray-800 rounded-full overflow-hidden border border-gray-600">
          <div
            className={clsx(
              'h-full transition-all duration-300',
              hp / maxHp > 0.6 ? 'bg-gradient-to-r from-green-600 to-green-500' :
              hp / maxHp > 0.3 ? 'bg-gradient-to-r from-yellow-600 to-yellow-500' :
              'bg-gradient-to-r from-red-600 to-red-500'
            )}
            style={{ width: `${(hp / maxHp) * 100}%` }}
          />
        </div>
        <span className="text-white font-mono text-sm w-20 text-right">
          {hp}/{maxHp}
        </span>
      </div>

      {/* Energy & Block */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="energy-orb w-10 h-10 text-lg">
            {energy}
          </div>
          <span className="text-gray-400 text-sm">/{maxEnergy}</span>
        </div>

        {block > 0 && (
          <div className="flex items-center gap-2">
            <BlockDisplay block={block} size="sm" />
            <span className="text-cyan-400 text-sm">Block</span>
          </div>
        )}
      </div>

      {/* Status Effects */}
      <StatusDisplay effects={effects} compact={compact} />
    </div>
  );
}
