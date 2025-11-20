import Phaser from 'phaser';
import { Room, RoomType } from '@/types';
import { GameStateManager } from '@/systems/GameStateManager';

/**
 * MapScene displays the dungeon map and allows room selection
 */
export class MapScene extends Phaser.Scene {
  private gameState!: GameStateManager;
  private roomNodes: Map<number, Phaser.GameObjects.Container> = new Map();

  constructor() {
    super({ key: 'MapScene' });
  }

  init(data: { gameState: GameStateManager }) {
    this.gameState = data.gameState;
  }

  create(): void {
    const width = this.cameras.main.width;

    // Title
    this.add.text(width / 2, 50, `ACT ${this.gameState.currentAct} - THE DESCENT`, {
      fontSize: '36px',
      color: '#ffffff',
      fontStyle: 'bold',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Player stats
    this.add.text(50, 50, `HP: ${this.gameState.player.currentHp}/${this.gameState.player.maxHp}`, {
      fontSize: '20px',
      color: '#ff6b6b',
      fontStyle: 'bold',
      fontFamily: 'monospace',
    });

    this.add.text(50, 80, `Gold: ${this.gameState.player.gold}`, {
      fontSize: '20px',
      color: '#ffd700',
      fontStyle: 'bold',
      fontFamily: 'monospace',
    });

    // Draw the map
    this.renderMap();
  }

  /**
   * Render the entire map
   */
  private renderMap(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const map = this.gameState.map;

    // Calculate layout parameters
    const mapStartY = 150;
    const mapHeight = height - 200;
    const maxFloor = Math.max(...map.map(r => r.y));
    const floorHeight = mapHeight / (maxFloor + 1);

    // Group rooms by floor
    const roomsByFloor: Map<number, Room[]> = new Map();
    map.forEach(room => {
      if (!roomsByFloor.has(room.y)) {
        roomsByFloor.set(room.y, []);
      }
      roomsByFloor.get(room.y)!.push(room);
    });

    // Draw connections first (so they appear behind nodes)
    map.forEach((room) => {
      room.connections.forEach(targetIndex => {
        this.drawConnection(room, map[targetIndex], width, mapStartY, floorHeight);
      });
    });

    // Draw room nodes
    map.forEach((room, index) => {
      const roomsOnFloor = roomsByFloor.get(room.y)!;
      const xPos = this.calculateXPosition(room.x, roomsOnFloor.length, width);
      const yPos = mapStartY + room.y * floorHeight;

      const node = this.createRoomNode(room, index, xPos, yPos);
      this.roomNodes.set(index, node);
    });
  }

  /**
   * Calculate X position for a room
   */
  private calculateXPosition(roomX: number, roomsOnFloor: number, screenWidth: number): number {
    const margin = 200;
    const availableWidth = screenWidth - margin * 2;

    if (roomsOnFloor === 1) {
      return screenWidth / 2;
    }

    const spacing = availableWidth / (roomsOnFloor - 1);
    return margin + roomX * spacing;
  }

  /**
   * Draw connection line between rooms
   */
  private drawConnection(
    from: Room,
    to: Room,
    screenWidth: number,
    mapStartY: number,
    floorHeight: number
  ): void {
    const roomsByFloor: Map<number, Room[]> = new Map();
    this.gameState.map.forEach(room => {
      if (!roomsByFloor.has(room.y)) {
        roomsByFloor.set(room.y, []);
      }
      roomsByFloor.get(room.y)!.push(room);
    });

    const fromX = this.calculateXPosition(from.x, roomsByFloor.get(from.y)!.length, screenWidth);
    const fromY = mapStartY + from.y * floorHeight;
    const toX = this.calculateXPosition(to.x, roomsByFloor.get(to.y)!.length, screenWidth);
    const toY = mapStartY + to.y * floorHeight;

    const line = this.add.line(
      0, 0,
      fromX, fromY + 20,
      toX, toY - 20,
      0x666666
    );
    line.setOrigin(0);
    line.setLineWidth(2);
    line.setDepth(0);
  }

  /**
   * Create a room node
   */
  private createRoomNode(room: Room, index: number, x: number, y: number): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    container.setDepth(10);

    const isCurrentRoom = index === this.gameState.currentRoomIndex;
    const isAvailable = this.isRoomAvailable(index);
    const isVisited = room.visited;

    // Room background
    const bgColor = this.getRoomColor(room.type);
    const alpha = isVisited ? 1 : (isAvailable ? 0.8 : 0.3);
    const size = isCurrentRoom ? 50 : 40;

    const bg = this.add.circle(0, 0, size / 2, bgColor, alpha);
    bg.setStrokeStyle(isCurrentRoom ? 4 : 2, isCurrentRoom ? 0xffff00 : 0xffffff);
    container.add(bg);

    // Room icon
    const icon = this.getRoomIcon(room.type);
    const iconText = this.add.text(0, 0, icon, {
      fontSize: isCurrentRoom ? '28px' : '24px',
      color: '#ffffff',
      fontFamily: 'monospace',
    });
    iconText.setOrigin(0.5);
    container.add(iconText);

    // Make clickable if available
    if (isAvailable && !isCurrentRoom) {
      bg.setInteractive({ useHandCursor: true });

      bg.on('pointerover', () => {
        bg.setScale(1.2);
        bg.setStrokeStyle(4, 0xffff00);
      });

      bg.on('pointerout', () => {
        bg.setScale(1.0);
        bg.setStrokeStyle(2, 0xffffff);
      });

      bg.on('pointerdown', () => {
        this.onRoomSelected(index);
      });
    }

    return container;
  }

  /**
   * Check if a room is available to enter
   */
  private isRoomAvailable(roomIndex: number): boolean {
    const currentRoom = this.gameState.getCurrentRoom();
    return currentRoom.connections.includes(roomIndex);
  }

  /**
   * Get color for room type
   */
  private getRoomColor(type: RoomType): number {
    switch (type) {
      case RoomType.COMBAT:
        return 0x8b0000; // Dark red
      case RoomType.ELITE:
        return 0xff4444; // Bright red
      case RoomType.BOSS:
        return 0x880000; // Deep red
      case RoomType.REST:
        return 0x228b22; // Forest green
      case RoomType.MERCHANT:
        return 0xffd700; // Gold
      case RoomType.TREASURE:
        return 0x4169e1; // Royal blue
      case RoomType.EVENT:
        return 0x9370db; // Medium purple
      default:
        return 0x808080; // Gray
    }
  }

  /**
   * Get icon for room type
   */
  private getRoomIcon(type: RoomType): string {
    switch (type) {
      case RoomType.COMBAT:
        return '⚔️';
      case RoomType.ELITE:
        return '👹';
      case RoomType.BOSS:
        return '💀';
      case RoomType.REST:
        return '🔥';
      case RoomType.MERCHANT:
        return '🛒';
      case RoomType.TREASURE:
        return '📦';
      case RoomType.EVENT:
        return '❓';
      default:
        return '?';
    }
  }

  /**
   * Handle room selection
   */
  private onRoomSelected(roomIndex: number): void {
    const room = this.gameState.map[roomIndex];
    this.gameState.moveToRoom(roomIndex);

    console.log(`Entering ${room.type} room`);

    // Transition to appropriate scene based on room type
    switch (room.type) {
      case RoomType.COMBAT:
      case RoomType.ELITE:
        this.scene.start('CombatScene', { gameState: this.gameState, isElite: room.type === RoomType.ELITE });
        break;

      case RoomType.BOSS:
        this.scene.start('CombatScene', { gameState: this.gameState, isBoss: true });
        break;

      case RoomType.REST:
        this.scene.start('RestScene', { gameState: this.gameState });
        break;

      case RoomType.MERCHANT:
        this.scene.start('MerchantScene', { gameState: this.gameState });
        break;

      case RoomType.TREASURE:
        this.scene.start('RewardScene', { gameState: this.gameState, isTreasure: true });
        break;

      case RoomType.EVENT:
        this.scene.start('EventScene', { gameState: this.gameState });
        break;
    }
  }
}
