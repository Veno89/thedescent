# The Descent

A deck-building roguelike game inspired by Slay the Spire, built with TypeScript and Phaser 3.

## 🎮 About

The Descent is a single-player deck-building roguelike where you battle enemies, collect powerful relics, and build your deck as you descend through dangerous floors. Each run is unique, with randomized encounters, events, and rewards.

## ✨ Features

### Core Gameplay
- **Turn-Based Card Combat**: Strategic deck-building combat system with energy management
- **Procedural Map Generation**: Each run features a unique path through multiple room types
- **43 Unique Relics**: Passive items that modify your playstyle
- **15 Potions**: Consumable items for emergency situations
- **23 Random Events**: Interactive story moments with meaningful choices

### Enemy Variety
- **5 Normal Enemies**: Standard encounters (Cultist, Jaw Worm, Red/Green Louse, Fungi Beast)
- **3 Elite Enemies**: Tougher fights with better rewards (Gremlin Nob, Lagavulin, Sentry × 3)
- **2 Boss Enemies**: Epic encounters that end your run (Slime Boss, The Guardian)

### Room Types
- 🗡️ **Combat**: Fight 1-3 normal enemies
- 👹 **Elite**: Face powerful elite enemies for greater rewards
- 💀 **Boss**: The final challenge of your run
- 🔥 **Rest Site**: Heal or upgrade a card
- 🛒 **Merchant**: Buy cards, relics, potions, or remove cards from your deck
- 📦 **Treasure**: Guaranteed relic reward
- ❓ **Event**: Random events with choices and outcomes

### Quality of Life Features
- **Deck Viewing System**: View your full deck, draw pile, discard pile, and exhaust pile during combat
- **Card Selection UI**: Choose which cards to upgrade, remove, or transform
- **Detailed Statistics**: Track your progress with comprehensive end-of-run stats
- **Visual Feedback**: Floating damage numbers, screen shake, and smooth animations

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd thedescent
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## 🎯 How to Play

### Combat Basics
- **Energy**: You have 3 energy per turn to play cards
- **Cards**: Play attack cards to damage enemies, skill cards for effects, and power cards for permanent buffs
- **Block**: Prevents damage but resets at the start of your turn
- **Hand**: Draw 5 cards at the start of each turn

### Card Types
- **Attack** (Red): Deal damage to enemies
- **Skill** (Green): Defensive and utility effects
- **Power** (Blue): Permanent effects that last the entire combat
- **Status/Curse** (Gray): Usually negative effects added to your deck

### Controls
- **Click cards** to select them
- **Click enemies** to target your attacks
- **Click "End Turn"** to finish your turn
- **Click pile counters** to view draw/discard piles
- **Click "View Deck"** to see all cards in your deck
- **ESC** to close deck view

### Tips for Success
1. **Thin your deck**: Remove weak starter cards when possible
2. **Balance your deck**: Mix offensive and defensive cards
3. **Relics are powerful**: Prioritize relic rewards when you can
4. **Plan your path**: Choose your route through the map strategically
5. **Upgrade wisely**: Upgraded cards are significantly more powerful
6. **Don't be greedy**: Sometimes it's better to heal than to upgrade
7. **Potions save runs**: Use them in tough fights, don't hoard them

## 🏗️ Project Structure

```
src/
├── data/              # Game content (cards, enemies, relics, potions, events)
│   ├── cards/        # Card definitions (starter and advanced)
│   ├── enemies/      # Enemy data (Act 1 enemies)
│   ├── relics/       # Relic definitions (43 relics)
│   ├── potions/      # Potion data (15 potions)
│   └── events/       # Event data (23 events)
├── entities/          # Game entities
│   ├── Player.ts     # Player entity
│   ├── Relic.ts      # Relic entity class
│   └── Potion.ts     # Potion entity class
├── scenes/            # Phaser scenes (all game screens)
│   ├── BootScene.ts          # Initial loading
│   ├── MainMenuScene.ts      # Main menu
│   ├── MapScene.ts           # Map/path selection
│   ├── CombatScene.ts        # Combat gameplay
│   ├── RewardScene.ts        # Post-combat rewards
│   ├── RestScene.ts          # Rest site
│   ├── EventScene.ts         # Random events
│   ├── MerchantScene.ts      # Shop
│   ├── CardSelectionScene.ts # Card selection UI
│   ├── DeckViewScene.ts      # Deck viewing
│   ├── VictoryScene.ts       # Run victory
│   └── DefeatScene.ts        # Run defeat
├── systems/           # Game systems
│   ├── CombatManager.ts    # Combat logic
│   └── GameStateManager.ts # Run state management
├── ui/                # UI components
│   ├── CardSprite.ts    # Card visual component
│   ├── EnemySprite.ts   # Enemy visual component
│   ├── RelicSprite.ts   # Relic visual component
│   └── PotionSprite.ts  # Potion visual component
├── utils/             # Utilities
│   └── DataLoader.ts  # JSON data loading
└── types/             # TypeScript type definitions
    └── index.ts       # Core game types
```

## 🛠️ Technologies Used

- **TypeScript**: Type-safe JavaScript
- **Phaser 3**: 2D game framework
- **Vite**: Fast build tool and dev server
- **JSON**: Data-driven content system

## 📊 Game Content Stats

- **Cards**: 30+ unique cards (starter + advanced)
- **Relics**: 43 unique relics (1 starter, 13 common, 14 uncommon, 15 rare)
- **Potions**: 15 different potions (10 common, 3 uncommon, 2 rare)
- **Events**: 23 random events with multiple choices
- **Enemies**: 10 unique enemies (5 normal, 3 elite, 2 boss)

## 🎨 Design Philosophy

This game uses text-based UI and emoji icons for a minimalist aesthetic. All game logic and systems are implemented from scratch using a data-driven architecture where content is defined in JSON files.

## 📋 Development Phases Completed

- ✅ **Phase 0**: Project Setup & Foundation
- ✅ **Phase 1**: Core Combat System
- ✅ **Phase 2**: Card Effects & Status System
- ✅ **Phase 3**: Map & Progression System
- ✅ **Phase 4**: Relics & Potions (43 relics, 15 potions)
- ✅ **Phase 5**: Events & Merchant System (23 events, full shop)
- ✅ **Phase 6**: Card Selection UI & Victory/Defeat Screens
- ✅ **Phase 7**: Enemy Expansion (Elite & Boss enemies)
- ✅ **Phase 8**: Deck View System & Combat Animations

## 🔮 Future Enhancements

- Multiple playable characters with unique decks
- Unlockable cards and relics
- Achievement system
- Save/load functionality
- Run statistics and history
- Sound effects and music
- Additional acts and content
- More card synergies and combos
- Daily challenges
- Ascension mode for increased difficulty

## 🐛 Known Limitations

- No sound effects or music
- Single character only
- No save/load (runs must be completed in one session)
- Limited to Act 1 content

## 🤝 Contributing

This is a solo development project, but feedback and suggestions are welcome!

## 📝 License

This project is for educational purposes.

## 🙏 Acknowledgments

- Inspired by **Slay the Spire** by MegaCrit
- Built with **Phaser 3** game framework
- Thanks to the roguelike community for design inspiration

---

**Version**: 1.0.0
**Last Updated**: 2025-11-21
**Made with TypeScript and Phaser 3**
