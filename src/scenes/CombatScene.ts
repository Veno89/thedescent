import Phaser from 'phaser';
import { Player } from '@/entities/Player';
import { Enemy } from '@/entities/Enemy';
import { CombatManager } from '@/systems/CombatManager';
import { GameStateManager } from '@/systems/GameStateManager';
import { DataLoader } from '@/utils/DataLoader';
import { CardSprite } from '@/ui/CardSprite';
import { EnemySprite } from '@/ui/EnemySprite';
import { RelicSprite } from '@/ui/RelicSprite';

export class CombatScene extends Phaser.Scene {
  // Game entities
  private player!: Player;
  private combat!: CombatManager;
  private gameState: GameStateManager | null = null;
  private isElite = false;
  private isBoss = false;

  // UI Elements
  private cardSprites: CardSprite[] = [];
  private enemySprites: EnemySprite[] = [];
  private relicSprites: RelicSprite[] = [];

  // UI Text
  private playerHpText!: Phaser.GameObjects.Text;
  private playerBlockText!: Phaser.GameObjects.Text;
  private energyText!: Phaser.GameObjects.Text;
  private turnText!: Phaser.GameObjects.Text;
  private endTurnButton!: Phaser.GameObjects.Text;
  private drawPileText!: Phaser.GameObjects.Text;
  private discardPileText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'CombatScene' });
  }

  init(data: { gameState?: GameStateManager; isElite?: boolean; isBoss?: boolean }) {
    this.gameState = data.gameState || null;
    this.isElite = data.isElite || false;
    this.isBoss = data.isBoss || false;
  }

  create(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Initialize data
    DataLoader.initialize();

    // Use player from game state, or create test player
    if (this.gameState) {
      this.player = this.gameState.player;
    } else {
      this.player = new Player(80, 99);
      this.player.deck = DataLoader.createStarterDeck();
    }

    // Create enemies based on difficulty
    const enemies = this.createEnemies();

    // Create combat manager
    this.combat = new CombatManager(this.player, enemies);

    // Setup callbacks
    this.setupCombatCallbacks();

    // Create UI
    this.createUI(width, height);
    this.createEnemySprites(width);
    this.createRelicSprites();

    // Start combat
    this.combat.startCombat();
    this.updateUI();
    this.updateHand();

    // ESC to return to menu
    this.input.keyboard?.on('keydown-ESC', () => {
      this.scene.start('MainMenuScene');
    });

    console.log('Combat scene initialized!');
  }

  /**
   * Create enemies for combat based on difficulty
   */
  private createEnemies(): Enemy[] {
    const enemies: Enemy[] = [];

    if (this.isBoss) {
      // TODO: Create boss enemy
      const bossTemplate = DataLoader.getEnemy('jaw_worm');
      if (bossTemplate) {
        enemies.push(bossTemplate);
      }
    } else if (this.isElite) {
      // Elite: 1 tough enemy
      const eliteTemplate = DataLoader.getEnemy('jaw_worm');
      if (eliteTemplate) {
        enemies.push(eliteTemplate);
      }
    } else {
      // Normal: 1-2 random enemies
      const enemyCount = Math.random() < 0.5 ? 1 : 2;
      const allEnemies = DataLoader.getAllEnemies();

      for (let i = 0; i < enemyCount; i++) {
        const randomEnemy = allEnemies[Math.floor(Math.random() * allEnemies.length)];
        enemies.push(DataLoader.getEnemy(randomEnemy.id) || randomEnemy);
      }
    }

    return enemies;
  }

  /**
   * Setup combat event callbacks
   */
  private setupCombatCallbacks(): void {
    this.combat.onCardPlayed = (card, _target) => {
      console.log(`Played ${card.name}`);
      this.updateUI();
    };

    this.combat.onDamageDealt = (source, target, amount) => {
      console.log(`${source} dealt ${amount} damage to ${target}`);

      // Find enemy sprite and animate
      if (target !== 'player') {
        const enemySprite = this.enemySprites.find(
          (sprite) => sprite.getEnemy().name === target
        );
        if (enemySprite) {
          enemySprite.animateDamage(amount);
        }
      }
    };

    this.combat.onCombatEnd = (victory) => {
      this.showCombatEndScreen(victory);
    };
  }

  /**
   * Create UI elements
   */
  private createUI(width: number, height: number): void {
    // Title
    this.add.text(width / 2, 50, 'COMBAT', {
      fontSize: '36px',
      color: '#ffffff',
      fontStyle: 'bold',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Player HP
    this.playerHpText = this.add.text(100, height - 400, '', {
      fontSize: '24px',
      color: '#ff6b6b',
      fontStyle: 'bold',
      fontFamily: 'monospace',
    });

    // Player Block
    this.playerBlockText = this.add.text(100, height - 370, '', {
      fontSize: '20px',
      color: '#00ffff',
      fontFamily: 'monospace',
    });

    // Energy
    this.energyText = this.add.text(100, height - 340, '', {
      fontSize: '24px',
      color: '#4444ff',
      fontStyle: 'bold',
      fontFamily: 'monospace',
    });

    // Turn indicator
    this.turnText = this.add.text(width - 100, height - 400, '', {
      fontSize: '20px',
      color: '#ffffff',
      fontFamily: 'monospace',
    }).setOrigin(1, 0);

    // End Turn button
    this.endTurnButton = this.add.text(
      width - 100,
      height - 340,
      'END TURN',
      {
        fontSize: '24px',
        color: '#ffffff',
        fontStyle: 'bold',
        fontFamily: 'monospace',
        backgroundColor: '#4a4a4a',
        padding: { x: 20, y: 10 },
      }
    );
    this.endTurnButton.setOrigin(1, 0);
    this.endTurnButton.setInteractive({ useHandCursor: true });

    this.endTurnButton.on('pointerover', () => {
      this.endTurnButton.setStyle({ backgroundColor: '#6a6a6a' });
    });

    this.endTurnButton.on('pointerout', () => {
      this.endTurnButton.setStyle({ backgroundColor: '#4a4a4a' });
    });

    this.endTurnButton.on('pointerdown', () => {
      if (this.combat.isPlayerTurn && !this.combat.combatEnded) {
        this.combat.endPlayerTurn();
        this.updateUI();
        this.updateHand();
      }
    });

    // Draw pile counter
    this.drawPileText = this.add.text(100, height - 300, '', {
      fontSize: '18px',
      color: '#cccccc',
      fontFamily: 'monospace',
    });

    // Discard pile counter
    this.discardPileText = this.add.text(100, height - 270, '', {
      fontSize: '18px',
      color: '#cccccc',
      fontFamily: 'monospace',
    });

    // Player area background
    this.add.rectangle(
      width / 2,
      height - 150,
      width - 100,
      250,
      0x2a2a4a,
      0.3
    );

    // Instructions
    this.add.text(width / 2, height - 50, 'Click a card, then click an enemy to attack', {
      fontSize: '16px',
      color: '#888888',
      fontFamily: 'monospace',
      align: 'center',
    }).setOrigin(0.5);
  }

  /**
   * Create enemy sprites
   */
  private createEnemySprites(width: number): void {
    const enemies = this.combat.getAliveEnemies();
    const spacing = 250;
    const startX = width / 2 - ((enemies.length - 1) * spacing) / 2;

    enemies.forEach((enemy, index) => {
      const sprite = new EnemySprite(this, startX + index * spacing, 300, enemy);
      this.enemySprites.push(sprite);

      // Make enemy clickable for targeting
      sprite.on('pointerdown', () => {
        this.onEnemyClicked(sprite);
      });
    });
  }

  /**
   * Create relic sprites
   */
  private createRelicSprites(): void {
    const relics = this.player.relics;
    const spacing = 70;
    const startX = 100;
    const y = 110;

    relics.forEach((relic, index) => {
      const sprite = new RelicSprite(this, startX + index * spacing, y, relic);
      this.relicSprites.push(sprite);
    });
  }

  /**
   * Update UI elements
   */
  private updateUI(): void {
    const player = this.combat.player;

    // Player stats
    this.playerHpText.setText(`HP: ${player.currentHp}/${player.maxHp}`);
    this.playerBlockText.setText(`Block: ${player.block}`);
    this.energyText.setText(`Energy: ${player.energy}/${player.maxEnergy}`);

    // Turn info
    this.turnText.setText(`Turn ${this.combat.turn}`);

    // Pile counts
    this.drawPileText.setText(`Draw: ${this.combat.drawPile.length}`);
    this.discardPileText.setText(`Discard: ${this.combat.discardPile.length}`);

    // Update enemy sprites
    this.enemySprites.forEach((sprite) => sprite.update());

    // Update card playability
    this.updateCardPlayability();
  }

  /**
   * Update hand display
   */
  private updateHand(): void {
    // Remove old card sprites
    this.cardSprites.forEach((sprite) => sprite.destroy());
    this.cardSprites = [];

    // Create new card sprites
    const hand = this.combat.hand;
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const cardY = height - 150;

    const cardSpacing = 200;
    const maxWidth = width - 200;
    const actualSpacing = Math.min(cardSpacing, maxWidth / hand.length);
    const startX = width / 2 - ((hand.length - 1) * actualSpacing) / 2;

    hand.forEach((card, index) => {
      const cardSprite = new CardSprite(
        this,
        startX + index * actualSpacing,
        cardY,
        card
      );
      this.cardSprites.push(cardSprite);

      cardSprite.drawAnimation();

      // Make card clickable
      cardSprite.on('pointerdown', () => {
        this.onCardClicked(cardSprite);
      });
    });

    this.updateCardPlayability();
  }

  /**
   * Update which cards can be played
   */
  private updateCardPlayability(): void {
    this.cardSprites.forEach((sprite) => {
      const card = sprite.getCard();
      const canAfford = this.combat.player.energy >= card.cost;
      sprite.setPlayable(canAfford && this.combat.isPlayerTurn);
    });
  }

  /**
   * Handle card clicked
   */
  private onCardClicked(cardSprite: CardSprite): void {
    if (!this.combat.isPlayerTurn || this.combat.combatEnded) return;

    const card = cardSprite.getCard();

    // Check if card needs a target
    if (card.targetType === 'SINGLE_ENEMY') {
      // Highlight enemies for targeting
      this.highlightEnemiesForTargeting(cardSprite);
    } else {
      // Play card immediately (self-target or AOE)
      this.playCard(cardSprite, undefined);
    }
  }

  /**
   * Highlight enemies for targeting
   */
  private highlightEnemiesForTargeting(cardSprite: CardSprite): void {
    // Store the selected card for when enemy is clicked
    cardSprite.setData('awaitingTarget', true);

    // Highlight all alive enemies
    this.enemySprites.forEach((sprite) => {
      if (!sprite.getEnemy().isDead()) {
        sprite.setSelected(true);
      }
    });
  }

  /**
   * Handle enemy clicked
   */
  private onEnemyClicked(enemySprite: EnemySprite): void {
    if (enemySprite.getEnemy().isDead()) return;

    // Check if any card is awaiting a target
    const awaitingCard = this.cardSprites.find((sprite) => sprite.getData('awaitingTarget'));

    if (awaitingCard) {
      // Play the card on this enemy
      this.playCard(awaitingCard, enemySprite.getEnemy());

      // Clear targeting state
      this.cardSprites.forEach((sprite) => sprite.setData('awaitingTarget', false));
      this.enemySprites.forEach((sprite) => sprite.setSelected(false));
    }
  }

  /**
   * Play a card
   */
  private playCard(cardSprite: CardSprite, target?: Enemy): void {
    const card = cardSprite.getCard();
    const success = this.combat.playCard(card, target);

    if (success) {
      // Animate card being played
      cardSprite.playAnimation(() => {
        this.updateHand();
      });

      this.updateUI();
    }
  }

  /**
   * Show combat end screen
   */
  private showCombatEndScreen(victory: boolean): void {
    if (victory) {
      // Calculate rewards
      const goldReward = this.calculateGoldReward();

      // Delay before transitioning to rewards
      this.time.delayedCall(1000, () => {
        if (this.gameState) {
          this.scene.start('RewardScene', { gameState: this.gameState, goldReward });
        } else {
          // Test mode: just go back to menu
          this.scene.start('MainMenuScene');
        }
      });
    } else {
      // Defeat: return to menu
      this.time.delayedCall(2000, () => {
        this.scene.start('MainMenuScene');
      });
    }

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Result text
    const resultText = this.add.text(
      width / 2,
      height / 2,
      victory ? 'VICTORY!' : 'DEFEAT',
      {
        fontSize: '72px',
        color: victory ? '#00ff00' : '#ff0000',
        fontStyle: 'bold',
        fontFamily: 'monospace',
      }
    );
    resultText.setOrigin(0.5);
    resultText.setDepth(1001);

    // Fade in effect
    resultText.setAlpha(0);
    this.tweens.add({
      targets: resultText,
      alpha: 1,
      duration: 500,
      ease: 'Power2',
    });
  }

  /**
   * Calculate gold reward based on enemies
   */
  private calculateGoldReward(): number {
    let gold = 0;

    this.combat.enemies.forEach(_enemy => {
      // Base gold per enemy
      gold += 10 + Math.floor(Math.random() * 10);
    });

    // Bonus for elite/boss
    if (this.isElite) gold = Math.floor(gold * 1.5);
    if (this.isBoss) gold = Math.floor(gold * 2);

    // Floor bonus
    if (this.gameState) {
      gold += this.gameState.currentFloor * 2;
    }

    return gold;
  }
}
