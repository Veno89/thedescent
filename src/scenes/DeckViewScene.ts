import Phaser from 'phaser';
import { Card } from '@/types';

/**
 * DeckViewScene - Shows the player's deck, discard pile, and draw pile during combat
 */
export class DeckViewScene extends Phaser.Scene {
  private cards!: Card[];
  private discardPile!: Card[];
  private drawPile!: Card[];
  private exhaustPile!: Card[];
  private returnScene!: string;
  private returnData?: any;
  private viewMode: 'DECK' | 'DISCARD' | 'DRAW' | 'EXHAUST' = 'DECK';

  constructor() {
    super({ key: 'DeckViewScene' });
  }

  init(data: {
    cards: Card[];
    discardPile: Card[];
    drawPile: Card[];
    exhaustPile: Card[];
    returnScene: string;
    returnData?: any;
    viewMode?: 'DECK' | 'DISCARD' | 'DRAW' | 'EXHAUST';
  }) {
    this.cards = data.cards || [];
    this.discardPile = data.discardPile || [];
    this.drawPile = data.drawPile || [];
    this.exhaustPile = data.exhaustPile || [];
    this.returnScene = data.returnScene;
    this.returnData = data.returnData;
    this.viewMode = data.viewMode || 'DECK';
  }

  create(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Semi-transparent background
    const bg = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.85);
    bg.setInteractive();
    bg.on('pointerdown', () => this.closeView());

