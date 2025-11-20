import { Card, CardEffect, CardType } from '@/types';
import { Player } from '@/entities/Player';
import { Enemy } from '@/entities/Enemy';
import { Relic } from '@/entities/Relic';
import { Potion } from '@/entities/Potion';
import { DataLoader } from '@/utils/DataLoader';

/**
 * CombatManager handles all combat logic and state
 */
export class CombatManager {
  public player: Player;
  public enemies: Enemy[] = [];

  // Card piles
  public drawPile: Card[] = [];
  public hand: Card[] = [];
  public discardPile: Card[] = [];
  public exhaustPile: Card[] = [];

  // Combat state
  public turn: number = 0;
  public isPlayerTurn: boolean = true;
  public combatEnded: boolean = false;
  public victory: boolean = false;

  // Relic tracking
  private cardsPlayedThisCombat: number = 0;
  private attacksPlayedThisTurn: number = 0;
  private skillsPlayedThisTurn: number = 0;
  private powersPlayedThisCombat: number = 0;
  private shufflesThisCombat: number = 0;
  private firstAttackThisCombat: boolean = true;
  private bonusEnergyNextCombat: number = 0;

  // Constants
  private readonly HAND_SIZE = 5;
  private readonly MAX_HAND_SIZE = 10;

  // Event callbacks
  public onCardPlayed?: (card: Card, target?: Enemy) => void;
  public onCardDrawn?: (card: Card) => void;
  public onCardDiscarded?: (card: Card) => void;
  public onDamageDealt?: (source: string, target: string, amount: number) => void;
  public onPotionUsed?: (potion: Potion, target?: Enemy) => void;
  public onCombatEnd?: (victory: boolean) => void;

  constructor(player: Player, enemies: Enemy[]) {
    this.player = player;
    this.enemies = enemies;
  }

  /**
   * Start combat
   */
  startCombat(): void {
    this.player.startCombat();
    this.turn = 1;
    this.isPlayerTurn = true;
    this.combatEnded = false;
    this.victory = false;

    // Reset relic tracking
    this.cardsPlayedThisCombat = 0;
    this.attacksPlayedThisTurn = 0;
    this.skillsPlayedThisTurn = 0;
    this.powersPlayedThisCombat = 0;
    this.shufflesThisCombat = 0;
    this.firstAttackThisCombat = true;

    // Initialize piles
    this.hand = [];
    this.discardPile = [];
    this.exhaustPile = [];

    // Separate innate cards from the rest
    const innateCards: Card[] = [];
    const regularCards: Card[] = [];

    this.player.deck.forEach((card) => {
      if (card.innate) {
        innateCards.push(card);
      } else {
        regularCards.push(card);
      }
    });

    // Shuffle regular cards into draw pile
    this.drawPile = this.shuffleArray(regularCards);

    // Apply bonus energy from relics (e.g., Ancient Tea Set)
    if (this.bonusEnergyNextCombat > 0) {
      this.player.gainEnergy(this.bonusEnergyNextCombat);
      this.bonusEnergyNextCombat = 0;
    }

    // Trigger onCombatStart relics
    this.triggerRelics('onCombatStart');

    // Add innate cards to hand first
    innateCards.forEach((card) => {
      this.hand.push(card);
      this.onCardDrawn?.(card);
    });

    // Draw remaining cards to fill hand
    const cardsToDraw = Math.max(0, this.HAND_SIZE - this.hand.length);
    this.drawCards(cardsToDraw);

    console.log('Combat started!');
  }

