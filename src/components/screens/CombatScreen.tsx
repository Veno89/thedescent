import { useCallback, useState } from 'react';
import { clsx } from 'clsx';
import { Button } from '@/components/ui/Button';
import { Panel } from '@/components/ui/Panel';
import { Card } from '@/components/game/Card';
import { StatusDisplay, BlockDisplay } from '@/components/game/StatusEffects';
import { HpBar, EnergyDisplay } from '@/components/ui/ProgressBar';
import { PotionBar, RelicBar, GoldDisplay } from '@/components/game/Inventory';
import { useGameStore } from '@/stores/gameStore';
import type { Card as CardType, Enemy, Player } from '@/types';

export function CombatScreen() {
  const { 
    player, 
    combat, 
    updateCombat,
    setShowDeckView 
  } = useGameStore();
  
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
  const [animatingCard, setAnimatingCard] = useState<number | null>(null);

  // Handle card selection
  const handleCardClick = useCallback((card: CardType, index: number) => {
    if (!combat?.isPlayerTurn) return;
    if (card.cost > player.energy && !card.isXCost) return;

    if (card.targetType === 'SINGLE_ENEMY') {
      setSelectedCardIndex(index);
      // If only one enemy, auto-target
      if (combat.enemies.length === 1) {
        playCard(index, 0);
      }
    } else {
      playCard(index, null);
    }
  }, [combat, player.energy]);

  // Handle enemy targeting
  const handleEnemyClick = useCallback((enemyIndex: number) => {
    if (selectedCardIndex !== null) {
      playCard(selectedCardIndex, enemyIndex);
    }
  }, [selectedCardIndex]);

  // Play a card
  const playCard = useCallback((cardIndex: number, _targetIndex: number | null) => {
    if (!combat) return;
    
    setAnimatingCard(cardIndex);
    
    // Simulate card play animation
    setTimeout(() => {
      // TODO: Implement actual card effect execution
      const hand = [...combat.hand];
      const playedCard = hand.splice(cardIndex, 1)[0];
      const discardPile = [...combat.discardPile, playedCard];
      
      updateCombat({ hand, discardPile });
      setSelectedCardIndex(null);
      setAnimatingCard(null);
    }, 300);
  }, [combat, updateCombat]);

  // End turn
  const handleEndTurn = useCallback(() => {
    if (!combat) return;
    
    updateCombat({ isPlayerTurn: false });
    
    // Simulate enemy turn
    setTimeout(() => {
      // TODO: Implement enemy AI
      updateCombat({ 
        isPlayerTurn: true,
        turn: combat.turn + 1 
      });
    }, 1500);
  }, [combat, updateCombat]);

  // Cancel targeting
  const handleCancelTarget = useCallback(() => {
    setSelectedCardIndex(null);
  }, []);

  // Use potion
  const handleUsePotion = useCallback((index: number) => {
    // TODO: Implement potion usage
    console.log('Use potion', index);
  }, []);

  if (!combat) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-red-500">Combat not initialized</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-panel-dark to-black flex flex-col overflow-hidden">
      {/* Top Bar - Player Info */}
      <TopBar 
        player={player}
        onShowDeck={() => setShowDeckView(true, 'DECK')}
        onShowDraw={() => setShowDeckView(true, 'DRAW')}
        onShowDiscard={() => setShowDeckView(true, 'DISCARD')}
        drawCount={combat.drawPile.length}
        discardCount={combat.discardPile.length}
      />

      {/* Main Combat Area */}
      <div className="flex-1 flex flex-col">
        {/* Enemy Area */}
        <div className="flex-1 flex items-center justify-center gap-8 p-8">
          {combat.enemies.map((enemy, index) => (
            <EnemyDisplay
              key={`enemy-${index}`}
              enemy={enemy}
              index={index}
              isTargetable={selectedCardIndex !== null}
              onClick={() => handleEnemyClick(index)}
            />
          ))}
        </div>

        {/* Center - Turn indicator & player */}
        <div className="flex justify-center items-center py-4">
          <Panel className="px-8 py-4 flex items-center gap-8" border="blue">
            <EnergyDisplay current={player.energy} max={player.maxEnergy} />
            
            <div className="h-12 w-px bg-gray-700" />
            
            <div className="text-center">
              <p className="text-gray-400 text-sm">Turn {combat.turn}</p>
              <p className={clsx(
                'font-bold',
                combat.isPlayerTurn ? 'text-green-400' : 'text-red-400'
              )}>
                {combat.isPlayerTurn ? 'Your Turn' : 'Enemy Turn'}
              </p>
            </div>

            <div className="h-12 w-px bg-gray-700" />

            <Button
              variant="primary"
              onClick={handleEndTurn}
              disabled={!combat.isPlayerTurn}
            >
              End Turn
            </Button>
          </Panel>
        </div>

        {/* Hand Area */}
        <div className="h-64 relative">
          <HandDisplay
            hand={combat.hand}
            energy={player.energy}
            selectedIndex={selectedCardIndex}
            animatingIndex={animatingCard}
            onCardClick={handleCardClick}
            isPlayerTurn={combat.isPlayerTurn}
          />
        </div>
      </div>

      {/* Targeting Overlay */}
      {selectedCardIndex !== null && (
        <div 
          className="fixed inset-0 bg-black/30 z-40"
          onClick={handleCancelTarget}
        >
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-yellow-900 text-yellow-200 px-6 py-2 rounded-lg">
            Select a target (click to cancel)
          </div>
        </div>
      )}

      {/* Potion Bar (bottom left) */}
      <div className="fixed bottom-4 left-4 z-50">
        <PotionBar
          potions={player.potions}
          onUsePotion={handleUsePotion}
          disabled={!combat.isPlayerTurn}
        />
      </div>
    </div>
  );
}

