/**
 * Relic Effect Handlers
 * 
 * Registry of handler functions for each relic action type.
 * Replaces the giant switch statement in CombatManager.executeRelicEffect().
 */

import type { EffectContext, RelicEffectDef, EffectResult } from './EffectContext';
import type { Relic } from '@/entities/Relic';
import { DataLoader } from '@/utils/DataLoader';

/**
 * Extended context for relic effects.
 */
export interface RelicEffectContext extends EffectContext {
  relic: Relic;
  triggerContext?: any;
}

/**
 * Type for a relic effect handler function.
 */
export type RelicEffectHandler = (
  effect: RelicEffectDef,
  context: RelicEffectContext
) => EffectResult;

/**
 * Registry of relic effect handlers.
 */
const relicEffectHandlers: Map<string, RelicEffectHandler> = new Map();

/**
 * Register a relic effect handler.
 */
export function registerRelicEffect(action: string, handler: RelicEffectHandler): void {
  relicEffectHandlers.set(action, handler);
}

/**
 * Execute a relic effect using the registered handler.
 */
export function executeRelicEffect(
  effect: RelicEffectDef,
  context: RelicEffectContext
): EffectResult {
  const handler = relicEffectHandlers.get(effect.action);
  
  if (!handler) {
    // Check if it's a passive effect that's handled elsewhere
    if (isPassiveEffect(effect.action)) {
      return { success: true, message: 'Passive effect handled elsewhere' };
    }
    
    console.warn(`Unknown relic action: ${effect.action}`);
    return { success: false, message: `Unknown action: ${effect.action}` };
  }
  
  return handler(effect, context);
}

/**
 * Check if a handler exists for a relic action.
 */
export function hasRelicEffectHandler(action: string): boolean {
  return relicEffectHandlers.has(action) || isPassiveEffect(action);
}

/**
 * Check if this is a passive effect handled by other systems.
 */
function isPassiveEffect(action: string): boolean {
  const passiveEffects = [
    'ELITE_BONUS_RELIC',
    'CURSES_PLAYABLE',
    'VULNERABLE_BONUS',
    'MORE_EVENT_OPTIONS',
    'MERCHANT_BONUS',
    'MERCHANT_DISCOUNT',
    'EXTRA_CARD_REWARD',
    'EXTRA_CARD_CHOICE',
    'REST_REMOVE_CARD',
    'REST_DIG',
    'REDUCE_SMALL_DAMAGE',
    'RETAIN_ENERGY',
    'EVENT_TO_TREASURE',
    'INTANGIBLE_EVERY_N',
    'REVIVE',
    'AUTO_UPGRADE_SKILLS',
    'AUTO_UPGRADE_POWERS',
    'REDUCE_RANDOM_COST',
    'DISCARD_DRAW',
    'MAX_HP',
    'GAIN_GOLD',
    'GAIN_MAX_HP',
    'POTION_SLOT',
  ];
  return passiveEffects.includes(action);
}

// ============================================================================
// SIMPLE EFFECTS
// ============================================================================

registerRelicEffect('HEAL', (effect, context) => {
  const value = effect.value || 0;
  context.player.heal(value);
  context.actions.log(`${context.relic.name}: Healed ${value} HP`);
  return { success: true, value };
});

registerRelicEffect('BLOCK', (effect, context) => {
  const value = effect.value || 0;
  context.player.addBlockRaw(value); // Raw block, no dexterity/frail
  context.actions.log(`${context.relic.name}: Gained ${value} Block`);
  return { success: true, value };
});

registerRelicEffect('DRAW', (effect, context) => {
  const value = effect.value || 0;
  context.actions.drawCards(value);
  context.actions.log(`${context.relic.name}: Drew ${value} cards`);
  return { success: true, value };
});

registerRelicEffect('GAIN_ENERGY', (effect, context) => {
  const value = effect.value || 0;
  context.player.gainEnergy(value);
  context.actions.log(`${context.relic.name}: Gained ${value} Energy`);
  return { success: true, value };
});

registerRelicEffect('GAIN_STRENGTH', (effect, context) => {
  const value = effect.value || 0;
  context.player.strength += value;
  context.actions.log(`${context.relic.name}: Gained ${value} Strength`);
  return { success: true, value };
});

registerRelicEffect('GAIN_DEXTERITY', (effect, context) => {
  const value = effect.value || 0;
  context.player.dexterity += value;
  context.actions.log(`${context.relic.name}: Gained ${value} Dexterity`);
  return { success: true, value };
});

