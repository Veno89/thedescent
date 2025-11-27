/**
 * Relic Triggers
 * 
 * Standardized enums for relic trigger conditions and actions.
 * Includes migration mapping for old trigger names.
 */

// ============================================================================
// RELIC TRIGGERS
// ============================================================================

/**
 * All possible relic trigger conditions.
 * When the condition is met, the relic's effects activate.
 */
export enum RelicTrigger {
  // Combat lifecycle
  COMBAT_START = 'COMBAT_START',
  COMBAT_END = 'COMBAT_END',
  COMBAT_VICTORY = 'COMBAT_VICTORY',
  
  // Turn lifecycle
  TURN_START = 'TURN_START',
  TURN_END = 'TURN_END',
  FIRST_TURN = 'FIRST_TURN',
  TURN_EVERY_N = 'TURN_EVERY_N',
  
  // Card play triggers
  CARD_PLAYED = 'CARD_PLAYED',
  ATTACK_PLAYED = 'ATTACK_PLAYED',
  SKILL_PLAYED = 'SKILL_PLAYED',
  POWER_PLAYED = 'POWER_PLAYED',
  FIRST_ATTACK_COMBAT = 'FIRST_ATTACK_COMBAT',
  FIRST_ATTACK_TURN = 'FIRST_ATTACK_TURN',
  CARD_EVERY_N = 'CARD_EVERY_N',
  ATTACK_EVERY_N = 'ATTACK_EVERY_N',
  SKILL_EVERY_N = 'SKILL_EVERY_N',
  
  // Card manipulation triggers
  CARD_DRAWN = 'CARD_DRAWN',
  CARD_DISCARDED = 'CARD_DISCARDED',
  CARD_EXHAUSTED = 'CARD_EXHAUSTED',
  SHUFFLE = 'SHUFFLE',
  SHUFFLE_EVERY_N = 'SHUFFLE_EVERY_N',
  EMPTY_HAND_END_TURN = 'EMPTY_HAND_END_TURN',
  
  // Damage triggers
  PLAYER_DAMAGED = 'PLAYER_DAMAGED',
  FIRST_DAMAGE_COMBAT = 'FIRST_DAMAGE_COMBAT',
  PLAYER_HP_LOST = 'PLAYER_HP_LOST',
  DAMAGE_DEALT = 'DAMAGE_DEALT',
  ENEMY_KILLED = 'ENEMY_KILLED',
  
  // Block triggers
  BLOCK_GAINED = 'BLOCK_GAINED',
  BLOCK_BROKEN = 'BLOCK_BROKEN',
  
  // Status triggers
  DEBUFF_PREVENTED = 'DEBUFF_PREVENTED',
  BUFF_GAINED = 'BUFF_GAINED',
  
  // Room entry triggers
  REST_SITE_ENTER = 'REST_SITE_ENTER',
  REST_HEAL = 'REST_HEAL',
  REST_UPGRADE = 'REST_UPGRADE',
  MERCHANT_ENTER = 'MERCHANT_ENTER',
  EVENT_ENTER = 'EVENT_ENTER',
  TREASURE_ENTER = 'TREASURE_ENTER',
  ROOM_ENTER = 'ROOM_ENTER',
  
  // Economy triggers
  GOLD_GAINED = 'GOLD_GAINED',
  GOLD_SPENT = 'GOLD_SPENT',
  
  // Item triggers
  POTION_GAINED = 'POTION_GAINED',
  POTION_USED = 'POTION_USED',
  
  // Acquisition triggers
  ON_OBTAIN = 'ON_OBTAIN',
  RELIC_OBTAINED = 'RELIC_OBTAINED',
  CARD_OBTAINED = 'CARD_OBTAINED',
  
  // Passive (always active)
  PASSIVE = 'PASSIVE',
  
  // HP threshold triggers
  HP_BELOW_50 = 'HP_BELOW_50',
  HP_BELOW_25 = 'HP_BELOW_25',
}

// ============================================================================
// RELIC ACTIONS
// ============================================================================

/**
 * All possible relic effect actions.
 * What happens when the trigger condition is met.
 */
export enum RelicAction {
  // Direct effects
  HEAL = 'HEAL',
  BLOCK = 'BLOCK',
  DRAW = 'DRAW',
  GAIN_ENERGY = 'GAIN_ENERGY',
  GAIN_STRENGTH = 'GAIN_STRENGTH',
  GAIN_DEXTERITY = 'GAIN_DEXTERITY',
  GAIN_MAX_HP = 'GAIN_MAX_HP',
  GAIN_GOLD = 'GAIN_GOLD',
  THORNS = 'THORNS',
  
  // Damage effects
  DAMAGE_RANDOM = 'DAMAGE_RANDOM',
  DAMAGE_ALL = 'DAMAGE_ALL',
  BONUS_DAMAGE = 'BONUS_DAMAGE',
  REDUCE_DAMAGE = 'REDUCE_DAMAGE',
  
