/**
 * Relic Manager
 * 
 * Manages relic triggering, counter tracking, and effect execution.
 * Centralizes all relic-related logic.
 */

import { Player } from '@/entities/Player';
import { Enemy } from '@/entities/Enemy';
import { Relic } from '@/entities/Relic';
import { Card } from '@/types';
import {
  EffectSystem,
  type EffectContext,
  type RelicEffectContext,
} from '@/systems/effects';

/**
 * Context provided when triggering relics.
 */
export interface RelicTriggerContext {
  card?: Card;
  enemy?: Enemy;
  damage?: number;
  gold?: number;
  [key: string]: any;
}

/**
 * Callbacks for relic events.
 */
export interface RelicCallbacks {
  onRelicTriggered?: (relic: Relic, effect: any, result: any) => void;
}

/**
 * RelicManager handles relic effects and tracking.
 */
export class RelicManager {
  // Effect context provider
  private contextProvider: () => EffectContext;

  // Callbacks
  private callbacks: RelicCallbacks = {};

  // Bonus energy for next combat (Ancient Tea Set)
  private bonusEnergyNextCombat: number = 0;

  constructor(contextProvider: () => EffectContext) {
    this.contextProvider = contextProvider;
  }

  /**
   * Set callbacks for relic events.
   */
  setCallbacks(callbacks: RelicCallbacks): void {
    this.callbacks = callbacks;
  }

  /**
   * Reset for new combat.
   */
  reset(): void {
    // Reset relic counters
    // Note: Individual relics track their own counters
  }

  // ============================================================================
  // TRIGGERING
  // ============================================================================

  /**
   * Trigger all relics with a specific trigger.
   * 
   * @param player - Player whose relics to check
   * @param trigger - Trigger name
   * @param triggerContext - Additional context for the trigger
   */
  triggerRelics(
    player: Player,
    trigger: string,
    triggerContext?: RelicTriggerContext
  ): void {
    player.relics.forEach((relic) => {
      const effects = relic.getEffectsForTrigger(trigger);

      effects.forEach((effect) => {
        this.executeRelicEffect(relic, effect, triggerContext);
      });
    });
  }

  /**
   * Execute a single relic effect.
   */
  private executeRelicEffect(
    relic: Relic,
    effect: any,
    triggerContext?: RelicTriggerContext
  ): void {
    // Try the new effect system first
    if (EffectSystem.hasRelicEffectHandler(effect.action)) {
      const context = this.contextProvider();
      const relicContext: RelicEffectContext = {
        ...context,
        relic,
        triggerContext,
      };

      const result = EffectSystem.executeRelicEffect(effect, relicContext);
      this.callbacks.onRelicTriggered?.(relic, effect, result);
    } else {
      // Fall back to legacy handling
      this.executeRelicEffectLegacy(relic, effect, triggerContext);
    }
  }

