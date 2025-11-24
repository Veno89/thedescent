import Phaser from 'phaser';
import { Card, CardRarity } from '@/types';
import { GameStateManager } from '@/systems/GameStateManager';
import { DataLoader } from '@/utils/DataLoader';
import { Relic } from '@/entities/Relic';
import { Potion } from '@/entities/Potion';
import { Button } from '@/ui/Button';
import { Theme } from '@/ui/theme';

interface ShopItem {
  type: 'CARD' | 'RELIC' | 'POTION' | 'REMOVE';
  data?: Card | Relic | Potion;
  price: number;
  sold: boolean;
}

/**
 * MerchantScene handles the shop with cards, relics, potions, and card removal
 */
export class MerchantScene extends Phaser.Scene {
  private gameState!: GameStateManager;
  private shopItems: ShopItem[] = [];
  private goldText!: Phaser.GameObjects.Text;
  private removalPrice: number = 0;
  private removalServiceUsed: boolean = false;

  constructor() {
    super({ key: 'MerchantScene' });
  }

  init(data: {
    gameState: GameStateManager;
    selectedCardIndex?: number;
    cancelled?: boolean;
    removalPrice?: number;
    removalServiceUsed?: boolean;
  }) {
    this.gameState = data.gameState;
    this.removalServiceUsed = data.removalServiceUsed || false;

    // Check if returning from CardSelectionScene
    if (data.selectedCardIndex !== undefined && data.removalPrice !== undefined) {
      this.removalPrice = data.removalPrice;

      // Handle card removal if a card was selected
      if (!data.cancelled && data.selectedCardIndex >= 0) {
        const removedCard = this.gameState.player.deck[data.selectedCardIndex];
        this.gameState.player.deck.splice(data.selectedCardIndex, 1);
        this.gameState.player.spendGold(this.removalPrice);
        this.removalServiceUsed = true;

        // Show success message when shop is displayed
        this.time.delayedCall(100, () => {
          this.showMessage(`Removed ${removedCard.name} from deck!`, 0xff4444);
        });
      }
    } else {
      this.shopItems = [];
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
      Theme.helpers.hexToColor(Theme.colors.backgroundLight),
      1
    ).setDepth(Theme.layers.background);

    // Title
    this.add.text(
      Theme.layout.getCenterX(width),
      Theme.layout.positions.topMargin,
      'THE MERCHANT',
      Theme.typography.styles.heading1
    ).setOrigin(0.5).setDepth(Theme.layers.ui);

    // Player stats (top-left corner)
    this.add.text(
      Theme.layout.margin.screen,
      Theme.layout.margin.screen,
      `HP: ${this.gameState.player.currentHp}/${this.gameState.player.maxHp}`,
      {
        ...Theme.typography.styles.body,
        color: Theme.colors.danger,
      }
    ).setDepth(Theme.layers.ui);

    this.goldText = this.add.text(
      Theme.layout.margin.screen,
      Theme.layout.margin.screen + Theme.spacing.xl,
      `Gold: ${this.gameState.player.gold}`,
      {
        ...Theme.typography.styles.body,
        color: Theme.colors.gold,
      }
    );
    this.goldText.setDepth(Theme.layers.ui);

    // Generate shop inventory
    this.generateShopInventory();

    // Display shop items
    this.displayShop(width);

    // Leave button
    this.createLeaveButton(width, height);
  }

  /**
   * Generate random shop inventory
   */
  private generateShopInventory(): void {
    const floor = this.gameState.currentFloor;

    // Generate 6 cards for sale
    for (let i = 0; i < 6; i++) {
      const card = DataLoader.getRandomWeightedCard();
      if (card) {
        this.shopItems.push({
          type: 'CARD',
          data: { ...card },
          price: this.calculateCardPrice(card, floor),
          sold: false,
        });
      }
    }

    // Generate 2 relics for sale
    for (let i = 0; i < 2; i++) {
      const relic = DataLoader.getRandomWeightedRelic();
      if (relic) {
        this.shopItems.push({
          type: 'RELIC',
          data: relic,
          price: this.calculateRelicPrice(relic, floor),
          sold: false,
        });
      }
    }

    // Generate 3 potions for sale
    for (let i = 0; i < 3; i++) {
      const potion = DataLoader.getRandomWeightedPotion();
      if (potion) {
        this.shopItems.push({
          type: 'POTION',
          data: potion,
          price: this.calculatePotionPrice(potion, floor),
          sold: false,
        });
      }
    }

    // Add card removal service
    this.shopItems.push({
      type: 'REMOVE',
      price: this.calculateRemovalPrice(floor),
      sold: this.removalServiceUsed, // Mark as sold if already used
    });
  }

