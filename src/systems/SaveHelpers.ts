/**
 * Save Helpers
 * 
 * Utility functions for serializing and deserializing game objects.
 * Converts between runtime objects and save-friendly formats.
 */

import type { Card, Room } from '@/types';
import { Player } from '@/entities/Player';
import { Enemy } from '@/entities/Enemy';
import { Relic } from '@/entities/Relic';
import { Potion } from '@/entities/Potion';
import { DataLoader } from '@/utils/DataLoader';
import type {
  SavedCard,
  SavedRelic,
  SavedPotion,
  SavedRoom,
  SavedPlayerState,
  SavedEnemy,
  SavedRunState,
  SavedCombatState,
} from './SaveSystem';

// ============================================================================
// CARD SERIALIZATION
// ============================================================================

/**
 * Serialize a card to save format.
 */
export function serializeCard(card: Card): SavedCard {
  return {
    id: card.id,
    upgraded: card.upgraded || false,
  };
}

/**
 * Deserialize a card from save format.
 */
export function deserializeCard(saved: SavedCard): Card | null {
  const baseCard = DataLoader.getCardById(saved.id);
  if (!baseCard) {
    console.warn(`[SaveHelpers] Card not found: ${saved.id}`);
    return null;
  }

  // Clone and apply upgrade if needed
  const card: Card = { ...baseCard };
  
  if (saved.upgraded && !card.upgraded) {
    // Apply upgrade effects
    card.upgraded = true;
    card.name = `${card.name}+`;
    
    // Upgrade typically improves damage/block by ~30% or reduces cost
    card.effects = card.effects.map((effect) => {
      const upgraded = { ...effect };
      if (effect.type === 'DAMAGE' || effect.type === 'BLOCK') {
        upgraded.value = Math.floor(effect.value * 1.3);
      }
      return upgraded;
    });
    
    // Use upgradeEffects if defined
    if (baseCard.upgradeEffects) {
      card.effects = baseCard.upgradeEffects;
    }
  }

  return card;
}

/**
 * Serialize an array of cards.
 */
export function serializeCards(cards: Card[]): SavedCard[] {
  return cards.map(serializeCard);
}

/**
 * Deserialize an array of cards.
 */
export function deserializeCards(saved: SavedCard[]): Card[] {
  return saved
    .map(deserializeCard)
    .filter((card): card is Card => card !== null);
}

// ============================================================================
// RELIC SERIALIZATION
// ============================================================================

/**
 * Serialize a relic to save format.
 */
export function serializeRelic(relic: Relic): SavedRelic {
  return {
    id: relic.id,
    counter: relic.counter,
  };
}

/**
 * Deserialize a relic from save format.
 */
export function deserializeRelic(saved: SavedRelic): Relic | null {
  const relicData = DataLoader.getRelicById(saved.id);
  if (!relicData) {
    console.warn(`[SaveHelpers] Relic not found: ${saved.id}`);
    return null;
  }

  const relic = new Relic(relicData);
  relic.counter = saved.counter;
  return relic;
}

/**
 * Serialize an array of relics.
 */
export function serializeRelics(relics: Relic[]): SavedRelic[] {
  return relics.map(serializeRelic);
}

/**
 * Deserialize an array of relics.
 */
export function deserializeRelics(saved: SavedRelic[]): Relic[] {
  return saved
    .map(deserializeRelic)
    .filter((relic): relic is Relic => relic !== null);
}

// ============================================================================
// POTION SERIALIZATION
// ============================================================================

/**
 * Serialize a potion to save format.
 */
export function serializePotion(potion: Potion | null): SavedPotion | null {
  if (!potion) return null;
  return { id: potion.id };
}

/**
 * Deserialize a potion from save format.
 */
export function deserializePotion(saved: SavedPotion | null): Potion | null {
  if (!saved) return null;
  
  const potionData = DataLoader.getPotionById(saved.id);
  if (!potionData) {
    console.warn(`[SaveHelpers] Potion not found: ${saved.id}`);
    return null;
  }

  return new Potion(potionData);
}

/**
 * Serialize an array of potions (with nulls for empty slots).
 */
export function serializePotions(potions: (Potion | null)[]): (SavedPotion | null)[] {
  return potions.map(serializePotion);
}

/**
 * Deserialize an array of potions.
 */
export function deserializePotions(saved: (SavedPotion | null)[]): (Potion | null)[] {
  return saved.map(deserializePotion);
}

// ============================================================================
// ENEMY SERIALIZATION
// ============================================================================

/**
 * Serialize an enemy to save format.
 */
export function serializeEnemy(enemy: Enemy): SavedEnemy {
  return {
    id: enemy.id,
    currentHp: enemy.currentHp,
    maxHp: enemy.maxHp,
    block: enemy.block,
    strength: enemy.strength,
    vulnerable: enemy.vulnerable,
    weak: enemy.weak,
    poison: enemy.poison,
    moveIndex: enemy.currentMoveIndex || 0,
  };
}

/**
 * Deserialize an enemy from save format.
 */
export function deserializeEnemy(saved: SavedEnemy): Enemy | null {
  const enemyData = DataLoader.getEnemyById(saved.id);
  if (!enemyData) {
    console.warn(`[SaveHelpers] Enemy not found: ${saved.id}`);
    return null;
  }

  const enemy = new Enemy(enemyData);
  enemy.currentHp = saved.currentHp;
  enemy.maxHp = saved.maxHp;
  enemy.block = saved.block;
  enemy.strength = saved.strength;
  enemy.vulnerable = saved.vulnerable;
  enemy.weak = saved.weak;
  enemy.poison = saved.poison;
  // Restore move index if possible
  if (typeof enemy.currentMoveIndex !== 'undefined') {
    enemy.currentMoveIndex = saved.moveIndex;
  }

  return enemy;
}

