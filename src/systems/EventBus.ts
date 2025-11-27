/**
 * Event Bus
 * 
 * Centralized event system for decoupled communication between game systems.
 * Uses a publish-subscribe pattern for loose coupling.
 * 
 * Usage:
 * ```typescript
 * // Subscribe to events
 * EventBus.on(GameEvent.CARD_PLAYED, (data) => {
 *   console.log(`Card played: ${data.card.name}`);
 * });
 * 
 * // Emit events
 * EventBus.emit(GameEvent.CARD_PLAYED, { card, target });
 * 
 * // Unsubscribe
 * const unsubscribe = EventBus.on(GameEvent.DAMAGE_DEALT, handler);
 * unsubscribe(); // Remove listener
 * ```
 */

// ============================================================================
// EVENT TYPES
// ============================================================================

/**
 * All game events that can be emitted/subscribed to.
 */
export enum GameEvent {
  // Combat lifecycle
  COMBAT_START = 'COMBAT_START',
  COMBAT_END = 'COMBAT_END',
  COMBAT_VICTORY = 'COMBAT_VICTORY',
  COMBAT_DEFEAT = 'COMBAT_DEFEAT',

  // Turn lifecycle
  TURN_START = 'TURN_START',
  TURN_END = 'TURN_END',
  PLAYER_TURN_START = 'PLAYER_TURN_START',
  PLAYER_TURN_END = 'PLAYER_TURN_END',
  ENEMY_TURN_START = 'ENEMY_TURN_START',
  ENEMY_TURN_END = 'ENEMY_TURN_END',

  // Card events
  CARD_DRAWN = 'CARD_DRAWN',
  CARD_PLAYED = 'CARD_PLAYED',
  CARD_DISCARDED = 'CARD_DISCARDED',
  CARD_EXHAUSTED = 'CARD_EXHAUSTED',
  CARD_ADDED_TO_DECK = 'CARD_ADDED_TO_DECK',
  CARD_REMOVED_FROM_DECK = 'CARD_REMOVED_FROM_DECK',
  CARD_UPGRADED = 'CARD_UPGRADED',
  CARD_TRANSFORMED = 'CARD_TRANSFORMED',

  // Damage events
  DAMAGE_DEALT = 'DAMAGE_DEALT',
  DAMAGE_TAKEN = 'DAMAGE_TAKEN',
  PLAYER_DAMAGED = 'PLAYER_DAMAGED',
  ENEMY_DAMAGED = 'ENEMY_DAMAGED',
  ENEMY_KILLED = 'ENEMY_KILLED',

  // Block events
  BLOCK_GAINED = 'BLOCK_GAINED',
  BLOCK_LOST = 'BLOCK_LOST',

  // Status effect events
  STATUS_APPLIED = 'STATUS_APPLIED',
  STATUS_REMOVED = 'STATUS_REMOVED',
  BUFF_GAINED = 'BUFF_GAINED',
  DEBUFF_APPLIED = 'DEBUFF_APPLIED',
  POISON_TICK = 'POISON_TICK',

  // Energy events
  ENERGY_GAINED = 'ENERGY_GAINED',
  ENERGY_SPENT = 'ENERGY_SPENT',
  ENERGY_LOST = 'ENERGY_LOST',

  // HP events
  HEAL = 'HEAL',
  HP_LOST = 'HP_LOST',
  MAX_HP_CHANGED = 'MAX_HP_CHANGED',

  // Pile events
  SHUFFLE = 'SHUFFLE',
  DRAW_PILE_EMPTY = 'DRAW_PILE_EMPTY',

  // Relic events
  RELIC_OBTAINED = 'RELIC_OBTAINED',
  RELIC_TRIGGERED = 'RELIC_TRIGGERED',

  // Potion events
  POTION_OBTAINED = 'POTION_OBTAINED',
  POTION_USED = 'POTION_USED',
  POTION_DISCARDED = 'POTION_DISCARDED',

  // Gold events
  GOLD_GAINED = 'GOLD_GAINED',
  GOLD_SPENT = 'GOLD_SPENT',

  // Room events
  ROOM_ENTERED = 'ROOM_ENTERED',
  ROOM_COMPLETED = 'ROOM_COMPLETED',
  REST_SITE_ENTERED = 'REST_SITE_ENTERED',
  MERCHANT_ENTERED = 'MERCHANT_ENTERED',
  EVENT_ENTERED = 'EVENT_ENTERED',
  TREASURE_OPENED = 'TREASURE_OPENED',

  // Map events
  FLOOR_COMPLETED = 'FLOOR_COMPLETED',
  ACT_COMPLETED = 'ACT_COMPLETED',