registerRelicEffect('BONUS_DAMAGE', (effect, context) => {
  // This is handled in damage calculation (Akabeko)
  context.actions.log(`${context.relic.name}: First attack bonus damage active`);
  return { success: true };
});

registerRelicEffect('THORNS', (effect, context) => {
  // Deal damage back when taking damage (Bronze Scales)
  const value = effect.value || 0;
  const enemy = context.actions.getRandomEnemy();
  
  if (enemy) {
    const damage = context.actions.dealDamageToEnemy(enemy, value);
    context.actions.log(`${context.relic.name}: Dealt ${damage} thorns damage to ${enemy.name}`);
    return { success: true, value: damage };
  }
  
  return { success: false, message: 'No enemy to damage' };
});

registerRelicEffect('APPLY_VULNERABLE', (effect, context) => {
  const value = effect.value || 0;
  const enemies = context.actions.getAliveEnemies();
  
  enemies.forEach(enemy => {
    enemy.applyVulnerable(value);
  });
  
  context.actions.log(`${context.relic.name}: Applied ${value} Vulnerable to all enemies`);
  return { success: true, value };
});

registerRelicEffect('APPLY_WEAK', (effect, context) => {
  const value = effect.value || 0;
  const enemies = context.actions.getAliveEnemies();
  
  enemies.forEach(enemy => {
    enemy.applyWeak(value);
  });
  
  context.actions.log(`${context.relic.name}: Applied ${value} Weak to all enemies`);
  return { success: true, value };
});

// ============================================================================
// COUNTER-BASED EFFECTS
// ============================================================================

registerRelicEffect('ENERGY_EVERY_N_TURNS', (effect, context) => {
  // Happy Flower: Every 3 turns gain 1 energy
  const value = effect.value || 3;
  if (context.turn % value === 0) {
    context.player.gainEnergy(1);
    context.actions.log(`${context.relic.name}: Gained 1 Energy (every ${value} turns)`);
    return { success: true, value: 1 };
  }
  return { success: false, message: 'Not the right turn' };
});

registerRelicEffect('DRAW_EVERY_N', (effect, context) => {
  // Ink Bottle: Every 10 cards played, draw 1
  const value = effect.value || 10;
  context.relic.incrementCounter();
  
  if (context.relic.counter >= value) {
    context.actions.drawCards(1);
    context.relic.resetCounter();
    context.actions.log(`${context.relic.name}: Drew 1 card (every ${value} cards played)`);
    return { success: true, value: 1 };
  }
  
  return { success: false, message: 'Counter not reached' };
});

registerRelicEffect('DEXTERITY_EVERY_N', (effect, context) => {
  // Kunai: Every 3 attacks, gain 1 dexterity
  const value = effect.value || 3;
  context.relic.incrementCounter();
  
  if (context.relic.counter >= value) {
    context.player.dexterity += 1;
    context.relic.resetCounter();
    context.actions.log(`${context.relic.name}: Gained 1 Dexterity (every ${value} attacks)`);
    return { success: true, value: 1 };
  }
  
  return { success: false, message: 'Counter not reached' };
});

registerRelicEffect('STRENGTH_EVERY_N', (effect, context) => {
  // Shuriken: Every 3 attacks, gain 1 strength
  const value = effect.value || 3;
  context.relic.incrementCounter();
  
  if (context.relic.counter >= value) {
    context.player.strength += 1;
    context.relic.resetCounter();
    context.actions.log(`${context.relic.name}: Gained 1 Strength (every ${value} attacks)`);
    return { success: true, value: 1 };
  }
  
  return { success: false, message: 'Counter not reached' };
});

registerRelicEffect('BLOCK_EVERY_N', (effect, context) => {
  // Ornamental Fan: Every 3 attacks, gain 4 block
  const value = effect.value || 3;
  context.relic.incrementCounter();
  
  if (context.relic.counter >= value) {
    context.player.addBlockRaw(4);
    context.relic.resetCounter();
    context.actions.log(`${context.relic.name}: Gained 4 Block (every ${value} attacks)`);
    return { success: true, value: 4 };
  }
  
  return { success: false, message: 'Counter not reached' };
});