  /**
   * Start player turn
   */
  startPlayerTurn(): void {
    this.turn++;
    this.isPlayerTurn = true;

    // Reset turn tracking
    this.attacksPlayedThisTurn = 0;
    this.skillsPlayedThisTurn = 0;

    this.player.startTurn();

    // Trigger onTurnStart relics
    this.triggerRelics('onTurnStart');

    // Handle end of turn card effects
    const cardsToKeep: Card[] = [];
    const cardsToDiscard: Card[] = [];

    this.hand.forEach((card) => {
      if (card.retain) {
        // Retain cards stay in hand
        cardsToKeep.push(card);
      } else if (card.ethereal) {
        // Ethereal cards are exhausted if not played
        this.exhaustCard(card);
        console.log(`${card.name} (Ethereal) was exhausted`);
      } else {
        // Normal cards are discarded
        cardsToDiscard.push(card);
      }
    });

    // Clear hand and add back retained cards
    this.hand = [...cardsToKeep];

    // Discard non-retained cards
    cardsToDiscard.forEach((card) => {
      this.discardPile.push(card);
      this.onCardDiscarded?.(card);
    });

    // Draw new cards to fill hand
    const cardsToDraw = Math.max(0, this.HAND_SIZE - this.hand.length);
    this.drawCards(cardsToDraw);

    // Trigger first turn relic (Lantern)
    if (this.turn === 1) {
      this.triggerRelics('onFirstTurn');
    }

    console.log(`Turn ${this.turn} - Player turn`);
  }

  /**
   * End player turn
   */
  endPlayerTurn(): void {
    if (!this.isPlayerTurn) return;

    this.player.endTurn();
    this.isPlayerTurn = false;

    // Start enemy turn
    this.executeEnemyTurn();
  }

  /**
   * Execute all enemy actions
   */
  private executeEnemyTurn(): void {
    console.log('Enemy turn');

    this.enemies.forEach((enemy) => {
      if (enemy.isDead()) return;

      enemy.startTurn();
      const move = enemy.executeMove();

      if (!move) return;

      console.log(`${enemy.name} uses ${move.name}`);

      // Execute move actions
      move.actions.forEach((action: any) => {
        this.executeEnemyAction(enemy, action);
      });

      enemy.endTurn();
    });

    // Check if player died
    if (this.player.isDead()) {
      this.endCombat(false);
      return;
    }

    // Start next player turn
    this.startPlayerTurn();
  }

  /**
   * Execute a single enemy action
   */
  private executeEnemyAction(enemy: Enemy, action: any): void {
    switch (action.type) {
      case 'DAMAGE':
        this.dealDamageToPlayer(enemy, action.value);
        break;
      case 'APPLY_WEAK':
        this.player.weak = Math.max(this.player.weak, action.value);
        break;
      case 'APPLY_VULNERABLE':
        this.player.vulnerable = Math.max(this.player.vulnerable, action.value);
        break;
      case 'APPLY_BLOCK_SELF':
        enemy.addBlock(action.value);
        break;
      case 'APPLY_STRENGTH_SELF':
        enemy.applyStrength(action.value);
        break;
      default:
        console.warn(`Unknown enemy action: ${action.type}`);
    }
  }

  /**
   * Play a card from hand
   */
  playCard(card: Card, target?: Enemy): boolean {
    if (!this.isPlayerTurn) return false;
    if (this.combatEnded) return false;

    // Check if card is in hand
    const cardIndex = this.hand.indexOf(card);
    if (cardIndex === -1) return false;

    // Handle X-cost cards
    let energySpent = 0;

    if (card.isXCost) {
      // X-cost cards consume all available energy
      energySpent = this.player.energy;
      this.player.energy = 0;
    } else {
      // Normal cost cards
      if (!this.player.spendEnergy(card.cost)) {
        console.log('Not enough energy!');
        return false;
      }
      energySpent = card.cost;
    }

    // Validate target
    if (!this.validateTarget(card, target)) {
      console.log('Invalid target!');
      return false;
    }

    // Remove from hand
    this.hand.splice(cardIndex, 1);

    // Track card plays for relics
    this.cardsPlayedThisCombat++;

    // Track card type for relics
    if (card.type === CardType.ATTACK) {
      this.attacksPlayedThisTurn++;
      if (this.firstAttackThisCombat) {
        this.triggerRelics('onFirstAttack');
        this.firstAttackThisCombat = false;
      }
      this.triggerRelics('onAttackPlayed', { card });
    } else if (card.type === CardType.SKILL) {
      this.skillsPlayedThisTurn++;
      this.triggerRelics('onSkillPlayed', { card });
    } else if (card.type === CardType.POWER) {
      this.powersPlayedThisCombat++;
      this.triggerRelics('onPowerPlayed', { card });
    }

    // Execute card effects (pass energySpent for X-cost cards)
    this.executeCardEffects(card, target, energySpent);

    // Trigger general onCardPlayed relics (like Ink Bottle)
    this.triggerRelics('onCardPlayed', { card });

    // Discard or exhaust card
    if (this.shouldExhaust(card)) {
      this.exhaustCard(card);
      this.triggerRelics('onCardExhaust', { card });
    } else {
      this.discardPile.push(card);
      this.onCardDiscarded?.(card);
    }

    // Callback
    this.onCardPlayed?.(card, target);

    // Check for combat end
    this.checkCombatEnd();

    return true;
  }

