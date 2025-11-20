import Phaser from 'phaser';
import { Card } from '@/types';
import { GameStateManager } from '@/systems/GameStateManager';

export type CardSelectionMode = 'REMOVE' | 'UPGRADE' | 'TRANSFORM' | 'VIEW';

export interface CardSelectionConfig {
  gameState: GameStateManager;
  mode: CardSelectionMode;
  title: string;
  description?: string;
  returnScene: string;
  returnData?: any;
  filter?: (card: Card) => boolean;
  onSelect?: (cardIndex: number) => void;
  canCancel?: boolean;
}

/**
 * CardSelectionScene - Reusable scene for selecting cards from the player's deck
 */
export class CardSelectionScene extends Phaser.Scene {
  private gameState!: GameStateManager;
  private mode!: CardSelectionMode;
  private titleText!: string;
  private descriptionText?: string;
  private returnScene!: string;
  private returnData?: any;
  private filter?: (card: Card) => boolean;
  private onSelectCallback?: (cardIndex: number) => void;
  private canCancel: boolean = true;

  private selectedCardIndex: number = -1;
  private cardContainers: Phaser.GameObjects.Container[] = [];

  constructor() {
    super({ key: 'CardSelectionScene' });
  }

  init(data: CardSelectionConfig) {
    this.gameState = data.gameState;
    this.mode = data.mode;
    this.titleText = data.title;
    this.descriptionText = data.description;
    this.returnScene = data.returnScene;
    this.returnData = data.returnData;
    this.filter = data.filter;
    this.onSelectCallback = data.onSelect;
    this.canCancel = data.canCancel !== undefined ? data.canCancel : true;
    this.selectedCardIndex = -1;
    this.cardContainers = [];
  }

  create(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x0a0a0a, 0.95).setDepth(-1);

