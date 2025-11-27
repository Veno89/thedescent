/**
 * Combat Calculations
 * 
 * Centralized utility functions for all damage and block calculations.
 * This eliminates duplicate calculation logic scattered throughout the codebase.
 * 
 * All combat math should go through these functions to ensure consistency.
 */

import { COMBAT } from '@/config/gameConstants';

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * Result of applying damage to a target.
 */
export interface DamageResult {
  /** Total damage calculated (after modifiers, before block) */
  totalDamage: number;
  /** Damage absorbed by block */
  blockedDamage: number;
  /** Actual HP lost */
  hpLost: number;
  /** Remaining block after damage */
  remainingBlock: number;
  /** Whether target was killed */
  lethal: boolean;
}

/**
 * Result of a block calculation.
 */
export interface BlockResult {
  /** Final block amount after modifiers */
  blockGained: number;
  /** Whether frail was applied */
  frailApplied: boolean;
}

// ============================================================================
// DAMAGE CALCULATIONS
// ============================================================================

/**
 * Calculate the final damage value after applying attacker's modifiers.
 * This is the damage BEFORE it hits the target's block.
 * 
 * @param baseDamage - Base damage from card/effect
 * @param attackerStrength - Attacker's strength stat
 * @param attackerWeak - Attacker's weak stacks (> 0 means weak is active)
 * @returns Final damage value (minimum 0)
 * 
 * @example
 * // Card deals 6 damage, player has 2 strength, no weak
 * calculateOutgoingDamage(6, 2, 0) // Returns 8
 * 
 * @example
 * // Card deals 6 damage, player has 2 strength, is weak
 * calculateOutgoingDamage(6, 2, 1) // Returns 6 (8 * 0.75 = 6)
 */
export function calculateOutgoingDamage(
  baseDamage: number,
  attackerStrength: number,
  attackerWeak: number
): number {
  // Add strength to base damage
  let damage = baseDamage + attackerStrength;
  
  // Apply weak (25% damage reduction)
  if (attackerWeak > 0) {
    damage = Math.floor(damage * COMBAT.WEAK_DAMAGE_MULTIPLIER);
  }
  
  return Math.max(0, damage);
}

/**
 * Calculate damage after applying target's defensive modifiers.
 * This modifies the incoming damage based on target's status.
 * 
 * @param incomingDamage - Damage after attacker's modifiers
 * @param targetVulnerable - Target's vulnerable stacks
 * @param targetIntangible - Target's intangible stacks
 * @returns Modified damage value
 * 
 * @example
 * // 10 damage to vulnerable target
 * calculateIncomingDamage(10, 2, 0) // Returns 15 (10 * 1.5)
 * 
 * @example
 * // 50 damage to intangible target
 * calculateIncomingDamage(50, 0, 1) // Returns 1
 */
export function calculateIncomingDamage(
  incomingDamage: number,
  targetVulnerable: number,
  targetIntangible: number = 0
): number {
  // Intangible reduces all damage to 1
  if (targetIntangible > 0) {
    return COMBAT.INTANGIBLE_DAMAGE;
  }
  
  let damage = incomingDamage;
  
  // Apply vulnerable (50% more damage)
  if (targetVulnerable > 0) {
    damage = Math.floor(damage * COMBAT.VULNERABLE_DAMAGE_MULTIPLIER);
  }
  
  return Math.max(0, damage);
}

/**
 * Full damage calculation from attacker to target.
 * Combines outgoing and incoming damage calculations.
 * 
 * @param baseDamage - Base damage from card/effect
 * @param attacker - Attacker's combat stats
 * @param target - Target's combat stats
 * @returns Final damage value before block
 */
export function calculateDamage(
  baseDamage: number,
  attacker: { strength?: number; weak?: number },
  target: { vulnerable?: number; intangible?: number }
): number {
  const outgoing = calculateOutgoingDamage(
    baseDamage,
    attacker.strength ?? 0,
    attacker.weak ?? 0
  );
  
  return calculateIncomingDamage(
    outgoing,
    target.vulnerable ?? 0,
    target.intangible ?? 0
  );
}