  /**
   * Execute all effects of a card
   */
  private executeCardEffects(card: Card, target?: Enemy, energySpent = 0): void {
    card.effects.forEach((effect) => {
      this.executeEffect(effect, target, energySpent);
    });
  }

  /**
   * Execute a single card effect
   */
  private executeEffect(effect: CardEffect, target?: Enemy, energySpent = 0): void {
    // For X-cost cards, use energySpent as the value if effect value is 0
    const effectValue = effect.value === 0 && energySpent > 0 ? energySpent : effect.value;

    switch (effect.type) {
      case 'DAMAGE':
        if (target) {
          this.dealDamageToEnemy(target, effectValue);
        } else if (effect.target === 'ALL_ENEMIES') {
          this.enemies.forEach((enemy) => {
            if (!enemy.isDead()) {
              this.dealDamageToEnemy(enemy, effectValue);
            }
          });
        }
        break;

      case 'BLOCK':
        this.player.addBlock(effectValue);
        break;

      case 'DRAW':
        this.drawCards(effectValue);
        break;

      case 'APPLY_VULNERABLE':
        if (target) {
          target.applyVulnerable(effectValue);
        }
        break;

      case 'APPLY_WEAK':
        if (target) {
          target.applyWeak(effectValue);
        }
        break;

      case 'APPLY_STRENGTH':
        this.player.strength += effectValue;
        break;

      case 'APPLY_POISON':
        if (target) {
          target.applyPoison(effectValue);
        }
        break;

      case 'GAIN_ENERGY':
        this.player.gainEnergy(effectValue);
        break;

      case 'LOSE_HP':
        this.player.loseHp(effectValue);
        break;

      case 'DAMAGE_EQUAL_BLOCK':
        if (target) {
          this.dealDamageToEnemy(target, this.player.block);
        }
        break;

      default:
        console.warn(`Unknown effect type: ${effect.type}`);
    }
  }

  /**
   * Deal damage from player to enemy
   */
  private dealDamageToEnemy(enemy: Enemy, baseDamage: number): void {
    // Apply strength
    let damage = baseDamage + this.player.strength;

    // Apply weak (25% less damage)
    if (this.player.weak > 0) {
      damage = Math.floor(damage * 0.75);
    }

    damage = Math.max(0, damage);

    const actualDamage = enemy.takeDamage(damage);
    this.onDamageDealt?.('player', enemy.name, actualDamage);

    console.log(`Dealt ${actualDamage} damage to ${enemy.name} (${enemy.currentHp}/${enemy.maxHp})`);
  }

  /**
   * Deal damage from enemy to player
   */
  private dealDamageToPlayer(enemy: Enemy, baseDamage: number): void {
    // Apply enemy strength
    let damage = baseDamage + enemy.strength;

    // Apply enemy weak
    if (enemy.weak > 0) {
      damage = Math.floor(damage * 0.75);
    }

    damage = Math.max(0, damage);

    const actualDamage = this.player.takeDamage(damage);
    this.onDamageDealt?.(enemy.name, 'player', actualDamage);

    console.log(`Player took ${actualDamage} damage (${this.player.currentHp}/${this.player.maxHp})`);
  }

