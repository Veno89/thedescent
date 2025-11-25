import { Button } from '@/components/ui/Button';
import { Panel } from '@/components/ui/Panel';
import { useGameStore } from '@/stores/gameStore';

export function MainMenu() {
  const setScreen = useGameStore(s => s.setScreen);

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black flex flex-col items-center justify-center p-8">
      {/* Background effect */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
      
      {/* Title */}
      <div className="relative text-center mb-12">
        <h1 className="text-8xl font-game font-bold text-red-800 tracking-wider text-shadow mb-4">
          THE DESCENT
        </h1>
        <p className="text-2xl text-yellow-600 font-game">
          A Deck-Building Roguelike
        </p>
        
        {/* Decorative line */}
        <div className="mt-6 flex items-center justify-center gap-4">
          <div className="h-px w-32 bg-gradient-to-r from-transparent to-red-800" />
          <span className="text-red-800">⚔️</span>
          <div className="h-px w-32 bg-gradient-to-l from-transparent to-red-800" />
        </div>
      </div>

      {/* Menu Panel */}
      <Panel className="w-full max-w-md" border="gold">
        <div className="space-y-4">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={() => setScreen('CHARACTER_SELECT')}
          >
            ⚔️ Start New Run
          </Button>

          <Button
            variant="secondary"
            size="lg"
            fullWidth
            disabled
          >
            📜 Continue
          </Button>

          <Button
            variant="secondary"
            size="lg"
            fullWidth
            disabled
          >
            ⚙️ Settings
          </Button>
        </div>
      </Panel>

      {/* Stats Preview */}
      <Panel className="mt-8 w-full max-w-md" variant="dark">
        <h3 className="text-yellow-500 font-semibold mb-4">📊 Statistics</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-400">Runs Started</p>
            <p className="text-white text-lg font-mono">0</p>
          </div>
          <div>
            <p className="text-gray-400">Victories</p>
            <p className="text-green-400 text-lg font-mono">0</p>
          </div>
          <div>
            <p className="text-gray-400">Defeats</p>
            <p className="text-red-400 text-lg font-mono">0</p>
          </div>
          <div>
            <p className="text-gray-400">Win Rate</p>
            <p className="text-yellow-400 text-lg font-mono">0%</p>
          </div>
        </div>
      </Panel>

      {/* Version */}
      <p className="absolute bottom-4 right-4 text-gray-600 text-sm">v0.2.0</p>
      <p className="absolute bottom-4 left-4 text-gray-600 text-sm">Press ESC to exit</p>
    </div>
  );
}
