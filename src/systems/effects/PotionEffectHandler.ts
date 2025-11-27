/**
 * Potion Effect Handlers
 * 
 * Registry of handler functions for each potion effect type.
 * Replaces the switch statement in CombatManager.executePotionEffect().
 */

import type { EffectContext, PotionEffectDef, EffectResult } from './EffectContext';
import type { Potion } from '@/entities/Potion';

/**
 * Extended context for potion effects.
 */
export interface PotionEffectContext extends EffectContext {
  potion: Potion;
}

/**
 * Type for a potion effect handler function.
 */
export type PotionEffectHandler = (
  effect: PotionEffectDef,
  context: PotionEffectContext
) => EffectResult;

/**
 * Registry of potion effect handlers.
 */
const potionEffectHandlers: Map<string, PotionEffectHandler> = new Map();

/**
 * Register a potion effect handler.
 */
export function registerPotionEffect(type: string, handler: PotionEffectHandler): void {
  potionEffectHandlers.set(type, handler);
}

/**
 * Execute a potion effect using the registered handler.
 */
export function executePotionEffect(
  effect: PotionEffectDef,
  context: PotionEffectContext
): EffectResult {
  const handler = potionEffectHandlers.get(effect.type);
  
  if (!handler) {
    console.warn(`Unknown potion effect type: ${effect.type}`);
    return { success: false, message: `Unknown effect type: ${effect.type}` };
  }
  
  return handler(effect, context);
}

/**
 * Check if a handler exists for a potion effect type.
 */