  /**
   * Validate card target
   */
  private validateTarget(card: Card, target?: Enemy): boolean {
    switch (card.targetType) {
      case 'SELF':
        return true;
      case 'SINGLE_ENEMY':
        return target !== undefined && !target.isDead();
      case 'ALL_ENEMIES':
      case 'RANDOM_ENEMY':
        return true;
      default:
        return false;
    }
  }

  /**
   * Check if card should be exhausted
   */
  private shouldExhaust(card: Card): boolean {
    return card.exhaust === true;
  }

  /**
   * Draw cards from draw pile
   */
  drawCards(count: number): void {
    for (let i = 0; i < count; i++) {
      if (this.hand.length >= this.MAX_HAND_SIZE) {
        console.log('Hand is full!');
        break;
      }

      // Shuffle discard if draw pile is empty
      if (this.drawPile.length === 0) {
        if (this.discardPile.length === 0) {
          console.log('No cards left to draw!');
          break;
        }
        this.shuffleDiscardIntoDrawPile();
      }

      const card = this.drawPile.pop();
      if (card) {
        this.hand.push(card);
        this.onCardDrawn?.(card);
      }
    }
  }

  /**
   * Discard a card from hand
   */
  discardCard(card: Card): void {
    const index = this.hand.indexOf(card);
    if (index !== -1) {
      this.hand.splice(index, 1);
      this.discardPile.push(card);
      this.onCardDiscarded?.(card);
    }
  }

  /**
   * Use a potion
   */
  usePotion(potionIndex: number, target?: Enemy): boolean {
    if (this.combatEnded) return false;

    // Get the potion from player's inventory
    const potion = this.player.potions[potionIndex];
    if (!potion) {
      console.log('No potion in that slot!');
      return false;
    }

    // Validate target if required
    if (potion.requiresTarget()) {
      if (!target || target.isDead()) {
        console.log('Valid target required!');
        return false;
      }
    }

    console.log(`Using potion: ${potion.name}`);

    // Execute potion effects
    potion.effects.forEach((effect) => {
      this.executePotionEffect(effect, target);
    });

    // Remove potion from inventory
    this.player.usePotion(potionIndex);

    // Callback
    this.onPotionUsed?.(potion, target);

    // Check for combat end
    this.checkCombatEnd();

    return true;
  }

  /**
   * Execute a single potion effect
   */
  private executePotionEffect(effect: CardEffect, target?: Enemy): void {
    switch (effect.type) {
      case 'HEAL':
        this.player.heal(effect.value);
        console.log(`Healed ${effect.value} HP`);
        break;

      case 'BLOCK':
        this.player.addBlock(effect.value);
        console.log(`Gained ${effect.value} Block`);
        break;

      case 'GAIN_ENERGY':
        this.player.gainEnergy(effect.value);
        console.log(`Gained ${effect.value} Energy`);
        break;

      case 'DRAW':
        this.drawCards(effect.value);
        console.log(`Drew ${effect.value} cards`);
        break;

      case 'DAMAGE':
        if (effect.target === 'ALL_ENEMIES') {
          // AOE damage
          this.getAliveEnemies().forEach((enemy) => {
            this.dealDamageToEnemy(enemy, effect.value);
          });
        } else if (target) {
          // Single target damage
          this.dealDamageToEnemy(target, effect.value);
        }
        break;

      case 'APPLY_STRENGTH':
        this.player.strength += effect.value;
        console.log(`Gained ${effect.value} Strength`);
        break;

      case 'GAIN_DEXTERITY':
        this.player.dexterity += effect.value;
        console.log(`Gained ${effect.value} Dexterity`);
        break;

      case 'APPLY_POISON':
        if (target) {
          target.applyPoison(effect.value);
          console.log(`Applied ${effect.value} Poison to ${target.name}`);
        }
        break;

      case 'APPLY_WEAK':
        if (target) {
          target.weak = Math.max(target.weak, effect.value);
          console.log(`Applied ${effect.value} Weak to ${target.name}`);
        }
        break;

      case 'APPLY_VULNERABLE':
        if (target) {
          target.vulnerable = Math.max(target.vulnerable, effect.value);
          console.log(`Applied ${effect.value} Vulnerable to ${target.name}`);
        }
        break;

      case 'GAIN_ARTIFACT':
        // TODO: Implement artifact status effect
        console.log(`Gained ${effect.value} Artifact (not yet implemented)`);
        break;

      case 'GAIN_PLATED_ARMOR':
        // TODO: Implement plated armor status effect
        console.log(`Gained ${effect.value} Plated Armor (not yet implemented)`);
        break;

      default:
        console.warn(`Unknown potion effect type: ${effect.type}`);
    }
  }