// Top Bar Component
interface TopBarProps {
  player: Player;
  onShowDeck: () => void;
  onShowDraw: () => void;
  onShowDiscard: () => void;
  drawCount: number;
  discardCount: number;
}

function TopBar({ player, onShowDeck, onShowDraw, onShowDiscard, drawCount, discardCount }: TopBarProps) {
  return (
    <div className="bg-panel-dark/90 backdrop-blur border-b border-gray-700 px-6 py-3">
      <div className="flex items-center justify-between">
        {/* Left - HP and Block */}
        <div className="flex items-center gap-6">
          <div className="w-64">
            <HpBar
              current={player.currentHp}
              max={player.maxHp}
              size="md"
              labelPosition="inside"
            />
          </div>
          {player.block > 0 && (
            <BlockDisplay block={player.block} size="md" />
          )}
          <StatusDisplay effects={player.statusEffects} compact />
        </div>

        {/* Center - Relics */}
        <RelicBar relics={player.relics} />

        {/* Right - Deck info & Gold */}
        <div className="flex items-center gap-4">
          <button
            onClick={onShowDraw}
            className="flex items-center gap-2 px-3 py-2 rounded bg-panel hover:bg-panel-light transition-colors"
          >
            <span className="text-blue-400">📚</span>
            <span className="text-white font-mono">{drawCount}</span>
          </button>
          
          <button
            onClick={onShowDiscard}
            className="flex items-center gap-2 px-3 py-2 rounded bg-panel hover:bg-panel-light transition-colors"
          >
            <span className="text-gray-400">🗑️</span>
            <span className="text-white font-mono">{discardCount}</span>
          </button>
          
          <button
            onClick={onShowDeck}
            className="flex items-center gap-2 px-3 py-2 rounded bg-panel hover:bg-panel-light transition-colors"
          >
            <span className="text-yellow-400">🎴</span>
            <span className="text-white font-mono">{player.deck.length}</span>
          </button>

          <div className="h-8 w-px bg-gray-700" />
          
          <GoldDisplay amount={player.gold} />
        </div>
      </div>
    </div>
  );
}

// Enemy Display Component
interface EnemyDisplayProps {
  enemy: Enemy;
  index: number;
  isTargetable: boolean;
  onClick: () => void;
}

