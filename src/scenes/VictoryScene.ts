import Phaser from 'phaser';
import { GameStateManager } from '@/systems/GameStateManager';

/**
 * VictoryScene - Displayed when the player completes a run by defeating the boss
 */
export class VictoryScene extends Phaser.Scene {
  private gameState!: GameStateManager;

  constructor() {
    super({ key: 'VictoryScene' });
  }

  init(data: { gameState: GameStateManager }) {
    this.gameState = data.gameState;
  }

  create(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x0a0a0a, 1).setDepth(-1);

    // Victory title with animation
    const victoryText = this.add.text(width / 2, 120, 'VICTORY!', {
      fontSize: '96px',
      color: '#ffd700',
      fontStyle: 'bold',
      fontFamily: 'monospace',
    });
    victoryText.setOrigin(0.5);
    victoryText.setAlpha(0);

    this.tweens.add({
      targets: victoryText,
      alpha: 1,
      scale: { from: 0.5, to: 1 },
      duration: 1000,
      ease: 'Bounce.easeOut',
    });

    // Subtitle
    this.add.text(width / 2, 220, 'You have conquered The Descent!', {
      fontSize: '28px',
      color: '#ffffff',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Run statistics
    this.displayRunStatistics(width, height);

    // Return to menu button
    this.createReturnButton(width, height);
  }

  /**
   * Display run statistics
   */
  private displayRunStatistics(width: number, height: number): void {
    const player = this.gameState.player;
    const startY = 300;
    const lineHeight = 40;

    // Section: Run Stats
    this.add.text(width / 2, startY, '═══ RUN STATISTICS ═══', {
      fontSize: '32px',
      color: '#ffd700',
      fontStyle: 'bold',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    const stats = [
      `Floor Reached: ${this.gameState.currentFloor}`,
      `Act: ${this.gameState.currentAct}`,
      `Final HP: ${player.currentHp} / ${player.maxHp}`,
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
    this.add.text(width / 2, relicsY, '═══ RELICS ═══', {
      fontSize: '28px',
      color: '#ffd700',
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
      color: '#ffd700',
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
   * Create return to menu button
   */
  private createReturnButton(width: number, height: number): void {
    const button = this.add.text(width / 2, height - 80, 'Return to Menu', {
      fontSize: '32px',
      color: '#ffffff',
      fontStyle: 'bold',
      fontFamily: 'monospace',
      backgroundColor: '#006400',
      padding: { x: 40, y: 20 },
    });
    button.setOrigin(0.5);
    button.setInteractive({ useHandCursor: true });

    button.on('pointerover', () => {
      button.setStyle({ backgroundColor: '#228b22', color: '#ffd700' });
      this.tweens.add({
        targets: button,
        scale: 1.1,
        duration: 100,
      });
    });

    button.on('pointerout', () => {
      button.setStyle({ backgroundColor: '#006400', color: '#ffffff' });
      this.tweens.add({
        targets: button,
        scale: 1.0,
        duration: 100,
      });
    });

    button.on('pointerdown', () => {
      this.scene.start('MainMenuScene');
    });
  }
}