  /**
   * Exhaust a card
   */
  private exhaustCard(card: Card): void {
    this.exhaustPile.push(card);
  }

  /**
   * Shuffle discard pile into draw pile
   */
  private shuffleDiscardIntoDrawPile(): void {
    console.log('Shuffling discard pile into draw pile');
    this.drawPile = this.shuffleArray(this.discardPile);
    this.discardPile = [];

    // Track shuffles for relics
    this.shufflesThisCombat++;
    this.triggerRelics('onShuffle');
  }

  /**
   * Shuffle array
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Check if combat has ended
   */
  private checkCombatEnd(): void {
    // Check if all enemies are dead
    const allEnemiesDead = this.enemies.every((enemy) => enemy.isDead());
    if (allEnemiesDead) {
      this.endCombat(true);
      return;
    }

    // Check if player is dead
    if (this.player.isDead()) {
      this.endCombat(false);
    }
  }

  /**
   * End combat
   */
  private endCombat(victory: boolean): void {
    this.combatEnded = true;
    this.victory = victory;

    // Trigger onCombatEnd relics (like Burning Blood for healing)
    if (victory) {
      this.triggerRelics('onCombatEnd', { victory });
    }

    console.log(victory ? 'Victory!' : 'Defeat!');
    this.onCombatEnd?.(victory);
  }

  /**
   * Get alive enemies
   */
  getAliveEnemies(): Enemy[] {
    return this.enemies.filter((enemy) => !enemy.isDead());
  }

  /**
   * Trigger relic effects
   */
  private triggerRelics(trigger: string, context?: any): void {
    this.player.relics.forEach((relic) => {
      const effects = relic.getEffectsForTrigger(trigger);

      effects.forEach((effect) => {
        this.executeRelicEffect(relic, effect, context);
      });
    });
  }

