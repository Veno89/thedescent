import Phaser from 'phaser';
import { GameStateManager } from '@/systems/GameStateManager';

/**
 * DefeatScene - Displayed when the player dies during a run
 */
export class DefeatScene extends Phaser.Scene {
  private gameState!: GameStateManager;
  private killedBy?: string;

  constructor() {
    super({ key: 'DefeatScene' });
  }

  init(data: { gameState: GameStateManager; killedBy?: string }) {
    this.gameState = data.gameState;
    this.killedBy = data.killedBy || 'Unknown';
  }

  create(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Background with red tint
    this.add.rectangle(width / 2, height / 2, width, height, 0x1a0000, 1).setDepth(-1);

    // Defeat title with animation
    const defeatText = this.add.text(width / 2, 120, 'DEFEATED', {
      fontSize: '96px',
      color: '#ff0000',
      fontStyle: 'bold',
      fontFamily: 'monospace',
    });
    defeatText.setOrigin(0.5);
    defeatText.setAlpha(0);

    this.tweens.add({
      targets: defeatText,
      alpha: 1,
      duration: 1000,
      ease: 'Power2',
    });

    // Killed by
    this.add.text(width / 2, 220, `Killed by: ${this.killedBy}`, {
      fontSize: '28px',
      color: '#ffffff',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Run statistics
    this.displayRunStatistics(width, height);

    // Buttons
    this.createButtons(width, height);
  }

  /**
   * Display run statistics
   */
  private displayRunStatistics(width: number, height: number): void {
    const player = this.gameState.player;
    const startY = 300;
    const lineHeight = 40;

    // Section: Run Stats
    this.add.text(width / 2, startY, '═══ RUN SUMMARY ═══', {
      fontSize: '32px',
      color: '#ff6b6b',
      fontStyle: 'bold',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    const stats = [
      `Floor Reached: ${this.gameState.currentFloor}`,
      `Act: ${this.gameState.currentAct}`,
      `Gold Collected: ${player.gold}`,
      `Deck Size: ${player.deck.length} cards`,
      `Relics Obtained: ${player.relics.length}`,
    ];

    stats.forEach((stat, index) => {
      this.add.text(width / 2, startY + 60 + index * lineHeight, stat, {
        fontSize: '24px',
        color: '#cccccc',
        fontFamily: 'monospace',
      }).setOrigin(0.5);
    });

    // Section: Relics
    const relicsY = startY + 60 + stats.length * lineHeight + 40;
    this.add.text(width / 2, relicsY, '═══ RELICS COLLECTED ═══', {
      fontSize: '28px',
      color: '#ff6b6b',
      fontStyle: 'bold',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    if (player.relics.length > 0) {
      player.relics.slice(0, 5).forEach((relic, index) => {
        this.add.text(width / 2, relicsY + 50 + index * 35, `🏺 ${relic.name}`, {
          fontSize: '20px',
          color: '#ffffff',
          fontFamily: 'monospace',
        }).setOrigin(0.5);
      });

      if (player.relics.length > 5) {
        this.add.text(width / 2, relicsY + 50 + 5 * 35, `... and ${player.relics.length - 5} more`, {
          fontSize: '18px',
          color: '#888888',
          fontFamily: 'monospace',
        }).setOrigin(0.5);
      }
    } else {
      this.add.text(width / 2, relicsY + 50, 'No relics obtained', {
        fontSize: '20px',
        color: '#888888',
        fontFamily: 'monospace',
      }).setOrigin(0.5);
    }

    // Section: Deck Highlights
    const deckY = height - 250;
    this.add.text(width / 2, deckY, '═══ FINAL DECK ═══', {
      fontSize: '28px',
      color: '#ff6b6b',
      fontStyle: 'bold',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    const rareCards = player.deck.filter(c => c.rarity === 'RARE');
    const upgradedCards = player.deck.filter(c => c.upgraded);

    const deckStats = [
      `Total Cards: ${player.deck.length}`,
      `Upgraded Cards: ${upgradedCards.length}`,
      `Rare Cards: ${rareCards.length}`,
    ];

    deckStats.forEach((stat, index) => {
      this.add.text(width / 2, deckY + 50 + index * 30, stat, {
        fontSize: '20px',
        color: '#cccccc',
        fontFamily: 'monospace',
      }).setOrigin(0.5);
    });
  }

  /**
   * Create buttons
   */
  private createButtons(width: number, height: number): void {
    // Return to menu button
    const menuButton = this.add.text(width / 2, height - 80, 'Return to Menu', {
      fontSize: '32px',
      color: '#ffffff',
      fontStyle: 'bold',
      fontFamily: 'monospace',
      backgroundColor: '#8b0000',
      padding: { x: 40, y: 20 },
    });
    menuButton.setOrigin(0.5);
    menuButton.setInteractive({ useHandCursor: true });

    menuButton.on('pointerover', () => {
      menuButton.setStyle({ backgroundColor: '#ff0000', color: '#ffffff' });
      this.tweens.add({
        targets: menuButton,
        scale: 1.1,
        duration: 100,
      });
    });

    menuButton.on('pointerout', () => {
      menuButton.setStyle({ backgroundColor: '#8b0000', color: '#ffffff' });
      this.tweens.add({
        targets: menuButton,
        scale: 1.0,
        duration: 100,
      });
    });

    menuButton.on('pointerdown', () => {
      this.scene.start('MainMenuScene');
    });
  }
}
