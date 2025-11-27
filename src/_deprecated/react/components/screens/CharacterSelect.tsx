import { Button } from '@/components/ui/Button';
import { Panel } from '@/components/ui/Panel';
import { useGameStore } from '@/stores/gameStore';
import type { CharacterClass } from '@/types';
import { clsx } from 'clsx';
import { useState } from 'react';

// Character data - Three unique Delver archetypes
const characters: CharacterClass[] = [
  {
    id: 'excavator',
    name: 'The Excavator',
    description: 'A veteran miner who strikes hard and can take a beating. Balanced offense and defense.',
    maxHp: 80,
    startingGold: 99,
    startingDeck: ['delve', 'delve', 'delve', 'delve', 'delve', 'brace', 'brace', 'brace', 'brace', 'brace', 'sunder'],
    startingRelic: 'miners_resolve',
  },
  {
    id: 'scout',
    name: 'The Scout',
    description: 'A swift explorer who relies on agility and card draw to outmaneuver foes.',
    maxHp: 70,
    startingGold: 99,
    startingDeck: ['delve', 'delve', 'delve', 'delve', 'delve', 'brace', 'brace', 'brace', 'brace', 'tunnel_vision', 'pickaxe_swing'],
    startingRelic: 'serpent_ring',
  },
  {
    id: 'bulwark',
    name: 'The Bulwark',
    description: 'A stalwart defender with high HP who specializes in outlasting enemies.',
    maxHp: 95,
    startingGold: 99,
    startingDeck: ['delve', 'delve', 'delve', 'delve', 'brace', 'brace', 'brace', 'brace', 'brace', 'brace', 'lantern_bash', 'gear_up'],
    startingRelic: 'iron_anchor',
  },
];

export function CharacterSelect() {
  const [selectedChar, setSelectedChar] = useState<CharacterClass | null>(null);
  const { setScreen, startNewRun } = useGameStore();

  const handleStartRun = () => {
    if (selectedChar) {
      startNewRun(selectedChar);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-panel-dark to-black p-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-game font-bold text-white mb-4">
          SELECT YOUR CHARACTER
        </h1>
        <p className="text-gray-400 text-lg">
          Choose wisely - each warrior has unique abilities
        </p>
      </div>

      {/* Character Cards */}
      <div className="flex justify-center gap-8 mb-12">
        {characters.map((char) => (
          <CharacterCard
            key={char.id}
            character={char}
            selected={selectedChar?.id === char.id}
            onClick={() => setSelectedChar(char)}
          />
        ))}
      </div>

      {/* Selected Character Details */}
      {selectedChar && (
        <Panel className="max-w-2xl mx-auto mb-8" border="gold">
          <div className="text-center">
            <h2 className="text-3xl font-game text-yellow-500 mb-4">
              {selectedChar.name}
            </h2>
            <p className="text-gray-300 mb-6">{selectedChar.description}</p>
            
            <div className="grid grid-cols-3 gap-6 mb-6">
              <div>
                <p className="text-red-400 text-sm">❤️ Starting HP</p>
                <p className="text-2xl font-bold text-white">{selectedChar.maxHp}</p>
              </div>
              <div>
                <p className="text-yellow-400 text-sm">💰 Starting Gold</p>
                <p className="text-2xl font-bold text-white">{selectedChar.startingGold}</p>
              </div>
              <div>
                <p className="text-blue-400 text-sm">🎴 Deck Size</p>
                <p className="text-2xl font-bold text-white">{selectedChar.startingDeck.length}</p>
              </div>
            </div>

            <Button variant="gold" size="lg" onClick={handleStartRun}>
              Begin Descent
            </Button>
          </div>
        </Panel>
      )}

      {/* Back button */}
      <div className="text-center">
        <Button variant="ghost" onClick={() => setScreen('MAIN_MENU')}>
          ← Back to Menu
        </Button>
      </div>
    </div>
  );
}

interface CharacterCardProps {
  character: CharacterClass;
  selected: boolean;
  onClick: () => void;
}

function CharacterCard({ character, selected, onClick }: CharacterCardProps) {
  const iconMap: Record<string, string> = {
    excavator: '⛏️',
    scout: '🔦',
    bulwark: '🛡️',
  };

  return (
    <div
      onClick={onClick}
      className={clsx(
        'w-72 cursor-pointer transition-all duration-300',
        'rounded-xl border-2 p-6',
        'bg-gradient-to-b from-panel-light to-panel-dark',
        selected
          ? 'border-yellow-500 scale-105 shadow-xl shadow-yellow-500/20'
          : 'border-gray-700 hover:border-gray-500 hover:scale-102'
      )}
    >
      {/* Character Icon */}
      <div className="text-center mb-4">
        <span className="text-6xl">{iconMap[character.id] || '👤'}</span>
      </div>

      {/* Name */}
      <h3 className={clsx(
        'text-2xl font-game text-center mb-2 transition-colors',
        selected ? 'text-yellow-400' : 'text-white'
      )}>
        {character.name}
      </h3>

      {/* Description */}
      <p className="text-gray-400 text-sm text-center mb-4 leading-relaxed">
        {character.description}
      </p>

      {/* Quick Stats */}
      <div className="flex justify-around text-sm border-t border-gray-700 pt-4">
        <div className="text-center">
          <p className="text-red-400">❤️</p>
          <p className="text-white font-mono">{character.maxHp}</p>
        </div>
        <div className="text-center">
          <p className="text-yellow-400">💰</p>
          <p className="text-white font-mono">{character.startingGold}</p>
        </div>
        <div className="text-center">
          <p className="text-blue-400">🎴</p>
          <p className="text-white font-mono">{character.startingDeck.length}</p>
        </div>
      </div>

      {/* Selected indicator */}
      {selected && (
        <div className="absolute -top-2 -right-2 bg-yellow-500 text-black w-8 h-8 rounded-full flex items-center justify-center font-bold">
          ✓
        </div>
      )}
    </div>
  );
}