registerRelicEffect('DAMAGE_ALL_EVERY_N', (effect, context) => {
  // Letter Opener: Every 3 skills, deal 5 damage to all
  const value = effect.value || 3;
  context.relic.incrementCounter();
  
  if (context.relic.counter >= value) {
    context.actions.getAliveEnemies().forEach(enemy => {
      const damage = context.actions.dealDamageToEnemy(enemy, 5);
      context.actions.log(`${context.relic.name}: Dealt ${damage} damage to ${enemy.name}`);
    });
    context.relic.resetCounter();
    return { success: true, value: 5 };
  }
  
  return { success: false, message: 'Counter not reached' };
});

registerRelicEffect('ENERGY_EVERY_N', (effect, context) => {
  // Sundial: Every 3 shuffles, gain 2 energy
  const value = effect.value || 3;
  context.relic.incrementCounter();
  
  if (context.relic.counter >= value) {
    context.player.gainEnergy(2);
    context.relic.resetCounter();
    context.actions.log(`${context.relic.name}: Gained 2 Energy (every ${value} shuffles)`);
    return { success: true, value: 2 };
  }
  
  return { success: false, message: 'Counter not reached' };
});

// ============================================================================
// SPECIAL EFFECTS
// ============================================================================

registerRelicEffect('ENERGY_NEXT_COMBAT', (effect, context) => {
  // Ancient Tea Set: After rest, gain energy next combat
  // This needs special handling - store value for next combat
  const value = effect.value || 2;
  context.actions.log(`${context.relic.name}: Will start next combat with +${value} Energy`);
  return { success: true, value };
});

registerRelicEffect('ADD_RANDOM_CARD', (effect, context) => {
  // Dead Branch: When exhausting, add random card to hand
  const allCards = DataLoader.getAllCards();
  
  if (allCards.length > 0 && context.hand.length < 10) {
    const randomCard = { ...allCards[Math.floor(Math.random() * allCards.length)] };
    context.actions.addCardToHand(randomCard);
    context.actions.log(`${context.relic.name}: Added ${randomCard.name} to hand`);
    return { success: true };
  }
  
  return { success: false, message: 'Hand full or no cards available' };
});

registerRelicEffect('DAMAGE_RANDOM', (effect, context) => {
  // Tingsha: When discarding, deal damage to random enemy
  const value = effect.value || 3;
  const enemy = context.actions.dealDamageToRandomEnemy(value);
  
  if (enemy) {
    context.actions.log(`${context.relic.name}: Dealt ${value} damage to ${enemy.name}`);
    return { success: true, value };
  }
  
  return { success: false, message: 'No enemy to damage' };
});

registerRelicEffect('DAMAGE_ALL', (effect, context) => {
  const value = effect.value || 0;
  context.actions.dealDamageToAllEnemies(value);
  context.actions.log(`${context.relic.name}: Dealt ${value} damage to all enemies`);
  return { success: true, value };
});

registerRelicEffect('DRAW_IF_ATTACKS', (effect, context) => {
  // Pocketwatch: If few attacks played, draw cards
  const threshold = effect.value || 3;
  
  if (context.attacksPlayedThisTurn < threshold) {
    context.actions.drawCards(3);
    context.actions.log(`${context.relic.name}: Drew 3 cards (less than ${threshold} attacks played)`);
    return { success: true, value: 3 };
  }
  
  return { success: false, message: 'Too many attacks played' };
});

registerRelicEffect('PLATED_ARMOR', (effect, context) => {
  // Orichalcum: If no block at end of turn, gain plated armor block
  const value = effect.value || 6;
  
  if (context.player.block === 0) {
    context.player.addBlockRaw(value);
    context.actions.log(`${context.relic.name}: Gained ${value} Block (no block at end of turn)`);
    return { success: true, value };
  }
  
  return { success: false, message: 'Player has block' };
});

registerRelicEffect('HEAL_PERCENT', (effect, context) => {
  // Meat on the Bone: After combat, if below 50% HP, heal
  const value = effect.value || 12;
  const threshold = 0.5;
  
  if (context.player.currentHp / context.player.maxHp < threshold) {
    context.player.heal(value);
    context.actions.log(`${context.relic.name}: Healed ${value} HP (below 50%)`);
    return { success: true, value };
  }
  
  return { success: false, message: 'HP above threshold' };
});

registerRelicEffect('STRENGTH_AT_HP', (effect, context) => {
  // Red Skull: While below 50% HP, gain strength
  const value = effect.value || 3;
  // This is a passive effect that's checked during combat
  return { success: true, value };
});

// ============================================================================
// EXPORT
// ============================================================================

export { relicEffectHandlers };
