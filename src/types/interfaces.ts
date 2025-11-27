/**
 * Core Interfaces
 * 
 * Shared interfaces that establish contracts between game systems.
 * These interfaces enable polymorphism, reduce coupling, and improve testability.
 */

import type { Card, StatusEffects, RelicEffect } from './index';

// ============================================================================
// COMBAT INTERFACES
// ============================================================================

/**
 * Interface for any entity that can participate in combat.
 * Both Player and Enemy implement this interface.
 */
export interface ICombatant {
  /** Unique identifier */
  readonly id: string;
  
  /** Display name */
  readonly name: string;
  
  /** Maximum health points */
  maxHp: number;
  
  /** Current health points */
  currentHp: number;
  
  /** Current block (temporary defense) */
  block: number;
  
  /** Current strength (bonus damage) */
  strength: number;
  
  /** Current dexterity (bonus block) */
  dexterity: number;
  
  /** Turns of weakness remaining */
  weak: number;
  
  /** Turns of vulnerability remaining */
  vulnerable: number;
  
  /** Turns of frailty remaining */
  frail: number;
  
  /** Stacks of poison */
  poison: number;
  
  /**
   * Check if the combatant is dead.
   */
  isDead(): boolean;
  
  /**
   * Take damage, applying block first.
   * @param damage - Raw damage amount
   * @returns Actual HP lost after block
   */
  takeDamage(damage: number): number;
  
  /**
   * Gain block.
   * @param amount - Block to gain
   */
  gainBlock(amount: number): void;
  
  /**
   * Heal HP.
   * @param amount - HP to restore
   */
  heal(amount: number): void;
}

/**
 * Interface for entities that hold status effects.
 */
export interface IStatusHolder {
  /** Artifact stacks (negate debuffs) */
  artifact: number;
  
  /** Plated armor stacks (end-of-turn block) */
  platedArmor: number;
  
  /** Thorns stacks (reflect damage) */
  thorns: number;
  
  /** Ritual stacks (gain strength each turn) */
  ritual: number;
  
  /** Intangible turns (reduce damage to 1) */
  intangible: number;
  
  /** Regeneration stacks (heal each turn) */
  regen?: number;
  
  /**
   * Apply a status effect.
   * @param status - Status effect name
   * @param stacks - Number of stacks to apply
   */
  applyStatus(status: keyof StatusEffects, stacks: number): void;
  
  /**
   * Remove/decrement status effects at end of turn.
   */
  tickStatusEffects(): void;
  
  /**
   * Check if entity has artifact to block a debuff.
   * Consumes one artifact stack if available.
   * @returns True if debuff was blocked
   */
  tryBlockDebuff?(): boolean;
}

/**
 * Combined interface for full combat participants.
 */
export interface ICombatParticipant extends ICombatant, IStatusHolder {}

// ============================================================================
// TARGETING INTERFACES
// ============================================================================

/**
 * Interface for entities that can be targeted by cards/effects.
 */
export interface ITargetable {
  /** Unique identifier for targeting */
  readonly id: string;
  
  /** Whether this target is currently valid */
  isValidTarget(): boolean;
}

/**
 * Target selection result.
 */
export interface ITargetSelection {
  /** Selected targets */
  targets: ITargetable[];
  
  /** Whether selection was cancelled */
  cancelled: boolean;
}

// ============================================================================
// SERIALIZATION INTERFACES
// ============================================================================

/**
 * Interface for objects that can be serialized for saving.
 */
export interface ISerializable<T = unknown> {
  /**
   * Serialize the object to a plain data structure.
   */
  serialize(): T;
}

/**
 * Interface for classes that can deserialize saved data.
 */
export interface IDeserializable<T, R> {
  /**
   * Create an instance from serialized data.
   * @param data - Serialized data
   */
  deserialize(data: T): R;
}

// ============================================================================
// DECK/CARD INTERFACES
// ============================================================================

/**
 * Interface for objects that hold cards.
 */
export interface ICardHolder {
  /** Cards in the collection */
  readonly cards: Card[];
  
  /**
   * Add a card to the collection.
   * @param card - Card to add
   */
  addCard(card: Card): void;
  
  /**
   * Remove a card from the collection.
   * @param card - Card to remove
   * @returns True if card was found and removed
   */
  removeCard(card: Card): boolean;
  
  /**
   * Get the number of cards.
   */
  getCount(): number;
}

/**
 * Interface for card piles (draw, discard, exhaust, hand).
 */
export interface ICardPile extends ICardHolder {
  /** Pile name for identification */
  readonly name: string;
  
  /**
   * Draw a card from the pile.
   * @returns The drawn card, or null if empty
   */
  draw(): Card | null;
  
