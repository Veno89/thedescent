import { useGameStore } from '@/stores/gameStore';
import { MainMenu } from '@/components/screens/MainMenu';
import { CharacterSelect } from '@/components/screens/CharacterSelect';
import { MapScreen } from '@/components/screens/MapScreen';
import { CombatScreen } from '@/components/screens/CombatScreen';
import { RestScreen } from '@/components/screens/RestScreen';
import { RewardScreen } from '@/components/screens/RewardScreen';
import { EventScreen } from '@/components/screens/EventScreen';
import { DeckViewOverlay } from '@/components/screens/DeckView';
import { useEffect } from 'react';

// Screen router component
function ScreenRouter() {
  const screen = useGameStore((s) => s.screen);

  switch (screen) {
    case 'MAIN_MENU':
      return <MainMenu />;
    case 'CHARACTER_SELECT':
      return <CharacterSelect />;
    case 'MAP':
      return <MapScreen />;
    case 'COMBAT':
      return <CombatScreen />;
    case 'REST':
      return <RestScreen />;
    case 'REWARD':
      return <RewardScreen />;
    case 'MERCHANT':
      return <MerchantPlaceholder />;
    case 'EVENT':
      return <EventScreen />;
    case 'VICTORY':
      return <VictoryPlaceholder />;
    case 'DEFEAT':
      return <DefeatPlaceholder />;
    default:
      return <MainMenu />;
  }
}

// Placeholder screens (to be implemented)
function MerchantPlaceholder() {
  const setScreen = useGameStore((s) => s.setScreen);
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <span className="text-6xl block mb-4">💰</span>
        <h1 className="text-3xl text-yellow-500 mb-4">Merchant</h1>
        <p className="text-gray-400 mb-8">Coming soon...</p>
        <button 
          onClick={() => setScreen('MAP')}
          className="btn btn-secondary"
        >
          Return to Map
        </button>
      </div>
    </div>
  );
}

function VictoryPlaceholder() {
  const resetGame = useGameStore((s) => s.resetGame);
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <span className="text-6xl block mb-4">🏆</span>
        <h1 className="text-5xl font-game text-yellow-500 mb-4">Victory!</h1>
        <p className="text-gray-400 mb-8">You have conquered the spire!</p>
        <button 
          onClick={resetGame}
          className="btn btn-gold"
        >
          Return to Main Menu
        </button>
      </div>
    </div>
  );
}

function DefeatPlaceholder() {
  const resetGame = useGameStore((s) => s.resetGame);
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <span className="text-6xl block mb-4">💀</span>
        <h1 className="text-5xl font-game text-red-500 mb-4">Defeated</h1>
        <p className="text-gray-400 mb-8">Your journey ends here...</p>
        <button 
          onClick={resetGame}
          className="btn btn-primary"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

// Global keyboard shortcuts
function useGlobalKeyboard() {
  const { screen, setShowDeckView, showDeckView, setScreen } = useGameStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape - close overlays or go back
      if (e.key === 'Escape') {
        if (showDeckView) {
          setShowDeckView(false);
          return;
        }
        // Add more escape handlers as needed
      }

      // D - open deck view (in combat or map)
      if (e.key === 'd' || e.key === 'D') {
        if (screen === 'COMBAT' || screen === 'MAP') {
          setShowDeckView(!showDeckView, 'DECK');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [screen, showDeckView, setShowDeckView, setScreen]);
}

export function App() {
  useGlobalKeyboard();

  return (
    <div className="min-h-screen bg-black text-white">
      <ScreenRouter />
      <DeckViewOverlay />
    </div>
  );
}

export default App;
