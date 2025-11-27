/**
 * Save System
 * 
 * Comprehensive save/load functionality for game state persistence.
 * Handles run saves, settings, unlocks, and statistics.
 * 
 * Features:
 * - Versioned save format with migration support
 * - Auto-save functionality
 * - Multiple save slots
 * - Data validation and error recovery
 * - Event bus integration
 */

import { SAVE } from '@/config/gameConstants';
import { SaveLog } from '@/utils/Logger';
import { EventBus, GameEvent } from './EventBus';
import type { Card, Room } from '@/types';
import type { Player } from '@/entities/Player';

// ============================================================================
// SAVE DATA TYPES
// ============================================================================

/**
 * Current save format version.
 * Increment when making breaking changes to save format.
 */
export const SAVE_VERSION = '1.1.0';

/**
 * Player state for serialization.
 */
export interface SavedPlayerState {
  characterId: string;
  maxHp: number;
  currentHp: number;
  gold: number;
  maxEnergy: number;
  deck: SavedCard[];
  relics: SavedRelic[];
  potions: (SavedPotion | null)[];
}

/**
 * Minimal card data for saving.
 */
export interface SavedCard {
  id: string;
  upgraded: boolean;
}

/**
 * Minimal relic data for saving.
 */
export interface SavedRelic {
  id: string;
  counter: number;
}

/**
 * Minimal potion data for saving.
 */
export interface SavedPotion {
  id: string;
}

/**
 * Map room for saving.
 */
export interface SavedRoom {
  x: number;
  y: number;
  type: string;
  visited: boolean;
  completed: boolean;
  connections: number[];
}

/**
 * Complete run state for saving.
 */
export interface SavedRunState {
  version: string;
  timestamp: number;
  seed: string;
  currentAct: number;
  currentFloor: number;
  currentRoomIndex: number;
  map: SavedRoom[];
  player: SavedPlayerState;
  combatState?: SavedCombatState;
}

/**
 * Combat state for mid-combat saves.
 */
export interface SavedCombatState {
  turn: number;
  drawPile: SavedCard[];
  hand: SavedCard[];
  discardPile: SavedCard[];
  exhaustPile: SavedCard[];
  enemies: SavedEnemy[];
  playerBlock: number;
  playerEnergy: number;
}

/**
 * Enemy state for saving.
 */
export interface SavedEnemy {
  id: string;
  currentHp: number;
  maxHp: number;
  block: number;
  strength: number;
  vulnerable: number;
  weak: number;
  poison: number;
  moveIndex: number;
}

/**
 * Game settings for saving.
 */
export interface SavedSettings {
  version: string;
  musicVolume: number;
  sfxVolume: number;
  screenShake: boolean;
  fastMode: boolean;
  confirmEndTurn: boolean;
  showDamageNumbers: boolean;
  autoEndTurn: boolean;
}

/**
 * Statistics for saving.
 */
export interface SavedStats {
  version: string;
  totalPlayTime: number;
  runsStarted: number;
  runsCompleted: number;
  runsAbandoned: number;
  highestFloor: number;
  highestAct: number;
  enemiesKilled: number;
  elitesKilled: number;
  bossesKilled: number;
  cardsPlayed: number;
  damageDealt: number;
  damageBlocked: number;
  healingDone: number;
  goldEarned: number;
  goldSpent: number;
  cardsObtained: number;
  cardsRemoved: number;
  cardsUpgraded: number;
  relicsObtained: number;
  potionsUsed: number;
  perfectCombats: number;
  fastestBossKill: number;
  longestWinStreak: number;
  currentWinStreak: number;
}

/**
 * Unlock data for saving.
 */
export interface SavedUnlocks {
  version: string;
  unlockedCards: string[];
  unlockedRelics: string[];
  unlockedCharacters: string[];
  achievements: string[];
}

/**
 * Complete save data container.
 */
export interface SaveData {
  run?: SavedRunState;
  settings: SavedSettings;
  stats: SavedStats;
  unlocks: SavedUnlocks;
}

// ============================================================================
// STORAGE KEYS
// ============================================================================

const STORAGE_KEYS = {
  RUN: SAVE.STORAGE_KEY,
  SETTINGS: `${SAVE.STORAGE_KEY}-settings`,
  STATS: SAVE.STATS_STORAGE_KEY || `${SAVE.STORAGE_KEY}-stats`,
  UNLOCKS: SAVE.UNLOCK_STORAGE_KEY || `${SAVE.STORAGE_KEY}-unlocks`,
  SLOT_PREFIX: `${SAVE.STORAGE_KEY}-slot-`,
};

