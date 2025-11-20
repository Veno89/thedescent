import Phaser from 'phaser';
import { GameStateManager } from '@/systems/GameStateManager';
import { Card } from '@/types';

/**
 * RestScene handles rest site choices (Heal or Upgrade)
 */
export class RestScene extends Phaser.Scene {
  private gameState!: GameStateManager;
  private choiceMade: boolean = false;
  private selectedCardIndex: number = -1;

  constructor() {
    super({ key: 'RestScene' });
  }

  init(data: { gameState: GameStateManager; selectedCardIndex?: number; cancelled?: boolean }) {
    this.gameState = data.gameState;

    // Check if returning from CardSelectionScene
    if (data.selectedCardIndex !== undefined) {
      this.selectedCardIndex = data.selectedCardIndex;
      this.choiceMade = true;

      // Handle card upgrade if a card was selected
      if (!data.cancelled && this.selectedCardIndex >= 0) {
        const card = this.gameState.player.deck[this.selectedCardIndex];
        if (card && !card.upgraded) {
          card.upgraded = true;
          card.name = `${card.name}+`;
        }
      }
    } else {
      this.choiceMade = false;
      this.selectedCardIndex = -1;
    }
  }

  create(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a1a);

    // Title
    this.add.text(width / 2, 100, 'REST SITE', {
      fontSize: '48px',
      color: '#ffd700',
      fontStyle: 'bold',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    // If returning from card selection with a card upgraded
    if (this.choiceMade && this.selectedCardIndex >= 0) {
      const card = this.gameState.player.deck[this.selectedCardIndex];
      if (card) {
        // Show feedback
        const feedback = this.add.text(
          width / 2,
          300,
          `Upgraded ${card.name}!`,
          {
            fontSize: '32px',
            color: '#00ff00',
            fontStyle: 'bold',
            fontFamily: 'monospace',
          }
        );
        feedback.setOrigin(0.5);

        this.showContinueButton();
        return;
      }
    }

    // Show normal rest site UI if no choice made yet
    // Description
    this.add.text(width / 2, 180, 'Choose one:', {
      fontSize: '24px',
      color: '#ffffff',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Player stats
    const healAmount = Math.floor(this.gameState.player.maxHp * 0.3);
    const canHeal = this.gameState.player.currentHp < this.gameState.player.maxHp;
    const hasUpgradeableCards = this.getUpgradeableCards().length > 0;

    this.add.text(width / 2, 220, `Current HP: ${this.gameState.player.currentHp}/${this.gameState.player.maxHp}`, {
      fontSize: '20px',
      color: '#ff6b6b',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Heal option
    this.createOptionButton(
      width / 2 - 200,
      400,
      '🔥 Rest',
      `Heal ${healAmount} HP`,
      canHeal,
      () => this.onHealSelected(healAmount)
    );

    // Upgrade option
    this.createOptionButton(
      width / 2 + 200,
      400,
      '⚒️ Smith',
      'Upgrade a card',
      hasUpgradeableCards,
      () => this.onUpgradeSelected()
    );

    // Continue button (initially hidden, shows after selection)
  }

  /**
   * Create an option button
   */
  private createOptionButton(
    x: number,
    y: number,
    title: string,
    description: string,
    enabled: boolean,
    callback: () => void
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    // Background
    const bg = this.add.rectangle(0, 0, 300, 200, enabled ? 0x2a4a2a : 0x4a4a4a, 0.9);
    bg.setStrokeStyle(3, enabled ? 0x00ff00 : 0x666666);
    container.add(bg);

    // Title
    const titleText = this.add.text(0, -50, title, {
      fontSize: '32px',
      color: enabled ? '#ffffff' : '#888888',
      fontStyle: 'bold',
      fontFamily: 'monospace',
      align: 'center',
    });
    titleText.setOrigin(0.5);
    container.add(titleText);

    // Description
    const descText = this.add.text(0, 20, description, {
      fontSize: '18px',
      color: enabled ? '#cccccc' : '#666666',
      fontFamily: 'monospace',
      align: 'center',
      wordWrap: { width: 260 },
    });
    descText.setOrigin(0.5);
    container.add(descText);

    if (enabled) {
      bg.setInteractive({ useHandCursor: true });

      bg.on('pointerover', () => {
        bg.setStrokeStyle(4, 0xffff00);
        this.tweens.add({
          targets: container,
          scale: 1.05,
          duration: 100,
        });
      });

      bg.on('pointerout', () => {
        bg.setStrokeStyle(3, 0x00ff00);
        this.tweens.add({
          targets: container,
          scale: 1.0,
          duration: 100,
        });
      });

      bg.on('pointerdown', () => {
        callback();
        bg.disableInteractive();
      });
    }

    return container;
  }

  /**
   * Handle heal selection
   */
  private onHealSelected(amount: number): void {
    this.gameState.player.heal(amount);

    // Show feedback
    const feedback = this.add.text(
      this.cameras.main.width / 2,
      600,
      `Healed ${amount} HP!\nHP: ${this.gameState.player.currentHp}/${this.gameState.player.maxHp}`,
      {
        fontSize: '28px',
        color: '#00ff00',
        fontStyle: 'bold',
        fontFamily: 'monospace',
        align: 'center',
      }
    );
    feedback.setOrigin(0.5);

    this.showContinueButton();
  }

  /**
   * Handle upgrade selection
   */
  private onUpgradeSelected(): void {
    // Launch CardSelectionScene for the player to choose a card to upgrade
    this.scene.start('CardSelectionScene', {
      gameState: this.gameState,
      mode: 'UPGRADE',
      title: 'Upgrade a Card',
      description: 'Select a card to upgrade',
      returnScene: 'RestScene',
      returnData: { gameState: this.gameState },
      filter: (card: Card) => !card.upgraded,
      canCancel: true,
    });
  }

  /**
   * Get cards that can be upgraded
   */
  private getUpgradeableCards(): Card[] {
    return this.gameState.player.deck.filter(c => !c.upgraded);
  }

  /**
   * Show continue button
   */
  private showContinueButton(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const continueButton = this.add.text(
      width / 2,
      height - 100,
      'Continue',
      {
        fontSize: '32px',
        color: '#ffffff',
        fontFamily: 'monospace',
        backgroundColor: '#006400',
        padding: { x: 30, y: 15 },
      }
    );
    continueButton.setOrigin(0.5);
    continueButton.setInteractive({ useHandCursor: true });

    continueButton.on('pointerover', () => {
      continueButton.setStyle({ backgroundColor: '#228b22' });
    });

    continueButton.on('pointerout', () => {
      continueButton.setStyle({ backgroundColor: '#006400' });
    });

    continueButton.on('pointerdown', () => {
      this.scene.start('MapScene', { gameState: this.gameState });
    });
  }
}
