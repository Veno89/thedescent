import Phaser from 'phaser';
import { Card } from '@/types';
import { Relic } from '@/entities/Relic';
import { Potion } from '@/entities/Potion';
import { GameStateManager } from '@/systems/GameStateManager';
import { DataLoader } from '@/utils/DataLoader';
import { CardSprite } from '@/ui/CardSprite';
import { RelicSprite } from '@/ui/RelicSprite';
import { PotionSprite } from '@/ui/PotionSprite';

/**
 * RewardScene handles post-combat rewards
 */
export class RewardScene extends Phaser.Scene {
  private gameState!: GameStateManager;
  private isTreasure = false;
  private goldReward = 0;
  private cardRewards: Card[] = [];
  private relicReward: Relic | null = null;
  private potionDrop: Potion | null = null;

  constructor() {
    super({ key: 'RewardScene' });
  }

  init(data: {
    gameState: GameStateManager;
    goldReward?: number;
    isTreasure?: boolean;
    potionDrop?: Potion | null;
  }) {
    this.gameState = data.gameState;
    this.goldReward = data.goldReward || 0;
    this.isTreasure = data.isTreasure || false;
    this.potionDrop = data.potionDrop || null;
  }

  create(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Title
    this.add.text(width / 2, 80, this.isTreasure ? 'TREASURE!' : 'VICTORY!', {
      fontSize: '48px',
      color: '#ffd700',
      fontStyle: 'bold',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Generate rewards
    if (!this.isTreasure && this.goldReward === 0) {
      this.goldReward = this.calculateGoldReward();
    }

    if (this.isTreasure) {
      this.goldReward = Math.floor(this.goldReward * 2); // Double gold for treasure
      // Treasure rooms give a relic
      this.relicReward = DataLoader.getRandomWeightedRelic() || null;
    }

    this.cardRewards = this.generateCardRewards();

    let currentY = 180;

    // Display gold reward
    if (this.goldReward > 0) {
      const goldText = this.add.text(width / 2, currentY, `+${this.goldReward} Gold`, {
        fontSize: '32px',
        color: '#ffd700',
        fontStyle: 'bold',
        fontFamily: 'monospace',
      });
      goldText.setOrigin(0.5);

      // Animate gold collection
      this.tweens.add({
        targets: goldText,
        y: currentY - 20,
        scale: 1.2,
        duration: 200,
        yoyo: true,
        ease: 'Power2',
      });

      // Add gold to player
      this.gameState.player.addGold(this.goldReward);
      currentY += 80;
    }

    // Display potion drop
    if (this.potionDrop) {
      this.add.text(width / 2, currentY, 'Potion Found!', {
        fontSize: '24px',
        color: '#4a9eff',
        fontStyle: 'bold',
        fontFamily: 'monospace',
      }).setOrigin(0.5);

      currentY += 50;

      // Display potion
      const potionSprite = new PotionSprite(this, width / 2, currentY, this.potionDrop, 0);
      potionSprite.setScale(1.5); // Make it bigger for display

      currentY += 60;

      // Potion name
      this.add.text(width / 2, currentY, this.potionDrop.name, {
        fontSize: '20px',
        color: '#ffffff',
        fontStyle: 'bold',
        fontFamily: 'monospace',
      }).setOrigin(0.5);

      currentY += 30;

      // Potion description
      this.add.text(width / 2, currentY, this.potionDrop.description, {
        fontSize: '14px',
        color: '#cccccc',
        fontFamily: 'monospace',
        align: 'center',
        wordWrap: { width: 500 },
      }).setOrigin(0.5);

      // Add potion to player if there's space
      const success = this.gameState.player.addPotion(this.potionDrop);
      if (!success) {
        currentY += 25;
        this.add.text(width / 2, currentY, '(Potion inventory full - discarded)', {
          fontSize: '12px',
          color: '#ff6666',
          fontStyle: 'italic',
          fontFamily: 'monospace',
        }).setOrigin(0.5);
      }

      currentY += 70;
    }

    // Display relic reward (treasure rooms)
    if (this.relicReward) {
      this.add.text(width / 2, currentY, 'Relic Found!', {
        fontSize: '28px',
        color: '#ffd700',
        fontStyle: 'bold',
        fontFamily: 'monospace',
      }).setOrigin(0.5);

      currentY += 50;

      // Display relic
      const relicSprite = new RelicSprite(this, width / 2, currentY, this.relicReward);
      relicSprite.setScale(2); // Make it bigger for display

      currentY += 100;

      // Relic name and description
      this.add.text(width / 2, currentY, this.relicReward.name, {
        fontSize: '24px',
        color: '#ffffff',
        fontStyle: 'bold',
        fontFamily: 'monospace',
      }).setOrigin(0.5);

      currentY += 35;

      this.add.text(width / 2, currentY, this.relicReward.description, {
        fontSize: '16px',
        color: '#cccccc',
        fontFamily: 'monospace',
        align: 'center',
        wordWrap: { width: 600 },
      }).setOrigin(0.5);

      // Add relic to player
      this.gameState.player.addRelic(this.relicReward);

      currentY += 80;
    }

    // Display card rewards
    if (!this.isTreasure) {
      this.add.text(width / 2, 250, 'Choose a card to add to your deck:', {
        fontSize: '24px',
        color: '#ffffff',
        fontFamily: 'monospace',
      }).setOrigin(0.5);

      this.displayCardRewards();
    }

    // Skip button
    this.createSkipButton(width, height);

    // Continue button (appears after selecting or skipping)
    this.createContinueButton(width, height);
  }

  /**
   * Calculate gold reward based on difficulty
   */
  private calculateGoldReward(): number {
    // Base reward: 10-20 gold
    const base = 10 + Math.floor(Math.random() * 11);

    // Bonus based on floor
    const floorBonus = this.gameState.currentFloor * 2;

    return base + floorBonus;
  }

  /**
   * Generate card rewards (3 cards to choose from)
   */
  private generateCardRewards(): Card[] {
    const rewards: Card[] = [];
    const allCards = DataLoader.getAllCards();

    // Filter out starter cards for rewards
    const rewardPool = allCards.filter(c => c.rarity !== 'STARTER');

    // Pick 3 random cards with rarity weighting
    for (let i = 0; i < 3; i++) {
      const card = this.pickWeightedCard(rewardPool);
      if (card) rewards.push(card);
    }

    return rewards;
  }

  /**
   * Pick a card with rarity-based weighting
   */
  private pickWeightedCard(pool: Card[]): Card | null {
    if (pool.length === 0) return null;

    // Rarity weights: COMMON (60%), UNCOMMON (30%), RARE (10%)
    const roll = Math.random();
    let targetRarity: string;

    if (roll < 0.6) {
      targetRarity = 'COMMON';
    } else if (roll < 0.9) {
      targetRarity = 'UNCOMMON';
    } else {
      targetRarity = 'RARE';
    }

    const filtered = pool.filter(c => c.rarity === targetRarity);
    if (filtered.length === 0) {
      // Fallback to any card
      return pool[Math.floor(Math.random() * pool.length)];
    }

    return filtered[Math.floor(Math.random() * filtered.length)];
  }

  /**
   * Display card reward options
   */
  private displayCardRewards(): void {
    const width = this.cameras.main.width;
    const cardSpacing = 220;
    const startX = width / 2 - ((this.cardRewards.length - 1) * cardSpacing) / 2;

    this.cardRewards.forEach((card, index) => {
      const cardSprite = new CardSprite(
        this,
        startX + index * cardSpacing,
        550,
        card
      );

      cardSprite.setInteractive({ useHandCursor: true });

      cardSprite.on('pointerdown', () => {
        this.onCardSelected(card, cardSprite);
      });
    });
  }

  /**
   * Handle card selection
   */
  private onCardSelected(card: Card, sprite: CardSprite): void {
    this.gameState.player.addCardToDeck(card);

    console.log(`Added ${card.name} to deck`);

    // Visual feedback
    this.tweens.add({
      targets: sprite,
      y: sprite.y - 50,
      scale: 1.2,
      alpha: 0,
      duration: 500,
      ease: 'Power2',
    });

    // Show selected message
    const selectedText = this.add.text(
      this.cameras.main.width / 2,
      800,
      `${card.name} added to deck!`,
      {
        fontSize: '24px',
        color: '#00ff00',
        fontStyle: 'bold',
        fontFamily: 'monospace',
      }
    );
    selectedText.setOrigin(0.5);
  }

  /**
   * Create skip button
   */
  private createSkipButton(width: number, height: number): void {
    const skipButton = this.add.text(
      width / 2 - 150,
      height - 100,
      'Skip Reward',
      {
        fontSize: '24px',
        color: '#ffffff',
        fontFamily: 'monospace',
        backgroundColor: '#333333',
        padding: { x: 20, y: 10 },
      }
    );
    skipButton.setOrigin(0.5);
    skipButton.setInteractive({ useHandCursor: true });

    skipButton.on('pointerover', () => {
      skipButton.setStyle({ color: '#ffaa00' });
    });

    skipButton.on('pointerout', () => {
      skipButton.setStyle({ color: '#ffffff' });
    });

    skipButton.on('pointerdown', () => {
      console.log('Skipped card reward');
    });
  }

  /**
   * Create continue button
   */
  private createContinueButton(width: number, height: number): void {
    const continueButton = this.add.text(
      width / 2 + 150,
      height - 100,
      'Continue',
      {
        fontSize: '24px',
        color: '#ffffff',
        fontFamily: 'monospace',
        backgroundColor: '#006400',
        padding: { x: 20, y: 10 },
      }
    );
    continueButton.setOrigin(0.5);
    continueButton.setInteractive({ useHandCursor: true });

    continueButton.on('pointerover', () => {
      continueButton.setStyle({ backgroundColor: '#228b22' });
    });

    continueButton.on('pointerout', () => {
      continueButton.setStyle({ backgroundColor: '#006400' });
    });

    continueButton.on('pointerdown', () => {
      this.returnToMap();
    });
  }

  /**
   * Return to map
   */
  private returnToMap(): void {
    // Check if we're at the boss
    if (this.gameState.isAtBoss()) {
      this.gameState.completeAct();

      if (this.gameState.currentAct > 3) {
        // Game won!
        this.scene.start('MainMenuScene');
        return;
      }
    }

    this.scene.start('MapScene', { gameState: this.gameState });
  }
}
