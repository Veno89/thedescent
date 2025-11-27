/**
 * Effect System
 * 
 * Centralized effect execution system using a registry pattern.
 * This replaces the giant switch statements throughout the codebase.
 * 
 * Usage:
 * ```typescript
 * import { EffectSystem } from '@/systems/effects';
 * 
 * // Execute a card effect
 * EffectSystem.executeCardEffect(effect, context);
 * 
 * // Execute a relic effect
 * EffectSystem.executeRelicEffect(effect, relicContext);
 * 
 * // Execute a potion effect
 * EffectSystem.executePotionEffect(effect, potionContext);
 * ```
 */

// Re-export types
export type {
  EffectContext,
  EffectActions,
  BaseEffect,
  CardEffectDef,
  RelicEffectDef,
  PotionEffectDef,
  EffectResult,
} from './EffectContext';

export type { RelicEffectContext } from './RelicEffectHandler';
export type { PotionEffectContext } from './PotionEffectHandler';

// Import handlers to register them
import {
  executeCardEffect,
  hasCardEffectHandler,
  registerCardEffect,
  type CardEffectHandler,
} from './CardEffectHandler';

import {
  executeRelicEffect,
  hasRelicEffectHandler,
  registerRelicEffect,
  type RelicEffectHandler,
} from './RelicEffectHandler';

import {
  executePotionEffect,
  hasPotionEffectHandler,
  registerPotionEffect,
  type PotionEffectHandler,
} from './PotionEffectHandler';

// Re-export handler types
export type { CardEffectHandler, RelicEffectHandler, PotionEffectHandler };

/**
 * Main Effect System API.
 * Provides a unified interface for executing all effect types.
 */
export const EffectSystem = {
  // Card effects
  executeCardEffect,
  hasCardEffectHandler,
  registerCardEffect,
  
  // Relic effects
  executeRelicEffect,
  hasRelicEffectHandler,
  registerRelicEffect,
  
  // Potion effects
  executePotionEffect,
  hasPotionEffectHandler,
  registerPotionEffect,
  
  /**
   * Check if any handler exists for an effect type.
   */
  hasHandler(type: string, category: 'card' | 'relic' | 'potion'): boolean {
    switch (category) {
      case 'card':
        return hasCardEffectHandler(type);
      case 'relic':
        return hasRelicEffectHandler(type);
      case 'potion':
        return hasPotionEffectHandler(type);
      default:
        return false;
    }
  },
};

// Default export
export default EffectSystem;
