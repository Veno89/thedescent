import { Card } from '@/types';
import { Enemy } from '@/entities/Enemy';
import starterCards from '@/data/cards/starter.json';
import act1Enemies from '@/data/enemies/act1.json';

/**
 * DataLoader handles loading and caching game data from JSON files
 */
export class DataLoader {
  private static cardCache: Map<string, Card> = new Map();
  private static enemyCache: Map<string, Enemy> = new Map();
  private static initialized = false;

  /**
   * Initialize the data loader by loading all data files
   */
  static initialize(): void {
    if (this.initialized) return;

    // Load cards
    starterCards.cards.forEach((cardData) => {
      const card = this.parseCard(cardData);
      this.cardCache.set(card.id, card);
    });

    // Load enemies
    act1Enemies.enemies.forEach((enemyData) => {
      const enemy = this.parseEnemy(enemyData);
      this.enemyCache.set(enemy.id, enemy);
    });

    this.initialized = true;
    console.log(`Loaded ${this.cardCache.size} cards and ${this.enemyCache.size} enemies`);
  }

  /**
   * Get a card by ID
   */
  static getCard(id: string): Card | undefined {
    if (!this.initialized) this.initialize();
    return this.cardCache.get(id);
  }

  /**
   * Get all cards
   */
  static getAllCards(): Card[] {
    if (!this.initialized) this.initialize();
    return Array.from(this.cardCache.values());
  }

  /**
   * Get cards by rarity
   */
  static getCardsByRarity(rarity: string): Card[] {
    if (!this.initialized) this.initialize();
    return Array.from(this.cardCache.values()).filter(
      (card) => card.rarity === rarity
    );
  }

  /**
   * Get an enemy by ID
   */
  static getEnemy(id: string): Enemy | undefined {
    if (!this.initialized) this.initialize();
    const template = this.enemyCache.get(id);
    if (!template) return undefined;

    // Return a fresh copy with randomized HP variance
    return this.createEnemyInstance(template);
  }

  /**
   * Get all enemy templates
   */
  static getAllEnemies(): Enemy[] {
    if (!this.initialized) this.initialize();
    return Array.from(this.enemyCache.values());
  }

  /**
   * Create a card instance from data (with optional upgrade)
   */
  static createCard(id: string, upgraded = false): Card | undefined {
    const template = this.getCard(id);
    if (!template) return undefined;

    const card: Card = {
      ...template,
      upgraded,
    };

    // Apply upgrade stats if upgraded
    if (upgraded && (template as any).upgradedStats) {
      const upgradedStats = (template as any).upgradedStats;
      Object.assign(card, upgradedStats);

      // Update name with + suffix
      card.name = `${card.name}+`;
    }

    return card;
  }

  /**
   * Create a starting deck for testing
   */
  static createStarterDeck(): Card[] {
    const deck: Card[] = [];

    // 5 Strikes, 4 Defends, 1 Bash (typical starter deck)
    for (let i = 0; i < 5; i++) {
      const strike = this.createCard('strike');
      if (strike) deck.push(strike);
    }

    for (let i = 0; i < 4; i++) {
      const defend = this.createCard('defend');
      if (defend) deck.push(defend);
    }

    const bash = this.createCard('bash');
    if (bash) deck.push(bash);

    return deck;
  }

  // Private helper methods

  private static parseCard(data: any): Card {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      type: data.type,
      rarity: data.rarity,
      cost: data.cost,
      upgraded: data.upgraded || false,
      targetType: data.targetType,
      effects: data.effects,
    };
  }

  private static parseEnemy(data: any): Enemy {
    return new Enemy(
      data.id,
      data.name,
      data.maxHp,
      data.moves
    );
  }

  private static createEnemyInstance(template: Enemy): Enemy {
    // Add ±10% HP variance
    const variance = 0.1;
    const minHp = Math.floor(template.maxHp * (1 - variance));
    const maxHp = Math.floor(template.maxHp * (1 + variance));
    const randomHp = Math.floor(Math.random() * (maxHp - minHp + 1)) + minHp;

    return new Enemy(
      template.id,
      template.name,
      randomHp,
      [...template.moves]
    );
  }
}
