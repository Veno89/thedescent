# Deprecated Code

This folder contains deprecated code that is no longer used in the main game.

## React UI System (`react/`)

**Deprecated as of:** Phase 8 Refactoring
**Reason:** Duplicate UI implementation - Phaser scenes are the primary renderer

The game originally had two parallel UI systems:
1. **React** - Browser-based UI with Zustand state management
2. **Phaser** - Game engine-based UI with scene management

During refactoring, we consolidated on Phaser as the primary (and only) renderer because:
- Phaser provides better game-specific features (animations, particles, input handling)
- Having two UI systems caused maintenance overhead and inconsistencies
- The Phaser implementation was more complete and feature-rich

### Contents

```
react/
├── App.tsx              # Root React component with screen router
├── main.tsx             # React entry point
├── index.css            # Tailwind CSS styles
├── stores/
│   └── gameStore.ts     # Zustand game state store
└── components/
    ├── screens/         # Screen components (MainMenu, Combat, etc.)
    ├── game/            # Game UI components (Card, StatusEffects, etc.)
    └── ui/              # Reusable UI components (Button, Panel, etc.)
```

### If You Need to Restore React

1. Move files back to `src/`
2. Update `index.html` to use `main.tsx`:
   ```html
   <div id="root"></div>
   <script type="module" src="/src/main.tsx"></script>
   ```
3. Ensure React dependencies are installed:
   ```bash
   npm install react react-dom zustand
   npm install -D @types/react @types/react-dom
   ```

### Reference Value

The React code may still be useful as:
- Reference for game logic (the Zustand store has comprehensive game state)
- Design patterns for state management
- UI/UX designs that could be ported to Phaser
- Testing ground for new features before Phaser implementation