export function hasPotionEffectHandler(type: string): boolean {
  return potionEffectHandlers.has(type);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get targets based on effect target type.
 */
function getTargets(effect: PotionEffectDef, context: PotionEffectContext) {
  if (effect.target === 'ALL_ENEMIES') {
    return context.actions.getAliveEnemies();
  }
  
  if (context.target && !context.target.isDead()) {
    return [context.target];
  }
  
  return [];
}

// ============================================================================
// HEALING EFFECTS
// ============================================================================

registerPotionEffect('HEAL', (effect, context) => {
  let value = effect.value;
  
  // Handle percentage-based healing (Blood Potion)
  if (effect.percentage) {
    value = Math.floor(context.player.maxHp * effect.percentage);
  }
  
  context.player.heal(value);
  context.actions.log(`Healed ${value} HP`);
  return { success: true, value };
});

registerPotionEffect('HEAL_PERCENT', (effect, context) => {
  const percentage = effect.percentage || 0.2;
  const value = Math.floor(context.player.maxHp * percentage);
  context.player.heal(value);
  context.actions.log(`Healed ${value} HP (${Math.round(percentage * 100)}%)`);
  return { success: true, value };
});

// ============================================================================
// BLOCK EFFECTS
// ============================================================================

registerPotionEffect('BLOCK', (effect, context) => {
  const value = effect.value;
  context.player.addBlockRaw(value); // Potions give raw block
  context.actions.log(`Gained ${value} Block`);
  return { success: true, value };
});

// ============================================================================
// ENERGY EFFECTS
// ============================================================================

registerPotionEffect('GAIN_ENERGY', (effect, context) => {
  const value = effect.value;
  context.player.gainEnergy(value);
  context.actions.log(`Gained ${value} Energy`);
  return { success: true, value };
});

// ============================================================================
// CARD EFFECTS
// ============================================================================

registerPotionEffect('DRAW', (effect, context) => {
  const value = effect.value;
  context.actions.drawCards(value);
  context.actions.log(`Drew ${value} cards`);
  return { success: true, value };
});

// ============================================================================
// DAMAGE EFFECTS
// ============================================================================

registerPotionEffect('DAMAGE', (effect, context) => {
  const value = effect.value;
  const targets = getTargets(effect, context);
  
  if (effect.target === 'ALL_ENEMIES') {
    // AOE damage (Explosive Potion)
    targets.forEach(enemy => {
      context.actions.dealDamageToEnemy(enemy, value);
    });
    context.actions.log(`Dealt ${value} damage to all enemies`);
  } else if (targets.length > 0) {
    // Single target damage (Fire Potion)
    const enemy = targets[0];
    context.actions.dealDamageToEnemy(enemy, value);
    context.actions.log(`Dealt ${value} damage to ${enemy.name}`);
  }
  
  return { success: true, value };
});

// ============================================================================
// BUFF EFFECTS
// ============================================================================

registerPotionEffect('APPLY_STRENGTH', (effect, context) => {
  const value = effect.value;
  context.player.strength += value;
  context.actions.log(`Gained ${value} Strength`);
  return { success: true, value };
});

registerPotionEffect('GAIN_STRENGTH', (effect, context) => {
  // Alias for APPLY_STRENGTH
  const value = effect.value;
  context.player.strength += value;
  context.actions.log(`Gained ${value} Strength`);
  return { success: true, value };
});

registerPotionEffect('APPLY_DEXTERITY', (effect, context) => {
  const value = effect.value;
  context.player.dexterity += value;
  context.actions.log(`Gained ${value} Dexterity`);
  return { success: true, value };
});

registerPotionEffect('GAIN_DEXTERITY', (effect, context) => {
  // Alias for APPLY_DEXTERITY
  const value = effect.value;
  context.player.dexterity += value;
  context.actions.log(`Gained ${value} Dexterity`);
  return { success: true, value };
});

registerPotionEffect('GAIN_ARTIFACT', (effect, context) => {
  const value = effect.value;
  // TODO: Implement artifact status on player
  context.actions.log(`Gained ${value} Artifact`);
  return { success: true, value };
});

registerPotionEffect('APPLY_ARTIFACT', (effect, context) => {
  // Alias
  const value = effect.value;
  context.actions.log(`Gained ${value} Artifact`);
  return { success: true, value };
});

registerPotionEffect('GAIN_PLATED_ARMOR', (effect, context) => {
  const value = effect.value;
  // TODO: Implement plated armor status on player
  context.actions.log(`Gained ${value} Plated Armor`);
  return { success: true, value };
});

registerPotionEffect('APPLY_PLATED_ARMOR', (effect, context) => {
  // Alias
  const value = effect.value;
  context.actions.log(`Gained ${value} Plated Armor`);
  return { success: true, value };
});

// ============================================================================
// DEBUFF EFFECTS
// ============================================================================

registerPotionEffect('APPLY_POISON', (effect, context) => {
  const value = effect.value;
  const targets = getTargets(effect, context);
  
  if (targets.length > 0) {
    targets.forEach(enemy => {
      enemy.applyPoison(value);
    });
    context.actions.log(`Applied ${value} Poison`);
  }
  
  return { success: targets.length > 0, value };
});

registerPotionEffect('APPLY_WEAK', (effect, context) => {
  const value = effect.value;
  const targets = getTargets(effect, context);
  
  if (targets.length > 0) {
    targets.forEach(enemy => {
      enemy.applyWeak(value);
    });
    context.actions.log(`Applied ${value} Weak`);
  }
  
  return { success: targets.length > 0, value };
});

registerPotionEffect('APPLY_VULNERABLE', (effect, context) => {
  const value = effect.value;
  const targets = getTargets(effect, context);
  
  if (targets.length > 0) {
    targets.forEach(enemy => {
      enemy.applyVulnerable(value);
    });
    context.actions.log(`Applied ${value} Vulnerable`);
  }
  
  return { success: targets.length > 0, value };
});

registerPotionEffect('APPLY_FRAIL', (effect, context) => {
  const value = effect.value;
  // Frail typically applied to player by enemies
  // But some potions might apply to enemies
  const targets = getTargets(effect, context);
  
  if (targets.length > 0) {
    // Apply to enemies if targeted
    context.actions.log(`Applied ${value} Frail`);
  }
  
  return { success: true, value };
});

// ============================================================================
// MAX HP EFFECTS
// ============================================================================

registerPotionEffect('GAIN_MAX_HP', (effect, context) => {
  const value = effect.value;
  context.player.maxHp += value;
  context.player.currentHp += value; // Also heal for the amount
  context.actions.log(`Gained ${value} Max HP`);
  return { success: true, value };
});

// ============================================================================
// SPECIAL EFFECTS
// ============================================================================

registerPotionEffect('REVIVE', (effect, context) => {
  // Fairy in a Bottle: Revive on death
  // This is handled by a passive check, not directly executed
  const percentage = effect.percentage || 0.3;
  const healAmount = Math.floor(context.player.maxHp * percentage);
  context.player.currentHp = healAmount;
  context.actions.log(`Revived with ${healAmount} HP`);
  return { success: true, value: healAmount };
});

registerPotionEffect('DOUBLE_DAMAGE', (effect, context) => {
  // Some potions might double damage for a turn
  // TODO: Implement via combat state flag
  context.actions.log(`Next attack deals double damage`);
  return { success: true };
});

registerPotionEffect('INTANGIBLE', (effect, context) => {
  const value = effect.value || 1;
  // TODO: Implement intangible on player
  context.actions.log(`Gained ${value} Intangible`);
  return { success: true, value };
});

// ============================================================================
// EXPORT
// ============================================================================

export { potionEffectHandlers };
