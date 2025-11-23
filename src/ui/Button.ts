import Phaser from 'phaser';
import { Theme } from './theme';

export interface ButtonConfig {
  scene: Phaser.Scene;
  x: number;
  y: number;
  text: string;
  width?: number;
  height?: number;
  style?: 'primary' | 'secondary' | 'success' | 'danger';
  onClick?: () => void;
}

/**
 * Button - Reusable button component with proper states
 * Supports hover, pressed, and disabled states
 */
export class Button extends Phaser.GameObjects.Container {
  private background: Phaser.GameObjects.Graphics;
  private buttonText: Phaser.GameObjects.Text;
  private config: ButtonConfig;
  private isEnabled: boolean = true;

  constructor(config: ButtonConfig) {
    super(config.scene, config.x, config.y);
    this.config = config;
    this.scene.add.existing(this);

    const width = config.width ?? Theme.dimensions.button.minWidth;
    const height = config.height ?? Theme.dimensions.button.height;
    const style = config.style ?? 'primary';

    // Create background
    this.background = this.scene.add.graphics();
    this.add(this.background);

    // Create text
    this.buttonText = this.scene.add.text(0, 0, config.text, {
      ...Theme.typography.styles.body,
      align: 'center',
    });
    this.buttonText.setOrigin(0.5, 0.5);
    this.add(this.buttonText);

    // Draw initial state
    this.drawButton(this.getNormalColor(style), this.getNormalBorderColor(style));

    // Make interactive
    this.setSize(width, height);
    this.setInteractive(
      new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height),
      Phaser.Geom.Rectangle.Contains
    );

    // Event handlers
    this.on('pointerover', this.onHover, this);
    this.on('pointerout', this.onOut, this);
    this.on('pointerdown', this.onDown, this);
    this.on('pointerup', this.onUp, this);

    this.setDepth(Theme.layers.ui);
  }

  private getNormalColor(style: string): number {
    switch (style) {
      case 'primary':
        return Theme.helpers.hexToColor(Theme.colors.primary);
      case 'secondary':
        return Theme.helpers.hexToColor(Theme.colors.backgroundLight);
      case 'success':
        return Theme.helpers.hexToColor(Theme.colors.success);
      case 'danger':
        return Theme.helpers.hexToColor(Theme.colors.danger);
      default:
        return Theme.helpers.hexToColor(Theme.colors.primary);
    }
  }

  private getNormalBorderColor(style: string): number {
    switch (style) {
      case 'primary':
        return Theme.helpers.hexToColor(Theme.colors.primaryLight);
      case 'secondary':
        return Theme.helpers.hexToColor(Theme.colors.border);
      case 'success':
        return Theme.helpers.hexToColor(Theme.colors.successLight);
      case 'danger':
        return Theme.helpers.hexToColor(Theme.colors.danger);
      default:
        return Theme.helpers.hexToColor(Theme.colors.primaryLight);
    }
  }

  private getHoverColor(style: string): number {
    switch (style) {
      case 'primary':
        return Theme.helpers.hexToColor(Theme.colors.primaryLight);
      case 'secondary':
        return Theme.helpers.hexToColor(Theme.colors.border);
      case 'success':
        return Theme.helpers.hexToColor(Theme.colors.successLight);
      case 'danger':
        return Theme.helpers.hexToColor('#ff4444');
      default:
        return Theme.helpers.hexToColor(Theme.colors.primaryLight);
    }
  }

  private drawButton(fillColor: number, borderColor: number, pressed: boolean = false): void {
    const width = this.config.width ?? Theme.dimensions.button.minWidth;
    const height = this.config.height ?? Theme.dimensions.button.height;
    const cornerRadius = Theme.dimensions.button.cornerRadius;
    const borderWidth = Theme.dimensions.button.borderWidth;

    this.background.clear();
    this.background.lineStyle(borderWidth, borderColor);
    this.background.fillStyle(fillColor, 0.9);

    // Offset for pressed state
    const offsetY = pressed ? 2 : 0;

    this.background.fillRoundedRect(
      -width / 2,
      -height / 2 + offsetY,
      width,
      height,
      cornerRadius
    );
    this.background.strokeRoundedRect(
      -width / 2,
      -height / 2 + offsetY,
      width,
      height,
      cornerRadius
    );

    // Update text position for pressed state
    this.buttonText.setY(offsetY);
  }

  private onHover(): void {
    if (!this.isEnabled) return;

    const style = this.config.style ?? 'primary';
    this.drawButton(
      this.getHoverColor(style),
      Theme.helpers.hexToColor(Theme.colors.hover)
    );

    this.scene.tweens.add({
      targets: this,
      scale: Theme.effects.buttonHover.scale,
      duration: Theme.effects.buttonHover.duration,
      ease: 'Power2',
    });
  }

  private onOut(): void {
    if (!this.isEnabled) return;

    const style = this.config.style ?? 'primary';
    this.drawButton(this.getNormalColor(style), this.getNormalBorderColor(style));

    this.scene.tweens.add({
      targets: this,
      scale: 1,
      duration: Theme.effects.buttonHover.duration,
      ease: 'Power2',
    });
  }

  private onDown(): void {
    if (!this.isEnabled) return;

    const style = this.config.style ?? 'primary';
    this.drawButton(
      this.getNormalColor(style),
      Theme.helpers.hexToColor(Theme.colors.active),
      true
    );
  }

  private onUp(): void {
    if (!this.isEnabled) return;

    const style = this.config.style ?? 'primary';
    this.drawButton(
      this.getHoverColor(style),
      Theme.helpers.hexToColor(Theme.colors.hover)
    );

    // Execute callback
    if (this.config.onClick) {
      this.config.onClick();
    }
  }

  /**
   * Disable the button (gray out and make non-interactive)
   */
  disable(): void {
    this.isEnabled = false;
    this.disableInteractive();
    this.drawButton(
      Theme.helpers.hexToColor(Theme.colors.disabled),
      Theme.helpers.hexToColor(Theme.colors.disabled)
    );
    this.buttonText.setColor(Theme.colors.textMuted);
    this.setAlpha(0.6);
  }

  /**
   * Enable the button
   */
  enable(): void {
    this.isEnabled = true;
    this.setInteractive();
    const style = this.config.style ?? 'primary';
    this.drawButton(this.getNormalColor(style), this.getNormalBorderColor(style));
    this.buttonText.setColor(Theme.colors.text);
    this.setAlpha(1);
  }

  /**
   * Update button text
   */
  setText(text: string): void {
    this.buttonText.setText(text);
  }

  /**
   * Update callback
   */
  setCallback(callback: () => void): void {
    this.config.onClick = callback;
  }
}