  // UI events
  CARD_SELECTED = 'CARD_SELECTED',
  CARD_DESELECTED = 'CARD_DESELECTED',
  ENEMY_TARGETED = 'ENEMY_TARGETED',
  ANIMATION_COMPLETE = 'ANIMATION_COMPLETE',

  // Game state events
  GAME_STARTED = 'GAME_STARTED',
  GAME_OVER = 'GAME_OVER',
  RUN_STARTED = 'RUN_STARTED',
  RUN_ENDED = 'RUN_ENDED',
  SAVE_GAME = 'SAVE_GAME',
  LOAD_GAME = 'LOAD_GAME',
}

// ============================================================================
// EVENT DATA TYPES
// ============================================================================

import type { Card } from '@/types';
import type { Player } from '@/entities/Player';
import type { Enemy } from '@/entities/Enemy';
import type { Relic } from '@/entities/Relic';
import type { Potion } from '@/entities/Potion';

/**
 * Base event data - all events include timestamp.
 */
export interface BaseEventData {
  timestamp: number;
}

/**
 * Combat event data.
 */
export interface CombatEventData extends BaseEventData {
  player: Player;
  enemies: Enemy[];
  turn?: number;
  victory?: boolean;
}

/**
 * Card event data.
 */
export interface CardEventData extends BaseEventData {
  card: Card;
  target?: Enemy;
  source?: 'hand' | 'draw' | 'discard' | 'exhaust' | 'deck';
  destination?: 'hand' | 'draw' | 'discard' | 'exhaust' | 'deck';
}

/**
 * Damage event data.
 */
export interface DamageEventData extends BaseEventData {
  source: 'player' | 'enemy' | 'effect' | 'poison' | 'thorns';
  target: 'player' | Enemy;
  baseDamage: number;
  finalDamage: number;
  blocked: number;
  hpLost: number;
  wasLethal: boolean;
  sourceName?: string;
}

/**
 * Status effect event data.
 */
export interface StatusEventData extends BaseEventData {
  target: 'player' | Enemy;
  status: string;
  stacks: number;
  isDebuff: boolean;
}

/**
 * Energy event data.
 */
export interface EnergyEventData extends BaseEventData {
  amount: number;
  current: number;
  max: number;
}

/**
 * Gold event data.
 */
export interface GoldEventData extends BaseEventData {
  amount: number;
  total: number;
  source?: string;
}

/**
 * Relic event data.
 */
export interface RelicEventData extends BaseEventData {
  relic: Relic;
  trigger?: string;
  effect?: any;
}

/**
 * Potion event data.
 */
export interface PotionEventData extends BaseEventData {
  potion: Potion;
  target?: Enemy;
  slotIndex?: number;
}

/**
 * Room event data.
 */
export interface RoomEventData extends BaseEventData {
  roomType: string;
  floor: number;
  act: number;
}

/**
 * Generic event data for simple events.
 */
export interface GenericEventData extends BaseEventData {
  [key: string]: any;
}

/**
 * Union type of all event data.
 */
export type EventData =
  | CombatEventData
  | CardEventData
  | DamageEventData
  | StatusEventData
  | EnergyEventData
  | GoldEventData
  | RelicEventData
  | PotionEventData
  | RoomEventData
  | GenericEventData;

// ============================================================================
// EVENT HANDLER TYPE
// ============================================================================

/**
 * Event handler function type.
 */
export type EventHandler<T = EventData> = (data: T) => void;

/**
 * Unsubscribe function returned when subscribing.
 */
export type Unsubscribe = () => void;

// ============================================================================
// EVENT BUS IMPLEMENTATION
// ============================================================================

/**
 * Event listener entry.
 */
interface ListenerEntry {
  handler: EventHandler;
  once: boolean;
  priority: number;
}

/**
 * EventBus class - singleton pattern.
 */
class EventBusImpl {
  private listeners: Map<GameEvent | string, ListenerEntry[]> = new Map();
  private eventHistory: Array<{ event: GameEvent | string; data: EventData }> = [];
  private historyLimit: number = 100;
  private debugMode: boolean = false;

  // ============================================================================
  // SUBSCRIPTION
  // ============================================================================

  /**
   * Subscribe to an event.
   * 
   * @param event - Event to subscribe to
   * @param handler - Handler function
   * @param priority - Higher priority handlers called first (default: 0)
   * @returns Unsubscribe function
   */
  on<T = EventData>(
    event: GameEvent | string,
    handler: EventHandler<T>,
    priority: number = 0
  ): Unsubscribe {
    return this.addListener(event, handler as EventHandler, false, priority);
  }