/**
 * Apply damage to a target, accounting for block.
 * Returns detailed information about the damage application.
 * 
 * @param damage - Final damage after all modifiers
 * @param targetHp - Target's current HP
 * @param targetBlock - Target's current block
 * @returns Detailed damage result
 * 
 * @example
 * // 15 damage against 10 block, 50 HP
 * applyDamage(15, 50, 10)
 * // Returns: { totalDamage: 15, blockedDamage: 10, hpLost: 5, remainingBlock: 0, lethal: false }
 */
export function applyDamage(
  damage: number,
  targetHp: number,
  targetBlock: number
): DamageResult {
  const blockedDamage = Math.min(damage, targetBlock);
  const remainingBlock = Math.max(0, targetBlock - damage);
  const hpLost = Math.max(0, damage - targetBlock);
  const newHp = Math.max(0, targetHp - hpLost);
  
  return {
    totalDamage: damage,
    blockedDamage,
    hpLost,
    remainingBlock,
    lethal: newHp <= 0,
  };
}

/**
 * Complete damage pipeline: calculate and apply damage from attacker to target.
 * This is the main function to use for most damage scenarios.
 * 
 * @param baseDamage - Base damage from card/effect
 * @param attacker - Attacker's status (strength, weak)
 * @param target - Target's full combat state
 * @returns Damage result with all details
 */
export function calculateAndApplyDamage(
  baseDamage: number,
  attacker: { strength?: number; weak?: number },
  target: { currentHp: number; block: number; vulnerable?: number; intangible?: number }
): DamageResult {
  const finalDamage = calculateDamage(baseDamage, attacker, target);
  return applyDamage(finalDamage, target.currentHp, target.block);
}

// ============================================================================
// BLOCK CALCULATIONS
// ============================================================================

/**
 * Calculate final block value after applying modifiers.
 * 
 * @param baseBlock - Base block from card/effect
 * @param dexterity - Player's dexterity stat
 * @param frail - Player's frail stacks (> 0 means frail is active)
 * @returns Block calculation result
 * 
 * @example
 * // Gain 5 block with 2 dexterity, not frail
 * calculateBlock(5, 2, 0) // Returns { blockGained: 7, frailApplied: false }
 * 
 * @example
 * // Gain 5 block with 2 dexterity, is frail
 * calculateBlock(5, 2, 1) // Returns { blockGained: 5, frailApplied: true } (7 * 0.75 = 5.25 -> 5)
 */
export function calculateBlock(
  baseBlock: number,
  dexterity: number,
  frail: number
): BlockResult {
  // Add dexterity to base block
  let block = baseBlock + dexterity;
  
  const frailApplied = frail > 0;
  
  // Apply frail (25% block reduction)
  if (frailApplied) {
    block = Math.floor(block * COMBAT.FRAIL_BLOCK_MULTIPLIER);
  }
  
  return {
    blockGained: Math.max(0, block),
    frailApplied,
  };
}

/**
 * Simple block calculation returning just the value.
 * Use this when you don't need the detailed result.
 * 
 * @param baseBlock - Base block from card/effect
 * @param dexterity - Player's dexterity stat
 * @param frail - Player's frail stacks
 * @returns Final block value
 */
export function calculateBlockValue(
  baseBlock: number,
  dexterity: number,
  frail: number
): number {
  return calculateBlock(baseBlock, dexterity, frail).blockGained;
}

// ============================================================================
// INTENT CALCULATIONS (for enemy display)
// ============================================================================

/**
 * Calculate the displayed damage for an enemy's intent.
 * This shows what damage the player WILL take if not blocked.
 * 
 * @param baseDamage - Base damage from enemy move
 * @param enemyStrength - Enemy's strength
 * @param enemyWeak - Enemy's weak stacks
 * @param playerVulnerable - Player's vulnerable stacks
 * @returns Damage value to display in intent
 */