    // Title
    this.add.text(width / 2, 60, this.getTitle(), {
      fontSize: '42px',
      color: '#ffffff',
      fontStyle: 'bold',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Tab buttons
    this.createTabButtons(width);

    // Display cards based on view mode
    this.displayCards(width, height);

    // Close button
    this.createCloseButton(width, height);
  }

  /**
   * Get title based on view mode
   */
  private getTitle(): string {
    switch (this.viewMode) {
      case 'DECK':
        return `Full Deck (${this.cards.length} cards)`;
      case 'DISCARD':
        return `Discard Pile (${this.discardPile.length} cards)`;
      case 'DRAW':
        return `Draw Pile (${this.drawPile.length} cards)`;
      case 'EXHAUST':
        return `Exhaust Pile (${this.exhaustPile.length} cards)`;
    }
  }

  /**
   * Create tab buttons to switch between views
   */
  private createTabButtons(width: number): void {
    const tabs = [
      { mode: 'DECK' as const, label: `Deck (${this.cards.length})`, x: width / 2 - 450 },
      { mode: 'DRAW' as const, label: `Draw (${this.drawPile.length})`, x: width / 2 - 150 },
      { mode: 'DISCARD' as const, label: `Discard (${this.discardPile.length})`, x: width / 2 + 150 },
      { mode: 'EXHAUST' as const, label: `Exhaust (${this.exhaustPile.length})`, x: width / 2 + 450 },
    ];

    tabs.forEach(tab => {
      const isActive = this.viewMode === tab.mode;
      const button = this.add.text(tab.x, 130, tab.label, {
        fontSize: '20px',
        color: isActive ? '#ffd700' : '#ffffff',
        fontStyle: isActive ? 'bold' : 'normal',
        fontFamily: 'monospace',
        backgroundColor: isActive ? '#333333' : '#1a1a1a',
        padding: { x: 20, y: 10 },
      });
      button.setOrigin(0.5);
      button.setInteractive({ useHandCursor: true });

      button.on('pointerover', () => {
        if (!isActive) {
          button.setStyle({ backgroundColor: '#2a2a2a' });
        }
      });

      button.on('pointerout', () => {
        if (!isActive) {
          button.setStyle({ backgroundColor: '#1a1a1a' });
        }
      });

      button.on('pointerdown', () => {
        this.switchTab(tab.mode);
      });
    });
  }

  /**
   * Switch to a different tab
   */
  private switchTab(mode: 'DECK' | 'DISCARD' | 'DRAW' | 'EXHAUST'): void {
    this.viewMode = mode;
    this.scene.restart({
      cards: this.cards,
      discardPile: this.discardPile,
      drawPile: this.drawPile,
      exhaustPile: this.exhaustPile,
      returnScene: this.returnScene,
      returnData: this.returnData,
      viewMode: mode,
    });
  }

  /**
   * Display cards in a grid
   */
  private displayCards(width: number, height: number): void {
    let cardsToDisplay: Card[] = [];

    switch (this.viewMode) {
      case 'DECK':
        cardsToDisplay = this.cards;
        break;
      case 'DISCARD':
        cardsToDisplay = this.discardPile;
        break;
      case 'DRAW':
        cardsToDisplay = this.drawPile;
        break;
      case 'EXHAUST':
        cardsToDisplay = this.exhaustPile;
        break;
    }

    if (cardsToDisplay.length === 0) {
      this.add.text(width / 2, height / 2, 'No cards', {
        fontSize: '32px',
        color: '#888888',
        fontFamily: 'monospace',
      }).setOrigin(0.5);
      return;
    }

    const cardsPerRow = 5;
    const cardWidth = 180;
    const cardHeight = 250;
    const horizontalSpacing = 200;
    const verticalSpacing = 270;
    const startY = 220;

    cardsToDisplay.forEach((card, index) => {
      const row = Math.floor(index / cardsPerRow);
      const col = index % cardsPerRow;
      const x = width / 2 - (cardsPerRow - 1) * horizontalSpacing / 2 + col * horizontalSpacing;
      const y = startY + row * verticalSpacing;

      this.createCardDisplay(card, x, y, cardWidth, cardHeight);
    });
  }

  /**
   * Create a card display
   */
  private createCardDisplay(
    card: Card,
    x: number,
    y: number,
    cardWidth: number,
    cardHeight: number
  ): void {
    const container = this.add.container(x, y);

    // Card background
    const bgColor = this.getCardColor(card);
    const bg = this.add.rectangle(0, 0, cardWidth, cardHeight, bgColor, 1);
    bg.setStrokeStyle(2, 0x888888);
    container.add(bg);

    // Card name
    const nameText = this.add.text(0, -cardHeight / 2 + 15, card.name, {
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold',
      fontFamily: 'monospace',
      align: 'center',
      wordWrap: { width: cardWidth - 20 },
    });
    nameText.setOrigin(0.5, 0);
    container.add(nameText);

    // Energy cost
    const costBg = this.add.circle(-cardWidth / 2 + 20, -cardHeight / 2 + 20, 18, 0x4a9eff);
    container.add(costBg);
    const costText = this.add.text(-cardWidth / 2 + 20, -cardHeight / 2 + 20, card.cost.toString(), {
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold',
      fontFamily: 'monospace',
    });
    costText.setOrigin(0.5);
    container.add(costText);

    // Card type
    const typeText = this.add.text(0, -cardHeight / 2 + 50, card.type, {
      fontSize: '12px',
      color: '#aaaaaa',
      fontFamily: 'monospace',
    });
    typeText.setOrigin(0.5, 0);
    container.add(typeText);

    // Card description
    const descText = this.add.text(0, 0, card.description, {
      fontSize: '13px',
      color: '#cccccc',
      fontFamily: 'monospace',
      align: 'center',
      wordWrap: { width: cardWidth - 30 },
    });
    descText.setOrigin(0.5);
    container.add(descText);

    // Upgraded indicator
    if (card.upgraded) {
      const upgradedBadge = this.add.text(cardWidth / 2 - 10, -cardHeight / 2 + 10, '+', {
        fontSize: '24px',
        color: '#00ff00',
        fontStyle: 'bold',
        fontFamily: 'monospace',
      });
      upgradedBadge.setOrigin(1, 0);
      container.add(upgradedBadge);
    }

    // Hover effect
    bg.setInteractive();
    bg.on('pointerover', () => {
      bg.setStrokeStyle(3, 0xffff00);
      container.setScale(1.05);
      container.setDepth(100);
    });

    bg.on('pointerout', () => {
      bg.setStrokeStyle(2, 0x888888);
      container.setScale(1.0);
      container.setDepth(0);
    });
  }

  /**
   * Get card background color based on type
   */
  private getCardColor(card: Card): number {
    switch (card.type) {
      case 'ATTACK':
        return 0x8b0000;
      case 'SKILL':
        return 0x004d00;
      case 'POWER':
        return 0x000080;
      case 'STATUS':
      case 'CURSE':
        return 0x4a4a4a;
      default:
        return 0x333333;
    }
  }

  /**
   * Create close button
   */
  private createCloseButton(width: number, height: number): void {
    const button = this.add.text(width / 2, height - 80, 'Close (ESC)', {
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold',
      fontFamily: 'monospace',
      backgroundColor: '#333333',
      padding: { x: 30, y: 15 },
    });
    button.setOrigin(0.5);
    button.setInteractive({ useHandCursor: true });

    button.on('pointerover', () => {
      button.setStyle({ backgroundColor: '#555555', color: '#ffd700' });
    });

    button.on('pointerout', () => {
      button.setStyle({ backgroundColor: '#333333', color: '#ffffff' });
    });

    button.on('pointerdown', () => {
      this.closeView();
    });

    // ESC key to close
    this.input.keyboard?.on('keydown-ESC', () => {
      this.closeView();
    });
  }

  /**
   * Close the deck view and return to previous scene
   */
  private closeView(): void {
    this.scene.stop();
    this.scene.resume(this.returnScene);
  }
}
