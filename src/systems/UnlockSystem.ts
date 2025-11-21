/**
 * UnlockSystem - Manages progression and unlockable content
 */
export interface UnlockData {
  unlockedCards: string[]; // Card IDs
  unlockedRelics: string[]; // Relic IDs
  unlockedCharacters: string[]; // Character IDs
  stats: {
    runsCompleted: number;
    runsAttempted: number;
    enemiesDefeated: number;
    elitesDefeated: number;
    bossesDefeated: number;
    cardsPlayed: number;
    damageDealt: number;
    damageTaken: number;
    goldEarned: number;
    floorsCleared: number;
    highestFloor: number;
  };
}

export class UnlockSystem {
  private static readonly STORAGE_KEY = 'thedescent_unlocks';
  private static data: UnlockData | null = null;

  /**
   * Initialize the unlock system and load saved data
   */
  static initialize(): UnlockData {
    if (this.data) return this.data;

    // Try to load from localStorage
    const saved = localStorage.getItem(this.STORAGE_KEY);

    if (saved) {
      try {
        this.data = JSON.parse(saved);
        console.log('Loaded unlock data from localStorage');
        return this.data!;
      } catch (e) {
        console.error('Failed to parse unlock data, resetting...', e);
      }
    }

    // Create default unlock data
    this.data = {
      unlockedCards: this.getStarterCards(),
      unlockedRelics: this.getStarterRelics(),
      unlockedCharacters: ['warrior', 'rogue', 'guardian'], // All characters unlocked by default
      stats: {
        runsCompleted: 0,
        runsAttempted: 0,
        enemiesDefeated: 0,
        elitesDefeated: 0,
        bossesDefeated: 0,
        cardsPlayed: 0,
        damageDealt: 0,
        damageTaken: 0,
        goldEarned: 0,
        floorsCleared: 0,
        highestFloor: 0,
      },
    };

    this.save();
    console.log('Created new unlock data');
    return this.data;
  }

  /**
   * Get the list of starter cards that are unlocked by default
   */
  private static getStarterCards(): string[] {
    return [
      // Starter cards - always unlocked
      'strike',
      'defend',
      'bash',
      'cleave',
      'iron_wave',
      'shrug_it_off',
      'pommel_strike',
      'armaments',
      'headbutt',
      'flex',
      'warcry',
      // Some common cards unlocked by default
      'twin_strike',
      'thunder_strike',
      'wild_strike',
      'quick_slash',
    ];
  }

  /**
   * Get the list of starter relics
   */
  private static getStarterRelics(): string[] {
    return ['burning_blood', 'ring_of_the_snake', 'anchor'];
  }

  /**
   * Save unlock data to localStorage
   */
  static save(): void {
    if (!this.data) return;

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.error('Failed to save unlock data', e);
    }
  }

  /**
   * Check if a card is unlocked
   */
  static isCardUnlocked(cardId: string): boolean {
    if (!this.data) this.initialize();
    return this.data!.unlockedCards.includes(cardId);
  }

  /**
   * Check if a relic is unlocked
   */
  static isRelicUnlocked(relicId: string): boolean {
    if (!this.data) this.initialize();
    return this.data!.unlockedRelics.includes(relicId);
  }

  /**
   * Check if a character is unlocked
   */
  static isCharacterUnlocked(characterId: string): boolean {
    if (!this.data) this.initialize();
    return this.data!.unlockedCharacters.includes(characterId);
  }

  /**
   * Unlock a card
   */
  static unlockCard(cardId: string): void {
    if (!this.data) this.initialize();

    if (!this.data!.unlockedCards.includes(cardId)) {
      this.data!.unlockedCards.push(cardId);
      this.save();
      console.log(`Unlocked card: ${cardId}`);
    }
  }

  /**
   * Unlock a relic
   */
  static unlockRelic(relicId: string): void {
    if (!this.data) this.initialize();

    if (!this.data!.unlockedRelics.includes(relicId)) {
      this.data!.unlockedRelics.push(relicId);
      this.save();
      console.log(`Unlocked relic: ${relicId}`);
    }
  }

  /**
   * Unlock a character
   */
  static unlockCharacter(characterId: string): void {
    if (!this.data) this.initialize();

    if (!this.data!.unlockedCharacters.includes(characterId)) {
      this.data!.unlockedCharacters.push(characterId);
      this.save();
      console.log(`Unlocked character: ${characterId}`);
    }
  }

  /**
   * Update statistics
   */
  static updateStats(updates: Partial<UnlockData['stats']>): void {
    if (!this.data) this.initialize();

    Object.assign(this.data!.stats, updates);
    this.save();
  }

  /**
   * Increment a stat by a value
   */
  static incrementStat(stat: keyof UnlockData['stats'], amount: number = 1): void {
    if (!this.data) this.initialize();

    this.data!.stats[stat] += amount;
    this.save();
  }

  /**
   * Get current statistics
   */
  static getStats(): UnlockData['stats'] {
    if (!this.data) this.initialize();
    return { ...this.data!.stats };
  }

  /**
   * Get all unlock data
   */
  static getData(): UnlockData {
    if (!this.data) this.initialize();
    return this.data!;
  }

  /**
   * Reset all unlock data (for testing/debugging)
   */
  static reset(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this.data = null;
    this.initialize();
    console.log('Reset all unlock data');
  }

  /**
   * Record a run start
   */
  static recordRunStart(): void {
    this.incrementStat('runsAttempted');
  }

  /**
   * Record a run completion (victory)
   */
  static recordRunComplete(floor: number, goldEarned: number): void {
    this.incrementStat('runsCompleted');
    this.incrementStat('floorsCleared', floor);
    this.incrementStat('goldEarned', goldEarned);

    if (floor > this.data!.stats.highestFloor) {
      this.updateStats({ highestFloor: floor });
    }
  }

  /**
   * Record enemy defeat
   */
  static recordEnemyDefeat(isElite: boolean = false, isBoss: boolean = false): void {
    this.incrementStat('enemiesDefeated');

    if (isElite) {
      this.incrementStat('elitesDefeated');
    }

    if (isBoss) {
      this.incrementStat('bossesDefeated');
    }
  }

  /**
   * Check unlock conditions and unlock content based on stats
   */
  static checkUnlockConditions(): string[] {
    if (!this.data) this.initialize();

    const newUnlocks: string[] = [];
    const stats = this.data!.stats;

    // Example unlock conditions

    // Unlock Inflame after defeating 10 enemies
    if (stats.enemiesDefeated >= 10 && !this.isCardUnlocked('inflame')) {
      this.unlockCard('inflame');
      newUnlocks.push('Card: Inflame');
    }

    // Unlock Body Slam after dealing 1000 damage
    if (stats.damageDealt >= 1000 && !this.isCardUnlocked('body_slam')) {
      this.unlockCard('body_slam');
      newUnlocks.push('Card: Body Slam');
    }

    // Unlock Offering after completing 1 run
    if (stats.runsCompleted >= 1 && !this.isCardUnlocked('offering')) {
      this.unlockCard('offering');
      newUnlocks.push('Card: Offering');
    }

    // Unlock Demon Form after defeating 5 elites
    if (stats.elitesDefeated >= 5 && !this.isCardUnlocked('demon_form')) {
      this.unlockCard('demon_form');
      newUnlocks.push('Card: Demon Form');
    }

    // Unlock Barricade after blocking 500 damage (would need to track this)
    if (stats.runsCompleted >= 2 && !this.isCardUnlocked('barricade')) {
      this.unlockCard('barricade');
      newUnlocks.push('Card: Barricade');
    }

    return newUnlocks;
  }
}