  /**
   * Legacy relic effect handler.
   * @deprecated Use EffectSystem.executeRelicEffect
   */
  private executeRelicEffectLegacy(
    relic: Relic,
    effect: any,
    context?: RelicTriggerContext
  ): void {
    const action = effect.action;
    const value = effect.value || 0;
    const effectContext = this.contextProvider();

    switch (action) {
      case 'HEAL':
        effectContext.player.heal(value);
        console.log(`${relic.name}: Healed ${value} HP`);
        break;

      case 'BLOCK':
        effectContext.player.addBlockRaw(value);
        console.log(`${relic.name}: Gained ${value} Block`);
        break;

      case 'DRAW':
        effectContext.actions.drawCards(value);
        console.log(`${relic.name}: Drew ${value} cards`);
        break;

      case 'GAIN_ENERGY':
        effectContext.player.gainEnergy(value);
        console.log(`${relic.name}: Gained ${value} Energy`);
        break;

      case 'GAIN_DEXTERITY':
        effectContext.player.dexterity += value;
        console.log(`${relic.name}: Gained ${value} Dexterity`);
        break;

      case 'GAIN_STRENGTH':
        effectContext.player.strength += value;
        console.log(`${relic.name}: Gained ${value} Strength`);
        break;

      case 'BONUS_DAMAGE':
        console.log(`${relic.name}: First attack bonus damage active`);
        break;

      case 'THORNS':
        const enemy = effectContext.actions.getRandomEnemy();
        if (enemy) {
          effectContext.actions.dealDamageToEnemy(enemy, value);
          console.log(`${relic.name}: Dealt ${value} thorns damage`);
        }
        break;

      case 'ENERGY_EVERY_N_TURNS':
        if (effectContext.turn % value === 0) {
          effectContext.player.gainEnergy(1);
          console.log(`${relic.name}: Gained 1 Energy`);
        }
        break;

      case 'DRAW_EVERY_N':
        relic.incrementCounter();
        if (relic.counter >= value) {
          effectContext.actions.drawCards(1);
          relic.resetCounter();
          console.log(`${relic.name}: Drew 1 card`);
        }
        break;

      case 'DEXTERITY_EVERY_N':
        relic.incrementCounter();
        if (relic.counter >= value) {
          effectContext.player.dexterity += 1;
          relic.resetCounter();
          console.log(`${relic.name}: Gained 1 Dexterity`);
        }
        break;

      case 'STRENGTH_EVERY_N':
        relic.incrementCounter();
        if (relic.counter >= value) {
          effectContext.player.strength += 1;
          relic.resetCounter();
          console.log(`${relic.name}: Gained 1 Strength`);
        }
        break;

      case 'BLOCK_EVERY_N':
        relic.incrementCounter();
        if (relic.counter >= value) {
          effectContext.player.addBlockRaw(4);
          relic.resetCounter();
          console.log(`${relic.name}: Gained 4 Block`);
        }
        break;

      case 'DAMAGE_ALL_EVERY_N':
        relic.incrementCounter();
        if (relic.counter >= value) {
          effectContext.actions.dealDamageToAllEnemies(5);
          relic.resetCounter();
          console.log(`${relic.name}: Dealt 5 damage to all`);
        }
        break;

      case 'ENERGY_EVERY_N':
        relic.incrementCounter();
        if (relic.counter >= value) {
          effectContext.player.gainEnergy(2);
          relic.resetCounter();
          console.log(`${relic.name}: Gained 2 Energy`);
        }
        break;

      case 'ENERGY_NEXT_COMBAT':
        this.bonusEnergyNextCombat = value;
        console.log(`${relic.name}: Next combat +${value} Energy`);
        break;

      case 'DAMAGE_RANDOM':
        const randomEnemy = effectContext.actions.getRandomEnemy();
        if (randomEnemy) {
          effectContext.actions.dealDamageToEnemy(randomEnemy, value);
          console.log(`${relic.name}: Dealt ${value} damage`);
        }
        break;

      // Passive effects handled elsewhere
      case 'ELITE_BONUS_RELIC':
      case 'CURSES_PLAYABLE':
      case 'VULNERABLE_BONUS':
      case 'MORE_EVENT_OPTIONS':
      case 'MERCHANT_BONUS':
      case 'EXTRA_CARD_REWARD':
      case 'REST_REMOVE_CARD':
      case 'REST_DIG':
      case 'REDUCE_SMALL_DAMAGE':
      case 'RETAIN_ENERGY':
      case 'EVENT_TO_TREASURE':
      case 'INTANGIBLE_EVERY_N':
      case 'REVIVE':
      case 'AUTO_UPGRADE_SKILLS':
      case 'AUTO_UPGRADE_POWERS':
      case 'REDUCE_RANDOM_COST':
      case 'DISCARD_DRAW':
      case 'MAX_HP':
      case 'GAIN_GOLD':
        // Handled by other systems
        break;

      default:
        console.warn(`Unknown relic action: ${action}`);
    }

    this.callbacks.onRelicTriggered?.(relic, effect, { action, value });
  }

  // ============================================================================
  // SPECIAL QUERIES
  // ============================================================================

  /**
   * Check if player has a specific relic.
   */
  hasRelic(player: Player, relicId: string): boolean {
    return player.relics.some((r) => r.id === relicId);
  }

  /**
   * Get a specific relic.
   */
  getRelic(player: Player, relicId: string): Relic | undefined {
    return player.relics.find((r) => r.id === relicId);
  }

  /**
   * Get bonus energy for next combat (and consume it).
   */
  consumeBonusEnergy(): number {
    const bonus = this.bonusEnergyNextCombat;
    this.bonusEnergyNextCombat = 0;
    return bonus;
  }

  /**
   * Check if player has the Red Skull relic (strength below 50% HP).
   */
  checkRedSkull(player: Player): number {
    const redSkull = this.getRelic(player, 'red_skull');
    if (!redSkull) return 0;

    const threshold = 0.5;
    if (player.currentHp / player.maxHp <= threshold) {
      return 3; // Red Skull gives 3 strength below 50%
    }
    return 0;
  }

  /**
   * Check if player has Paper Phrog (vulnerable bonus damage).
   */
  hasPaperPhrog(player: Player): boolean {
    return this.hasRelic(player, 'paper_phrog');
  }

  /**
   * Check if player has Torii (reduce small damage).
   */
  checkTorii(player: Player, damage: number): number {
    if (!this.hasRelic(player, 'torii')) return damage;
    if (damage > 0 && damage <= 5) {
      return 1; // Reduce to 1
    }
    return damage;
  }

  /**
   * Check if player has Tungsten Rod (reduce damage by 1).
   */
  checkTungstenRod(player: Player, damage: number): number {
    if (!this.hasRelic(player, 'tungsten_rod')) return damage;
    return Math.max(0, damage - 1);
  }

  /**
   * Get relic effects for a trigger without executing them.
   */
  getEffectsForTrigger(player: Player, trigger: string): Array<{ relic: Relic; effect: any }> {
    const results: Array<{ relic: Relic; effect: any }> = [];

    player.relics.forEach((relic) => {
      const effects = relic.getEffectsForTrigger(trigger);
      effects.forEach((effect) => {
        results.push({ relic, effect });
      });
    });

    return results;
  }
}
