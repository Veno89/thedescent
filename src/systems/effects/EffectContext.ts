/**
 * Effect Context
 * 
 * Defines the shared context passed to all effect handlers.
 * This provides access to game state without tight coupling.
 */

import type { Card } from '@/types';
import type { Player } from '@/entities/Player';
import type { Enemy } from '@/entities/Enemy';
import type { Relic } from '@/entities/Relic';
import type { Potion } from '@/entities/Potion';

/**
 * Context passed to effect handlers.
 * Provides all the state and methods needed to execute effects.
 */
export interface EffectContext {
  // Core entities
  player: Player;
  enemies: Enemy[];
  
  // Card piles
  hand: Card[];
  drawPile: Card[];
  discardPile: Card[];
  exhaustPile: Card[];
  
  // Combat state
  turn: number;
  isPlayerTurn: boolean;
  
  // Target (for targeted effects)
  target?: Enemy;
  
  // Source info
  sourceCard?: Card;
  sourceRelic?: Relic;
  sourcePotion?: Potion;
  
  // X-cost energy spent
  energySpent?: number;
  
  // Relic tracking counters
  cardsPlayedThisCombat: number;
  attacksPlayedThisTurn: number;
  skillsPlayedThisTurn: number;
  
  // Actions the effect can trigger
  actions: EffectActions;
}

/**
 * Actions available to effect handlers.
 * These are methods provided by CombatManager.
 */
export interface EffectActions {
  /** Deal damage from player to a specific enemy */
  dealDamageToEnemy: (enemy: Enemy, baseDamage: number) => number;
  
  /** Deal damage to all alive enemies */
  dealDamageToAllEnemies: (baseDamage: number) => void;
  
  /** Deal damage to a random enemy */
  dealDamageToRandomEnemy: (baseDamage: number) => Enemy | null;
  
  /** Draw cards from draw pile */
  drawCards: (count: number) => void;
  
  /** Discard a card from hand */
  discardCard: (card: Card) => void;
  
  /** Exhaust a card */
  exhaustCard: (card: Card) => void;
  
  /** Add a card to hand */
  addCardToHand: (card: Card) => boolean;
  
  /** Add a card to discard pile */
  addCardToDiscard: (card: Card) => void;
  
  /** Add a card to draw pile */
  addCardToDrawPile: (card: Card, position?: 'top' | 'bottom' | 'random') => void;
  
  /** Get all alive enemies */
  getAliveEnemies: () => Enemy[];
  
  /** Get a random alive enemy */
  getRandomEnemy: () => Enemy | null;
  
  /** Trigger relic effects for a given trigger */
  triggerRelics: (trigger: string, context?: any) => void;
  
  /** Log a message */
  log: (message: string) => void;
}

/**
 * Base effect definition from JSON data.
 */
export interface BaseEffect {
  type: string;
  value: number;
  target?: string;
  condition?: string;
}

/**
 * Card effect definition.
 */
export interface CardEffectDef extends BaseEffect {
  // Card effects can have times for multi-hit
  times?: number;
}

/**
 * Relic effect definition.
 */
export interface RelicEffectDef {
  trigger: string;
  action: string;
  value?: number;
  condition?: string;
}

/**
 * Potion effect definition.
 */
export interface PotionEffectDef extends BaseEffect {
  // Potions can have percentage-based effects
  percentage?: number;
}

/**
 * Result of executing an effect.
 */
export interface EffectResult {
  success: boolean;
  message?: string;
  value?: number;
}