  /**
   * Display all shop items
   */
  private displayShop(width: number): void {
    const startY = Theme.layout.positions.topMargin + Theme.spacing.xxxl + Theme.spacing.lg;
    const cardSpacing = 180;
    const otherSpacing = Theme.spacing.xxxl + Theme.spacing.xl;

    let currentY = startY;

    // Section: Cards
    this.add.text(
      Theme.layout.getCenterX(width),
      currentY,
      'CARDS FOR SALE',
      {
        ...Theme.typography.styles.heading3,
        color: Theme.colors.text,
      }
    ).setOrigin(0.5).setDepth(Theme.layers.ui);
    currentY += Theme.spacing.xl + Theme.spacing.md;

    const cardItems = this.shopItems.filter(item => item.type === 'CARD');
    this.displayCardGrid(cardItems, width, currentY);
    currentY += Math.ceil(cardItems.length / 3) * cardSpacing + Theme.spacing.xl;

    // Section: Relics
    this.add.text(
      Theme.layout.getCenterX(width),
      currentY,
      'RELICS',
      {
        ...Theme.typography.styles.heading3,
        color: Theme.colors.text,
      }
    ).setOrigin(0.5).setDepth(Theme.layers.ui);
    currentY += Theme.spacing.xl + Theme.spacing.md;

    const relicItems = this.shopItems.filter(item => item.type === 'RELIC');
    relicItems.forEach((item) => {
      this.displayRelicItem(item, Theme.layout.getCenterX(width), currentY);
      currentY += otherSpacing;
    });

    currentY += Theme.spacing.lg;

    // Section: Potions
    this.add.text(
      Theme.layout.getCenterX(width),
      currentY,
      'POTIONS',
      {
        ...Theme.typography.styles.heading3,
        color: Theme.colors.text,
      }
    ).setOrigin(0.5).setDepth(Theme.layers.ui);
    currentY += Theme.spacing.xl + Theme.spacing.md;

    const potionItems = this.shopItems.filter(item => item.type === 'POTION');
    potionItems.forEach((item) => {
      this.displayPotionItem(item, Theme.layout.getCenterX(width), currentY);
      currentY += otherSpacing;
    });

    currentY += Theme.spacing.lg;

    // Section: Services
    this.add.text(
      Theme.layout.getCenterX(width),
      currentY,
      'SERVICES',
      {
        ...Theme.typography.styles.heading3,
        color: Theme.colors.text,
      }
    ).setOrigin(0.5).setDepth(Theme.layers.ui);
    currentY += Theme.spacing.xl + Theme.spacing.md;

    const removeItem = this.shopItems.find(item => item.type === 'REMOVE');
    if (removeItem) {
      this.displayRemovalService(removeItem, Theme.layout.getCenterX(width), currentY);
    }
  }

  /**
   * Display cards in a grid (3 per row)
   */
  private displayCardGrid(items: ShopItem[], width: number, startY: number): void {
    const cardsPerRow = 3;
    const cardWidth = 220;
    const cardHeight = 140;
    const horizontalSpacing = 240;
    const verticalSpacing = 180;

    items.forEach((item, index) => {
      const row = Math.floor(index / cardsPerRow);
      const col = index % cardsPerRow;
      const x = width / 2 - horizontalSpacing + col * horizontalSpacing;
      const y = startY + row * verticalSpacing;

      this.displayCardItem(item, x, y, cardWidth, cardHeight);
    });
  }

