import Phaser from 'phaser';
import { GameStateManager } from '@/systems/GameStateManager';
import { Card } from '@/types';
import { Button } from '@/ui/Button';
import { UICard } from '@/ui/UICard';
import { Theme } from '@/ui/theme';

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
    this.add.rectangle(
      width / 2,
      height / 2,
      width,
      height,
      Theme.helpers.hexToColor(Theme.colors.background)
    ).setDepth(Theme.layers.background);

    // Title
    this.add.text(
      Theme.layout.getCenterX(width),
      Theme.layout.positions.topMargin,
      'REST SITE',
      Theme.typography.styles.heading1
    ).setOrigin(0.5).setDepth(Theme.layers.ui);

    // If returning from card selection with a card upgraded
    if (this.choiceMade && this.selectedCardIndex >= 0) {
      const card = this.gameState.player.deck[this.selectedCardIndex];
      if (card) {
        // Show feedback
        const feedback = this.add.text(
          Theme.layout.getCenterX(width),
          Theme.layout.getCenterY(height),
          `Upgraded ${card.name}!`,
          {
            ...Theme.typography.styles.heading2,
            color: Theme.colors.successLight,
          }
        );
        feedback.setOrigin(0.5);
        feedback.setDepth(Theme.layers.ui);

        this.showContinueButton();
        return;
      }
    }

    // Show normal rest site UI if no choice made yet
    const descY = Theme.layout.positions.topMargin + Theme.spacing.xxxl + Theme.spacing.lg;

    // Description
    this.add.text(
      Theme.layout.getCenterX(width),
      descY,
      'Choose one:',
      {
        ...Theme.typography.styles.heading3,
        color: Theme.colors.text,
      }
    ).setOrigin(0.5).setDepth(Theme.layers.ui);

    // Player stats
    const healAmount = Math.floor(this.gameState.player.maxHp * 0.3);
    const canHeal = this.gameState.player.currentHp < this.gameState.player.maxHp;
    const hasUpgradeableCards = this.getUpgradeableCards().length > 0;

    this.add.text(
      Theme.layout.getCenterX(width),
      descY + Theme.spacing.xl + Theme.spacing.md,
      `Current HP: ${this.gameState.player.currentHp}/${this.gameState.player.maxHp}`,
      {
        ...Theme.typography.styles.body,
        color: Theme.colors.danger,
      }
    ).setOrigin(0.5).setDepth(Theme.layers.ui);

    // Options positioned side by side with proper spacing
    const optionsY = Theme.layout.getCenterY(height);
    const optionSpacing = 300;

    // Heal option
    this.createOptionCard(
      Theme.layout.getCenterX(width) - optionSpacing,
      optionsY,
      '🔥 Rest',
      `Heal ${healAmount} HP`,
      canHeal,
      () => this.onHealSelected(healAmount)
    );

    // Upgrade option
    this.createOptionCard(
      Theme.layout.getCenterX(width) + optionSpacing,
      optionsY,
      '⚒️ Smith',
      'Upgrade a card',
      hasUpgradeableCards,
      () => this.onUpgradeSelected()
    );
  }

  /**
   * Create an option card using UICard component
   */
  private createOptionCard(
    x: number,
    y: number,
    title: string,
    description: string,
    enabled: boolean,
    callback: () => void
  ): UICard {
    const card = new UICard({
      scene: this,
      x,
      y,
      width: 320,
      height: 220,
      title: title,
      backgroundColor: enabled
        ? Theme.helpers.hexToColor(Theme.colors.rest)
        : Theme.helpers.hexToColor(Theme.colors.disabled),
      borderColor: enabled
        ? Theme.helpers.hexToColor(Theme.colors.successLight)
        : Theme.helpers.hexToColor(Theme.colors.border),
      alpha: enabled ? 0.95 : 0.6,
    });

    // Add description text
    const descY = card.getContentStartY() + Theme.spacing.lg;
    card.addText(
      description,
      0,
      descY,
      {
        ...Theme.typography.styles.body,
        color: enabled ? Theme.colors.textSecondary : Theme.colors.textMuted,
        align: 'center',
      }
    ).setOrigin(0.5, 0);

    // Make interactive if enabled
    if (enabled) {
      card.setInteractive(new Phaser.Geom.Rectangle(-160, -110, 320, 220), Phaser.Geom.Rectangle.Contains);
      card.input!.cursor = 'pointer';

      card.on('pointerover', () => {
        card.setBorderColor(Theme.helpers.hexToColor(Theme.colors.hover));
        this.tweens.add({
          targets: card,
          scale: 1.05,
          duration: Theme.animation.fast,
          ease: 'Power2',
        });
      });

      card.on('pointerout', () => {
        card.setBorderColor(Theme.helpers.hexToColor(Theme.colors.successLight));
        this.tweens.add({
          targets: card,
          scale: 1.0,
          duration: Theme.animation.fast,
          ease: 'Power2',
        });
      });

      card.on('pointerdown', () => {
        callback();
        card.disableInteractive();
      });
    }

    return card;
  }

  /**
   * Handle heal selection
   */
  private onHealSelected(amount: number): void {
    this.gameState.player.heal(amount);

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Show feedback
    const feedback = this.add.text(
      Theme.layout.getCenterX(width),
      height - Theme.spacing.xxxl * 3,
      `Healed ${amount} HP!\nHP: ${this.gameState.player.currentHp}/${this.gameState.player.maxHp}`,
      {
        ...Theme.typography.styles.heading2,
        color: Theme.colors.successLight,
        align: 'center',
      }
    );
    feedback.setOrigin(0.5);
    feedback.setDepth(Theme.layers.ui);

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

    new Button({
      scene: this,
      x: Theme.layout.getCenterX(width),
      y: height - Theme.layout.positions.bottomMargin,
      text: 'Continue',
      width: 250,
      height: Theme.dimensions.button.height + 10,
      style: 'success',
      onClick: () => {
        this.scene.start('MapScene', { gameState: this.gameState });
      },
    });
  }
}
