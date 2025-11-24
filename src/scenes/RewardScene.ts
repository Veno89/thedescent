import Phaser from 'phaser';
import { Card } from '@/types';
import { Relic } from '@/entities/Relic';
import { Potion } from '@/entities/Potion';
import { GameStateManager } from '@/systems/GameStateManager';
import { DataLoader } from '@/utils/DataLoader';
import { CardSprite } from '@/ui/CardSprite';
import { RelicSprite } from '@/ui/RelicSprite';
import { PotionSprite } from '@/ui/PotionSprite';
import { Button } from '@/ui/Button';
import { Theme } from '@/ui/theme';

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

    // Background
    this.add.rectangle(
      width / 2,
      height / 2,
      width,
      height,
      Theme.helpers.hexToColor(Theme.colors.background)
    ).setDepth(Theme.layers.background);

    // Title
    this.add.text(
      Theme.layout.getCenterX(width),
      Theme.layout.positions.topMargin,
      this.isTreasure ? 'TREASURE!' : 'VICTORY!',
      Theme.typography.styles.heading1
    ).setOrigin(0.5).setDepth(Theme.layers.ui);

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

    // Calculate content start position
    let currentY = Theme.layout.positions.topMargin + Theme.spacing.xxxl + Theme.spacing.lg;

    // Display gold reward
    if (this.goldReward > 0) {
      const goldText = this.add.text(
        Theme.layout.getCenterX(width),
        currentY,
        `+${this.goldReward} Gold`,
        {
          ...Theme.typography.styles.heading2,
          color: Theme.colors.gold,
        }
      );
      goldText.setOrigin(0.5);
      goldText.setDepth(Theme.layers.ui);

      // Animate gold collection
      this.tweens.add({
        targets: goldText,
        y: currentY - Theme.spacing.lg,
        scale: 1.2,
        duration: Theme.animation.fast,
        yoyo: true,
        ease: 'Power2',
      });

      // Add gold to player
      this.gameState.player.addGold(this.goldReward);
      currentY += Theme.spacing.xxxl + Theme.spacing.lg;
    }

    // Display potion drop
    if (this.potionDrop) {
      this.add.text(
        Theme.layout.getCenterX(width),
        currentY,
        'Potion Found!',
        {
          ...Theme.typography.styles.heading3,
          color: Theme.colors.info,
        }
      ).setOrigin(0.5).setDepth(Theme.layers.ui);

      currentY += Theme.spacing.xl + Theme.spacing.md;

      // Display potion
      const potionSprite = new PotionSprite(
        this,
        Theme.layout.getCenterX(width),
        currentY,
        this.potionDrop,
        0
      );
      potionSprite.setScale(1.5);
      potionSprite.setDepth(Theme.layers.ui);

      currentY += Theme.spacing.xxxl + Theme.spacing.md;

      // Potion name
      this.add.text(
        Theme.layout.getCenterX(width),
        currentY,
        this.potionDrop.name,
        Theme.typography.styles.body
      ).setOrigin(0.5).setDepth(Theme.layers.ui);

      currentY += Theme.spacing.xl;

      // Potion description
      this.add.text(
        Theme.layout.getCenterX(width),
        currentY,
        this.potionDrop.description,
        {
          ...Theme.typography.styles.small,
          color: Theme.colors.textSecondary,
          align: 'center',
          wordWrap: { width: 500 },
        }
      ).setOrigin(0.5).setDepth(Theme.layers.ui);

      // Add potion to player if there's space
      const success = this.gameState.player.addPotion(this.potionDrop);
      if (!success) {
        currentY += Theme.spacing.lg;
        this.add.text(
          Theme.layout.getCenterX(width),
          currentY,
          '(Potion inventory full - discarded)',
          {
            ...Theme.typography.styles.label,
            color: Theme.colors.danger,
            fontStyle: 'italic',
          }
        ).setOrigin(0.5).setDepth(Theme.layers.ui);
      }

      currentY += Theme.spacing.xxxl + Theme.spacing.lg;
    }

    // Display relic reward (treasure rooms)
    if (this.relicReward) {
      this.add.text(
        Theme.layout.getCenterX(width),
        currentY,
        'Relic Found!',
        {
          ...Theme.typography.styles.heading2,
          color: Theme.colors.gold,
        }
      ).setOrigin(0.5).setDepth(Theme.layers.ui);

      currentY += Theme.spacing.xl + Theme.spacing.md;

      // Display relic
      const relicSprite = new RelicSprite(
        this,
        Theme.layout.getCenterX(width),
        currentY,
        this.relicReward
      );
      relicSprite.setScale(2);
      relicSprite.setDepth(Theme.layers.ui);

      currentY += Theme.spacing.xxxl * 2;

      // Relic name and description
      this.add.text(
        Theme.layout.getCenterX(width),
        currentY,
        this.relicReward.name,
        {
          ...Theme.typography.styles.heading3,
          color: Theme.colors.text,
        }
      ).setOrigin(0.5).setDepth(Theme.layers.ui);

      currentY += Theme.spacing.xl + Theme.spacing.md;

      this.add.text(
        Theme.layout.getCenterX(width),
        currentY,
        this.relicReward.description,
        {
          ...Theme.typography.styles.small,
          color: Theme.colors.textSecondary,
          align: 'center',
          wordWrap: { width: 600 },
        }
      ).setOrigin(0.5).setDepth(Theme.layers.ui);

      // Add relic to player
      this.gameState.player.addRelic(this.relicReward);

      currentY += Theme.spacing.xxxl + Theme.spacing.lg;
    }

    // Display card rewards
    if (!this.isTreasure) {
      // Only show if not too far down the screen
      const cardPromptY = Math.max(currentY, 250);
      this.add.text(
        Theme.layout.getCenterX(width),
        cardPromptY,
        'Choose a card to add to your deck:',
        {
          ...Theme.typography.styles.heading3,
          color: Theme.colors.text,
        }
      ).setOrigin(0.5).setDepth(Theme.layers.ui);

      this.displayCardRewards();
    }

    // Skip and Continue buttons
    this.createActionButtons(width, height);
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
    const cardSpacing = Theme.spacing.xxxl * 3 + Theme.spacing.lg;
    const startX = Theme.layout.getCenterX(width) - ((this.cardRewards.length - 1) * cardSpacing) / 2;
    const cardY = 550; // Fixed position for cards to avoid overlap

    this.cardRewards.forEach((card, index) => {
      const cardSprite = new CardSprite(
        this,
        startX + index * cardSpacing,
        cardY,
        card
      );

      cardSprite.setInteractive({ useHandCursor: true });
      cardSprite.setDepth(Theme.layers.cards);

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
      y: sprite.y - Theme.spacing.xxxl,
      scale: 1.2,
      alpha: 0,
      duration: Theme.animation.slow,
      ease: 'Power2',
    });

    // Show selected message
    const selectedText = this.add.text(
      Theme.layout.getCenterX(this.cameras.main.width),
      800,
      `${card.name} added to deck!`,
      {
        ...Theme.typography.styles.heading3,
        color: Theme.colors.successLight,
      }
    );
    selectedText.setOrigin(0.5);
    selectedText.setDepth(Theme.layers.tooltips);
  }

  /**
   * Create action buttons (Skip and Continue)
   */
  private createActionButtons(width: number, height: number): void {
    const buttonY = height - Theme.layout.positions.bottomMargin;
    const buttonSpacing = 180;

    // Skip button (only for card rewards)
    if (!this.isTreasure) {
      new Button({
        scene: this,
        x: Theme.layout.getCenterX(width) - buttonSpacing,
        y: buttonY,
        text: 'Skip Reward',
        width: 200,
        style: 'secondary',
        onClick: () => {
          console.log('Skipped card reward');
        },
      });
    }

    // Continue button
    const continueX = this.isTreasure
      ? Theme.layout.getCenterX(width)
      : Theme.layout.getCenterX(width) + buttonSpacing;

    new Button({
      scene: this,
      x: continueX,
      y: buttonY,
      text: 'Continue',
      width: 200,
      style: 'success',
      onClick: () => {
        this.returnToMap();
      },
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