  /**
   * Subscribe to an event, auto-unsubscribe after first call.
   * 
   * @param event - Event to subscribe to
   * @param handler - Handler function
   * @param priority - Higher priority handlers called first
   * @returns Unsubscribe function
   */
  once<T = EventData>(
    event: GameEvent | string,
    handler: EventHandler<T>,
    priority: number = 0
  ): Unsubscribe {
    return this.addListener(event, handler as EventHandler, true, priority);
  }

  /**
   * Unsubscribe from an event.
   * 
   * @param event - Event to unsubscribe from
   * @param handler - Handler to remove
   */
  off(event: GameEvent | string, handler: EventHandler): void {
    const listeners = this.listeners.get(event);
    if (!listeners) return;

    const index = listeners.findIndex((l) => l.handler === handler);
    if (index !== -1) {
      listeners.splice(index, 1);
    }

    if (listeners.length === 0) {
      this.listeners.delete(event);
    }
  }

  /**
   * Internal method to add a listener.
   */
  private addListener(
    event: GameEvent | string,
    handler: EventHandler,
    once: boolean,
    priority: number
  ): Unsubscribe {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }

    const listeners = this.listeners.get(event)!;
    const entry: ListenerEntry = { handler, once, priority };

    // Insert in priority order (higher priority first)
    const insertIndex = listeners.findIndex((l) => l.priority < priority);
    if (insertIndex === -1) {
      listeners.push(entry);
    } else {
      listeners.splice(insertIndex, 0, entry);
    }

    // Return unsubscribe function
    return () => this.off(event, handler);
  }

  // ============================================================================
  // EMISSION
  // ============================================================================

  /**
   * Emit an event.
   * 
   * @param event - Event to emit
   * @param data - Event data (timestamp added automatically)
   */
  emit<T extends EventData = EventData>(
    event: GameEvent | string,
    data: Omit<T, 'timestamp'> | T
  ): void {
    // Add timestamp if not present
    const eventData: T = {
      ...data,
      timestamp: (data as any).timestamp ?? Date.now(),
    } as T;

    // Debug logging
    if (this.debugMode) {
      console.log(`[EventBus] ${event}`, eventData);
    }

    // Store in history
    this.eventHistory.push({ event, data: eventData });
    if (this.eventHistory.length > this.historyLimit) {
      this.eventHistory.shift();
    }

    // Get listeners
    const listeners = this.listeners.get(event);
    if (!listeners || listeners.length === 0) return;

    // Call handlers (copy array to handle removal during iteration)
    const toCall = [...listeners];
    const toRemove: ListenerEntry[] = [];

    toCall.forEach((entry) => {
      try {
        entry.handler(eventData);
      } catch (error) {
        console.error(`[EventBus] Error in handler for ${event}:`, error);
      }

      if (entry.once) {
        toRemove.push(entry);
      }
    });

    // Remove one-time listeners
    toRemove.forEach((entry) => {
      const index = listeners.indexOf(entry);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    });
  }

  // ============================================================================
  // UTILITY
  // ============================================================================

  /**
   * Remove all listeners for an event.
   */
  clear(event: GameEvent | string): void {
    this.listeners.delete(event);
  }

  /**
   * Remove all listeners for all events.
   */
  clearAll(): void {
    this.listeners.clear();
  }

  /**
   * Get number of listeners for an event.
   */
  listenerCount(event: GameEvent | string): number {
    return this.listeners.get(event)?.length ?? 0;
  }

  /**
   * Check if event has listeners.
   */
  hasListeners(event: GameEvent | string): boolean {
    return this.listenerCount(event) > 0;
  }

  /**
   * Get all registered events.
   */
  getRegisteredEvents(): (GameEvent | string)[] {
    return Array.from(this.listeners.keys());
  }

  /**
   * Get event history.
   */
  getHistory(): Array<{ event: GameEvent | string; data: EventData }> {
    return [...this.eventHistory];
  }

  /**
   * Clear event history.
   */
  clearHistory(): void {
    this.eventHistory = [];
  }

  /**
   * Set history limit.
   */
  setHistoryLimit(limit: number): void {
    this.historyLimit = limit;
    while (this.eventHistory.length > limit) {
      this.eventHistory.shift();
    }
  }

  /**
   * Enable/disable debug mode.
   */
  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
  }

  /**
   * Check if debug mode is enabled.
   */
  isDebugMode(): boolean {
    return this.debugMode;
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

/**
 * Global EventBus instance.
 */
export const EventBus = new EventBusImpl();

// Default export
export default EventBus;