  /**
   * Execute a single relic effect
   */
  private executeRelicEffect(relic: Relic, effect: any, context?: any): void {
    const action = effect.action;
    const value = effect.value || 0;

    switch (action) {
      // Simple effects
      case 'HEAL':
        this.player.heal(value);
        console.log(`${relic.name}: Healed ${value} HP`);
        break;

      case 'BLOCK':
        this.player.addBlock(value);
        console.log(`${relic.name}: Gained ${value} Block`);
        break;

      case 'DRAW':
        this.drawCards(value);
        console.log(`${relic.name}: Drew ${value} cards`);
        break;

      case 'GAIN_ENERGY':
        this.player.gainEnergy(value);
        console.log(`${relic.name}: Gained ${value} Energy`);
        break;

      case 'GAIN_DEXTERITY':
        this.player.dexterity += value;
        console.log(`${relic.name}: Gained ${value} Dexterity`);
        break;

      case 'BONUS_DAMAGE':
        // Handled in damage calculation (Akabeko)
        console.log(`${relic.name}: First attack bonus damage active`);
        break;

      case 'THORNS':
        // Deal damage back when taking damage (Bronze Scales)
        if (context) {
          const aliveEnemies = this.getAliveEnemies();
          if (aliveEnemies.length > 0) {
            const randomEnemy = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
            const damage = randomEnemy.takeDamage(value);
            console.log(`${relic.name}: Dealt ${damage} thorns damage to ${randomEnemy.name}`);
          }
        }
        break;

      // Counter-based effects
      case 'ENERGY_EVERY_N_TURNS':
        // Happy Flower: Every 3 turns gain 1 energy
        if (this.turn % value === 0) {
          this.player.gainEnergy(1);
          console.log(`${relic.name}: Gained 1 Energy (every ${value} turns)`);
        }
        break;

      case 'DRAW_EVERY_N':
        // Ink Bottle: Every 10 cards played, draw 1
        relic.incrementCounter();
        if (relic.counter >= value) {
          this.drawCards(1);
          relic.resetCounter();
          console.log(`${relic.name}: Drew 1 card (every ${value} cards played)`);
        }
        break;

      case 'DEXTERITY_EVERY_N':
        // Kunai: Every 3 attacks, gain 1 dexterity
        relic.incrementCounter();
        if (relic.counter >= value) {
          this.player.dexterity += 1;
          relic.resetCounter();
          console.log(`${relic.name}: Gained 1 Dexterity (every ${value} attacks)`);
        }
        break;

      case 'STRENGTH_EVERY_N':
        // Shuriken: Every 3 attacks, gain 1 strength
        relic.incrementCounter();
        if (relic.counter >= value) {
          this.player.strength += 1;
          relic.resetCounter();
          console.log(`${relic.name}: Gained 1 Strength (every ${value} attacks)`);
        }
        break;

      case 'BLOCK_EVERY_N':
        // Ornamental Fan: Every 3 attacks, gain 4 block
        relic.incrementCounter();
        if (relic.counter >= value) {
          this.player.addBlock(4);
          relic.resetCounter();
          console.log(`${relic.name}: Gained 4 Block (every ${value} attacks)`);
        }
        break;

      case 'DAMAGE_ALL_EVERY_N':
        // Letter Opener: Every 3 skills, deal 5 damage to all
        relic.incrementCounter();
        if (relic.counter >= value) {
          this.getAliveEnemies().forEach((enemy) => {
            const damage = enemy.takeDamage(5);
            console.log(`${relic.name}: Dealt ${damage} damage to ${enemy.name}`);
          });
          relic.resetCounter();
        }
        break;

      case 'ENERGY_EVERY_N':
        // Sundial: Every 3 shuffles, gain 2 energy
        relic.incrementCounter();
        if (relic.counter >= value) {
          this.player.gainEnergy(2);
          relic.resetCounter();
          console.log(`${relic.name}: Gained 2 Energy (every ${value} shuffles)`);
        }
        break;

      case 'ENERGY_NEXT_COMBAT':
        // Ancient Tea Set: After rest, gain energy next combat
        this.bonusEnergyNextCombat = value;
        console.log(`${relic.name}: Will start next combat with +${value} Energy`);
        break;

      case 'ADD_RANDOM_CARD':
        // Dead Branch: When exhausting, add random card to hand
        if (this.hand.length < this.MAX_HAND_SIZE) {
          const randomCard = DataLoader.getAllCards()[
            Math.floor(Math.random() * DataLoader.getAllCards().length)
          ];
          if (randomCard) {
            this.hand.push(randomCard);
            this.onCardDrawn?.(randomCard);
            console.log(`${relic.name}: Added ${randomCard.name} to hand`);
          }
        }
        break;

      case 'DAMAGE_RANDOM':
        // Tingsha: When discarding, deal 3 damage to random enemy
        const aliveEnemies = this.getAliveEnemies();
        if (aliveEnemies.length > 0) {
          const randomEnemy = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
          const damage = randomEnemy.takeDamage(value);
          console.log(`${relic.name}: Dealt ${damage} damage to ${randomEnemy.name}`);
        }
        break;

      case 'DRAW_IF_ATTACKS':
        // Pocketwatch: If 3+ attacks played this turn, draw 3 cards at end of turn
        if (this.attacksPlayedThisTurn >= value) {
          this.drawCards(value);
          console.log(`${relic.name}: Drew ${value} cards (${this.attacksPlayedThisTurn} attacks played)`);
        }
        break;

      // Passive effects (handled elsewhere)
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
        // These are handled in other systems or have special logic
        break;

      // onObtain effects (handled when relic is obtained)
      case 'MAX_HP':
      case 'GAIN_GOLD':
        // These execute immediately when relic is obtained
        break;

      default:
        console.warn(`Unknown relic action: ${action}`);
    }
  }
}