  // Counter-based effects
  DRAW_EVERY_N = 'DRAW_EVERY_N',
  ENERGY_EVERY_N = 'ENERGY_EVERY_N',
  DEXTERITY_EVERY_N = 'DEXTERITY_EVERY_N',
  STRENGTH_EVERY_N = 'STRENGTH_EVERY_N',
  BLOCK_EVERY_N = 'BLOCK_EVERY_N',
  DAMAGE_ALL_EVERY_N = 'DAMAGE_ALL_EVERY_N',
  ENERGY_SHUFFLE_N = 'ENERGY_SHUFFLE_N',
  
  // Card effects
  ADD_RANDOM_CARD = 'ADD_RANDOM_CARD',
  UPGRADE_RANDOM = 'UPGRADE_RANDOM',
  DOUBLE_FIRST_CARD = 'DOUBLE_FIRST_CARD',
  
  // Combat modifiers
  ENERGY_NEXT_COMBAT = 'ENERGY_NEXT_COMBAT',
  
  // Capacity modifiers
  POTION_SLOT = 'POTION_SLOT',
  
  // Economy modifiers
  GOLD_MULTIPLY = 'GOLD_MULTIPLY',
  EXTRA_CARD_CHOICE = 'EXTRA_CARD_CHOICE',
  ELITE_BONUS_RELIC = 'ELITE_BONUS_RELIC',
  
  // Special modifiers
  CURSES_PLAYABLE = 'CURSES_PLAYABLE',
  VULNERABLE_BONUS = 'VULNERABLE_BONUS',
  MORE_EVENT_OPTIONS = 'MORE_EVENT_OPTIONS',
  MERCHANT_DISCOUNT = 'MERCHANT_DISCOUNT',
  
  // Rest site modifiers
  REST_REMOVE_CARD = 'REST_REMOVE_CARD',
  REST_DIG = 'REST_DIG',
  
  // Event modifiers
  EVENT_TO_TREASURE = 'EVENT_TO_TREASURE',
  
  // Defensive effects
  INTANGIBLE_EVERY_N = 'INTANGIBLE_EVERY_N',
  REVIVE = 'REVIVE',
  
  // Upgrade effects
  AUTO_UPGRADE_SKILLS = 'AUTO_UPGRADE_SKILLS',
  AUTO_UPGRADE_POWERS = 'AUTO_UPGRADE_POWERS',
  REDUCE_RANDOM_COST = 'REDUCE_RANDOM_COST',
  
  // Combo effects
  DISCARD_DRAW = 'DISCARD_DRAW',
  PLATED_ARMOR = 'PLATED_ARMOR',
  RETAIN_ENERGY = 'RETAIN_ENERGY',
  
  // Debuff application
  APPLY_DEBUFF_ENEMIES = 'APPLY_DEBUFF_ENEMIES',
  APPLY_VULNERABLE = 'APPLY_VULNERABLE',
  APPLY_WEAK = 'APPLY_WEAK',
}

// ============================================================================
// MIGRATION MAPPING
// ============================================================================

/**
 * Maps old trigger names to new standardized names.
 * Use normalizeTrigger() to convert old triggers.
 */
