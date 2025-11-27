/**
 * Card Effect Handlers
 * 
 * Registry of handler functions for each card effect type.
 * Replaces the giant switch statement in CombatManager.executeEffect().
 */

import type { EffectContext, CardEffectDef, EffectResult } from './EffectContext';
import type { Enemy } from '@/entities/Enemy';

/**
 * Type for a card effect handler function.
 */
export type CardEffectHandler = (
  effect: CardEffectDef,
  context: EffectContext
) => EffectResult;

/**
 * Registry of card effect handlers.
 */
const cardEffectHandlers: Map<string, CardEffectHandler> = new Map();

/**
 * Register a card effect handler.
 */
export function registerCardEffect(type: string, handler: CardEffectHandler): void {
  cardEffectHandlers.set(type, handler);
}

/**
 * Execute a card effect using the registered handler.
 */
export function executeCardEffect(
  effect: CardEffectDef,
  context: EffectContext
): EffectResult {
  const handler = cardEffectHandlers.get(effect.type);
  
  if (!handler) {
    console.warn(`Unknown card effect type: ${effect.type}`);
    return { success: false, message: `Unknown effect type: ${effect.type}` };
  }
  
  return handler(effect, context);
}

/**
 * Check if a handler exists for an effect type.
 */
export function hasCardEffectHandler(type: string): boolean {
  return cardEffectHandlers.has(type);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get the effective value for an effect, accounting for X-cost cards.
 */
function getEffectValue(effect: CardEffectDef, context: EffectContext): number {
  // For X-cost cards, use energySpent if effect value is 0
  if (effect.value === 0 && context.energySpent && context.energySpent > 0) {
    return context.energySpent;
  }
  return effect.value;
}

/**
 * Get target enemy, handling ALL_ENEMIES and RANDOM_ENEMY cases.
 */
function getTargets(effect: CardEffectDef, context: EffectContext): Enemy[] {
  if (effect.target === 'ALL_ENEMIES') {
    return context.actions.getAliveEnemies();
  }
  
  if (effect.target === 'RANDOM_ENEMY') {
    const enemy = context.actions.getRandomEnemy();
    return enemy ? [enemy] : [];
  }
  
  // Single target
  if (context.target && !context.target.isDead()) {
    return [context.target];
  }
  
  return [];
}

// ============================================================================
// DAMAGE EFFECTS
// ============================================================================

registerCardEffect('DAMAGE', (effect, context) => {
  const value = getEffectValue(effect, context);
  const targets = getTargets(effect, context);
  
  if (targets.length === 0) {
    return { success: false, message: 'No valid target' };
  }
  
  let totalDamage = 0;
  const times = effect.times || 1;
  
  for (let i = 0; i < times; i++) {
    targets.forEach(enemy => {
      totalDamage += context.actions.dealDamageToEnemy(enemy, value);
    });
  }
  
  return { success: true, value: totalDamage };
});

registerCardEffect('DAMAGE_ALL', (effect, context) => {
  const value = getEffectValue(effect, context);
  context.actions.dealDamageToAllEnemies(value);
  return { success: true, value };
});

registerCardEffect('DAMAGE_RANDOM', (effect, context) => {
  const value = getEffectValue(effect, context);
  const enemy = context.actions.dealDamageToRandomEnemy(value);
  return { success: !!enemy, value };
});

registerCardEffect('DAMAGE_EQUAL_BLOCK', (effect, context) => {
  const targets = getTargets(effect, context);
  
  if (targets.length === 0) {
    return { success: false, message: 'No valid target' };
  }
  
  const damage = context.player.block;
  let totalDamage = 0;
  
  targets.forEach(enemy => {
    totalDamage += context.actions.dealDamageToEnemy(enemy, damage);
  });
  
  return { success: true, value: totalDamage };
});

// ============================================================================
// BLOCK EFFECTS
// ============================================================================

registerCardEffect('BLOCK', (effect, context) => {
  const value = getEffectValue(effect, context);
  context.player.addBlock(value);
  return { success: true, value };
});

registerCardEffect('DOUBLE_BLOCK', (effect, context) => {
  const currentBlock = context.player.block;
  context.player.addBlockRaw(currentBlock);
  return { success: true, value: currentBlock };
});

// ============================================================================
// CARD MANIPULATION
// ============================================================================

registerCardEffect('DRAW', (effect, context) => {
  const value = getEffectValue(effect, context);
  context.actions.drawCards(value);
  return { success: true, value };
});

registerCardEffect('DISCARD', (effect, context) => {
  // Discard random cards from hand
  const value = getEffectValue(effect, context);
  let discarded = 0;
  
  for (let i = 0; i < value && context.hand.length > 0; i++) {
    const randomIndex = Math.floor(Math.random() * context.hand.length);
    const card = context.hand[randomIndex];
    context.actions.discardCard(card);
    discarded++;
  }
  
  return { success: true, value: discarded };
});

registerCardEffect('EXHAUST', (effect, context) => {
  // This is typically handled by card.exhaust flag, not as an effect
  // But some cards exhaust other cards
  return { success: true };
});

registerCardEffect('ADD_TO_HAND', (effect, context) => {
  // Add a specific card to hand (e.g., Shiv)
  // This would need card data lookup
  return { success: true };
});

registerCardEffect('ADD_TO_DISCARD', (effect, context) => {
  // Add a specific card to discard pile
  return { success: true };
});

registerCardEffect('ADD_TO_DRAW', (effect, context) => {
  // Add a specific card to draw pile
  return { success: true };
});

// ============================================================================
// ENERGY EFFECTS
// ============================================================================

registerCardEffect('GAIN_ENERGY', (effect, context) => {
  const value = getEffectValue(effect, context);
  context.player.gainEnergy(value);
  return { success: true, value };
});

registerCardEffect('LOSE_ENERGY', (effect, context) => {
  const value = getEffectValue(effect, context);
  context.player.energy = Math.max(0, context.player.energy - value);
  return { success: true, value };
});

// ============================================================================
// HP EFFECTS
// ============================================================================

registerCardEffect('HEAL', (effect, context) => {
  const value = getEffectValue(effect, context);
  context.player.heal(value);
  return { success: true, value };
});

registerCardEffect('LOSE_HP', (effect, context) => {
  const value = getEffectValue(effect, context);
  context.player.loseHp(value);
  return { success: true, value };
});

registerCardEffect('GAIN_MAX_HP', (effect, context) => {
  const value = getEffectValue(effect, context);
  context.player.maxHp += value;
  context.player.currentHp += value;
  return { success: true, value };
});

// ============================================================================
// BUFF EFFECTS (SELF)
// ============================================================================

registerCardEffect('APPLY_STRENGTH', (effect, context) => {
  const value = getEffectValue(effect, context);
  context.player.strength += value;
  context.actions.log(`Gained ${value} Strength`);
  return { success: true, value };
});

registerCardEffect('APPLY_DEXTERITY', (effect, context) => {
  const value = getEffectValue(effect, context);
  context.player.dexterity += value;
  context.actions.log(`Gained ${value} Dexterity`);
  return { success: true, value };
});

registerCardEffect('APPLY_ARTIFACT', (effect, context) => {
  const value = getEffectValue(effect, context);
  // Artifact prevents debuffs
  // TODO: Implement artifact on player
  context.actions.log(`Gained ${value} Artifact`);
  return { success: true, value };
});

registerCardEffect('APPLY_PLATED_ARMOR', (effect, context) => {
  const value = getEffectValue(effect, context);
  // TODO: Implement plated armor on player
  context.actions.log(`Gained ${value} Plated Armor`);
  return { success: true, value };
});

registerCardEffect('APPLY_THORNS', (effect, context) => {
  const value = getEffectValue(effect, context);
  // TODO: Implement thorns on player
  context.actions.log(`Gained ${value} Thorns`);
  return { success: true, value };
});

registerCardEffect('APPLY_RITUAL', (effect, context) => {
  const value = getEffectValue(effect, context);
  // Ritual: At end of turn, gain strength
  // TODO: Implement ritual
  context.actions.log(`Gained ${value} Ritual`);
  return { success: true, value };
});

registerCardEffect('APPLY_INTANGIBLE', (effect, context) => {
  const value = getEffectValue(effect, context);
  // TODO: Implement intangible on player
  context.actions.log(`Gained ${value} Intangible`);
  return { success: true, value };
});

registerCardEffect('APPLY_REGEN', (effect, context) => {
  const value = getEffectValue(effect, context);
  // Regen: Heal at end of turn
  // TODO: Implement regen
  context.actions.log(`Gained ${value} Regen`);
  return { success: true, value };
});

// ============================================================================
// DEBUFF EFFECTS (ENEMIES)
// ============================================================================

registerCardEffect('APPLY_VULNERABLE', (effect, context) => {
  const value = getEffectValue(effect, context);
  const targets = getTargets(effect, context);
  
  targets.forEach(enemy => {
    enemy.applyVulnerable(value);
    context.actions.log(`Applied ${value} Vulnerable to ${enemy.name}`);
  });
  
  return { success: targets.length > 0, value };
});

registerCardEffect('APPLY_WEAK', (effect, context) => {
  const value = getEffectValue(effect, context);
  const targets = getTargets(effect, context);
  
  targets.forEach(enemy => {
    enemy.applyWeak(value);
    context.actions.log(`Applied ${value} Weak to ${enemy.name}`);
  });
  
  return { success: targets.length > 0, value };
});

registerCardEffect('APPLY_FRAIL', (effect, context) => {
  const value = getEffectValue(effect, context);
  // Frail typically only applies to player, but some cards might apply to enemies
  context.player.frail = Math.max(context.player.frail, value);
  return { success: true, value };
});

registerCardEffect('APPLY_POISON', (effect, context) => {
  const value = getEffectValue(effect, context);
  const targets = getTargets(effect, context);
  
  targets.forEach(enemy => {
    enemy.applyPoison(value);
    context.actions.log(`Applied ${value} Poison to ${enemy.name}`);
  });
  
  return { success: targets.length > 0, value };
});

registerCardEffect('REDUCE_STRENGTH', (effect, context) => {
  const value = getEffectValue(effect, context);
  const targets = getTargets(effect, context);
  
  targets.forEach(enemy => {
    enemy.strength = Math.max(0, enemy.strength - value);
    context.actions.log(`Reduced ${enemy.name}'s Strength by ${value}`);
  });
  
  return { success: targets.length > 0, value };
});

// ============================================================================
// SPECIAL EFFECTS
// ============================================================================

registerCardEffect('UPGRADE_CARD', (effect, context) => {
  // Upgrade a random card in hand
  // TODO: Implement card upgrading
  return { success: true };
});

registerCardEffect('TRANSFORM_CARD', (effect, context) => {
  // Transform a card into another
  // TODO: Implement card transformation
  return { success: true };
});

registerCardEffect('NEXT_CARD_TWICE', (effect, context) => {
  // Next card played is played twice (Double Tap)
  // TODO: Implement via combat state flag
  return { success: true };
});

registerCardEffect('SCRY', (effect, context) => {
  const value = getEffectValue(effect, context);
  // Look at top N cards of draw pile, discard any
  // TODO: Implement scry UI
  context.actions.log(`Scry ${value}`);
  return { success: true, value };
});

registerCardEffect('RETAIN_HAND', (effect, context) => {
  // Cards in hand are retained this turn
  // TODO: Implement via card flags
  return { success: true };
});

// ============================================================================
// EXPORT
// ============================================================================

export { cardEffectHandlers };
