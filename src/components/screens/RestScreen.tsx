import { useState } from 'react';
import { clsx } from 'clsx';
import { Button } from '@/components/ui/Button';
import { Panel } from '@/components/ui/Panel';
import { HpBar } from '@/components/ui/ProgressBar';
import { useGameStore } from '@/stores/gameStore';

export function RestScreen() {
  const { player, heal, setScreen, setShowDeckView } = useGameStore();
  const [actionTaken, setActionTaken] = useState(false);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);

  const healAmount = Math.floor(player.maxHp * 0.3);
  const canHeal = player.currentHp < player.maxHp;
  const hasUpgradableCards = player.deck.some(c => !c.upgraded);

  const handleRest = () => {
    heal(healAmount);
    setSelectedAction('rest');
    setActionTaken(true);
  };

  const handleSmith = () => {
    setShowDeckView(true, 'DECK');
    // TODO: Open card upgrade selection
    setSelectedAction('smith');
    setActionTaken(true);
  };

  const handleContinue = () => {
    setScreen('MAP');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-amber-950/20 to-black flex items-center justify-center p-8">
      {/* Ambient fire effect */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-orange-900/20 via-transparent to-transparent pointer-events-none" />

      <Panel className="w-full max-w-2xl relative z-10" border="gold">
        {/* Header */}
        <div className="text-center mb-8">
          <span className="text-6xl mb-4 block animate-float">🔥</span>
          <h1 className="text-4xl font-game text-orange-400 mb-2">Rest Site</h1>
          <p className="text-gray-400">
            A moment of respite in your journey...
          </p>
        </div>

        {/* Player HP */}
        <div className="mb-8">
          <p className="text-sm text-gray-400 mb-2">Current Health</p>
          <HpBar 
            current={player.currentHp} 
            max={player.maxHp} 
            size="lg" 
            labelPosition="inside"
          />
        </div>

        {/* Actions */}
        {!actionTaken ? (
          <div className="grid grid-cols-2 gap-6">
            {/* Rest Option */}
            <button
              onClick={handleRest}
              disabled={!canHeal}
              className={clsx(
                'p-6 rounded-xl border-2 transition-all duration-200 text-left',
                'bg-gradient-to-br from-red-900/50 to-red-950/50',
                canHeal 
                  ? 'border-red-700 hover:border-red-500 hover:scale-105 cursor-pointer' 
                  : 'border-gray-700 opacity-50 cursor-not-allowed'
              )}
            >
              <span className="text-4xl mb-3 block">💤</span>
              <h3 className="text-xl font-bold text-red-400 mb-2">Rest</h3>
              <p className="text-gray-400 text-sm mb-3">
                Heal for 30% of your max HP
              </p>
              <p className="text-green-400 font-mono">
                +{healAmount} HP
              </p>
              {!canHeal && (
                <p className="text-yellow-500 text-xs mt-2">Already at full health</p>
              )}
            </button>

            {/* Smith Option */}
            <button
              onClick={handleSmith}
              disabled={!hasUpgradableCards}
              className={clsx(
                'p-6 rounded-xl border-2 transition-all duration-200 text-left',
                'bg-gradient-to-br from-blue-900/50 to-blue-950/50',
                hasUpgradableCards
                  ? 'border-blue-700 hover:border-blue-500 hover:scale-105 cursor-pointer'
                  : 'border-gray-700 opacity-50 cursor-not-allowed'
              )}
            >
              <span className="text-4xl mb-3 block">🔨</span>
              <h3 className="text-xl font-bold text-blue-400 mb-2">Smith</h3>
              <p className="text-gray-400 text-sm mb-3">
                Upgrade a card in your deck
              </p>
              <p className="text-blue-400 font-mono">
                Enhance a card
              </p>
              {!hasUpgradableCards && (
                <p className="text-yellow-500 text-xs mt-2">No cards to upgrade</p>
              )}
            </button>
          </div>
        ) : (
          <div className="text-center">
            {/* Action Result */}
            <div className={clsx(
              'p-6 rounded-xl border-2 mb-6',
              selectedAction === 'rest' 
                ? 'bg-red-900/30 border-red-700' 
                : 'bg-blue-900/30 border-blue-700'
            )}>
              {selectedAction === 'rest' ? (
                <>
                  <span className="text-4xl mb-3 block">💖</span>
                  <h3 className="text-xl font-bold text-green-400 mb-2">Feeling Rested</h3>
                  <p className="text-gray-300">
                    You healed for <span className="text-green-400 font-bold">{healAmount}</span> HP
                  </p>
                </>
              ) : (
                <>
                  <span className="text-4xl mb-3 block">⬆️</span>
                  <h3 className="text-xl font-bold text-blue-400 mb-2">Card Upgraded</h3>
                  <p className="text-gray-300">
                    Your card has been enhanced
                  </p>
                </>
              )}
            </div>

            <Button variant="gold" size="lg" onClick={handleContinue}>
              Continue Journey
            </Button>
          </div>
        )}

        {/* Skip button (if no action taken) */}
        {!actionTaken && (
          <div className="mt-6 text-center">
            <Button variant="ghost" onClick={handleContinue}>
              Leave without resting
            </Button>
          </div>
        )}
      </Panel>
    </div>
  );
}
