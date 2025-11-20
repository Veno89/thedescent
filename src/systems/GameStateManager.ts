import { Room, RoomType } from '@/types';
import { Player } from '@/entities/Player';
import { MapGenerator } from './MapGenerator';

/**
 * GameStateManager tracks the player's progress through a run
 */
export class GameStateManager {
  public player: Player;
  public currentAct: number = 1;
  public currentFloor: number = 0;
  public currentRoomIndex: number = 0;
  public map: Room[] = [];
  public seed: string;

  private mapGenerator: MapGenerator;

  constructor(player: Player, seed?: string) {
    this.player = player;
    this.seed = seed || this.generateSeed();
    this.mapGenerator = new MapGenerator();
  }

  /**
   * Start a new run
   */
  startRun(): void {
    this.currentAct = 1;
    this.currentFloor = 0;
    this.generateMapForAct(1);

    // Start at first room
    this.currentRoomIndex = 0;
    this.map[this.currentRoomIndex].visited = true;
  }

  /**
   * Generate map for current act
   */
  generateMapForAct(act: number): void {
    this.map = this.mapGenerator.generateMap(act);
    console.log(`Generated map for Act ${act} with ${this.map.length} rooms`);
  }

  /**
   * Move to a specific room
   */
  moveToRoom(roomIndex: number): void {
    if (roomIndex < 0 || roomIndex >= this.map.length) {
      console.error('Invalid room index:', roomIndex);
      return;
    }

    const room = this.map[roomIndex];
    room.visited = true;
    this.currentRoomIndex = roomIndex;
    this.currentFloor = room.y;

    console.log(`Moved to ${room.type} at floor ${room.y}`);
  }

  /**
   * Get current room
   */
  getCurrentRoom(): Room {
    return this.map[this.currentRoomIndex];
  }

  /**
   * Get available next rooms
   */
  getAvailableRooms(): Room[] {
    const currentRoom = this.getCurrentRoom();
    return currentRoom.connections.map(index => this.map[index]);
  }

  /**
   * Check if we're at the boss
   */
  isAtBoss(): boolean {
    return this.getCurrentRoom().type === RoomType.BOSS;
  }

  /**
   * Complete current act and move to next
   */
  completeAct(): void {
    if (this.currentAct < 3) {
      this.currentAct++;
      this.currentFloor = 0;
      this.generateMapForAct(this.currentAct);
      this.currentRoomIndex = 0;
      this.map[this.currentRoomIndex].visited = true;
      console.log(`Starting Act ${this.currentAct}`);
    } else {
      console.log('Run complete! You won!');
    }
  }

  /**
   * Generate a random seed
   */
  private generateSeed(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  /**
   * Serialize game state for saving
   */
  serialize(): string {
    return JSON.stringify({
      seed: this.seed,
      currentAct: this.currentAct,
      currentFloor: this.currentFloor,
      currentRoomIndex: this.currentRoomIndex,
      map: this.map,
      player: {
        maxHp: this.player.maxHp,
        currentHp: this.player.currentHp,
        gold: this.player.gold,
        deck: this.player.deck,
        relics: this.player.relics,
        potions: this.player.potions,
      },
    });
  }

  /**
   * Deserialize game state from save
   */
  static deserialize(data: string): GameStateManager | null {
    try {
      const state = JSON.parse(data);
      const player = new Player(state.player.maxHp);
      player.currentHp = state.player.currentHp;
      player.gold = state.player.gold;
      player.deck = state.player.deck;
      player.relics = state.player.relics;
      player.potions = state.player.potions;

      const gameState = new GameStateManager(player, state.seed);
      gameState.currentAct = state.currentAct;
      gameState.currentFloor = state.currentFloor;
      gameState.currentRoomIndex = state.currentRoomIndex;
      gameState.map = state.map;

      return gameState;
    } catch (error) {
      console.error('Failed to deserialize game state:', error);
      return null;
    }
  }
}
