/**
 * Effect Types
 * 
 * Standardized enums for card effects, target types, card types,
 * rarities, status effects, and card keywords.
 */

// ============================================================================
// EFFECT TYPES
// ============================================================================

/**
 * All possible card/relic/potion effect types.
 * Used in effect.type field.
 */
export enum EffectType {
  // Damage effects
  DAMAGE = 'DAMAGE',
  DAMAGE_EQUAL_BLOCK = 'DAMAGE_EQUAL_BLOCK',
  DAMAGE_ALL = 'DAMAGE_ALL',
  DAMAGE_RANDOM = 'DAMAGE_RANDOM',
  
  // Block effects
  BLOCK = 'BLOCK',
  DOUBLE_BLOCK = 'DOUBLE_BLOCK',
  
  // Card manipulation
  DRAW = 'DRAW',
  DISCARD = 'DISCARD',
  EXHAUST = 'EXHAUST',
  ADD_TO_HAND = 'ADD_TO_HAND',
  ADD_TO_DISCARD = 'ADD_TO_DISCARD',
  ADD_TO_DRAW = 'ADD_TO_DRAW',
  
  // Energy
  GAIN_ENERGY = 'GAIN_ENERGY',
  LOSE_ENERGY = 'LOSE_ENERGY',
  
  // HP manipulation
  HEAL = 'HEAL',
  LOSE_HP = 'LOSE_HP',
  GAIN_MAX_HP = 'GAIN_MAX_HP',
  
  // Buff application (to self)
  APPLY_STRENGTH = 'APPLY_STRENGTH',
  APPLY_DEXTERITY = 'APPLY_DEXTERITY',
  APPLY_ARTIFACT = 'APPLY_ARTIFACT',
  APPLY_PLATED_ARMOR = 'APPLY_PLATED_ARMOR',
  APPLY_THORNS = 'APPLY_THORNS',
  APPLY_RITUAL = 'APPLY_RITUAL',
  APPLY_INTANGIBLE = 'APPLY_INTANGIBLE',
  APPLY_REGEN = 'APPLY_REGEN',
  
  // Debuff application (to enemies)
  APPLY_VULNERABLE = 'APPLY_VULNERABLE',
  APPLY_WEAK = 'APPLY_WEAK',
  APPLY_FRAIL = 'APPLY_FRAIL',
  APPLY_POISON = 'APPLY_POISON',
  
  // Special effects
  UPGRADE_CARD = 'UPGRADE_CARD',
  TRANSFORM_CARD = 'TRANSFORM_CARD',
  NEXT_CARD_TWICE = 'NEXT_CARD_TWICE',
  SCRY = 'SCRY',
  RETAIN_HAND = 'RETAIN_HAND',
  REDUCE_STRENGTH = 'REDUCE_STRENGTH',
}

// ============================================================================
// TARGET TYPES
// ============================================================================

/**
 * Valid targets for effects.
 */
export enum TargetType {
  SELF = 'SELF',
  SINGLE_ENEMY = 'SINGLE_ENEMY',
  ALL_ENEMIES = 'ALL_ENEMIES',
  RANDOM_ENEMY = 'RANDOM_ENEMY',
}

// ============================================================================
// CARD TYPES
// ============================================================================

/**
 * Card type classifications.
 */
export enum CardType {
  ATTACK = 'ATTACK',
  SKILL = 'SKILL',
  POWER = 'POWER',
  STATUS = 'STATUS',
  CURSE = 'CURSE',
}

// ============================================================================
// RARITY
// ============================================================================

/**
 * Rarity levels for cards, relics, and potions.
 */
export enum Rarity {
  STARTER = 'STARTER',
  COMMON = 'COMMON',
  UNCOMMON = 'UNCOMMON',
  RARE = 'RARE',
  SPECIAL = 'SPECIAL',
}

// ============================================================================
// STATUS EFFECTS
// ============================================================================

/**
 * All status effect identifiers.
 * These are the keys used in StatusEffects objects.
 */
export enum StatusEffect {
  STRENGTH = 'strength',
  DEXTERITY = 'dexterity',
  ARTIFACT = 'artifact',
  PLATED_ARMOR = 'platedArmor',
  THORNS = 'thorns',
  RITUAL = 'ritual',
  INTANGIBLE = 'intangible',
  WEAK = 'weak',
  VULNERABLE = 'vulnerable',
  FRAIL = 'frail',
  POISON = 'poison',
  BLOCK = 'block',
  REGEN = 'regen',
}

// ============================================================================
// CARD KEYWORDS
// ============================================================================

/**
 * Special card keywords/properties.
 */
export enum CardKeyword {
  EXHAUST = 'exhaust',
  RETAIN = 'retain',
  INNATE = 'innate',
  ETHEREAL = 'ethereal',
  IS_X_COST = 'isXCost',
  UNPLAYABLE = 'unplayable',
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if an effect type deals damage.
 */
export function isDamageEffect(type: string): boolean {
  return [
    EffectType.DAMAGE,
    EffectType.DAMAGE_EQUAL_BLOCK,
    EffectType.DAMAGE_ALL,
    EffectType.DAMAGE_RANDOM,
  ].includes(type as EffectType);
}

/**
 * Check if an effect type grants block.
 */
export function isBlockEffect(type: string): boolean {
  return [
    EffectType.BLOCK,
    EffectType.DOUBLE_BLOCK,
  ].includes(type as EffectType);
}

/**
 * Check if an effect type is a debuff.
 */
export function isDebuffEffect(type: string): boolean {
  return [
    EffectType.APPLY_VULNERABLE,
    EffectType.APPLY_WEAK,
    EffectType.APPLY_FRAIL,
    EffectType.APPLY_POISON,
    EffectType.REDUCE_STRENGTH,
  ].includes(type as EffectType);
}

/**
 * Check if an effect type is a buff.
 */
export function isBuffEffect(type: string): boolean {
  return [
    EffectType.APPLY_STRENGTH,
    EffectType.APPLY_DEXTERITY,
    EffectType.APPLY_ARTIFACT,
    EffectType.APPLY_PLATED_ARMOR,
    EffectType.APPLY_THORNS,
    EffectType.APPLY_RITUAL,
    EffectType.APPLY_INTANGIBLE,
    EffectType.APPLY_REGEN,
  ].includes(type as EffectType);
}

/**
 * Get the status effect key for an apply effect type.
 */
export function getStatusEffectForApplyType(type: string): StatusEffect | null {
  const mapping: Record<string, StatusEffect> = {
    [EffectType.APPLY_STRENGTH]: StatusEffect.STRENGTH,
    [EffectType.APPLY_DEXTERITY]: StatusEffect.DEXTERITY,
    [EffectType.APPLY_ARTIFACT]: StatusEffect.ARTIFACT,
    [EffectType.APPLY_PLATED_ARMOR]: StatusEffect.PLATED_ARMOR,
    [EffectType.APPLY_THORNS]: StatusEffect.THORNS,
    [EffectType.APPLY_RITUAL]: StatusEffect.RITUAL,
    [EffectType.APPLY_INTANGIBLE]: StatusEffect.INTANGIBLE,
    [EffectType.APPLY_REGEN]: StatusEffect.REGEN,
    [EffectType.APPLY_VULNERABLE]: StatusEffect.VULNERABLE,
    [EffectType.APPLY_WEAK]: StatusEffect.WEAK,
    [EffectType.APPLY_FRAIL]: StatusEffect.FRAIL,
    [EffectType.APPLY_POISON]: StatusEffect.POISON,
  };
  return mapping[type] || null;
}
