import Phaser from 'phaser';
import { Theme } from './theme';

export interface ProgressBarConfig {
  scene: Phaser.Scene;
  x: number;
  y: number;
  width?: number;
  height?: number;
  barColor?: number;
  backgroundColor?: number;
  borderColor?: number;
  showLabel?: boolean;
  labelStyle?: 'value' | 'percentage' | 'both';
}

/**
 * ProgressBar - Reusable progress bar component for HP, energy, etc.
 * Supports smooth animations and labels
 */
export class ProgressBar extends Phaser.GameObjects.Container {
  private background: Phaser.GameObjects.Graphics;
  private bar: Phaser.GameObjects.Graphics;
  private border: Phaser.GameObjects.Graphics;
  private label?: Phaser.GameObjects.Text;
  private config: ProgressBarConfig;
  private currentValue: number = 100;
  private maxValue: number = 100;

  constructor(config: ProgressBarConfig) {
    super(config.scene, config.x, config.y);
    this.config = config;
    this.scene.add.existing(this);

    const width = config.width ?? Theme.dimensions.progressBar.width;
    const height = config.height ?? Theme.dimensions.progressBar.height;

    // Create background
    this.background = this.scene.add.graphics();
    this.add(this.background);

    // Create bar
    this.bar = this.scene.add.graphics();
    this.add(this.bar);

    // Create border
    this.border = this.scene.add.graphics();
    this.add(this.border);

    // Create label if enabled
    if (config.showLabel) {
      this.label = this.scene.add.text(width / 2, height / 2, '', {
        ...Theme.typography.styles.small,
        align: 'center',
      });
      this.label.setOrigin(0.5, 0.5);
      this.add(this.label);
    }

    // Draw initial state
    this.draw();

    this.setDepth(Theme.layers.ui);
  }

  private draw(): void {
    const width = this.config.width ?? Theme.dimensions.progressBar.width;
    const height = this.config.height ?? Theme.dimensions.progressBar.height;
    const cornerRadius = Theme.dimensions.progressBar.cornerRadius;
    const borderWidth = Theme.dimensions.progressBar.borderWidth;

    const backgroundColor =
      this.config.backgroundColor ?? Theme.helpers.hexToColor(Theme.colors.backgroundDark);
    const borderColor =
      this.config.borderColor ?? Theme.helpers.hexToColor(Theme.colors.border);
    const barColor = this.config.barColor ?? Theme.helpers.hexToColor(Theme.colors.success);

    // Draw background
    this.background.clear();
    this.background.fillStyle(backgroundColor, 0.8);
    this.background.fillRoundedRect(0, 0, width, height, cornerRadius);

    // Calculate bar width based on percentage
    const percentage = this.maxValue > 0 ? this.currentValue / this.maxValue : 0;
    const barWidth = Math.max(0, width * percentage);

    // Draw bar
    this.bar.clear();
    if (barWidth > 0) {
      this.bar.fillStyle(barColor, 1);
      this.bar.fillRoundedRect(0, 0, barWidth, height, cornerRadius);
    }

    // Draw border
    this.border.clear();
    this.border.lineStyle(borderWidth, borderColor);
    this.border.strokeRoundedRect(0, 0, width, height, cornerRadius);

    // Update label
    if (this.label) {
      const labelStyle = this.config.labelStyle ?? 'both';
      let labelText = '';

      switch (labelStyle) {
        case 'value':
          labelText = `${this.currentValue}/${this.maxValue}`;
          break;
        case 'percentage':
          labelText = `${Math.round(percentage * 100)}%`;
          break;
        case 'both':
          labelText = `${this.currentValue}/${this.maxValue} (${Math.round(percentage * 100)}%)`;
          break;
      }

      this.label.setText(labelText);
    }
  }

  /**
   * Set the current and max values
   */
  setValues(current: number, max: number, animate: boolean = false): void {
    const oldCurrent = this.currentValue;
    this.currentValue = Math.max(0, Math.min(current, max));
    this.maxValue = max;

    if (animate && oldCurrent !== this.currentValue) {
      // Animate the bar change
      const startValue = oldCurrent;
      const endValue = this.currentValue;
      const duration = Theme.animation.normal;

      this.scene.tweens.addCounter({
        from: startValue,
        to: endValue,
        duration: duration,
        ease: 'Power2',
        onUpdate: (tween: Phaser.Tweens.Tween) => {
          const value = tween.getValue();
          if (value !== null) {
            this.currentValue = value;
            this.draw();
          }
        },
        onComplete: () => {
          this.currentValue = endValue;
          this.draw();
        },
      });
    } else {
      this.draw();
    }
  }

  /**
   * Update the bar color (e.g., change based on HP threshold)
   */
  setBarColor(color: number): void {
    this.config.barColor = color;
    this.draw();
  }

  /**
   * Get the current value
   */
  getCurrentValue(): number {
    return this.currentValue;
  }

  /**
   * Get the max value
   */
  getMaxValue(): number {
    return this.maxValue;
  }

  /**
   * Get the current percentage (0-1)
   */
  getPercentage(): number {
    return this.maxValue > 0 ? this.currentValue / this.maxValue : 0;
  }

  /**
   * Flash the bar (e.g., when taking damage)
   */
  flash(color?: number): void {
    const flashColor = color ?? Theme.helpers.hexToColor(Theme.colors.danger);
    const originalColor =
      this.config.barColor ?? Theme.helpers.hexToColor(Theme.colors.success);

    this.setBarColor(flashColor);

    this.scene.time.delayedCall(150, () => {
      this.setBarColor(originalColor);
    });
  }
}
