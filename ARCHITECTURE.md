# The Descent - Architecture Guide

## Overview

The Descent is a roguelike deck-builder built with Phaser 3 and TypeScript. This document describes the architecture, patterns, and conventions used throughout the codebase.

## Directory Structure

```
src/
├── main.ts              # Phaser game entry point
├── config/              # Game configuration and constants
├── data/                # JSON data files (cards, enemies, relics, etc.)
├── entities/            # Game entities (Player, Enemy, Relic, Potion)
├── scenes/              # Phaser scenes (14 total)
├── systems/             # Core game systems
├── ui/                  # Phaser UI components
├── utils/               # Utilities (DataLoader, Logger, Result, etc.)
├── types/               # TypeScript type definitions
└── _deprecated/         # Archived React implementation (reference only)
```

## Core Systems

### 1. Event Bus (`src/systems/EventBus.ts`)

Centralized publish-subscribe event system for decoupled communication.

```typescript
import { EventBus, GameEvent } from '@/systems/EventBus';

// Subscribe to events
EventBus.on(GameEvent.CARD_PLAYED, (data) => {
  console.log(`Card played: ${data.card.name}`);
});

// Emit events
EventBus.emit(GameEvent.CARD_PLAYED, { card, target });

// One-time subscription
EventBus.once(GameEvent.COMBAT_VICTORY, handleVictory);

// Unsubscribe
EventBus.off(GameEvent.CARD_PLAYED, handler);
```

**Event Categories:**
- Combat: `COMBAT_START`, `COMBAT_VICTORY`, `COMBAT_DEFEAT`, `TURN_START`, `TURN_END`
- Cards: `CARD_PLAYED`, `CARD_DRAWN`, `CARD_EXHAUSTED`, `CARD_ADDED`, `CARD_REMOVED`
- Damage: `DAMAGE_DEALT`, `PLAYER_DAMAGED`, `ENEMY_DAMAGED`, `ENEMY_KILLED`
- Status: `STATUS_APPLIED`, `STATUS_REMOVED`, `BLOCK_GAINED`
- Items: `RELIC_OBTAINED`, `RELIC_TRIGGERED`, `POTION_OBTAINED`, `POTION_USED`
- Progress: `FLOOR_CHANGED`, `GOLD_CHANGED`, `SAVE_GAME`, `LOAD_GAME`

### 2. Combat Manager (`src/systems/CombatManager.ts`)

Orchestrates all combat logic through decomposed sub-managers:

```typescript
const combat = new CombatManager(player, enemies);
combat.startCombat();

// Play a card
combat.playCard(cardIndex, targetEnemy);

// End turn
combat.endPlayerTurn();

// Use potion
combat.usePotion(potionIndex, target);
```

**Sub-Managers:**
- `CardPileManager`: Draw, discard, exhaust piles and card movement
- `TurnManager`: Turn order, phase tracking, card type counters
- `RelicManager`: Relic triggers and effect execution

### 3. Effect System (`src/systems/effects/`)

Registry-based effect handlers for cards, relics, and potions:

```typescript
import { EffectSystem } from '@/systems/effects';

// Register a card effect handler
EffectSystem.registerCardEffectHandler('DAMAGE', (effect, context) => {
  const damage = calculateDamage(effect.value, context);
  context.target?.takeDamage(damage);
});

// Execute effects
EffectSystem.executeCardEffect(effect, context);
EffectSystem.executeRelicEffect(relic, trigger, context);
EffectSystem.executePotionEffect(effect, context);
```

### 4. Save System (`src/systems/SaveSystem.ts`)

Versioned persistence with auto-save and migration support:

```typescript
import { SaveSystem } from '@/systems/SaveSystem';

// Save current run
SaveSystem.saveRun(runState);

// Load run
const run = SaveSystem.loadRun();

// Save slots (1-3)
SaveSystem.saveToSlot(1, runState);
const saved = SaveSystem.loadFromSlot(1);

// Settings & Stats
SaveSystem.saveSettings(settings);
SaveSystem.updateStats({ enemiesKilled: 1 });
```

### 5. Data Loader (`src/utils/DataLoader.ts`)

Centralized data access with caching:

```typescript
import { DataLoader } from '@/utils/DataLoader';

await DataLoader.initialize();

const card = DataLoader.getCardById('strike');
const enemy = DataLoader.getEnemyById('cultist');
const relic = DataLoader.getRelicById('burning_blood');
const potion = DataLoader.getPotionById('health_potion');
const character = DataLoader.getCharacterById('ironclad');
```

## Entity Interfaces

### ICombatant

All entities that participate in combat implement `ICombatant`:

```typescript
interface ICombatant {
  currentHp: number;
  maxHp: number;
  block: number;
  
  takeDamage(amount: number): number;
  heal(amount: number): void;
  addBlock(amount: number): void;
  isDead(): boolean;
}
```

### IStatusHolder

Entities that can have status effects implement `IStatusHolder`:

```typescript
interface IStatusHolder {
  strength: number;
  dexterity: number;
  weak: number;
  vulnerable: number;
  
  applyStatus(status: string, amount: number): void;
  tickStatusEffects(): void;
  tryBlockDebuff(debuffType: string): boolean;
}
```

## Error Handling

### Result Type

Functional error handling that makes errors explicit:

```typescript
import { ok, err, isOk, match, Result, GameError } from '@/utils/Result';

function findCard(id: string): Result<Card, GameError> {
  const card = DataLoader.getCardById(id);
  if (!card) {
    return gameErr(ErrorCode.CARD_NOT_FOUND, `Card ${id} not found`);
  }
  return ok(card);
}

// Pattern matching
const result = findCard('strike');
match(result, {
  ok: (card) => playCard(card),
  err: (error) => logger.error(error.message),
});

// Or with guards
if (isOk(result)) {
  playCard(result.value);
}
```

### Logger

Structured logging with categories and levels:

```typescript
import { Logger, CombatLog, LogLevel } from '@/utils/Logger';

// Pre-configured category loggers
CombatLog.info('Combat started', { enemies: ['Cultist'] });
CombatLog.debug('Card played', { card: 'Strike', damage: 6 });
CombatLog.error('Invalid target', error);

// Custom scoped logger
const log = Logger.scope('MySystem');
log.warn('Something suspicious');

// Configure log level
Logger.setLevel(LogLevel.WARN);  // DEBUG, INFO, WARN, ERROR, NONE

// Timing
const done = Logger.time('Combat', 'Enemy turn');
// ... operations
done();  // Logs: "Enemy turn took 42.31ms"
```

### Error Boundary

Graceful error recovery for scenes:

```typescript
import { ErrorBoundary, SafeScene } from '@/utils/ErrorBoundary';

// Wrap risky operations
const value = ErrorBoundary.wrap(
  () => riskyOperation(),
  fallbackValue,
  'operation context'
);

// Extend SafeScene for automatic error handling
class MyScene extends SafeScene {
  protected safeCreate(data?: object): void {
    // Errors caught and handled automatically
  }
}
```

## Scenes

The game uses 14 Phaser scenes:

| Scene | Purpose |
|-------|---------|
| `BootScene` | Asset loading, initialization |
| `MainMenuScene` | Title screen, navigation |
| `CharacterSelectionScene` | Character picker |
| `MapScene` | Floor navigation, room selection |
| `CombatScene` | Card combat gameplay |
| `RewardScene` | Post-combat rewards |
| `RestScene` | Campfire (heal/upgrade) |
| `EventScene` | Random events |
| `MerchantScene` | Shop |
| `CardSelectionScene` | Card rewards/removal |
| `DeckViewScene` | Deck inspection |
| `VictoryScene` | Run complete |
| `DefeatScene` | Game over |
| `OptionsScene` | Settings |

## Data Format

### Cards (`src/data/cards/`)

```json
{
  "id": "strike",
  "name": "Strike",
  "type": "ATTACK",
  "rarity": "STARTER",
  "cost": 1,
  "targetType": "SINGLE_ENEMY",
  "effects": [
    { "type": "DAMAGE", "value": 6 }
  ],
  "description": "Deal 6 damage."
}
```

### Enemies (`src/data/enemies/`)

```json
{
  "id": "cultist",
  "name": "Cultist",
  "hp": { "min": 48, "max": 54 },
  "moves": [
    {
      "id": "incantation",
      "name": "Incantation",
      "weight": 1,
      "actions": [
        { "type": "BUFF", "buff": "ritual", "value": 3 }
      ]
    }
  ]
}
```

### Relics (`src/data/relics/`)

```json
{
  "id": "burning_blood",
  "name": "Burning Blood",
  "rarity": "STARTER",
  "description": "At the end of combat, heal 6 HP.",
  "effects": [
    {
      "trigger": "onCombatEnd",
      "type": "HEAL",
      "value": 6
    }
  ]
}
```

## Constants

Game balance values are centralized in `src/config/gameConstants.ts`:

```typescript
import { COMBAT, PLAYER, MAP, REWARDS } from '@/config/gameConstants';

// Combat
COMBAT.HAND_SIZE          // 5
COMBAT.BASE_ENERGY        // 3
COMBAT.VULNERABLE_MULTIPLIER  // 1.5

// Player
PLAYER.BASE_HP            // 80
PLAYER.MAX_POTIONS        // 3

// Map
MAP.FLOORS_PER_ACT        // 15
MAP.PATHS_PER_FLOOR       // 3-4

// Rewards
REWARDS.CARD_CHOICES      // 3
REWARDS.GOLD_PER_ENEMY    // 10-20
```

## Testing Approach

While the project doesn't have a test suite yet, the architecture supports testing:

1. **Pure functions** in `CombatCalculations.ts` are easily unit tested
2. **Effect handlers** are isolated and testable
3. **Result type** makes error cases explicit
4. **EventBus** can be mocked for integration tests
5. **DataLoader** can be stubbed with test data

## Performance Considerations

1. **Object pooling**: Card sprites can be pooled for frequent creation/destruction
2. **Event cleanup**: Always unsubscribe from EventBus when scenes shutdown
3. **Lazy loading**: DataLoader caches data after first load
4. **Logging overhead**: Set `LogLevel.WARN` in production

## Future Improvements

1. **Unit tests** for combat calculations and effect handlers
2. **Integration tests** for save/load cycle
3. **State machine** for game flow (would formalize scene transitions)
4. **Animation system** for card plays and damage
5. **Sound manager** integration with EventBus
6. **Mod support** via external data loading