function EnemyDisplay({ enemy, isTargetable, onClick }: EnemyDisplayProps) {
  const hpPercent = enemy.currentHp / enemy.maxHp;
  
  return (
    <div
      className={clsx(
        'relative transition-all duration-200',
        isTargetable && 'cursor-crosshair hover:scale-105'
      )}
      onClick={isTargetable ? onClick : undefined}
    >
      {/* Enemy sprite placeholder */}
      <div
        className={clsx(
          'w-40 h-48 rounded-lg border-2 flex flex-col items-center justify-center',
          'bg-gradient-to-b from-gray-800 to-gray-900',
          isTargetable ? 'border-red-500 shadow-lg shadow-red-500/30' : 'border-gray-600'
        )}
      >
        <span className="text-6xl mb-2">👹</span>
        <p className="text-white font-bold">{enemy.name}</p>
      </div>

      {/* Intent display */}
      <div className="absolute -top-12 left-1/2 -translate-x-1/2">
        <IntentDisplay intent={enemy.currentIntent} />
      </div>

      {/* HP Bar */}
      <div className="mt-2">
        <div className="h-4 bg-gray-800 rounded-full overflow-hidden border border-gray-600">
          <div
            className={clsx(
              'h-full transition-all duration-300',
              hpPercent > 0.5 ? 'bg-red-600' : hpPercent > 0.25 ? 'bg-orange-600' : 'bg-red-800'
            )}
            style={{ width: `${hpPercent * 100}%` }}
          />
        </div>
        <p className="text-center text-sm text-white font-mono mt-1">
          {enemy.currentHp} / {enemy.maxHp}
        </p>
      </div>

      {/* Block indicator */}
      {enemy.block > 0 && (
        <div className="absolute top-2 right-2">
          <BlockDisplay block={enemy.block} size="sm" />
        </div>
      )}

      {/* Status effects */}
      <div className="mt-2">
        <StatusDisplay effects={enemy.statusEffects} compact />
      </div>
    </div>
  );
}

// Intent Display
function IntentDisplay({ intent }: { intent: Enemy['currentIntent'] }) {
  const intentIcons: Record<string, string> = {
    ATTACK: '⚔️',
    DEFEND: '🛡️',
    BUFF: '⬆️',
    DEBUFF: '⬇️',
    UNKNOWN: '❓',
    STUN: '💫',
  };

  return (
    <div className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 flex items-center gap-2">
      <span className="text-xl">{intentIcons[intent.type]}</span>
      {intent.value && (
        <span className={clsx(
          'font-bold',
          intent.type === 'ATTACK' ? 'text-red-400' : 'text-white'
        )}>
          {intent.value}
          {intent.times && intent.times > 1 && (
            <span className="text-gray-400 text-sm ml-1">x{intent.times}</span>
          )}
        </span>
      )}
    </div>
  );
}

// Hand Display Component
interface HandDisplayProps {
  hand: CardType[];
  energy: number;
  selectedIndex: number | null;
  animatingIndex: number | null;
  onCardClick: (card: CardType, index: number) => void;
  isPlayerTurn: boolean;
}

function HandDisplay({ 
  hand, 
  energy, 
  selectedIndex, 
  animatingIndex,
  onCardClick,
  isPlayerTurn 
}: HandDisplayProps) {
  // Calculate card positions in a fan layout
  const getCardStyle = (index: number, total: number) => {
    const centerIndex = (total - 1) / 2;
    const offset = index - centerIndex;
    const rotation = offset * 5; // degrees
    const translateY = Math.abs(offset) * 10; // pixels
    const translateX = offset * 100; // pixels
    
    return {
      transform: `translateX(${translateX}px) translateY(${translateY}px) rotate(${rotation}deg)`,
      zIndex: index,
    };
  };

  return (
    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex items-end justify-center h-full pt-8">
      {hand.map((card, index) => {
        const isPlayable = isPlayerTurn && (card.cost <= energy || card.isXCost);
        const isSelected = selectedIndex === index;
        const isAnimating = animatingIndex === index;

        return (
          <div
            key={`hand-${index}`}
            className={clsx(
              'transition-all duration-200 ease-out',
              isAnimating && 'opacity-0 scale-75 -translate-y-32',
              isSelected && '-translate-y-8'
            )}
            style={getCardStyle(index, hand.length)}
          >
            <Card
              card={card}
              size="md"
              playable={isPlayable}
              selected={isSelected}
              onClick={() => onCardClick(card, index)}
            />
          </div>
        );
      })}
    </div>
  );
}