/**
 * Serialize an array of enemies.
 */
export function serializeEnemies(enemies: Enemy[]): SavedEnemy[] {
  return enemies.map(serializeEnemy);
}

/**
 * Deserialize an array of enemies.
 */
export function deserializeEnemies(saved: SavedEnemy[]): Enemy[] {
  return saved
    .map(deserializeEnemy)
    .filter((enemy): enemy is Enemy => enemy !== null);
}

// ============================================================================
// ROOM SERIALIZATION
// ============================================================================

/**
 * Serialize a room to save format.
 */
export function serializeRoom(room: Room): SavedRoom {
  return {
    x: room.x,
    y: room.y,
    type: room.type,
    visited: room.visited,
    completed: room.completed || false,
    connections: room.connections,
  };
}

/**
 * Deserialize a room from save format.
 */
export function deserializeRoom(saved: SavedRoom): Room {
  return {
    x: saved.x,
    y: saved.y,
    type: saved.type as any,
    visited: saved.visited,
    completed: saved.completed,
    connections: saved.connections,
  };
}

/**
 * Serialize an array of rooms.
 */
export function serializeRooms(rooms: Room[]): SavedRoom[] {
  return rooms.map(serializeRoom);
}

/**
 * Deserialize an array of rooms.
 */
export function deserializeRooms(saved: SavedRoom[]): Room[] {
  return saved.map(deserializeRoom);
}

// ============================================================================
// PLAYER SERIALIZATION
// ============================================================================

/**
 * Serialize player state to save format.
 */
export function serializePlayer(player: Player): SavedPlayerState {
  return {
    characterId: player.characterId || 'warrior',
    maxHp: player.maxHp,
    currentHp: player.currentHp,
    gold: player.gold,
    maxEnergy: player.maxEnergy,
    deck: serializeCards(player.deck),
    relics: serializeRelics(player.relics),
    potions: serializePotions(player.potions),
  };
}

/**
 * Deserialize player state from save format.
 */
export function deserializePlayer(saved: SavedPlayerState): Player {
  const player = new Player(saved.maxHp);
  player.characterId = saved.characterId;
  player.currentHp = saved.currentHp;
  player.gold = saved.gold;
  player.maxEnergy = saved.maxEnergy || 3;
  player.deck = deserializeCards(saved.deck);
  player.relics = deserializeRelics(saved.relics);
  player.potions = deserializePotions(saved.potions);

  return player;
}

// ============================================================================
// COMBAT STATE SERIALIZATION
// ============================================================================

/**
 * Serialize combat state to save format.
 */
export function serializeCombatState(
  turn: number,
  drawPile: Card[],
  hand: Card[],
  discardPile: Card[],
  exhaustPile: Card[],
  enemies: Enemy[],
  playerBlock: number,
  playerEnergy: number
): SavedCombatState {
  return {
    turn,
    drawPile: serializeCards(drawPile),
    hand: serializeCards(hand),
    discardPile: serializeCards(discardPile),
    exhaustPile: serializeCards(exhaustPile),
    enemies: serializeEnemies(enemies),
    playerBlock,
    playerEnergy,
  };
}

/**
 * Deserialize combat state from save format.
 */
export function deserializeCombatState(saved: SavedCombatState): {
  turn: number;
  drawPile: Card[];
  hand: Card[];
  discardPile: Card[];
  exhaustPile: Card[];
  enemies: Enemy[];
  playerBlock: number;
  playerEnergy: number;
} {
  return {
    turn: saved.turn,
    drawPile: deserializeCards(saved.drawPile),
    hand: deserializeCards(saved.hand),
    discardPile: deserializeCards(saved.discardPile),
    exhaustPile: deserializeCards(saved.exhaustPile),
    enemies: deserializeEnemies(saved.enemies),
    playerBlock: saved.playerBlock,
    playerEnergy: saved.playerEnergy,
  };
}

// ============================================================================
// FULL RUN STATE
// ============================================================================

/**
 * Create a complete run state for saving.
 */
export function createRunState(
  seed: string,
  currentAct: number,
  currentFloor: number,
  currentRoomIndex: number,
  map: Room[],
  player: Player,
  combatState?: SavedCombatState
): SavedRunState {
  return {
    version: '1.1.0',
    timestamp: Date.now(),
    seed,
    currentAct,
    currentFloor,
    currentRoomIndex,
    map: serializeRooms(map),
    player: serializePlayer(player),
    combatState,
  };
}

/**
 * Restore a complete run state from save.
 */
export function restoreRunState(saved: SavedRunState): {
  seed: string;
  currentAct: number;
  currentFloor: number;
  currentRoomIndex: number;
  map: Room[];
  player: Player;
  combatState?: ReturnType<typeof deserializeCombatState>;
} {
  return {
    seed: saved.seed,
    currentAct: saved.currentAct,
    currentFloor: saved.currentFloor,
    currentRoomIndex: saved.currentRoomIndex,
    map: deserializeRooms(saved.map),
    player: deserializePlayer(saved.player),
    combatState: saved.combatState 
      ? deserializeCombatState(saved.combatState) 
      : undefined,
  };
}