// ============================================================================
// DEFAULT DATA
// ============================================================================

const DEFAULT_SETTINGS: SavedSettings = {
  version: SAVE_VERSION,
  musicVolume: 0.7,
  sfxVolume: 0.8,
  screenShake: true,
  fastMode: false,
  confirmEndTurn: false,
  showDamageNumbers: true,
  autoEndTurn: false,
};

const DEFAULT_STATS: SavedStats = {
  version: SAVE_VERSION,
  totalPlayTime: 0,
  runsStarted: 0,
  runsCompleted: 0,
  runsAbandoned: 0,
  highestFloor: 0,
  highestAct: 0,
  enemiesKilled: 0,
  elitesKilled: 0,
  bossesKilled: 0,
  cardsPlayed: 0,
  damageDealt: 0,
  damageBlocked: 0,
  healingDone: 0,
  goldEarned: 0,
  goldSpent: 0,
  cardsObtained: 0,
  cardsRemoved: 0,
  cardsUpgraded: 0,
  relicsObtained: 0,
  potionsUsed: 0,
  perfectCombats: 0,
  fastestBossKill: 0,
  longestWinStreak: 0,
  currentWinStreak: 0,
};

const DEFAULT_UNLOCKS: SavedUnlocks = {
  version: SAVE_VERSION,
  unlockedCards: [],
  unlockedRelics: [],
  unlockedCharacters: ['warrior'],
  achievements: [],
};

// ============================================================================
// SAVE SYSTEM IMPLEMENTATION
// ============================================================================

/**
 * SaveSystem - Singleton class for game persistence.
 */
class SaveSystemImpl {
  private autoSaveEnabled: boolean = true;
  private autoSaveInterval: number = 60000; // 1 minute
  private autoSaveTimer: number | null = null;
  private isDirty: boolean = false;

  // Cached data
  private cachedSettings: SavedSettings | null = null;
  private cachedStats: SavedStats | null = null;
  private cachedUnlocks: SavedUnlocks | null = null;

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  /**
   * Initialize the save system.
   */
  initialize(): void {
    // Load cached data
    this.cachedSettings = this.loadSettings();
    this.cachedStats = this.loadStats();
    this.cachedUnlocks = this.loadUnlocks();

    // Start auto-save
    if (this.autoSaveEnabled) {
      this.startAutoSave();
    }

    // Subscribe to events for stat tracking
    this.subscribeToEvents();

    SaveLog.info('SaveSystem initialized');
  }

  /**
   * Subscribe to game events for automatic stat tracking.
   */
  private subscribeToEvents(): void {
    // Track enemy kills
    EventBus.on(GameEvent.ENEMY_KILLED, () => {
      this.incrementStat('enemiesKilled');
    });

    // Track damage dealt
    EventBus.on(GameEvent.DAMAGE_DEALT, (data: any) => {
      if (data.source === 'player') {
        this.incrementStat('damageDealt', data.hpLost);
      }
    });

    // Track damage blocked
    EventBus.on(GameEvent.PLAYER_DAMAGED, (data: any) => {
      if (data.blocked > 0) {
        this.incrementStat('damageBlocked', data.blocked);
      }
    });

    // Track cards played
    EventBus.on(GameEvent.CARD_PLAYED, () => {
      this.incrementStat('cardsPlayed');
    });

    // Track potions used
    EventBus.on(GameEvent.POTION_USED, () => {
      this.incrementStat('potionsUsed');
    });

    // Track combat victories
    EventBus.on(GameEvent.COMBAT_VICTORY, () => {
      this.isDirty = true;
    });
  }

  // ============================================================================
  // RUN SAVES
  // ============================================================================

  /**
   * Save the current run state.
   */
  saveRun(runState: SavedRunState): boolean {
    try {
      const data: SavedRunState = {
        ...runState,
        version: SAVE_VERSION,
        timestamp: Date.now(),
      };

      localStorage.setItem(STORAGE_KEYS.RUN, JSON.stringify(data));
      
      EventBus.emit(GameEvent.SAVE_GAME, { success: true });
      SaveLog.info('Run saved');
      
      return true;
    } catch (error) {
      SaveLog.error('Failed to save run', error instanceof Error ? error : undefined);
      EventBus.emit(GameEvent.SAVE_GAME, { success: false, error });
      return false;
    }
  }

