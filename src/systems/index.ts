/**
 * Systems Module - Barrel Export
 * 
 * Central export point for all game systems.
 */

// Core managers
export { CombatManager } from './CombatManager';
export { GameStateManager } from './GameStateManager';
export { MapGenerator } from './MapGenerator';
export { UnlockSystem } from './UnlockSystem';

// Decomposed managers (Phase 4)
export { CardPileManager, type CardPileCallbacks } from './CardPileManager';
export { TurnManager, TurnPhase, type TurnCallbacks, type TurnState } from './TurnManager';
export { RelicManager, type RelicTriggerContext, type RelicCallbacks } from './RelicManager';

// Event Bus (Phase 5)
export {
  EventBus,
  GameEvent,
  type BaseEventData,
  type CombatEventData,
  type CardEventData,
  type DamageEventData,
  type StatusEventData,
  type EnergyEventData,
  type GoldEventData,
  type RelicEventData,
  type PotionEventData,
  type RoomEventData,
  type GenericEventData,
  type EventData,
  type EventHandler,
  type Unsubscribe,
} from './EventBus';

// Save System (Phase 6)
export {
  SaveSystem,
  SAVE_VERSION,
  type SavedPlayerState,
  type SavedCard,
  type SavedRelic,
  type SavedPotion,
  type SavedRoom,
  type SavedRunState,
  type SavedCombatState,
  type SavedEnemy,
  type SavedSettings,
  type SavedStats,
  type SavedUnlocks,
  type SaveData,
} from './SaveSystem';

// Save helpers
export {
  serializeCard,
  deserializeCard,
  serializeCards,
  deserializeCards,
  serializeRelic,
  deserializeRelic,
  serializeRelics,
  deserializeRelics,
  serializePotion,
  deserializePotion,
  serializePotions,
  deserializePotions,
  serializeEnemy,
  deserializeEnemy,
  serializeEnemies,
  deserializeEnemies,
  serializeRoom,
  deserializeRoom,
  serializeRooms,
  deserializeRooms,
  serializePlayer,
  deserializePlayer,
  serializeCombatState,
  deserializeCombatState,
  createRunState,
  restoreRunState,
} from './SaveHelpers';

// Effect system
export {
  EffectSystem,
  type EffectContext,
  type EffectActions,
  type RelicEffectContext,
  type PotionEffectContext,
  type CardEffectDef,
  type RelicEffectDef,
  type PotionEffectDef,
  type EffectResult,
} from './effects';
