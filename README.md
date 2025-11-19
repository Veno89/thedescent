# The Descent

A deck-building roguelike card game inspired by Slay the Spire.

## Tech Stack

- **TypeScript** - Type-safe development
- **Phaser 3** - 2D game framework
- **Vite** - Fast build tool and dev server
- **Tauri** - (Future) Desktop application wrapper for Windows

## Project Status

**Current Phase**: Foundation Complete
**Next Phase**: Phase 1.1 - Card System Implementation

See [ROADMAP.md](./ROADMAP.md) for detailed development plan.

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install
```

### Development

```bash
# Start development server (opens browser at localhost:3000)
npm run dev

# Type checking
npm run typecheck

# Lint code
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
thedescent/
├── src/
│   ├── scenes/          # Phaser scenes (Boot, MainMenu, Combat)
│   ├── systems/         # Game systems (to be implemented)
│   ├── entities/        # Game entities (Player, Enemy, Card)
│   ├── data/            # JSON data files (cards, relics, enemies)
│   ├── ui/              # UI components
│   ├── utils/           # Utility functions
│   ├── types/           # TypeScript type definitions
│   └── main.ts          # Entry point
├── public/              # Static assets (images, audio)
├── dist/                # Build output
└── index.html           # HTML entry point
```

## Current Features

- ✓ Basic scene management (Boot, MainMenu, Combat)
- ✓ Type definitions for core game systems
- ✓ Project structure and build pipeline

## Roadmap Highlights

1. **Phase 1**: Core Combat System - Playable card combat
2. **Phase 2**: Card Effects & Mechanics - Rich interactions
3. **Phase 3**: Progression & Map System - Full run structure
4. **Phase 4**: Relics & Potions - Strategic depth
5. **Phase 5**: Events & Merchant - Non-combat choices
6. **Phase 6**: Multiple Characters - Replayability
7. **Phase 7**: Save System - Persistence
8. **Phase 8**: Polish & Balance - Refined experience
9. **Phase 9**: Advanced Features - Ascension mode, daily runs
10. **Phase 10**: Desktop Release - Windows native app

See [ROADMAP.md](./ROADMAP.md) for complete details.

## Development Principles

- **Data-Driven**: Cards, relics, enemies defined in JSON
- **Modular**: Independent, reusable systems
- **Type-Safe**: Strict TypeScript for fewer bugs
- **Prototype First**: Function over form initially
- **Incremental**: Build phase by phase

## Controls (Planned)

- **Mouse**: Click/drag cards, select targets, navigate UI
- **ESC**: Return to menu, cancel actions
- **E**: End turn
- **Hover**: View card details

## License

TBD

## Contributing

This is a solo hobby project, but suggestions are welcome!

---

**Version**: 0.1.0
**Last Updated**: 2025-11-19
