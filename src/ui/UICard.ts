import Phaser from 'phaser';
import { Theme } from './theme';

export interface UICardConfig {
  scene: Phaser.Scene;
  x: number;
  y: number;
  width: number;
  height: number;
  title?: string;
  backgroundColor?: number;
  borderColor?: number;
  borderWidth?: number;
  cornerRadius?: number;
  padding?: number;
  alpha?: number;
}

/**
 * UICard - Reusable card/panel component for organizing UI elements
 * Provides consistent styling and visual grouping
 */
export class UICard extends Phaser.GameObjects.Container {
  private background: Phaser.GameObjects.Graphics;
  private titleText?: Phaser.GameObjects.Text;
  private config: UICardConfig;
  private contentY: number;

  constructor(config: UICardConfig) {
    super(config.scene, config.x, config.y);
    this.config = config;
    this.scene.add.existing(this);

    // Set default values
    const backgroundColor = config.backgroundColor ?? Theme.helpers.hexToColor(Theme.colors.backgroundLight);
    const borderColor = config.borderColor ?? Theme.helpers.hexToColor(Theme.colors.border);
    const borderWidth = config.borderWidth ?? Theme.dimensions.panel.borderWidth;
    const cornerRadius = config.cornerRadius ?? Theme.dimensions.panel.cornerRadius;
    const padding = config.padding ?? Theme.dimensions.panel.padding;

    // Create background with border
    this.background = this.scene.add.graphics();
    this.background.lineStyle(borderWidth, borderColor);
    this.background.fillStyle(backgroundColor, config.alpha ?? 0.9);
    this.background.fillRoundedRect(
      -config.width / 2,
      -config.height / 2,
      config.width,
      config.height,
      cornerRadius
    );
    this.background.strokeRoundedRect(
      -config.width / 2,
      -config.height / 2,
      config.width,
      config.height,
      cornerRadius
    );
    this.add(this.background);

    // Add title if provided
    if (config.title) {
      this.titleText = this.scene.add.text(
        0,
        -config.height / 2 + padding,
        config.title,
        {
          ...Theme.typography.styles.heading3,
          align: 'center',
        }
      );
      this.titleText.setOrigin(0.5, 0);
      this.add(this.titleText);
      this.contentY = -config.height / 2 + padding + this.titleText.height + Theme.spacing.md;
    } else {
      this.contentY = -config.height / 2 + padding;
    }

    this.setDepth(Theme.layers.panels);
  }

  /**
   * Get the Y position where content should start
   * (below title if present, otherwise at top with padding)
   */
  getContentStartY(): number {
    return this.contentY;
  }

  /**
   * Add a child element to the card at a specific position
   */
  addContent(element: Phaser.GameObjects.GameObject, x: number, y: number): void {
    this.add(element);
    if ('setPosition' in element && typeof (element as any).setPosition === 'function') {
      (element as any).setPosition(x, y);
    }
  }

  /**
   * Add a text element to the card
   */
  addText(text: string, x: number, y: number, style?: any): Phaser.GameObjects.Text {
    const textObj = this.scene.add.text(x, y, text, style ?? Theme.typography.styles.body);
    this.add(textObj);
    return textObj;
  }

  /**
   * Update the background color (e.g., for hover effects)
   */
  setBackgroundColor(color: number, alpha?: number): void {
    const borderColor = this.config.borderColor ?? Theme.helpers.hexToColor(Theme.colors.border);
    const borderWidth = this.config.borderWidth ?? Theme.dimensions.panel.borderWidth;
    const cornerRadius = this.config.cornerRadius ?? Theme.dimensions.panel.cornerRadius;

    this.background.clear();
    this.background.lineStyle(borderWidth, borderColor);
    this.background.fillStyle(color, alpha ?? this.config.alpha ?? 0.9);
    this.background.fillRoundedRect(
      -this.config.width / 2,
      -this.config.height / 2,
      this.config.width,
      this.config.height,
      cornerRadius
    );
    this.background.strokeRoundedRect(
      -this.config.width / 2,
      -this.config.height / 2,
      this.config.width,
      this.config.height,
      cornerRadius
    );
  }

  /**
   * Update the border color (e.g., for hover/active states)
   */
  setBorderColor(color: number): void {
    const backgroundColor = this.config.backgroundColor ?? Theme.helpers.hexToColor(Theme.colors.backgroundLight);
    const borderWidth = this.config.borderWidth ?? Theme.dimensions.panel.borderWidth;
    const cornerRadius = this.config.cornerRadius ?? Theme.dimensions.panel.cornerRadius;

    this.background.clear();
    this.background.lineStyle(borderWidth, color);
    this.background.fillStyle(backgroundColor, this.config.alpha ?? 0.9);
    this.background.fillRoundedRect(
      -this.config.width / 2,
      -this.config.height / 2,
      this.config.width,
      this.config.height,
      cornerRadius
    );
    this.background.strokeRoundedRect(
      -this.config.width / 2,
      -this.config.height / 2,
      this.config.width,
      this.config.height,
      cornerRadius
    );
  }

  /**
   * Make the card interactive with hover effects
   */
  makeInteractive(callback?: () => void): void {
    this.setSize(this.config.width, this.config.height);
    this.setInteractive(
      new Phaser.Geom.Rectangle(
        -this.config.width / 2,
        -this.config.height / 2,
        this.config.width,
        this.config.height
      ),
      Phaser.Geom.Rectangle.Contains
    );

    // Hover effects
    this.on('pointerover', () => {
      this.setBorderColor(Theme.helpers.hexToColor(Theme.colors.hover));
      this.scene.tweens.add({
        targets: this,
        scale: 1.02,
        duration: Theme.animation.fast,
        ease: 'Power2',
      });
    });

    this.on('pointerout', () => {
      this.setBorderColor(
        this.config.borderColor ?? Theme.helpers.hexToColor(Theme.colors.border)
      );
      this.scene.tweens.add({
        targets: this,
        scale: 1,
        duration: Theme.animation.fast,
        ease: 'Power2',
      });
    });

    // Click callback
    if (callback) {
      this.on('pointerdown', callback);
    }
  }

  /**
   * Disable the card (gray out and make non-interactive)
   */
  disable(): void {
    this.setBackgroundColor(Theme.helpers.hexToColor(Theme.colors.disabled), 0.5);
    this.setBorderColor(Theme.helpers.hexToColor(Theme.colors.disabled));
    this.disableInteractive();
    this.setAlpha(0.6);
  }

  /**
   * Enable the card
   */
  enable(): void {
    this.setBackgroundColor(
      this.config.backgroundColor ?? Theme.helpers.hexToColor(Theme.colors.backgroundLight)
    );
    this.setBorderColor(
      this.config.borderColor ?? Theme.helpers.hexToColor(Theme.colors.border)
    );
    this.setAlpha(1);
  }
}