  /**
   * Peek at the top card(s) without removing.
   * @param count - Number of cards to peek
   */
  peek(count?: number): Card[];
  
  /**
   * Shuffle the pile.
   */
  shuffle(): void;
  
  /**
   * Check if the pile is empty.
   */
  isEmpty(): boolean;
  
  /**
   * Clear all cards from the pile.
   * @returns The removed cards
   */
  clear(): Card[];
}

// ============================================================================
// RELIC INTERFACES
// ============================================================================

/**
 * Interface for relic data.
 */
export interface IRelicData {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly rarity: string;
  readonly effects: RelicEffect[];
}

/**
 * Interface for relic instances.
 */
export interface IRelic extends IRelicData {
  /** Counter for relics that track usage */
  counter: number;
  
  /**
   * Get effects that trigger on a specific event.
   * @param trigger - Trigger event name
   */
  getEffectsForTrigger(trigger: string): RelicEffect[];
  
  /**
   * Increment the relic's counter.
   * @param amount - Amount to increment (default 1)
   */
  incrementCounter(amount?: number): void;
  
  /**
   * Reset the relic's counter.
   */
  resetCounter(): void;
}

// ============================================================================
// EFFECT INTERFACES
// ============================================================================

/**
 * Result of executing an effect.
 */
export interface IEffectResult {
  /** Whether the effect executed successfully */
  success: boolean;
  
  /** Optional message describing the result */
  message?: string;
  
  /** Optional numeric value (damage dealt, HP healed, etc.) */
  value?: number;
  
  /** Whether to continue processing remaining effects */
  continue?: boolean;
}

/**
 * Context passed to effect handlers.
 */
export interface IEffectContext {
  /** The player */
  player: ICombatant & IStatusHolder;
  
  /** All enemies in combat */
  enemies: (ICombatant & IStatusHolder)[];
  
  /** Currently targeted enemy (if applicable) */
  target?: ICombatant & IStatusHolder;
  
  /** Source card (if card effect) */
  sourceCard?: Card;
  
  /** Energy spent (for X-cost cards) */
  energySpent?: number;
}

/**
 * Handler function for effects.
 */
export type IEffectHandler<T = unknown> = (
  effect: T,
  context: IEffectContext
) => IEffectResult;

// ============================================================================
// EVENT INTERFACES
// ============================================================================

/**
 * Interface for event emitters.
 */
export interface IEventEmitter {
  /**
   * Subscribe to an event.
   * @param event - Event name
   * @param handler - Handler function
   * @returns Unsubscribe function
   */
  on(event: string, handler: (...args: unknown[]) => void): () => void;
  
  /**
   * Subscribe to an event once.
   * @param event - Event name
   * @param handler - Handler function
   */
  once(event: string, handler: (...args: unknown[]) => void): () => void;
  
  /**
   * Emit an event.
   * @param event - Event name
   * @param args - Event arguments
   */
  emit(event: string, ...args: unknown[]): void;
  
  /**
   * Unsubscribe from an event.
   * @param event - Event name
   * @param handler - Handler to remove
   */
  off(event: string, handler: (...args: unknown[]) => void): void;
}

// ============================================================================
// GAME STATE INTERFACES
// ============================================================================

/**
 * Interface for run state.
 */
export interface IRunState {
  /** Random seed for the run */
  seed: string;
  
  /** Current act (1-3) */
  currentAct: number;
  
  /** Current floor within the act */
  currentFloor: number;
  
  /** Index of current room in map */
  currentRoomIndex: number;
}

/**
 * Interface for combat state.
 */
export interface ICombatState {
  /** Current turn number */
  turn: number;
  
  /** Whether it's the player's turn */
  isPlayerTurn: boolean;
  
  /** Cards in hand */
  hand: Card[];
  
  /** Cards in draw pile */
  drawPile: Card[];
  
  /** Cards in discard pile */
  discardPile: Card[];
  
  /** Exhausted cards */
  exhaustPile: Card[];
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Make all properties of T mutable (remove readonly).
 */
export type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

/**
 * Extract only the method names from a type.
 */
export type MethodNames<T> = {
  [K in keyof T]: T[K] extends (...args: unknown[]) => unknown ? K : never;
}[keyof T];

/**
 * Extract only the property names (non-methods) from a type.
 */
export type PropertyNames<T> = {
  [K in keyof T]: T[K] extends (...args: unknown[]) => unknown ? never : K;
}[keyof T];

/**
 * Pick only methods from a type.
 */
export type PickMethods<T> = Pick<T, MethodNames<T>>;

/**
 * Pick only properties from a type.
 */
export type PickProperties<T> = Pick<T, PropertyNames<T>>;