  /**
   * Load the current run state.
   */
  loadRun(): SavedRunState | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.RUN);
      if (!data) return null;

      const runState: SavedRunState = JSON.parse(data);
      
      // Validate and migrate if needed
      if (this.needsMigration(runState.version)) {
        return this.migrateRunState(runState);
      }

      EventBus.emit(GameEvent.LOAD_GAME, { success: true });
      return runState;
    } catch (error) {
      console.error('[SaveSystem] Failed to load run:', error);
      EventBus.emit(GameEvent.LOAD_GAME, { success: false, error });
      return null;
    }
  }

  /**
   * Delete the current run save.
   */
  deleteRun(): void {
    localStorage.removeItem(STORAGE_KEYS.RUN);
    console.log('[SaveSystem] Run deleted');
  }

  /**
   * Check if a run save exists.
   */
  hasRunSave(): boolean {
    return localStorage.getItem(STORAGE_KEYS.RUN) !== null;
  }

  // ============================================================================
  // SAVE SLOTS
  // ============================================================================

  /**
   * Save to a specific slot.
   */
  saveToSlot(slot: number, runState: SavedRunState): boolean {
    try {
      const key = `${STORAGE_KEYS.SLOT_PREFIX}${slot}`;
      const data: SavedRunState = {
        ...runState,
        version: SAVE_VERSION,
        timestamp: Date.now(),
      };

      localStorage.setItem(key, JSON.stringify(data));
      console.log(`[SaveSystem] Saved to slot ${slot}`);
      return true;
    } catch (error) {
      console.error(`[SaveSystem] Failed to save to slot ${slot}:`, error);
      return false;
    }
  }

  /**
   * Load from a specific slot.
   */
  loadFromSlot(slot: number): SavedRunState | null {
    try {
      const key = `${STORAGE_KEYS.SLOT_PREFIX}${slot}`;
      const data = localStorage.getItem(key);
      if (!data) return null;

      const runState: SavedRunState = JSON.parse(data);
      return this.needsMigration(runState.version) 
        ? this.migrateRunState(runState) 
        : runState;
    } catch (error) {
      console.error(`[SaveSystem] Failed to load from slot ${slot}:`, error);
      return null;
    }
  }

  /**
   * Delete a specific slot.
   */
  deleteSlot(slot: number): void {
    const key = `${STORAGE_KEYS.SLOT_PREFIX}${slot}`;
    localStorage.removeItem(key);
    console.log(`[SaveSystem] Deleted slot ${slot}`);
  }

  /**
   * Get all save slot info.
   */
  getSaveSlots(): Array<{ slot: number; timestamp: number; act: number; floor: number } | null> {
    const slots: Array<{ slot: number; timestamp: number; act: number; floor: number } | null> = [];
    
    for (let i = 1; i <= 3; i++) {
      const save = this.loadFromSlot(i);
      if (save) {
        slots.push({
          slot: i,
          timestamp: save.timestamp,
          act: save.currentAct,
          floor: save.currentFloor,
        });
      } else {
        slots.push(null);
      }
    }
    
    return slots;
  }

  // ============================================================================
  // SETTINGS
  // ============================================================================

  /**
   * Load settings.
   */
  loadSettings(): SavedSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!data) return { ...DEFAULT_SETTINGS };

      const settings: SavedSettings = JSON.parse(data);
      // Merge with defaults for any missing fields
      return { ...DEFAULT_SETTINGS, ...settings };
    } catch (error) {
      console.error('[SaveSystem] Failed to load settings:', error);
      return { ...DEFAULT_SETTINGS };
    }
  }

  /**
   * Save settings.
   */
  saveSettings(settings: Partial<SavedSettings>): void {
    try {
      const current = this.cachedSettings || this.loadSettings();
      const updated: SavedSettings = { ...current, ...settings, version: SAVE_VERSION };
      
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
      this.cachedSettings = updated;
      
      console.log('[SaveSystem] Settings saved');
    } catch (error) {
      console.error('[SaveSystem] Failed to save settings:', error);
    }
  }

  /**
   * Get a specific setting.
   */
  getSetting<K extends keyof SavedSettings>(key: K): SavedSettings[K] {
    if (!this.cachedSettings) {
      this.cachedSettings = this.loadSettings();
    }
    return this.cachedSettings[key];
  }

  /**
   * Set a specific setting.
   */
  setSetting<K extends keyof SavedSettings>(key: K, value: SavedSettings[K]): void {
    this.saveSettings({ [key]: value } as Partial<SavedSettings>);
  }

  // ============================================================================
  // STATISTICS
  // ============================================================================

  /**
   * Load statistics.
   */
  loadStats(): SavedStats {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STATS);
      if (!data) return { ...DEFAULT_STATS };

      const stats: SavedStats = JSON.parse(data);
      return { ...DEFAULT_STATS, ...stats };
    } catch (error) {
      console.error('[SaveSystem] Failed to load stats:', error);
      return { ...DEFAULT_STATS };
    }
  }

  /**
   * Save statistics.
   */
  saveStats(stats: Partial<SavedStats>): void {
    try {
      const current = this.cachedStats || this.loadStats();
      const updated: SavedStats = { ...current, ...stats, version: SAVE_VERSION };
      
      localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(updated));
      this.cachedStats = updated;
    } catch (error) {
      console.error('[SaveSystem] Failed to save stats:', error);
    }
  }

  /**
   * Increment a stat.
   */
  incrementStat(stat: keyof SavedStats, amount: number = 1): void {
    if (!this.cachedStats) {
      this.cachedStats = this.loadStats();
    }
    
    const current = this.cachedStats[stat];
    if (typeof current === 'number') {
      (this.cachedStats[stat] as number) = current + amount;
      this.isDirty = true;
    }
  }

  /**
   * Get all statistics.
   */
  getStats(): SavedStats {
    if (!this.cachedStats) {
      this.cachedStats = this.loadStats();
    }
    return { ...this.cachedStats };
  }

  /**
   * Update high score stats.
   */
  updateHighScore(stat: keyof SavedStats, value: number): void {
    if (!this.cachedStats) {
      this.cachedStats = this.loadStats();
    }
    
    const current = this.cachedStats[stat];
    if (typeof current === 'number' && value > current) {
      (this.cachedStats[stat] as number) = value;
      this.isDirty = true;
    }
  }

  // ============================================================================
  // UNLOCKS
  // ============================================================================

  /**
   * Load unlocks.
   */
  loadUnlocks(): SavedUnlocks {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.UNLOCKS);
      if (!data) return { ...DEFAULT_UNLOCKS };

      const unlocks: SavedUnlocks = JSON.parse(data);
      return { ...DEFAULT_UNLOCKS, ...unlocks };
    } catch (error) {
      console.error('[SaveSystem] Failed to load unlocks:', error);
      return { ...DEFAULT_UNLOCKS };
    }
  }

  /**
   * Save unlocks.
   */
  saveUnlocks(unlocks: Partial<SavedUnlocks>): void {
    try {
      const current = this.cachedUnlocks || this.loadUnlocks();
      const updated: SavedUnlocks = { ...current, ...unlocks, version: SAVE_VERSION };
      
      localStorage.setItem(STORAGE_KEYS.UNLOCKS, JSON.stringify(updated));
      this.cachedUnlocks = updated;
    } catch (error) {
      console.error('[SaveSystem] Failed to save unlocks:', error);
    }
  }

  /**
   * Check if something is unlocked.
   */
  isUnlocked(type: 'card' | 'relic' | 'character' | 'achievement', id: string): boolean {
    if (!this.cachedUnlocks) {
      this.cachedUnlocks = this.loadUnlocks();
    }

    switch (type) {
      case 'card':
        return this.cachedUnlocks.unlockedCards.includes(id);
      case 'relic':
        return this.cachedUnlocks.unlockedRelics.includes(id);
      case 'character':
        return this.cachedUnlocks.unlockedCharacters.includes(id);
      case 'achievement':
        return this.cachedUnlocks.achievements.includes(id);
      default:
        return false;
    }
  }

  /**
   * Unlock something.
   */
  unlock(type: 'card' | 'relic' | 'character' | 'achievement', id: string): boolean {
    if (!this.cachedUnlocks) {
      this.cachedUnlocks = this.loadUnlocks();
    }

    let array: string[];
    switch (type) {
      case 'card':
        array = this.cachedUnlocks.unlockedCards;
        break;
      case 'relic':
        array = this.cachedUnlocks.unlockedRelics;
        break;
      case 'character':
        array = this.cachedUnlocks.unlockedCharacters;
        break;
      case 'achievement':
        array = this.cachedUnlocks.achievements;
        break;
      default:
        return false;
    }

    if (!array.includes(id)) {
      array.push(id);
      this.saveUnlocks(this.cachedUnlocks);
      console.log(`[SaveSystem] Unlocked ${type}: ${id}`);
      return true;
    }
    
    return false;
  }

  // ============================================================================
  // AUTO-SAVE
  // ============================================================================

  /**
   * Start auto-save timer.
   */
  startAutoSave(): void {
    if (this.autoSaveTimer) return;

    this.autoSaveTimer = window.setInterval(() => {
      if (this.isDirty) {
        this.flushStats();
        this.isDirty = false;
      }
    }, this.autoSaveInterval);

    console.log('[SaveSystem] Auto-save started');
  }

  /**
   * Stop auto-save timer.
   */
  stopAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
      console.log('[SaveSystem] Auto-save stopped');
    }
  }

  /**
   * Flush cached stats to storage.
   */
  flushStats(): void {
    if (this.cachedStats) {
      this.saveStats(this.cachedStats);
    }
  }

  /**
   * Set auto-save interval.
   */
  setAutoSaveInterval(ms: number): void {
    this.autoSaveInterval = ms;
    if (this.autoSaveTimer) {
      this.stopAutoSave();
      this.startAutoSave();
    }
  }

  // ============================================================================
  // MIGRATION
  // ============================================================================

  /**
   * Check if save data needs migration.
   */
  private needsMigration(version: string): boolean {
    if (!version) return true;
    return version !== SAVE_VERSION;
  }

  /**
   * Migrate old run state to current version.
   */
  private migrateRunState(oldState: any): SavedRunState {
    console.log(`[SaveSystem] Migrating save from ${oldState.version} to ${SAVE_VERSION}`);

    // Add migration logic here for version upgrades
    const migrated: SavedRunState = {
      ...oldState,
      version: SAVE_VERSION,
    };

    // Example: Add fields that didn't exist in older versions
    if (!migrated.player.maxEnergy) {
      migrated.player.maxEnergy = 3;
    }

    return migrated;
  }

  // ============================================================================
  // UTILITY
  // ============================================================================

  /**
   * Clear all save data.
   */
  clearAll(): void {
    localStorage.removeItem(STORAGE_KEYS.RUN);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.STATS);
    localStorage.removeItem(STORAGE_KEYS.UNLOCKS);
    
    for (let i = 1; i <= 3; i++) {
      localStorage.removeItem(`${STORAGE_KEYS.SLOT_PREFIX}${i}`);
    }

    this.cachedSettings = null;
    this.cachedStats = null;
    this.cachedUnlocks = null;

    console.log('[SaveSystem] All data cleared');
  }

  /**
   * Export all save data as JSON string.
   */
  exportData(): string {
    const data: SaveData = {
      run: this.loadRun() || undefined,
      settings: this.loadSettings(),
      stats: this.loadStats(),
      unlocks: this.loadUnlocks(),
    };

    return JSON.stringify(data, null, 2);
  }

  /**
   * Import save data from JSON string.
   */
  importData(jsonString: string): boolean {
    try {
      const data: SaveData = JSON.parse(jsonString);

      if (data.run) {
        this.saveRun(data.run);
      }
      if (data.settings) {
        this.saveSettings(data.settings);
      }
      if (data.stats) {
        this.saveStats(data.stats);
      }
      if (data.unlocks) {
        this.saveUnlocks(data.unlocks);
      }

      console.log('[SaveSystem] Data imported successfully');
      return true;
    } catch (error) {
      console.error('[SaveSystem] Failed to import data:', error);
      return false;
    }
  }

  /**
   * Get storage usage in bytes.
   */
  getStorageUsage(): number {
    let total = 0;
    
    for (const key of Object.values(STORAGE_KEYS)) {
      const data = localStorage.getItem(key);
      if (data) {
        total += data.length * 2; // UTF-16 = 2 bytes per char
      }
    }
    
    return total;
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

/**
 * Global SaveSystem instance.
 */
export const SaveSystem = new SaveSystemImpl();

// Default export
export default SaveSystem;
