import Phaser from 'phaser';
import { Theme } from '@/ui/theme';
import { UICard } from '@/ui/UICard';
import { Button } from '@/ui/Button';

/**
 * OptionsScene - Settings/Options overlay during gameplay
 */
export class OptionsScene extends Phaser.Scene {
  private returnScene: string = 'MainMenuScene';

  constructor() {
    super({ key: 'OptionsScene' });
  }

  init(data: { returnScene?: string }) {
    this.returnScene = data.returnScene || 'MainMenuScene';
  }

  create(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Semi-transparent overlay background
    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.7);
    overlay.setOrigin(0, 0);
    overlay.setInteractive(); // Prevent clicks from passing through

    // Options card (center of screen)
    const optionsCard = new UICard({
      scene: this,
      x: width / 2,
      y: height / 2,
      width: 500,
      height: 400,
      title: 'OPTIONS',
      backgroundColor: Theme.helpers.hexToColor(Theme.colors.backgroundLight),
      borderColor: Theme.helpers.hexToColor(Theme.colors.gold),
      alpha: 0.95,
    });

    const contentStartY = optionsCard.getContentStartY();

    // Info text
    optionsCard.addText(
      'Game Options',
      0,
      contentStartY + Theme.spacing.md,
      {
        ...Theme.typography.styles.body,
        color: Theme.colors.textSecondary,
        align: 'center',
      }
    ).setOrigin(0.5, 0);

    // Close button
    new Button({
      scene: this,
      x: width / 2,
      y: height / 2 + contentStartY + Theme.spacing.xxxl * 2,
      text: 'CLOSE',
      width: 300,
      height: Theme.dimensions.button.height,
      style: 'primary',
      onClick: () => this.closeOverlay(),
    });

    // Return to Menu button (only show if not already in main menu)
    if (this.returnScene !== 'MainMenuScene') {
      new Button({
        scene: this,
        x: width / 2,
        y: height / 2 + contentStartY + Theme.spacing.xxxl * 3,
        text: 'RETURN TO MENU',
        width: 300,
        height: Theme.dimensions.button.height,
        style: 'danger',
        onClick: () => this.returnToMainMenu(),
      });
    }

    // ESC key to close
    this.input.keyboard?.on('keydown-ESC', () => {
      this.closeOverlay();
    });

    // Close button (X in top-right corner of card)
    const closeX = this.add.text(
      width / 2 + 230,
      height / 2 - 180,
      '✖️',
      {
        fontSize: '36px',
        color: Theme.colors.text,
        fontFamily: 'monospace',
      }
    );
    closeX.setInteractive({ useHandCursor: true });
    closeX.setDepth(1000);
    closeX.on('pointerover', () => {
      closeX.setColor(Theme.colors.danger);
      closeX.setScale(1.1);
    });
    closeX.on('pointerout', () => {
      closeX.setColor(Theme.colors.text);
      closeX.setScale(1);
    });
    closeX.on('pointerdown', () => {
      this.closeOverlay();
    });
  }

  /**
   * Close the overlay and return to the previous scene
   */
  private closeOverlay(): void {
    this.scene.stop();
    this.scene.resume(this.returnScene);
  }

  /**
   * Return to main menu (abandoning current run)
   */
  private returnToMainMenu(): void {
    // Stop all scenes and start main menu
    this.scene.stop();
    this.scene.stop(this.returnScene);
    this.scene.start('MainMenuScene');
  }
}
