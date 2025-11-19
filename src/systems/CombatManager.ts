import { Card, CardEffect } from '@/types';
import { Player } from '@/entities/Player';
import { Enemy } from '@/entities/Enemy';

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

  // Constants
  private readonly HAND_SIZE = 5;
  private readonly MAX_HAND_SIZE = 10;

  // Event callbacks
  public onCardPlayed?: (card: Card, target?: Enemy) => void;
  public onCardDrawn?: (card: Card) => void;
  public onCardDiscarded?: (card: Card) => void;
  public onDamageDealt?: (source: string, target: string, amount: number) => void;
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
    this.player.startTurn();

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

    // Execute card effects (pass energySpent for X-cost cards)
    this.executeCardEffects(card, target, energySpent);

    // Discard or exhaust card
    if (this.shouldExhaust(card)) {
      this.exhaustCard(card);
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
    console.log(victory ? 'Victory!' : 'Defeat!');
    this.onCombatEnd?.(victory);
  }

  /**
   * Get alive enemies
   */
  getAliveEnemies(): Enemy[] {
    return this.enemies.filter((enemy) => !enemy.isDead());
  }
}