export const TRIGGER_MIGRATION_MAP: Record<string, RelicTrigger> = {
  // camelCase to SCREAMING_CASE
  'onCombatStart': RelicTrigger.COMBAT_START,
  'onCombatEnd': RelicTrigger.COMBAT_END,
  'onCombatVictory': RelicTrigger.COMBAT_VICTORY,
  'onTurnStart': RelicTrigger.TURN_START,
  'onTurnEnd': RelicTrigger.TURN_END,
  'onFirstTurn': RelicTrigger.FIRST_TURN,
  'onCardPlayed': RelicTrigger.CARD_PLAYED,
  'onAttackPlayed': RelicTrigger.ATTACK_PLAYED,
  'onSkillPlayed': RelicTrigger.SKILL_PLAYED,
  'onPowerPlayed': RelicTrigger.POWER_PLAYED,
  'onFirstAttack': RelicTrigger.FIRST_ATTACK_COMBAT,
  'onCardDrawn': RelicTrigger.CARD_DRAWN,
  'onCardDiscarded': RelicTrigger.CARD_DISCARDED,
  'onCardExhausted': RelicTrigger.CARD_EXHAUSTED,
  'onShuffle': RelicTrigger.SHUFFLE,
  'onPlayerDamaged': RelicTrigger.PLAYER_DAMAGED,
  'onDamageDealt': RelicTrigger.DAMAGE_DEALT,
  'onEnemyKilled': RelicTrigger.ENEMY_KILLED,
  'onBlockGained': RelicTrigger.BLOCK_GAINED,
  'onDebuffPrevented': RelicTrigger.DEBUFF_PREVENTED,
  'onRestSite': RelicTrigger.REST_SITE_ENTER,
  'onMerchant': RelicTrigger.MERCHANT_ENTER,
  'onEvent': RelicTrigger.EVENT_ENTER,
  'onTreasure': RelicTrigger.TREASURE_ENTER,
  'onRoomEnter': RelicTrigger.ROOM_ENTER,
  'onGoldGained': RelicTrigger.GOLD_GAINED,
  'onGoldSpent': RelicTrigger.GOLD_SPENT,
  'onPotionGained': RelicTrigger.POTION_GAINED,
  'onPotionUsed': RelicTrigger.POTION_USED,
  'onObtain': RelicTrigger.ON_OBTAIN,
  'onRelicObtained': RelicTrigger.RELIC_OBTAINED,
  'onCardObtained': RelicTrigger.CARD_OBTAINED,
  'passive': RelicTrigger.PASSIVE,
  
  // Mixed case variations
  'START_COMBAT': RelicTrigger.COMBAT_START,
  'END_COMBAT': RelicTrigger.COMBAT_END,
  'START_TURN': RelicTrigger.TURN_START,
  'END_TURN': RelicTrigger.TURN_END,
  'FIRST_TURN': RelicTrigger.FIRST_TURN,
  'CARD_PLAY': RelicTrigger.CARD_PLAYED,
  'ATTACK_PLAY': RelicTrigger.ATTACK_PLAYED,
  'SKILL_PLAY': RelicTrigger.SKILL_PLAYED,
  'POWER_PLAY': RelicTrigger.POWER_PLAYED,
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Normalize a trigger string to the standard format.
 * Handles old camelCase and mixed case formats.
 */
export function normalizeTrigger(trigger: string): RelicTrigger {
  // Check migration map first
  if (trigger in TRIGGER_MIGRATION_MAP) {
    return TRIGGER_MIGRATION_MAP[trigger];
  }
  
  // Already in correct format
  if (Object.values(RelicTrigger).includes(trigger as RelicTrigger)) {
    return trigger as RelicTrigger;
  }
  
  // Try uppercase conversion
  const upperTrigger = trigger.toUpperCase().replace(/([a-z])([A-Z])/g, '$1_$2');
  if (Object.values(RelicTrigger).includes(upperTrigger as RelicTrigger)) {
    return upperTrigger as RelicTrigger;
  }
  
  console.warn(`Unknown trigger: ${trigger}`);
  return trigger as RelicTrigger;
}

/**
 * Check if a trigger fires during combat.
 */
export function isCombatTrigger(trigger: RelicTrigger): boolean {
  return [
    RelicTrigger.COMBAT_START,
    RelicTrigger.COMBAT_END,
    RelicTrigger.COMBAT_VICTORY,
    RelicTrigger.TURN_START,
    RelicTrigger.TURN_END,
    RelicTrigger.FIRST_TURN,
    RelicTrigger.CARD_PLAYED,
    RelicTrigger.ATTACK_PLAYED,
    RelicTrigger.SKILL_PLAYED,
    RelicTrigger.POWER_PLAYED,
    RelicTrigger.FIRST_ATTACK_COMBAT,
    RelicTrigger.CARD_DRAWN,
    RelicTrigger.CARD_DISCARDED,
    RelicTrigger.CARD_EXHAUSTED,
    RelicTrigger.SHUFFLE,
    RelicTrigger.PLAYER_DAMAGED,
    RelicTrigger.DAMAGE_DEALT,
    RelicTrigger.ENEMY_KILLED,
    RelicTrigger.BLOCK_GAINED,
  ].includes(trigger);
}

/**
 * Check if a trigger fires when entering a room.
 */
export function isRoomTrigger(trigger: RelicTrigger): boolean {
  return [
    RelicTrigger.REST_SITE_ENTER,
    RelicTrigger.MERCHANT_ENTER,
    RelicTrigger.EVENT_ENTER,
    RelicTrigger.TREASURE_ENTER,
    RelicTrigger.ROOM_ENTER,
  ].includes(trigger);
}

/**
 * Check if an action uses a counter (every N triggers).
 */
export function isCounterAction(action: RelicAction): boolean {
  return [
    RelicAction.DRAW_EVERY_N,
    RelicAction.ENERGY_EVERY_N,
    RelicAction.DEXTERITY_EVERY_N,
    RelicAction.STRENGTH_EVERY_N,
    RelicAction.BLOCK_EVERY_N,
    RelicAction.DAMAGE_ALL_EVERY_N,
    RelicAction.ENERGY_SHUFFLE_N,
    RelicAction.INTANGIBLE_EVERY_N,
  ].includes(action);
}
