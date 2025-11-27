# Changelog

All notable changes to The Descent are documented in this file.

## [0.3.0] - 2025-11-26

### Major Refactoring (Phases 1-10)

This release represents a comprehensive refactoring of the codebase to improve maintainability, testability, and extensibility.

#### Phase 1: Foundation & Constants
- Created `src/config/gameConstants.ts` with centralized game balance values
- Organized constants into logical groups: COMBAT, PLAYER, ENEMY, MAP, REWARDS, UI, SAVE
- Replaced magic numbers throughout codebase with named constants

#### Phase 2: Combat Calculations
- Created `src/utils/CombatCalculations.ts` with pure functions
- Extracted damage calculation logic: `calculateOutgoingDamage`, `calculateIncomingDamage`
- Added block calculation: `calculateBlockValue`
- Added damage application: `applyDamage` with DamageResult type
- All functions are stateless and easily testable

#### Phase 3: Effect System
- Created registry-based effect system in `src/systems/effects/`
- `CardEffectHandler.ts`: Handlers for card effects (DAMAGE, BLOCK, DRAW, etc.)
- `RelicEffectHandler.ts`: Handlers for relic triggers (onTurnStart, onCombatEnd, etc.)
- `PotionEffectHandler.ts`: Handlers for potion effects
- `EffectContext.ts`: Shared context types for effect execution
- Unified effect execution through `EffectSystem` facade

#### Phase 4: CombatManager Decomposition
- Split monolithic CombatManager into focused sub-managers:
  - `CardPileManager.ts`: Draw pile, hand, discard, exhaust management
  - `TurnManager.ts`: Turn phases, card type tracking, turn counters
  - `RelicManager.ts`: Relic trigger detection and effect execution
- CombatManager now orchestrates sub-managers
- Backward-compatible public API maintained

#### Phase 5: Event Bus
- Created `src/systems/EventBus.ts` with 50+ event types
- Implemented pub-sub pattern for decoupled communication
- Event categories: Combat, Cards, Damage, Status, Items, Progress, UI
- Type-safe event payloads
- Integrated throughout combat, save, and UI systems

#### Phase 6: Save/Load System
- Created comprehensive `src/systems/SaveSystem.ts`
- Features:
  - Versioned save format (v1.1.0) with migration support
  - Auto-save functionality with configurable interval
  - Multiple save slots (3)
  - Separate storage for runs, settings, stats, unlocks
  - Data validation and corruption recovery
- Created `src/systems/SaveHelpers.ts` for serialization utilities
- EventBus integration for save/load notifications

#### Phase 7: Type System Cleanup
- Created `src/types/interfaces.ts` with core interfaces
- `ICombatant`: Combat participant contract (takeDamage, heal, addBlock, isDead)
- `IStatusHolder`: Status effect contract (applyStatus, tickStatusEffects, tryBlockDebuff)
- Player and Enemy now implement both interfaces
- Improved type safety across combat system

#### Phase 8: React Deprecation
- Consolidated on Phaser as sole rendering system
- Moved React code to `src/_deprecated/react/` for reference
- Updated entry point from `main.tsx` to `main.ts`
- Simplified dependencies (React/Zustand now optional)
- Updated build configuration (vite.config.ts, tsconfig.json)
- Documented deprecation reasons and restoration instructions

#### Phase 9: Error Handling & Logging
- Created `src/utils/Result.ts` with functional error handling
  - Result<T, E> type (Ok/Err discriminated union)
  - Helper functions: ok, err, isOk, isErr, map, match, etc.
  - Game-specific error types and error codes
- Created `src/utils/Logger.ts` with structured logging
  - Log levels: DEBUG, INFO, WARN, ERROR, NONE
  - Category-based logging with colors
  - Pre-configured loggers: CombatLog, CardLog, SaveLog, etc.
  - Performance timing utilities
- Created `src/utils/ErrorBoundary.ts`
  - Error recovery strategies (RETRY, FALLBACK, SKIP, RESTART, MAIN_MENU)
  - SafeScene base class with automatic error handling
  - Error storm detection

#### Phase 10: Documentation & Final Cleanup
- Created `ARCHITECTURE.md` with comprehensive system documentation
- Created `CHANGELOG.md` (this file)
- Updated `README.md` with current architecture
- Created utils index file for clean imports
- Code cleanup and consistency improvements

### Technical Improvements

- **Maintainability**: Clear separation of concerns, single-responsibility modules
- **Testability**: Pure functions, dependency injection, mockable interfaces
- **Extensibility**: Registry patterns, event-driven architecture
- **Type Safety**: Comprehensive interfaces, Result types, strict TypeScript
- **Debugging**: Structured logging, error context, performance timing

### Breaking Changes

- React UI no longer functional (Phaser is primary renderer)
- Some internal APIs changed (external game API maintained)
- Save format updated to v1.1.0 (auto-migrates from v1.0.0)

## [0.2.0] - 2025-11-25

### Added
- Initial Phaser implementation with 14 scenes
- Full combat system with cards, enemies, relics, potions
- Map generation with branching paths
- Event system with choices
- Save/load functionality
- 3 playable characters
- 54 cards, 44 relics, 15 potions, 10 enemies

### Technical
- Dual UI system (React + Phaser)
- Zustand state management (React)
- TypeScript throughout
- Vite build system

## [0.1.0] - 2025-11-20

### Added
- Initial prototype
- Basic card combat
- Single character
- Starter cards only
