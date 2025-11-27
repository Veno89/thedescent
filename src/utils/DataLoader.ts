import { Card, CharacterClass, GameEvent } from '@/types';
import { Enemy } from '@/entities/Enemy';
import { Relic } from '@/entities/Relic';
import { Potion } from '@/entities/Potion';
import starterCards from '@/data/cards/starter.json';
import advancedCards from '@/data/cards/advanced.json';
import act1Enemies from '@/data/enemies/act1.json';
import relicsData from '@/data/relics/relics.json';
import potionsData from '@/data/potions/potions.json';
import eventsData from '@/data/events/events.json';
import charactersData from '@/data/characters.json';

/**
 * DataLoader handles loading and caching game data from JSON files
 */
export class DataLoader {
  private static cardCache: Map<string, Card> = new Map();
  private static enemyCache: Map<string, Enemy> = new Map();
  private static relicCache: Map<string, Relic> = new Map();
  private static potionCache: Map<string, Potion> = new Map();
  private static eventCache: Map<string, GameEvent> = new Map();
  private static characterCache: Map<string, CharacterClass> = new Map();
  private static initialized = false;

  /**
   * Initialize the data loader by loading all data files
   */
  static initialize(): void {
    if (this.initialized) return;

    // Load starter cards
    starterCards.cards.forEach((cardData) => {
      const card = this.parseCard(cardData);
      this.cardCache.set(card.id, card);
    });

    // Load advanced cards
    advancedCards.cards.forEach((cardData) => {
      const card = this.parseCard(cardData);
      this.cardCache.set(card.id, card);
    });

    // Load enemies
    act1Enemies.enemies.forEach((enemyData) => {
      const enemy = this.parseEnemy(enemyData);
      this.enemyCache.set(enemy.id, enemy);
    });

    // Load relics
    relicsData.relics.forEach((relicData) => {
      const relic = this.parseRelic(relicData);
      this.relicCache.set(relic.id, relic);
    });

    // Load potions
    potionsData.potions.forEach((potionData) => {
      const potion = this.parsePotion(potionData);
      this.potionCache.set(potion.id, potion);
    });

    // Load events
    eventsData.events.forEach((eventData: any) => {
      const event = this.parseEvent(eventData);
      this.eventCache.set(event.id, event);
    });

    // Load characters
    charactersData.characters.forEach((charData: any) => {
      this.characterCache.set(charData.id, charData as CharacterClass);
    });

    this.initialized = true;
    console.log(
      `Loaded ${this.cardCache.size} cards, ${this.enemyCache.size} enemies, ` +
      `${this.relicCache.size} relics, ${this.potionCache.size} potions, ` +
      `${this.eventCache.size} events, and ${this.characterCache.size} characters`
    );
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
   * Get a random card with rarity weighting
   * COMMON: 60%, UNCOMMON: 30%, RARE: 10%
   */
  static getRandomWeightedCard(): Card | undefined {
    if (!this.initialized) this.initialize();

    const roll = Math.random();
    let targetRarity: string;

    if (roll < 0.6) {
      targetRarity = 'COMMON';
    } else if (roll < 0.9) {
      targetRarity = 'UNCOMMON';
    } else {
      targetRarity = 'RARE';
    }

    const filtered = this.getCardsByRarity(targetRarity);
    if (filtered.length === 0) {
      // Fallback to any card
      const allCards = this.getAllCards();
      if (allCards.length === 0) return undefined;
      const randomIndex = Math.floor(Math.random() * allCards.length);
      return allCards[randomIndex];
    }

    const randomIndex = Math.floor(Math.random() * filtered.length);
    return filtered[randomIndex];
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
   * Get enemies by type (normal, elite, boss)
   */
  static getEnemiesByType(type: string): Enemy[] {
    if (!this.initialized) this.initialize();
    return Array.from(this.enemyCache.values()).filter(
      (enemy) => enemy.type === type
    );
  }

  /**
   * Get a random enemy of a specific type
   */
  static getRandomEnemyByType(type: string): Enemy | undefined {
    if (!this.initialized) this.initialize();
    const enemies = this.getEnemiesByType(type);
    if (enemies.length === 0) return undefined;

    const randomIndex = Math.floor(Math.random() * enemies.length);
    return this.getEnemy(enemies[randomIndex].id);
  }

  /**
   * Get a relic by ID
   */
  static getRelic(id: string): Relic | undefined {
    if (!this.initialized) this.initialize();
    const template = this.relicCache.get(id);
    return template ? template.clone() : undefined;
  }

  /**
   * Get all relics
   */
  static getAllRelics(): Relic[] {
    if (!this.initialized) this.initialize();
    return Array.from(this.relicCache.values()).map(r => r.clone());
  }

  /**
   * Get relics by rarity
   */
  static getRelicsByRarity(rarity: string): Relic[] {
    if (!this.initialized) this.initialize();
    return Array.from(this.relicCache.values())
      .filter((relic) => relic.rarity === rarity)
      .map(r => r.clone());
  }

  /**
   * Get a random relic
   */
  static getRandomRelic(): Relic | undefined {
    if (!this.initialized) this.initialize();
    const relics = Array.from(this.relicCache.values());
    if (relics.length === 0) return undefined;

    const randomIndex = Math.floor(Math.random() * relics.length);
    return relics[randomIndex].clone();
  }

  /**
   * Get a random relic with rarity weighting
   * COMMON: 60%, UNCOMMON: 30%, RARE: 10%
   */
  static getRandomWeightedRelic(): Relic | undefined {
    if (!this.initialized) this.initialize();

    const roll = Math.random();
    let targetRarity: string;

    if (roll < 0.6) {
      targetRarity = 'COMMON';
    } else if (roll < 0.9) {
      targetRarity = 'UNCOMMON';
    } else {
      targetRarity = 'RARE';
    }

    const filtered = this.getRelicsByRarity(targetRarity);
    if (filtered.length === 0) {
      // Fallback to any relic
      return this.getRandomRelic();
    }

    const randomIndex = Math.floor(Math.random() * filtered.length);
    return filtered[randomIndex];
  }

  /**
   * Get a potion by ID
   */
  static getPotion(id: string): Potion | undefined {
    if (!this.initialized) this.initialize();
    const template = this.potionCache.get(id);
    return template ? template.clone() : undefined;
  }

  /**
   * Get all potions
   */
  static getAllPotions(): Potion[] {
    if (!this.initialized) this.initialize();
    return Array.from(this.potionCache.values()).map(p => p.clone());
  }

  /**
   * Get potions by rarity
   */
  static getPotionsByRarity(rarity: string): Potion[] {
    if (!this.initialized) this.initialize();
    return Array.from(this.potionCache.values())
      .filter((potion) => potion.rarity === rarity)
      .map(p => p.clone());
  }

  /**
   * Get a random potion
   */
  static getRandomPotion(): Potion | undefined {
    if (!this.initialized) this.initialize();
    const potions = Array.from(this.potionCache.values());
    if (potions.length === 0) return undefined;

    const randomIndex = Math.floor(Math.random() * potions.length);
    return potions[randomIndex].clone();
  }

  /**
   * Get a random potion with rarity weighting
   * COMMON: 70%, UNCOMMON: 25%, RARE: 5%
   */
  static getRandomWeightedPotion(): Potion | undefined {
    if (!this.initialized) this.initialize();

    const roll = Math.random();
    let targetRarity: string;

    if (roll < 0.7) {
      targetRarity = 'COMMON';
    } else if (roll < 0.95) {
      targetRarity = 'UNCOMMON';
    } else {
      targetRarity = 'RARE';
    }

    const filtered = this.getPotionsByRarity(targetRarity);
    if (filtered.length === 0) {
      // Fallback to any potion
      return this.getRandomPotion();
    }

    const randomIndex = Math.floor(Math.random() * filtered.length);
    return filtered[randomIndex];
  }

  /**
   * Get an event by ID
   */
  static getEvent(id: string): GameEvent | undefined {
    if (!this.initialized) this.initialize();
    return this.eventCache.get(id);
  }

  /**
   * Get all events
   */
  static getAllEvents(): GameEvent[] {
    if (!this.initialized) this.initialize();
    return Array.from(this.eventCache.values());
  }

  /**
   * Get a random event
   */
  static getRandomEvent(): GameEvent | undefined {
    if (!this.initialized) this.initialize();
    const events = Array.from(this.eventCache.values());
    if (events.length === 0) return undefined;

    const randomIndex = Math.floor(Math.random() * events.length);
    return events[randomIndex];
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

    // 5 Delves, 4 Braces (reduced to make room for advanced cards)
    for (let i = 0; i < 5; i++) {
      const delve = this.createCard('delve');
      if (delve) deck.push(delve);
    }

    for (let i = 0; i < 4; i++) {
      const brace = this.createCard('brace');
      if (brace) deck.push(brace);
    }

    // Add some advanced cards for testing different mechanics
    const sunder = this.createCard('sunder');
    if (sunder) deck.push(sunder);

    const deepBreath = this.createCard('deep_breath');
    if (deepBreath) deck.push(deepBreath);

    const caveIn = this.createCard('cave_in');
    if (caveIn) deck.push(caveIn);

    const tunnelVision = this.createCard('tunnel_vision');
    if (tunnelVision) deck.push(tunnelVision);

    const crushingBlow = this.createCard('crushing_blow');
    if (crushingBlow) deck.push(crushingBlow);

    const depthAdaptation = this.createCard('depth_adaptation');
    if (depthAdaptation) deck.push(depthAdaptation);

    const whirlwind = this.createCard('whirlwind'); // X-cost
    if (whirlwind) deck.push(whirlwind);

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
      data.type, // Add type field!
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
      template.type, // Add type field!
      randomHp,
      [...template.moves]
    );
  }

  private static parseRelic(data: any): Relic {
    return new Relic({
      id: data.id,
      name: data.name,
      description: data.description,
      rarity: data.rarity,
      effects: data.effects,
    });
  }

  private static parsePotion(data: any): Potion {
    return new Potion({
      id: data.id,
      name: data.name,
      description: data.description,
      rarity: data.rarity,
      targetType: data.targetType,
      effects: data.effects,
    });
  }

  private static parseEvent(data: any): GameEvent {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      image: data.image,
      choices: data.choices,
    };
  }

  /**
   * Get a character class by ID
   */
  static getCharacterClass(id: string): CharacterClass | undefined {
    if (!this.initialized) this.initialize();
    return this.characterCache.get(id);
  }

  /**
   * Get all character classes
   */
  static getAllCharacterClasses(): CharacterClass[] {
    if (!this.initialized) this.initialize();
    return Array.from(this.characterCache.values());
  }
}
