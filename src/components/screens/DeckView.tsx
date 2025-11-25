import { useMemo } from 'react';
import { clsx } from 'clsx';
import { Button } from '@/components/ui/Button';
import { Panel } from '@/components/ui/Panel';
import { CardGrid } from '@/components/game/Card';
import { useGameStore } from '@/stores/gameStore';
import type { Card as CardType } from '@/types';

type DeckViewMode = 'DECK' | 'DRAW' | 'DISCARD' | 'EXHAUST';

interface DeckViewProps {
  mode?: DeckViewMode;
  onClose: () => void;
  onCardSelect?: (card: CardType, index: number) => void;
  selectMode?: boolean;
  selectFilter?: (card: CardType) => boolean;
}

const modeConfig: Record<DeckViewMode, { title: string; icon: string; emptyText: string }> = {
  DECK: { title: 'Your Deck', icon: '🎴', emptyText: 'Your deck is empty' },
  DRAW: { title: 'Draw Pile', icon: '📚', emptyText: 'Draw pile is empty' },
  DISCARD: { title: 'Discard Pile', icon: '🗑️', emptyText: 'Discard pile is empty' },
  EXHAUST: { title: 'Exhausted Cards', icon: '💨', emptyText: 'No exhausted cards' },
};

export function DeckView({ 
  mode = 'DECK', 
  onClose, 
  onCardSelect,
  selectMode = false,
  selectFilter 
}: DeckViewProps) {
  const { player, combat, deckViewMode } = useGameStore();
  
  // Get cards based on mode
  const cards = useMemo(() => {
    const actualMode = mode || deckViewMode;
    switch (actualMode) {
      case 'DECK':
        return [...player.deck].sort((a, b) => {
          // Sort by type, then by cost, then by name
          if (a.type !== b.type) return a.type.localeCompare(b.type);
          if (a.cost !== b.cost) return a.cost - b.cost;
          return a.name.localeCompare(b.name);
        });
      case 'DRAW':
        return combat?.drawPile || [];
      case 'DISCARD':
        return combat?.discardPile || [];
      case 'EXHAUST':
        return combat?.exhaustPile || [];
      default:
        return [];
    }
  }, [player.deck, combat, mode, deckViewMode]);

  // Group cards by type for deck view
  const cardsByType = useMemo(() => {
    if (mode !== 'DECK') return null;
    
    const groups: Record<string, CardType[]> = {
      ATTACK: [],
      SKILL: [],
      POWER: [],
      CURSE: [],
      STATUS: [],
    };
    
    cards.forEach(card => {
      if (groups[card.type]) {
        groups[card.type].push(card);
      }
    });
    
    return groups;
  }, [cards, mode]);

  // Stats
  const stats = useMemo(() => {
    const attacks = cards.filter(c => c.type === 'ATTACK').length;
    const skills = cards.filter(c => c.type === 'SKILL').length;
    const powers = cards.filter(c => c.type === 'POWER').length;
    const curses = cards.filter(c => c.type === 'CURSE' || c.type === 'STATUS').length;
    const upgraded = cards.filter(c => c.upgraded).length;
    
    return { attacks, skills, powers, curses, upgraded, total: cards.length };
  }, [cards]);

  const config = modeConfig[mode || deckViewMode];

  const handleCardClick = (card: CardType, index: number) => {
    if (selectMode && onCardSelect) {
      if (!selectFilter || selectFilter(card)) {
        onCardSelect(card, index);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-8">
      <Panel className="w-full max-w-6xl max-h-[90vh] flex flex-col" border="gold">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-700">
          <div className="flex items-center gap-4">
            <span className="text-3xl">{config.icon}</span>
            <div>
              <h2 className="text-2xl font-game text-yellow-500">{config.title}</h2>
              <p className="text-gray-400 text-sm">{stats.total} cards</p>
            </div>
          </div>

          {/* Stats bar */}
          <div className="flex items-center gap-6">
            <StatBadge label="Attacks" value={stats.attacks} color="text-red-400" />
            <StatBadge label="Skills" value={stats.skills} color="text-green-400" />
            <StatBadge label="Powers" value={stats.powers} color="text-blue-400" />
            {stats.curses > 0 && (
              <StatBadge label="Curses" value={stats.curses} color="text-purple-400" />
            )}
            <StatBadge label="Upgraded" value={stats.upgraded} color="text-yellow-400" />
          </div>

          <Button variant="secondary" onClick={onClose}>
            ✕ Close
          </Button>
        </div>

        {/* Select mode instruction */}
        {selectMode && (
          <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-3 mb-4 text-center">
            <p className="text-yellow-400">Select a card</p>
          </div>
        )}

        {/* Card display */}
        <div className="flex-1 overflow-auto">
          {cards.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500 text-lg">{config.emptyText}</p>
            </div>
          ) : mode === 'DECK' && cardsByType ? (
            // Grouped view for deck
            <div className="space-y-8">
              {Object.entries(cardsByType).map(([type, typeCards]) => {
                if (typeCards.length === 0) return null;
                
                return (
                  <div key={type}>
                    <h3 className={clsx(
                      'text-lg font-semibold mb-4 flex items-center gap-2',
                      type === 'ATTACK' && 'text-red-400',
                      type === 'SKILL' && 'text-green-400',
                      type === 'POWER' && 'text-blue-400',
                      type === 'CURSE' && 'text-purple-400',
                      type === 'STATUS' && 'text-gray-400',
                    )}>
                      {type} ({typeCards.length})
                    </h3>
                    <CardGrid
                      cards={typeCards}
                      cardSize="sm"
                      columns={8}
                      onCardClick={selectMode ? handleCardClick : undefined}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            // Simple grid view for draw/discard/exhaust
            <CardGrid
              cards={cards}
              cardSize="sm"
              columns={8}
              onCardClick={selectMode ? handleCardClick : undefined}
            />
          )}
        </div>
      </Panel>
    </div>
  );
}

function StatBadge({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="text-center">
      <p className={clsx('text-lg font-bold font-mono', color)}>{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}

// Export a wrapper component that uses the store
export function DeckViewOverlay() {
  const { showDeckView, deckViewMode, setShowDeckView } = useGameStore();
  
  if (!showDeckView) return null;
  
  return (
    <DeckView
      mode={deckViewMode}
      onClose={() => setShowDeckView(false)}
    />
  );
}
