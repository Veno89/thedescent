/**
 * Game Constants
 * 
 * Centralized configuration values for the entire game.
 * All magic numbers should be defined here.
 */

// ============================================================================
// COMBAT CONSTANTS
// ============================================================================

export const COMBAT = {
  /** Damage multiplier when attacker is weak (25% reduction) */
  WEAK_DAMAGE_MULTIPLIER: 0.75,
  
  /** Damage multiplier when target is vulnerable (50% increase) */
  VULNERABLE_DAMAGE_MULTIPLIER: 1.5,
  
  /** Block multiplier when defender is frail (25% reduction) */
  FRAIL_BLOCK_MULTIPLIER: 0.75,
  
  /** Default cards drawn per turn */
  DEFAULT_HAND_SIZE: 5,
  
  /** Maximum cards allowed in hand */
  MAX_HAND_SIZE: 10,
  
  /** Default energy per turn */
  DEFAULT_ENERGY: 3,
  
  /** Absolute maximum energy (even with relics) */
  MAX_ENERGY_CAP: 10,
  
  /** Damage dealt when target has intangible */
  INTANGIBLE_DAMAGE: 1,
} as const;

// ============================================================================
// PLAYER DEFAULTS
// ============================================================================

export const PLAYER = {
  /** Default maximum HP */
  DEFAULT_MAX_HP: 80,
  
  /** Starting gold for new runs */
  DEFAULT_STARTING_GOLD: 99,
  
  /** Default potion slots */
  DEFAULT_MAX_POTIONS: 3,
  
  /** Default energy per turn */
  DEFAULT_MAX_ENERGY: 3,
} as const;

// ============================================================================
// ECONOMY CONSTANTS
// ============================================================================

export const ECONOMY = {
  // Combat rewards
  /** Base gold from normal combat */
  COMBAT_GOLD_BASE: 10,
  /** Random additional gold from combat (0 to this value) */
  COMBAT_GOLD_RANDOM: 11,
  /** Base gold from elite combat */
  ELITE_GOLD_BASE: 25,
  /** Random additional gold from elite (0 to this value) */
  ELITE_GOLD_RANDOM: 6,
  /** Base gold from boss combat */
  BOSS_GOLD_BASE: 100,
  
  // Card prices by rarity
  CARD_PRICE_COMMON: 50,
  CARD_PRICE_UNCOMMON: 75,
  CARD_PRICE_RARE: 150,
  
  // Card removal
  /** Base price to remove a card */
  CARD_REMOVAL_BASE_PRICE: 70,
  /** Price increase per removal */
  CARD_REMOVAL_PRICE_INCREASE: 25,
  
  // Relic prices by rarity
  RELIC_PRICE_COMMON: 150,
  RELIC_PRICE_UNCOMMON: 250,
  RELIC_PRICE_RARE: 300,
  
  // Potion prices by rarity
  POTION_PRICE_COMMON: 50,
  POTION_PRICE_UNCOMMON: 75,
  POTION_PRICE_RARE: 100,
  
  // Floor multipliers for merchant prices
  FLOOR_PRICE_MULTIPLIER: 0.02,
} as const;

// ============================================================================
// MAP CONSTANTS
// ============================================================================

export const MAP = {
  /** Number of floors per act */
  FLOORS_PER_ACT: 15,
  
  /** Minimum rooms per floor */
  MIN_ROOMS_PER_FLOOR: 1,
  
  /** Maximum rooms per floor */
  MAX_ROOMS_PER_FLOOR: 4,
  
  /** How often rest sites appear (every N floors) */
  REST_SITE_INTERVAL: 6,
  
  /** Floors that contain treasure rooms */
  TREASURE_FLOORS: [7, 11] as readonly number[],
  
  /** Chance for a combat to be elite encounter */
  ELITE_ENCOUNTER_CHANCE: 0.4,
  
  /** Total number of acts in the game */
  TOTAL_ACTS: 3,
  
  /** Floor number for boss encounter */
  BOSS_FLOOR: 15,
} as const;

// ============================================================================
// REWARD CONSTANTS
// ============================================================================

export const REWARDS = {
  /** Number of card choices after combat */
  CARD_CHOICES: 3,
  
  /** Card rarity weights for rewards */
  CARD_RARITY_WEIGHTS: {
    COMMON: 0.6,
    UNCOMMON: 0.3,
    RARE: 0.1,
  } as const,
  
  /** Chance to get a potion drop */
  POTION_DROP_CHANCE: 0.4,
  
  /** Guaranteed relic from elite */
  ELITE_RELIC_GUARANTEED: true,
} as const;

// ============================================================================
// REST SITE CONSTANTS
// ============================================================================

export const REST = {
  /** Percentage of max HP healed at rest */
  HEAL_PERCENTAGE: 0.3,
  
  /** Minimum HP healed */
  MIN_HEAL: 1,
} as const;

// ============================================================================
// ENEMY CONSTANTS
// ============================================================================

export const ENEMY = {
  /** HP variance for enemies (±10%) */
  HP_VARIANCE: 0.1,
  
  /** Number of moves to track for AI patterns */
  MOVE_HISTORY_SIZE: 3,
} as const;

// ============================================================================
// UI CONSTANTS
// ============================================================================

export const UI = {
  /** Fast animation duration (ms) */
  ANIMATION_FAST: 150,
  
  /** Normal animation duration (ms) */
  ANIMATION_NORMAL: 300,
  
  /** Slow animation duration (ms) */
  ANIMATION_SLOW: 500,
  
  /** Screen shake intensity */
  SHAKE_INTENSITY: 0.005,
  
  /** Screen shake duration (ms) */
  SHAKE_DURATION: 200,
  
  /** Card hover scale */
  CARD_HOVER_SCALE: 1.1,
  
  /** Card selected scale */
  CARD_SELECTED_SCALE: 1.15,
} as const;

// ============================================================================
// SAVE SYSTEM CONSTANTS
// ============================================================================

export const SAVE = {
  /** LocalStorage key for save data */
  STORAGE_KEY: 'the-descent-save',
  
  /** Save data version */
  VERSION: '1.0.0',
  
  /** LocalStorage key for unlocks */
  UNLOCK_STORAGE_KEY: 'the-descent-unlocks',
  
  /** LocalStorage key for statistics */
  STATS_STORAGE_KEY: 'the-descent-stats',
} as const;

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type CombatConstants = typeof COMBAT;
export type PlayerConstants = typeof PLAYER;
export type EconomyConstants = typeof ECONOMY;
export type MapConstants = typeof MAP;
export type RewardConstants = typeof REWARDS;
export type RestConstants = typeof REST;
export type EnemyConstants = typeof ENEMY;
export type UIConstants = typeof UI;
export type SaveConstants = typeof SAVE;