  /**
   * Display a card item for sale
   */
  private displayCardItem(
    item: ShopItem,
    x: number,
    y: number,
    cardWidth: number,
    cardHeight: number
  ): void {
    const card = item.data as Card;
    const container = this.add.container(x, y);

    // Card background
    const bgColor = item.sold ? 0x555555 : this.getCardRarityColor(card.rarity);
    const bg = this.add.rectangle(0, 0, cardWidth, cardHeight, bgColor, item.sold ? 0.3 : 1);
    bg.setStrokeStyle(2, 0x888888);
    container.add(bg);

    if (!item.sold) {
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

      // Card cost
      const costText = this.add.text(-cardWidth / 2 + 10, -cardHeight / 2 + 10, `${card.cost}`, {
        fontSize: '18px',
        color: '#4a9eff',
        fontStyle: 'bold',
        fontFamily: 'monospace',
      });
      container.add(costText);

      // Card description
      const descText = this.add.text(0, 10, card.description, {
        fontSize: '12px',
        color: '#cccccc',
        fontFamily: 'monospace',
        align: 'center',
        wordWrap: { width: cardWidth - 20 },
      });
      descText.setOrigin(0.5);
      container.add(descText);

      // Price tag
      const priceText = this.add.text(0, cardHeight / 2 - 15, `${item.price} Gold`, {
        fontSize: '16px',
        color: '#ffd700',
        fontStyle: 'bold',
        fontFamily: 'monospace',
      });
      priceText.setOrigin(0.5);
      container.add(priceText);

      // Make interactive
      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerover', () => {
        bg.setStrokeStyle(3, 0xffff00);
        container.setScale(1.05);
      });
      bg.on('pointerout', () => {
        bg.setStrokeStyle(2, 0x888888);
        container.setScale(1.0);
      });
      bg.on('pointerdown', () => {
        this.purchaseItem(item);
      });
    } else {
      // Sold out overlay
      const soldText = this.add.text(0, 0, 'SOLD', {
        fontSize: '32px',
        color: '#888888',
        fontStyle: 'bold',
        fontFamily: 'monospace',
      });
      soldText.setOrigin(0.5);
      container.add(soldText);
    }
  }

  /**
   * Display a relic item for sale
   */
  private displayRelicItem(item: ShopItem, x: number, y: number): void {
    const relic = item.data as Relic;
    const container = this.add.container(x, y);

    // Background
    const width = 600;
    const height = 70;
    const bgColor = item.sold ? 0x555555 : 0x4a4a4a;
    const bg = this.add.rectangle(0, 0, width, height, bgColor, item.sold ? 0.3 : 1);
    bg.setStrokeStyle(2, item.sold ? 0x666666 : 0xffd700);
    container.add(bg);

    if (!item.sold) {
      // Relic icon
      const icon = this.add.text(-width / 2 + 30, 0, '🏺', {
        fontSize: '32px',
        fontFamily: 'monospace',
      });
      icon.setOrigin(0.5);
      container.add(icon);

      // Relic name
      const nameText = this.add.text(-width / 2 + 70, -10, relic.name, {
        fontSize: '18px',
        color: '#ffd700',
        fontStyle: 'bold',
        fontFamily: 'monospace',
      });
      nameText.setOrigin(0, 0.5);
      container.add(nameText);

      // Relic description
      const descText = this.add.text(-width / 2 + 70, 10, relic.description, {
        fontSize: '12px',
        color: '#cccccc',
        fontFamily: 'monospace',
        wordWrap: { width: 350 },
      });
      descText.setOrigin(0, 0.5);
      container.add(descText);

      // Price
      const priceText = this.add.text(width / 2 - 20, 0, `${item.price}G`, {
        fontSize: '20px',
        color: '#ffd700',
        fontStyle: 'bold',
        fontFamily: 'monospace',
      });
      priceText.setOrigin(1, 0.5);
      container.add(priceText);

      // Make interactive
      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerover', () => {
        bg.setStrokeStyle(3, 0xffff00);
      });
      bg.on('pointerout', () => {
        bg.setStrokeStyle(2, 0xffd700);
      });
      bg.on('pointerdown', () => {
        this.purchaseItem(item);
      });
    } else {
      // Sold out
      const soldText = this.add.text(0, 0, 'SOLD OUT', {
        fontSize: '24px',
        color: '#888888',
        fontStyle: 'bold',
        fontFamily: 'monospace',
      });
      soldText.setOrigin(0.5);
      container.add(soldText);
    }
  }

  /**
   * Display a potion item for sale
   */
  private displayPotionItem(item: ShopItem, x: number, y: number): void {
    const potion = item.data as Potion;
    const container = this.add.container(x, y);

    // Background
    const width = 600;
    const height = 70;
    const bgColor = item.sold ? 0x555555 : 0x4a4a4a;
    const bg = this.add.rectangle(0, 0, width, height, bgColor, item.sold ? 0.3 : 1);
    bg.setStrokeStyle(2, item.sold ? 0x666666 : 0x4a9eff);
    container.add(bg);

    if (!item.sold) {
      // Potion icon
      const icon = this.add.text(-width / 2 + 30, 0, '🧪', {
        fontSize: '32px',
        fontFamily: 'monospace',
      });
      icon.setOrigin(0.5);
      container.add(icon);

      // Potion name
      const nameText = this.add.text(-width / 2 + 70, -10, potion.name, {
        fontSize: '18px',
        color: '#4a9eff',
        fontStyle: 'bold',
        fontFamily: 'monospace',
      });
      nameText.setOrigin(0, 0.5);
      container.add(nameText);

      // Potion description
      const descText = this.add.text(-width / 2 + 70, 10, potion.description, {
        fontSize: '12px',
        color: '#cccccc',
        fontFamily: 'monospace',
        wordWrap: { width: 350 },
      });
      descText.setOrigin(0, 0.5);
      container.add(descText);

      // Price
      const priceText = this.add.text(width / 2 - 20, 0, `${item.price}G`, {
        fontSize: '20px',
        color: '#ffd700',
        fontStyle: 'bold',
        fontFamily: 'monospace',
      });
      priceText.setOrigin(1, 0.5);
      container.add(priceText);

      // Make interactive
      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerover', () => {
        bg.setStrokeStyle(3, 0xffff00);
      });
      bg.on('pointerout', () => {
        bg.setStrokeStyle(2, 0x4a9eff);
      });
      bg.on('pointerdown', () => {
        this.purchaseItem(item);
      });
    } else {
      // Sold out
      const soldText = this.add.text(0, 0, 'SOLD OUT', {
        fontSize: '24px',
        color: '#888888',
        fontStyle: 'bold',
        fontFamily: 'monospace',
      });
      soldText.setOrigin(0.5);
      container.add(soldText);
    }
  }

  /**
   * Display card removal service
   */
  private displayRemovalService(item: ShopItem, x: number, y: number): void {
    const container = this.add.container(x, y);

    // Background
    const width = 600;
    const height = 70;
    const bgColor = item.sold ? 0x555555 : 0x4a4a4a;
    const bg = this.add.rectangle(0, 0, width, height, bgColor, item.sold ? 0.3 : 1);
    bg.setStrokeStyle(2, item.sold ? 0x666666 : 0xff4444);
    container.add(bg);

    if (!item.sold) {
      // Icon
      const icon = this.add.text(-width / 2 + 30, 0, '🗑️', {
        fontSize: '32px',
        fontFamily: 'monospace',
      });
      icon.setOrigin(0.5);
      container.add(icon);

      // Service name
      const nameText = this.add.text(-width / 2 + 70, -10, 'Card Removal', {
        fontSize: '18px',
        color: '#ff4444',
        fontStyle: 'bold',
        fontFamily: 'monospace',
      });
      nameText.setOrigin(0, 0.5);
      container.add(nameText);

      // Service description
      const descText = this.add.text(-width / 2 + 70, 10, 'Remove a card from your deck permanently', {
        fontSize: '12px',
        color: '#cccccc',
        fontFamily: 'monospace',
      });
      descText.setOrigin(0, 0.5);
      container.add(descText);

      // Price
      const priceText = this.add.text(width / 2 - 20, 0, `${item.price}G`, {
        fontSize: '20px',
        color: '#ffd700',
        fontStyle: 'bold',
        fontFamily: 'monospace',
      });
      priceText.setOrigin(1, 0.5);
      container.add(priceText);

      // Make interactive
      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerover', () => {
        bg.setStrokeStyle(3, 0xffff00);
      });
      bg.on('pointerout', () => {
        bg.setStrokeStyle(2, 0xff4444);
      });
      bg.on('pointerdown', () => {
        this.useRemovalService(item);
      });
    } else {
      // Used
      const usedText = this.add.text(0, 0, 'USED', {
        fontSize: '24px',
        color: '#888888',
        fontStyle: 'bold',
        fontFamily: 'monospace',
      });
      usedText.setOrigin(0.5);
      container.add(usedText);
    }
  }

  /**
   * Purchase an item
   */
  private purchaseItem(item: ShopItem): void {
    if (item.sold) return;

    const player = this.gameState.player;

    // Check if player has enough gold
    if (player.gold < item.price) {
      this.showMessage('Not enough gold!', 0xff4444);
      return;
    }

    // Process purchase based on type
    switch (item.type) {
      case 'CARD':
        player.spendGold(item.price);
        player.addCardToDeck(item.data as Card);
        this.showMessage(`Purchased ${(item.data as Card).name}!`, 0x4a9eff);
        break;

      case 'RELIC':
        player.spendGold(item.price);
        player.addRelic(item.data as Relic);
        this.showMessage(`Obtained ${(item.data as Relic).name}!`, 0xffd700);
        break;

      case 'POTION':
        if (player.potions.length >= player.maxPotions) {
          this.showMessage('Potion inventory full!', 0xff4444);
          return;
        }
        player.spendGold(item.price);
        player.addPotion(item.data as Potion);
        this.showMessage(`Obtained ${(item.data as Potion).name}!`, 0x4a9eff);
        break;
    }

    // Mark as sold and refresh shop display
    item.sold = true;
    this.goldText.setText(`Gold: ${player.gold}`);
    this.refreshShop();
  }

  /**
   * Use card removal service
   */
  private useRemovalService(item: ShopItem): void {
    if (item.sold) return;

    const player = this.gameState.player;

    // Check if player has enough gold
    if (player.gold < item.price) {
      this.showMessage('Not enough gold!', 0xff4444);
      return;
    }

    // Check if deck has cards
    if (player.deck.length === 0) {
      this.showMessage('No cards to remove!', 0xff4444);
      return;
    }

    // Launch CardSelectionScene
    this.scene.start('CardSelectionScene', {
      gameState: this.gameState,
      mode: 'REMOVE',
      title: 'Remove a Card',
      description: 'Select a card to permanently remove from your deck',
      returnScene: 'MerchantScene',
      returnData: {
        gameState: this.gameState,
        removalPrice: item.price,
        removalServiceUsed: this.removalServiceUsed,
      },
      canCancel: true,
    });
  }

  /**
   * Refresh the shop display
   */
  private refreshShop(): void {
    // Clear and redraw
    this.children.removeAll();
    this.create();
  }

  /**
   * Show a message to the player
   */
  private showMessage(message: string, color: number): void {
    const width = this.cameras.main.width;
    const messageText = this.add.text(width / 2, 120, message, {
      fontSize: '24px',
      color: `#${color.toString(16).padStart(6, '0')}`,
      fontStyle: 'bold',
      fontFamily: 'monospace',
      backgroundColor: '#000000',
      padding: { x: 20, y: 10 },
    });
    messageText.setOrigin(0.5);
    messageText.setDepth(1000);

    // Fade out after 2 seconds
    this.tweens.add({
      targets: messageText,
      alpha: 0,
      duration: 2000,
      delay: 1000,
      onComplete: () => messageText.destroy(),
    });
  }

  /**
   * Create leave button
   */
  private createLeaveButton(width: number, height: number): void {
    new Button({
      scene: this,
      x: Theme.layout.getCenterX(width),
      y: height - Theme.layout.positions.bottomMargin,
      text: 'Leave Shop',
      width: 250,
      height: Theme.dimensions.button.height + 10,
      style: 'secondary',
      onClick: () => {
        this.scene.start('MapScene', { gameState: this.gameState });
      },
    });
  }

  /**
   * Calculate card price based on rarity and floor
   */
  private calculateCardPrice(card: Card, floor: number): number {
    const basePrice = {
      [CardRarity.STARTER]: 25,
      [CardRarity.COMMON]: 48,
      [CardRarity.UNCOMMON]: 70,
      [CardRarity.RARE]: 135,
      [CardRarity.SPECIAL]: 180,
    };

    const base = basePrice[card.rarity] || 48;
    const floorMultiplier = 1 + floor * 0.08; // Slightly reduced floor scaling
    return Math.floor(base * floorMultiplier);
  }

  /**
   * Calculate relic price based on rarity and floor
   */
  private calculateRelicPrice(relic: Relic, floor: number): number {
    const basePrice = {
      [CardRarity.STARTER]: 100,
      [CardRarity.COMMON]: 150,
      [CardRarity.UNCOMMON]: 250,
      [CardRarity.RARE]: 300,
      [CardRarity.SPECIAL]: 400,
    };

    const base = basePrice[relic.rarity] || 150;
    const floorMultiplier = 1 + floor * 0.1;
    return Math.floor(base * floorMultiplier);
  }

  /**
   * Calculate potion price based on rarity and floor
   */
  private calculatePotionPrice(potion: Potion, floor: number): number {
    const basePrice = {
      [CardRarity.STARTER]: 25,
      [CardRarity.COMMON]: 50,
      [CardRarity.UNCOMMON]: 75,
      [CardRarity.RARE]: 100,
      [CardRarity.SPECIAL]: 150,
    };

    const base = basePrice[potion.rarity] || 50;
    const floorMultiplier = 1 + floor * 0.1;
    return Math.floor(base * floorMultiplier);
  }

  /**
   * Calculate card removal price based on floor
   */
  private calculateRemovalPrice(floor: number): number {
    const basePrice = 70;
    const floorMultiplier = 1 + floor * 0.12; // Slightly reduced removal price scaling
    return Math.floor(basePrice * floorMultiplier);
  }

  /**
   * Get card rarity color
   */
  private getCardRarityColor(rarity: CardRarity): number {
    switch (rarity) {
      case CardRarity.COMMON:
        return 0x808080; // Gray
      case CardRarity.UNCOMMON:
        return 0x4a9eff; // Blue
      case CardRarity.RARE:
        return 0xffd700; // Gold
      case CardRarity.SPECIAL:
        return 0x9370db; // Purple
      default:
        return 0x808080;
    }
  }
}
