import { Card } from '@/types';
import { Relic } from '@/entities/Relic';
import { Potion } from '@/entities/Potion';

/**
 * Player entity - manages player character state
 */
export class Player {
  // Character stats
  public maxHp: number;
  public currentHp: number;
  public gold: number;

  // Combat stats
  public block: number = 0;
  public energy: number = 3;
  public maxEnergy: number = 3;

  // Status effects
  public strength: number = 0;
  public dexterity: number = 0;
  public weak: number = 0;
  public vulnerable: number = 0;
  public frail: number = 0;

  // Collections
  public deck: Card[] = [];
  public relics: Relic[] = [];
  public potions: Potion[] = [];
  public maxPotions: number = 3;

  constructor(maxHp: number = 80, startingGold: number = 99) {
    this.maxHp = maxHp;
    this.currentHp = maxHp;
    this.gold = startingGold;
  }

  /**
   * Take damage (after accounting for block)
   */
  takeDamage(amount: number): number {
    // Apply vulnerable (50% more damage)
    if (this.vulnerable > 0) {
      amount = Math.floor(amount * 1.5);
    }

    // Block absorbs damage
    const damageAfterBlock = Math.max(0, amount - this.block);

    this.block = Math.max(0, this.block - amount);
    this.currentHp = Math.max(0, this.currentHp - damageAfterBlock);

    return damageAfterBlock;
  }

  /**
   * Add block
   */
  addBlock(amount: number): void {
    // Apply dexterity bonus
    const totalBlock = amount + this.dexterity;

    // Apply frail (25% less block)
    const finalBlock = this.frail > 0
      ? Math.floor(totalBlock * 0.75)
      : totalBlock;

    this.block += Math.max(0, finalBlock);
  }

  /**
   * Heal HP
   */
  heal(amount: number): void {
    this.currentHp = Math.min(this.maxHp, this.currentHp + amount);
  }

  /**
   * Lose HP (bypasses block)
   */
  loseHp(amount: number): void {
    this.currentHp = Math.max(0, this.currentHp - amount);
  }

  /**
   * Modify energy
   */
  gainEnergy(amount: number): void {
    this.energy = Math.min(this.maxEnergy + 10, this.energy + amount); // Cap at max+10
  }

  spendEnergy(amount: number): boolean {
    if (this.energy >= amount) {
      this.energy -= amount;
      return true;
    }
    return false;
  }

  /**
   * Start of turn - refresh energy and reduce status effects
   */
  startTurn(): void {
    this.energy = this.maxEnergy;
    this.block = 0; // Block doesn't carry over
  }

  /**
   * End of turn - tick down status effects
   */
  endTurn(): void {
    if (this.weak > 0) this.weak--;
    if (this.vulnerable > 0) this.vulnerable--;
    if (this.frail > 0) this.frail--;
  }

  /**
   * Start of combat
   */
  startCombat(): void {
    this.block = 0;
    this.energy = this.maxEnergy;

    // Reset status effects
    this.strength = 0;
    this.dexterity = 0;
    this.weak = 0;
    this.vulnerable = 0;
    this.frail = 0;
  }

  /**
   * Check if player is dead
   */
  isDead(): boolean {
    return this.currentHp <= 0;
  }

  /**
   * Add card to deck
   */
  addCardToDeck(card: Card): void {
    this.deck.push(card);
  }

  /**
   * Remove card from deck
   */
  removeCardFromDeck(cardId: string): boolean {
    const index = this.deck.findIndex(c => c.id === cardId);
    if (index !== -1) {
      this.deck.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Add relic
   */
  addRelic(relic: Relic): void {
    this.relics.push(relic);

    // Execute onObtain effects immediately
    const obtainEffects = relic.getEffectsForTrigger('onObtain');
    obtainEffects.forEach((effect: any) => {
      switch (effect.action) {
        case 'MAX_HP':
          this.maxHp += effect.value || 0;
          this.currentHp += effect.value || 0; // Also heal for the amount
          console.log(`${relic.name}: Max HP increased by ${effect.value}`);
          break;

        case 'GAIN_GOLD':
          this.addGold(effect.value || 0);
          console.log(`${relic.name}: Gained ${effect.value} gold`);
          break;
      }
    });
  }

  /**
   * Check if player has a specific relic
   */
  hasRelic(relicId: string): boolean {
    return this.relics.some(r => r.id === relicId);
  }

  /**
   * Add potion
   */
  addPotion(potion: Potion): boolean {
    if (this.potions.length < this.maxPotions) {
      this.potions.push(potion);
      return true;
    }
    return false;
  }

  /**
   * Use and remove potion
   */
  usePotion(index: number): Potion | undefined {
    if (index >= 0 && index < this.potions.length) {
      return this.potions.splice(index, 1)[0];
    }
    return undefined;
  }

  /**
   * Add gold
   */
  addGold(amount: number): void {
    this.gold += amount;
  }

  /**
   * Spend gold
   */
  spendGold(amount: number): boolean {
    if (this.gold >= amount) {
      this.gold -= amount;
      return true;
    }
    return false;
  }
}
