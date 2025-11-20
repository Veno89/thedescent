import { Relic as RelicInterface, RelicEffect, CardRarity } from '@/types';

/**
 * Relic class represents passive items that provide permanent benefits
 */
export class Relic implements RelicInterface {
  public id: string;
  public name: string;
  public description: string;
  public rarity: CardRarity;
  public effects: RelicEffect[];

  // Runtime state
  public counter: number = 0; // For relics that track usage (e.g., "every 3 combats")

  constructor(data: RelicInterface) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.rarity = data.rarity;
    this.effects = data.effects;
  }

  /**
   * Get effects for a specific trigger
   */
  getEffectsForTrigger(trigger: string): RelicEffect[] {
    return this.effects.filter((effect) => effect.trigger === trigger);
  }

  /**
   * Check if relic has a specific trigger
   */
  hasTrigger(trigger: string): boolean {
    return this.effects.some((effect) => effect.trigger === trigger);
  }

  /**
   * Increment counter (for counting relics)
   */
  incrementCounter(): void {
    this.counter++;
  }

  /**
   * Reset counter
   */
  resetCounter(): void {
    this.counter = 0;
  }

  /**
   * Clone this relic (for creating instances from data)
   */
  clone(): Relic {
    return new Relic({
      id: this.id,
      name: this.name,
      description: this.description,
      rarity: this.rarity,
      effects: [...this.effects],
    });
  }
}
