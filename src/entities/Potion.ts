import { Potion as PotionInterface, CardEffect, CardRarity, TargetType } from '@/types';

/**
 * Potion class represents single-use consumable items
 */
export class Potion implements PotionInterface {
  public id: string;
  public name: string;
  public description: string;
  public rarity: CardRarity;
  public targetType: TargetType;
  public effects: CardEffect[];

  constructor(data: PotionInterface) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.rarity = data.rarity;
    this.targetType = data.targetType;
    this.effects = data.effects;
  }

  /**
   * Clone this potion (for creating instances from data)
   */
  clone(): Potion {
    return new Potion({
      id: this.id,
      name: this.name,
      description: this.description,
      rarity: this.rarity,
      targetType: this.targetType,
      effects: [...this.effects],
    });
  }

  /**
   * Check if potion requires a target
   */
  requiresTarget(): boolean {
    return this.targetType === 'SINGLE_ENEMY';
  }
}
