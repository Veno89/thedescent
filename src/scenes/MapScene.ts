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

    // Calculate layout parameters - INCREASED vertical spacing
    const mapStartY = 150;
    const mapHeight = height - 200;
    const maxFloor = Math.max(...map.map(r => r.y));
    const floorHeight = Math.min(120, mapHeight / (maxFloor + 1)); // Min 120px between floors

    // Group rooms by floor
    const roomsByFloor: Map<number, Room[]> = new Map();
    map.forEach(room => {
      if (!roomsByFloor.has(room.y)) {
        roomsByFloor.set(room.y, []);
      }
      roomsByFloor.get(room.y)!.push(room);
    });

    // NO CONNECTION LINES - Clean look!

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
   * Calculate X position for a room - TIGHTER horizontal spacing
   */
  private calculateXPosition(roomX: number, roomsOnFloor: number, screenWidth: number): number {
    const margin = 300; // Increased margins for tighter clustering
    const availableWidth = screenWidth - margin * 2;

    if (roomsOnFloor === 1) {
      return screenWidth / 2;
    }

    const spacing = availableWidth / (roomsOnFloor - 1);
    return margin + roomX * spacing;
  }


  /**
   * Create a room node with improved visual feedback
   */
  private createRoomNode(room: Room, index: number, x: number, y: number): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    container.setDepth(10);

    const currentRoom = this.gameState.getCurrentRoom();
    const isCurrentRoom = index === this.gameState.currentRoomIndex;
    const isAvailable = this.isRoomAvailable(index);
    const isPastFloor = room.y < currentRoom.y; // Grey out past floors

    // Room background
    const bgColor = this.getRoomColor(room.type);
    let alpha = 1.0;

    // Grey out past floors
    if (isPastFloor) {
      alpha = 0.3;
    } else if (isCurrentRoom) {
      alpha = 1.0;
    } else if (isAvailable) {
      alpha = 0.9;
    } else {
      alpha = 0.5;
    }

    const size = isCurrentRoom ? 55 : 45;
    const bg = this.add.circle(0, 0, size / 2, bgColor, alpha);

    // Current room gets special highlight
    if (isCurrentRoom) {
      bg.setStrokeStyle(5, 0xffff00);
      // Add pulsing glow effect for current position
      this.tweens.add({
        targets: bg,
        scaleX: 1.15,
        scaleY: 1.15,
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    } else {
      bg.setStrokeStyle(2, 0xffffff, isPastFloor ? 0.3 : 1);
    }

    container.add(bg);

    // Glow circle for hover effects (initially invisible)
    const glowCircle = this.add.circle(0, 0, size / 2 + 10, 0xffffff, 0);
    glowCircle.setStrokeStyle(0);
    container.add(glowCircle);

    // Room icon
    const icon = this.getRoomIcon(room.type);
    const iconText = this.add.text(0, 0, icon, {
      fontSize: isCurrentRoom ? '32px' : '28px',
      color: '#ffffff',
      fontFamily: 'monospace',
    });
    iconText.setOrigin(0.5);
    iconText.setAlpha(isPastFloor ? 0.3 : 1);
    container.add(iconText);

    // Make ALL nodes interactive for hover feedback
    if (!isCurrentRoom && !isPastFloor) {
      bg.setInteractive({ useHandCursor: isAvailable });

      bg.on('pointerover', () => {
        if (isAvailable) {
          // GREEN GLOW - can go here
          glowCircle.setFillStyle(0x00ff00, 0.4);
          glowCircle.setVisible(true);
          this.tweens.add({
            targets: glowCircle,
            scale: 1.3,
            alpha: 0,
            duration: 500,
            repeat: -1,
            ease: 'Power2'
          });
          bg.setScale(1.15);
          bg.setStrokeStyle(3, 0x00ff00); // Green stroke
        } else {
          // RED GLOW - cannot go here
          glowCircle.setFillStyle(0xff0000, 0.4);
          glowCircle.setVisible(true);
          this.tweens.add({
            targets: glowCircle,
            scale: 1.2,
            alpha: 0,
            duration: 400,
            repeat: -1,
            ease: 'Power2'
          });
          bg.setStrokeStyle(3, 0xff0000); // Red stroke
        }
      });

      bg.on('pointerout', () => {
        // Stop glow animation
        this.tweens.killTweensOf(glowCircle);
        glowCircle.setVisible(false);
        glowCircle.setScale(1);
        glowCircle.setAlpha(1);
        bg.setScale(1.0);
        bg.setStrokeStyle(2, 0xffffff, isPastFloor ? 0.3 : 1); // Reset stroke
      });

      bg.on('pointerdown', () => {
        if (isAvailable) {
          this.onRoomSelected(index);
        }
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
