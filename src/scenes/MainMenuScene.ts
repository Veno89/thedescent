import Phaser from 'phaser';
import { DataLoader } from '@/utils/DataLoader';
import { UnlockSystem } from '@/systems/UnlockSystem';
import { UICard } from '@/ui/UICard';
import { Button } from '@/ui/Button';
import { Theme } from '@/ui/theme';

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenuScene' });
  }

  create(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Background gradient effect
    const bgGraphics = this.add.graphics();
    bgGraphics.fillGradientStyle(
      Theme.helpers.hexToColor(Theme.colors.background),
      Theme.helpers.hexToColor(Theme.colors.background),
      Theme.helpers.hexToColor(Theme.colors.backgroundLight),
      Theme.helpers.hexToColor(Theme.colors.backgroundLight),
      1,
      1,
      1,
      1
    );
    bgGraphics.fillRect(0, 0, width, height);

    // Title
    const title = this.add.text(width / 2, height / 4, 'THE DESCENT', {
      ...Theme.typography.styles.title,
      fontSize: '96px',
    });
    title.setOrigin(0.5);

    // Add pulsing animation to title
    this.tweens.add({
      targets: title,
      scale: { from: 1, to: 1.05 },
      duration: 2000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });

    // Subtitle
    const subtitle = this.add.text(
      width / 2,
      height / 4 + Theme.spacing.xxxl + Theme.spacing.lg,
      'A Deck-Building Roguelike',
      {
        ...Theme.typography.styles.large,
        color: Theme.colors.gold,
      }
    );
    subtitle.setOrigin(0.5);

    // Main menu card
    const menuCard = new UICard({
      scene: this,
      x: width / 2,
      y: height / 2 + Theme.spacing.xxxl,
      width: 500,
      height: 400,
      backgroundColor: Theme.helpers.hexToColor(Theme.colors.backgroundLight),
      borderColor: Theme.helpers.hexToColor(Theme.colors.primary),
      alpha: 0.95,
    });

    // Menu buttons
    const buttonSpacing = Theme.spacing.xxxl + Theme.spacing.md;
    const startY = -menuCard.height / 2 + Theme.spacing.xxxl * 2;

    new Button({
      scene: this,
      x: menuCard.x,
      y: menuCard.y + startY,
      text: '⚔️  START NEW RUN',
      width: 400,
      style: 'primary',
      onClick: () => this.startNewRun(),
    });

    const continueButton = new Button({
      scene: this,
      x: menuCard.x,
      y: menuCard.y + startY + buttonSpacing,
      text: '📜  CONTINUE',
      width: 400,
      style: 'secondary',
      onClick: () => this.continueRun(),
    });
    continueButton.disable(); // Disabled until save system is implemented

    new Button({
      scene: this,
      x: menuCard.x,
      y: menuCard.y + startY + buttonSpacing * 2,
      text: '⚙️  SETTINGS',
      width: 400,
      style: 'secondary',
      onClick: () => this.openSettings(),
    });

    // Info card (stats/achievements preview)
    const infoCard = new UICard({
      scene: this,
      x: width - 250,
      y: height / 2,
      width: 400,
      height: 300,
      title: 'STATISTICS',
      backgroundColor: Theme.helpers.hexToColor(Theme.colors.backgroundLight),
      borderColor: Theme.helpers.hexToColor(Theme.colors.gold),
      alpha: 0.9,
    });

    UnlockSystem.initialize();
    const stats = UnlockSystem.getStats();
    const statsY = infoCard.getContentStartY();

    infoCard.addText(
      `Runs Started: ${stats.runsAttempted}`,
      -infoCard.width / 2 + Theme.spacing.lg,
      statsY,
      Theme.typography.styles.body
    );

    infoCard.addText(
      `Victories: ${stats.runsCompleted}`,
      -infoCard.width / 2 + Theme.spacing.lg,
      statsY + Theme.spacing.xl,
      {
        ...Theme.typography.styles.body,
        color: Theme.colors.success,
      }
    );

    const defeats = stats.runsAttempted - stats.runsCompleted;
    infoCard.addText(
      `Defeats: ${defeats}`,
      -infoCard.width / 2 + Theme.spacing.lg,
      statsY + Theme.spacing.xl * 2,
      {
        ...Theme.typography.styles.body,
        color: Theme.colors.danger,
      }
    );

    const winRate =
      stats.runsAttempted > 0
        ? Math.round((stats.runsCompleted / stats.runsAttempted) * 100)
        : 0;

    infoCard.addText(
      `Win Rate: ${winRate}%`,
      -infoCard.width / 2 + Theme.spacing.lg,
      statsY + Theme.spacing.xl * 3,
      {
        ...Theme.typography.styles.body,
        color: Theme.colors.gold,
      }
    );

    // Version number
    this.add.text(width - Theme.spacing.lg, height - Theme.spacing.lg, 'v0.1.0', {
      ...Theme.typography.styles.small,
      color: Theme.colors.textMuted,
    }).setOrigin(1);

    // Credits
    this.add.text(
      Theme.spacing.lg,
      height - Theme.spacing.lg,
      'Press ESC to exit game',
      {
        ...Theme.typography.styles.small,
        color: Theme.colors.textMuted,
      }
    ).setOrigin(0, 1);

    // Fade in animation
    this.cameras.main.fadeIn(Theme.animation.slow);
  }

  startNewRun(): void {
    console.log('Starting new run...');

    // Initialize data
    DataLoader.initialize();
    UnlockSystem.initialize();

    // Record run start
    UnlockSystem.recordRunStart();

    // Go to character selection
    this.scene.start('CharacterSelectionScene');
  }

  continueRun(): void {
    console.log('Continuing run...');
    // TODO: Load saved game state
  }

  openSettings(): void {
    console.log('Opening settings...');
    // TODO: Open settings menu
  }
}