    // Title
    this.add.text(width / 2, 60, this.titleText, {
      fontSize: '42px',
      color: '#ffffff',
      fontStyle: 'bold',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Description (if provided)
    if (this.descriptionText) {
      this.add.text(width / 2, 120, this.descriptionText, {
        fontSize: '18px',
        color: '#cccccc',
        fontFamily: 'monospace',
        align: 'center',
        wordWrap: { width: 800 },
      }).setOrigin(0.5);
    }

    // Display cards
    this.displayCards(width);

    // Cancel button (if allowed)
    if (this.canCancel) {
      this.createCancelButton(width, height);
    }

    // Deck count
    this.add.text(width - 50, 50, `Deck: ${this.gameState.player.deck.length}`, {
      fontSize: '20px',
      color: '#ffffff',
      fontFamily: 'monospace',
    }).setOrigin(1, 0);
  }

  /**
   * Display all cards in a scrollable grid
   */
  private displayCards(width: number): void {
    const deck = this.gameState.player.deck;
    const cardsPerRow = 5;
    const cardWidth = 200;
    const cardHeight = 280;
    const horizontalSpacing = 220;
    const verticalSpacing = 300;
    const startY = this.descriptionText ? 200 : 160;

    deck.forEach((card, index) => {
      const row = Math.floor(index / cardsPerRow);
      const col = index % cardsPerRow;
      const x = width / 2 - (cardsPerRow - 1) * horizontalSpacing / 2 + col * horizontalSpacing;
      const y = startY + row * verticalSpacing;

      const isSelectable = this.isCardSelectable(card);
      const container = this.createCardDisplay(card, index, x, y, cardWidth, cardHeight, isSelectable);
      this.cardContainers.push(container);
    });
  }

  /**
   * Check if a card is selectable based on mode and filter
   */
  private isCardSelectable(card: Card): boolean {
    // Apply custom filter if provided
    if (this.filter && !this.filter(card)) {
      return false;
    }

    // Mode-specific filters
    switch (this.mode) {
      case 'UPGRADE':
        return !card.upgraded; // Can only upgrade non-upgraded cards
      case 'REMOVE':
      case 'TRANSFORM':
      case 'VIEW':
      default:
        return true; // All cards selectable
    }
  }

  /**
   * Create a card display container
   */
  private createCardDisplay(
    card: Card,
    index: number,
    x: number,
    y: number,
    cardWidth: number,
    cardHeight: number,
    isSelectable: boolean
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    // Card background
    const bgColor = isSelectable ? this.getCardColor(card) : 0x333333;
    const alpha = isSelectable ? 1 : 0.5;
    const bg = this.add.rectangle(0, 0, cardWidth, cardHeight, bgColor, alpha);
    bg.setStrokeStyle(3, isSelectable ? 0x888888 : 0x555555);
    container.add(bg);

    // Card name
    const nameText = this.add.text(0, -cardHeight / 2 + 20, card.name, {
      fontSize: '18px',
      color: isSelectable ? '#ffffff' : '#777777',
      fontStyle: 'bold',
      fontFamily: 'monospace',
      align: 'center',
      wordWrap: { width: cardWidth - 20 },
    });
    nameText.setOrigin(0.5, 0);
    container.add(nameText);

    // Energy cost
    const costBg = this.add.circle(-cardWidth / 2 + 25, -cardHeight / 2 + 25, 20, 0x4a9eff);
    container.add(costBg);
    const costText = this.add.text(-cardWidth / 2 + 25, -cardHeight / 2 + 25, card.cost.toString(), {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold',
      fontFamily: 'monospace',
    });
    costText.setOrigin(0.5);
    container.add(costText);

    // Card type
    const typeText = this.add.text(0, -cardHeight / 2 + 55, card.type, {
      fontSize: '14px',
      color: isSelectable ? '#aaaaaa' : '#666666',
      fontFamily: 'monospace',
    });
    typeText.setOrigin(0.5, 0);
    container.add(typeText);

    // Card description
    const descText = this.add.text(0, -20, card.description, {
      fontSize: '14px',
      color: isSelectable ? '#cccccc' : '#666666',
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

    // Rarity indicator (bottom)
    const rarityText = this.add.text(0, cardHeight / 2 - 20, card.rarity, {
      fontSize: '12px',
      color: isSelectable ? '#888888' : '#555555',
      fontFamily: 'monospace',
    });
    rarityText.setOrigin(0.5);
    container.add(rarityText);

    // Make interactive if selectable
    if (isSelectable && this.mode !== 'VIEW') {
      bg.setInteractive({ useHandCursor: true });

      bg.on('pointerover', () => {
        bg.setStrokeStyle(4, 0xffff00);
        container.setScale(1.05);
        container.setDepth(100);
      });

      bg.on('pointerout', () => {
        bg.setStrokeStyle(3, 0x888888);
        container.setScale(1.0);
        container.setDepth(0);
      });

      bg.on('pointerdown', () => {
        this.onCardSelected(index);
      });
    }

    // Non-selectable overlay
    if (!isSelectable && this.mode !== 'VIEW') {
      const overlay = this.add.rectangle(0, 0, cardWidth, cardHeight, 0x000000, 0.6);
      container.add(overlay);

      let reasonText = '';
      if (this.mode === 'UPGRADE' && card.upgraded) {
        reasonText = 'Already Upgraded';
      }

      if (reasonText) {
        const reason = this.add.text(0, 0, reasonText, {
          fontSize: '16px',
          color: '#ff4444',
          fontStyle: 'bold',
          fontFamily: 'monospace',
          align: 'center',
        });
        reason.setOrigin(0.5);
        container.add(reason);
      }
    }

    return container;
  }

  /**
   * Handle card selection
   */
  private onCardSelected(cardIndex: number): void {
    this.selectedCardIndex = cardIndex;

    // Execute callback if provided
    if (this.onSelectCallback) {
      this.onSelectCallback(cardIndex);
    }

    // Return to calling scene with result
    this.returnToCallingScene();
  }

  /**
   * Create cancel button
   */
  private createCancelButton(width: number, height: number): void {
    const button = this.add.text(width / 2, height - 80, 'Cancel', {
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
      button.setStyle({ backgroundColor: '#555555', color: '#ff4444' });
    });

    button.on('pointerout', () => {
      button.setStyle({ backgroundColor: '#333333', color: '#ffffff' });
    });

    button.on('pointerdown', () => {
      this.selectedCardIndex = -1;
      this.returnToCallingScene();
    });
  }

  /**
   * Return to the calling scene
   */
  private returnToCallingScene(): void {
    const resultData = {
      ...this.returnData,
      selectedCardIndex: this.selectedCardIndex,
      cancelled: this.selectedCardIndex === -1,
    };

    this.scene.start(this.returnScene, resultData);
  }

  /**
   * Get card background color based on type
   */
  private getCardColor(card: Card): number {
    switch (card.type) {
      case 'ATTACK':
        return 0x8b0000; // Dark red
      case 'SKILL':
        return 0x004d00; // Dark green
      case 'POWER':
        return 0x000080; // Dark blue
      case 'STATUS':
      case 'CURSE':
        return 0x4a4a4a; // Dark gray
      default:
        return 0x333333;
    }
  }
}
