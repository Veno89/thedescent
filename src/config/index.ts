/**
 * Config Module - Barrel Export
 * 
 * Central export point for all game configuration.
 */

// Game constants
export {
  COMBAT,
  PLAYER,
  ECONOMY,
  MAP,
  REWARDS,
  REST,
  ENEMY,
  UI,
  SAVE,
} from './gameConstants';

export type {
  CombatConstants,
  PlayerConstants,
  EconomyConstants,
  MapConstants,
  RewardConstants,
  RestConstants,
  EnemyConstants,
  UIConstants,
  SaveConstants,
} from './gameConstants';

// Effect types
export {
  EffectType,
  TargetType,
  CardType,
  Rarity,
  StatusEffect,
  CardKeyword,
  isDamageEffect,
  isBlockEffect,
  isDebuffEffect,
  isBuffEffect,
  getStatusEffectForApplyType,
} from './effectTypes';

// Relic triggers
export {
  RelicTrigger,
  RelicAction,
  TRIGGER_MIGRATION_MAP,
  normalizeTrigger,
  isCombatTrigger,
  isRoomTrigger,
  isCounterAction,
} from './relicTriggers';
