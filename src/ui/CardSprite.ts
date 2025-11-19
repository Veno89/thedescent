import Phaser from 'phaser';
import { Card, CardType } from '@/types';

/**
 * Visual representation of a card in Phaser
 */
export class CardSprite extends Phaser.GameObjects.Container {
  private card: Card;
  private background!: Phaser.GameObjects.Rectangle;
  private nameText!: Phaser.GameObjects.Text;
  private costText!: Phaser.GameObjects.Text;
  private descriptionText!: Phaser.GameObjects.Text;
  private typeText!: Phaser.GameObjects.Text;

  private readonly CARD_WIDTH = 180;
  private readonly CARD_HEIGHT = 250;

  private isHovered = false;
  private originalY = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, card: Card) {
    super(scene, x, y);
    this.card = card;
    this.originalY = y;

    this.createCard();
    this.setupInteraction();

    scene.add.existing(this);
  }

  /**
   * Create the visual card elements
   */
  private createCard(): void {
    // Card background
    const bgColor = this.getCardColor();
    this.background = this.scene.add.rectangle(
      0,
      0,
      this.CARD_WIDTH,
      this.CARD_HEIGHT,
      bgColor,
      1
    );
    this.background.setStrokeStyle(3, 0xffffff);
    this.add(this.background);

    // Card name
    this.nameText = this.scene.add.text(0, -100, this.card.name, {
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold',
      fontFamily: 'monospace',
      align: 'center',
      wordWrap: { width: this.CARD_WIDTH - 20 },
    });
    this.nameText.setOrigin(0.5);
    this.add(this.nameText);

    // Energy cost (top-left corner)
    const costBg = this.scene.add.circle(-75, -105, 20, 0x4444ff);
    this.add(costBg);

    this.costText = this.scene.add.text(-75, -105, this.card.cost.toString(), {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold',
      fontFamily: 'monospace',
    });
    this.costText.setOrigin(0.5);
    this.add(this.costText);

    // Card type
    this.typeText = this.scene.add.text(0, -70, this.card.type, {
      fontSize: '12px',
      color: '#cccccc',
      fontFamily: 'monospace',
    });
    this.typeText.setOrigin(0.5);
    this.add(this.typeText);

    // Card art placeholder (middle section)
    const artBg = this.scene.add.rectangle(0, -10, this.CARD_WIDTH - 20, 80, 0x333333);
    this.add(artBg);

    const artText = this.scene.add.text(0, -10, '[Art]', {
      fontSize: '14px',
      color: '#666666',
      fontFamily: 'monospace',
    });
    artText.setOrigin(0.5);
    this.add(artText);

    // Card description
    const descWithValues = this.formatDescription();
    this.descriptionText = this.scene.add.text(0, 70, descWithValues, {
      fontSize: '14px',
      color: '#ffffff',
      fontFamily: 'monospace',
      align: 'center',
      wordWrap: { width: this.CARD_WIDTH - 30 },
    });
    this.descriptionText.setOrigin(0.5);
    this.add(this.descriptionText);

    // Keywords (Exhaust, Retain, Ethereal, Innate)
    const keywords = this.getKeywords();
    if (keywords.length > 0) {
      const keywordText = this.scene.add.text(0, 105, keywords.join('. ') + '.', {
        fontSize: '11px',
        color: '#ffaa00',
        fontStyle: 'italic',
        fontFamily: 'monospace',
        align: 'center',
        wordWrap: { width: this.CARD_WIDTH - 30 },
      });
      keywordText.setOrigin(0.5);
      this.add(keywordText);
    }

    // X-cost indicator
    if (this.card.isXCost) {
      this.costText.setText('X');
    }

    // Upgrade indicator
    if (this.card.upgraded) {
      const upgradeBadge = this.scene.add.text(75, -105, '+', {
        fontSize: '20px',
        color: '#00ff00',
        fontStyle: 'bold',
        fontFamily: 'monospace',
      });
      upgradeBadge.setOrigin(0.5);
      this.add(upgradeBadge);
    }
  }

  /**
   * Get list of keywords for this card
   */
  private getKeywords(): string[] {
    const keywords: string[] = [];
    if (this.card.exhaust) keywords.push('Exhaust');
    if (this.card.retain) keywords.push('Retain');
    if (this.card.ethereal) keywords.push('Ethereal');
    if (this.card.innate) keywords.push('Innate');
    return keywords;
  }

  /**
   * Get card background color based on type
   */
  private getCardColor(): number {
    switch (this.card.type) {
      case CardType.ATTACK:
        return 0x8b0000; // Dark red
      case CardType.SKILL:
        return 0x006400; // Dark green
      case CardType.POWER:
        return 0x00008b; // Dark blue
      case CardType.STATUS:
        return 0x4a4a4a; // Gray
      case CardType.CURSE:
        return 0x2d1b2e; // Dark purple
      default:
        return 0x333333;
    }
  }

  /**
   * Format description with effect values
   */
  private formatDescription(): string {
    let desc = this.card.description;

    // Replace {0}, {1}, etc. with actual effect values
    this.card.effects.forEach((effect, index) => {
      desc = desc.replace(`{${index}}`, effect.value.toString());
    });

    return desc;
  }

  /**
   * Setup card interaction (hover, click, drag)
   */
  private setupInteraction(): void {
    this.setSize(this.CARD_WIDTH, this.CARD_HEIGHT);
    this.setInteractive({ useHandCursor: true });

    // Hover effects
    this.on('pointerover', () => {
      this.isHovered = true;
      this.background.setStrokeStyle(4, 0xffff00);
      this.scene.tweens.add({
        targets: this,
        y: this.originalY - 30,
        scale: 1.1,
        duration: 150,
        ease: 'Power2',
      });
      this.setDepth(100);
    });

    this.on('pointerout', () => {
      this.isHovered = false;
      this.background.setStrokeStyle(3, 0xffffff);
      this.scene.tweens.add({
        targets: this,
        y: this.originalY,
        scale: 1.0,
        duration: 150,
        ease: 'Power2',
      });
      this.setDepth(0);
    });
  }

  /**
   * Animate card being played
   */
  playAnimation(onComplete?: () => void): void {
    this.scene.tweens.add({
      targets: this,
      y: this.originalY - 200,
      alpha: 0,
      scale: 0.5,
      duration: 300,
      ease: 'Power2',
      onComplete: () => {
        this.destroy();
        onComplete?.();
      },
    });
  }

  /**
   * Animate card being drawn
   */
  drawAnimation(): void {
    this.setAlpha(0);
    this.setScale(0.5);
    this.scene.tweens.add({
      targets: this,
      alpha: 1,
      scale: 1.0,
      duration: 200,
      ease: 'Back.easeOut',
    });
  }

  /**
   * Update card position (for hand positioning)
   */
  updatePosition(x: number, y: number, duration = 200): void {
    this.originalY = y;
    this.scene.tweens.add({
      targets: this,
      x,
      y: this.isHovered ? y - 30 : y,
      duration,
      ease: 'Power2',
    });
  }

  /**
   * Get the card data
   */
  getCard(): Card {
    return this.card;
  }

  /**
   * Disable interaction (when not playable)
   */
  setPlayable(playable: boolean): void {
    if (playable) {
      this.setAlpha(1);
      this.setInteractive();
    } else {
      this.setAlpha(0.5);
      this.disableInteractive();
    }
  }
}