export function calculateIntentDamage(
  baseDamage: number,
  enemyStrength: number,
  enemyWeak: number,
  playerVulnerable: number
): number {
  return calculateDamage(
    baseDamage,
    { strength: enemyStrength, weak: enemyWeak },
    { vulnerable: playerVulnerable }
  );
}

/**
 * Calculate displayed damage for enemy intent with simple parameters.
 * 
 * @param baseDamage - Base damage from enemy move
 * @param enemy - Enemy stats
 * @param player - Player stats (for vulnerable check)
 * @returns Damage value to display
 */
export function getIntentDamage(
  baseDamage: number,
  enemy: { strength?: number; weak?: number },
  player: { vulnerable?: number }
): number {
  return calculateDamage(baseDamage, enemy, player);
}

// ============================================================================
// POISON CALCULATIONS
// ============================================================================

/**
 * Calculate poison damage and remaining stacks.
 * Poison deals damage equal to stacks, then decrements.
 * 
 * @param poisonStacks - Current poison stacks
 * @returns Object with damage dealt and remaining stacks
 */
export function calculatePoisonTick(poisonStacks: number): {
  damage: number;
  remainingStacks: number;
} {
  if (poisonStacks <= 0) {
    return { damage: 0, remainingStacks: 0 };
  }
  
  return {
    damage: poisonStacks,
    remainingStacks: poisonStacks - 1,
  };
}

// ============================================================================
// PLATED ARMOR CALCULATIONS
// ============================================================================

/**
 * Calculate plated armor block at end of turn.
 * Also calculates reduction when taking damage.
 * 
 * @param platedArmor - Current plated armor stacks
 * @param tookUnblockedDamage - Whether unblocked damage was taken this turn
 * @returns Object with block granted and remaining stacks
 */
export function calculatePlatedArmor(
  platedArmor: number,
  tookUnblockedDamage: boolean
): {
  blockGranted: number;
  remainingStacks: number;
} {
  if (platedArmor <= 0) {
    return { blockGranted: 0, remainingStacks: 0 };
  }
  
  // Plated armor grants block equal to stacks
  const blockGranted = platedArmor;
  
  // If took unblocked damage, lose 1 stack
  const remainingStacks = tookUnblockedDamage 
    ? Math.max(0, platedArmor - 1) 
    : platedArmor;
  
  return { blockGranted, remainingStacks };
}

// ============================================================================
// THORNS CALCULATIONS
// ============================================================================

/**
 * Calculate thorns damage when attacked.
 * 
 * @param thornsStacks - Current thorns stacks
 * @returns Damage to deal back to attacker
 */
export function calculateThornsDamage(thornsStacks: number): number {
  return Math.max(0, thornsStacks);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if damage would be lethal.
 * 
 * @param damage - Incoming damage (after modifiers)
 * @param currentHp - Target's current HP
 * @param block - Target's current block
 * @returns True if damage would kill the target
 */
export function wouldBeLethal(
  damage: number,
  currentHp: number,
  block: number
): boolean {
  const hpLost = Math.max(0, damage - block);
  return currentHp - hpLost <= 0;
}

/**
 * Calculate effective HP (current HP + block).
 * Useful for AI decisions.
 * 
 * @param currentHp - Current HP
 * @param block - Current block
 * @returns Effective HP
 */
export function calculateEffectiveHp(currentHp: number, block: number): number {
  return currentHp + block;
}

/**
 * Calculate overkill damage (damage beyond lethal).
 * 
 * @param damage - Total damage dealt
 * @param currentHp - Target's current HP
 * @param block - Target's current block
 * @returns Overkill amount (0 if not lethal)
 */
export function calculateOverkill(
  damage: number,
  currentHp: number,
  block: number
): number {
  const hpLost = Math.max(0, damage - block);
  return Math.max(0, hpLost - currentHp);
}
