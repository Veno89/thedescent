import Phaser from 'phaser';
import { Relic } from '@/entities/Relic';

/**
 * Visual representation of a relic in Phaser
 */
export class RelicSprite extends Phaser.GameObjects.Container {
  private relic: Relic;
  private background!: Phaser.GameObjects.Rectangle;

  private readonly RELIC_SIZE = 60;

  constructor(scene: Phaser.Scene, x: number, y: number, relic: Relic) {
    super(scene, x, y);
    this.relic = relic;

    this.createRelic();
    this.setupInteraction();

    scene.add.existing(this);
  }

  /**
   * Create the visual relic elements
   */
  private createRelic(): void {
    // Relic background (square with border)
    const bgColor = this.getRelicColor();
    this.background = this.scene.add.rectangle(
      0,
      0,
      this.RELIC_SIZE,
      this.RELIC_SIZE,
      bgColor,
      1
    );
    this.background.setStrokeStyle(2, 0xffd700); // Gold border
    this.add(this.background);

    // Relic icon placeholder
    const iconText = this.scene.add.text(0, 0, '🔮', {
      fontSize: '32px',
      fontFamily: 'monospace',
    });
    iconText.setOrigin(0.5);
    this.add(iconText);

    // Counter display (for relics that count)
    if (this.relic.counter > 0) {
      const counterText = this.scene.add.text(
        this.RELIC_SIZE / 2 - 5,
        -this.RELIC_SIZE / 2 + 5,
        this.relic.counter.toString(),
        {
          fontSize: '14px',
          color: '#ffffff',
          fontStyle: 'bold',
          fontFamily: 'monospace',
          backgroundColor: '#000000',
          padding: { x: 3, y: 2 },
        }
      );
      counterText.setOrigin(1, 0);
      this.add(counterText);
    }
  }

  /**
   * Get relic background color based on rarity
   */
  private getRelicColor(): number {
    switch (this.relic.rarity) {
      case 'STARTER':
        return 0x4a4a4a; // Gray
      case 'COMMON':
        return 0x5a5a5a; // Light gray
      case 'UNCOMMON':
        return 0x4169e1; // Royal blue
      case 'RARE':
        return 0x9932cc; // Dark orchid
      default:
        return 0x333333;
    }
  }

  /**
   * Setup relic interaction (hover for tooltip)
   */
  private setupInteraction(): void {
    this.setSize(this.RELIC_SIZE, this.RELIC_SIZE);
    this.setInteractive({ useHandCursor: true });

    // Hover effects
    this.on('pointerover', () => {
      this.background.setStrokeStyle(3, 0xffff00); // Yellow highlight
      this.setScale(1.1);
      this.setDepth(100);

      // Show tooltip
      this.showTooltip();
    });

    this.on('pointerout', () => {
      this.background.setStrokeStyle(2, 0xffd700); // Gold border
      this.setScale(1.0);
      this.setDepth(0);

      // Hide tooltip
      this.hideTooltip();
    });
  }

  /**
   * Show tooltip with relic info
   */
  private showTooltip(): void {
    const tooltipWidth = 250;
    const tooltipX = this.x + this.RELIC_SIZE / 2 + 10;
    const tooltipY = this.y;

    // Create tooltip background
    const tooltip = this.scene.add.rectangle(
      tooltipX + tooltipWidth / 2,
      tooltipY,
      tooltipWidth,
      100,
      0x000000,
      0.9
    );
    tooltip.setStrokeStyle(2, 0xffd700);
    tooltip.setName('relicTooltip');
    tooltip.setDepth(150);

    // Relic name
    const nameText = this.scene.add.text(
      tooltipX + 10,
      tooltipY - 40,
      this.relic.name,
      {
        fontSize: '16px',
        color: '#ffd700',
        fontStyle: 'bold',
        fontFamily: 'monospace',
      }
    );
    nameText.setName('relicTooltip');
    nameText.setDepth(150);

    // Relic description
    const descText = this.scene.add.text(
      tooltipX + 10,
      tooltipY - 15,
      this.relic.description,
      {
        fontSize: '12px',
        color: '#ffffff',
        fontFamily: 'monospace',
        wordWrap: { width: tooltipWidth - 20 },
      }
    );
    descText.setName('relicTooltip');
    descText.setDepth(150);

    // Adjust tooltip height based on text
    const textHeight = Math.max(100, descText.height + 60);
    tooltip.setSize(tooltipWidth, textHeight);
    tooltip.y = tooltipY + textHeight / 2 - 50;
    nameText.y = tooltip.y - textHeight / 2 + 10;
    descText.y = nameText.y + 20;
  }

  /**
   * Hide tooltip
   */
  private hideTooltip(): void {
    // Remove all tooltip elements
    this.scene.children.list
      .filter((child: any) => child.name === 'relicTooltip')
      .forEach((child) => child.destroy());
  }

  /**
   * Update counter display
   */
  updateCounter(): void {
    // Remove and recreate the relic to show updated counter
    this.removeAll(true);
    this.createRelic();
  }

  /**
   * Get the relic data
   */
  getRelic(): Relic {
    return this.relic;
  }
}
