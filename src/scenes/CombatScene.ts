import Phaser from 'phaser';
import { Player } from '@/entities/Player';
import { Enemy } from '@/entities/Enemy';
import { CombatManager } from '@/systems/CombatManager';
import { GameStateManager } from '@/systems/GameStateManager';
import { DataLoader } from '@/utils/DataLoader';
import { CardSprite } from '@/ui/CardSprite';
import { EnemySprite } from '@/ui/EnemySprite';
import { RelicSprite } from '@/ui/RelicSprite';
import { PotionSprite } from '@/ui/PotionSprite';

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
  private potionSprites: PotionSprite[] = [];

  // Selection state
  private selectedPotionIndex: number | null = null;

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
    this.createPotionSprites(width, height);

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
      // Boss: 1 boss enemy
      const boss = DataLoader.getRandomEnemyByType('boss');
      if (boss) {
        enemies.push(boss);
      }
    } else if (this.isElite) {
      // Elite: 1-3 elite enemies (sentries come in packs)
      const elite = DataLoader.getRandomEnemyByType('elite');
      if (elite) {
        if (elite.id === 'sentry') {
          // Sentries come in groups of 3
          for (let i = 0; i < 3; i++) {
            const sentry = DataLoader.getEnemy('sentry');
            if (sentry) enemies.push(sentry);
          }
        } else {
          enemies.push(elite);
        }
      }
    } else {
      // Normal: 1-3 random normal enemies
      const enemyCount = Math.floor(Math.random() * 3) + 1; // 1-3 enemies
      const normalEnemies = DataLoader.getEnemiesByType('normal');

      for (let i = 0; i < enemyCount; i++) {
        if (normalEnemies.length > 0) {
          const randomEnemy = normalEnemies[Math.floor(Math.random() * normalEnemies.length)];
          const enemy = DataLoader.getEnemy(randomEnemy.id);
          if (enemy) enemies.push(enemy);
        }
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

    // Draw pile counter (clickable)
    this.drawPileText = this.add.text(100, height - 300, '', {
      fontSize: '18px',
      color: '#4a9eff',
      fontFamily: 'monospace',
      backgroundColor: '#1a1a1a',
      padding: { x: 10, y: 5 },
    });
    this.drawPileText.setInteractive({ useHandCursor: true });
    this.drawPileText.on('pointerover', () => {
      this.drawPileText.setStyle({ backgroundColor: '#2a2a4a', color: '#ffd700' });
    });
    this.drawPileText.on('pointerout', () => {
      this.drawPileText.setStyle({ backgroundColor: '#1a1a1a', color: '#4a9eff' });
    });
    this.drawPileText.on('pointerdown', () => {
      this.openDeckView('DRAW');
    });

    // Discard pile counter (clickable)
    this.discardPileText = this.add.text(100, height - 270, '', {
      fontSize: '18px',
      color: '#4a9eff',
      fontFamily: 'monospace',
      backgroundColor: '#1a1a1a',
      padding: { x: 10, y: 5 },
    });
    this.discardPileText.setInteractive({ useHandCursor: true });
    this.discardPileText.on('pointerover', () => {
      this.discardPileText.setStyle({ backgroundColor: '#2a2a4a', color: '#ffd700' });
    });
    this.discardPileText.on('pointerout', () => {
      this.discardPileText.setStyle({ backgroundColor: '#1a1a1a', color: '#4a9eff' });
    });
    this.discardPileText.on('pointerdown', () => {
      this.openDeckView('DISCARD');
    });

    // View Deck button
    const viewDeckButton = this.add.text(100, height - 240, 'View Deck', {
      fontSize: '18px',
      color: '#00ff00',
      fontFamily: 'monospace',
      backgroundColor: '#1a1a1a',
      padding: { x: 10, y: 5 },
    });
    viewDeckButton.setInteractive({ useHandCursor: true });
    viewDeckButton.on('pointerover', () => {
      viewDeckButton.setStyle({ backgroundColor: '#2a2a4a', color: '#ffd700' });
    });
    viewDeckButton.on('pointerout', () => {
      viewDeckButton.setStyle({ backgroundColor: '#1a1a1a', color: '#00ff00' });
    });
    viewDeckButton.on('pointerdown', () => {
      this.openDeckView('DECK');
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
   * Create potion sprites
   */
  private createPotionSprites(width: number, height: number): void {
    const spacing = 60;
    const startX = width - 100;
    const y = height - 350;

    // Create slots for max potions
    for (let i = 0; i < this.player.maxPotions; i++) {
      const potion = this.player.potions[i] || null;
      const sprite = new PotionSprite(this, startX, y + i * spacing, potion, i);
      this.potionSprites.push(sprite);

      // Handle potion clicks
      sprite.on('potionClicked', (slotIndex: number) => {
        this.onPotionClicked(slotIndex);
      });
    }
  }

  /**
   * Handle potion click
   */
  private onPotionClicked(slotIndex: number): void {
    if (this.combat.combatEnded || !this.combat.isPlayerTurn) return;

    const potion = this.player.potions[slotIndex];
    if (!potion) {
      console.log('No potion in that slot');
      return;
    }

    // Check if potion requires target
    if (potion.requiresTarget()) {
      // Set selected potion and wait for enemy click
      this.selectedPotionIndex = slotIndex;
      console.log(`Select an enemy to use ${potion.name}`);
    } else {
      // Use potion immediately (no target required)
      const success = this.combat.usePotion(slotIndex);
      if (success) {
        this.updatePotionDisplay();
        this.updateUI();
      }
    }
  }

  /**
   * Update potion display
   */
  private updatePotionDisplay(): void {
    this.potionSprites.forEach((sprite, index) => {
      const potion = this.player.potions[index] || null;
      sprite.updatePotion(potion);
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

    // Check if a potion is selected and waiting for a target
    if (this.selectedPotionIndex !== null) {
      // Use the potion on this enemy
      const success = this.combat.usePotion(this.selectedPotionIndex, enemySprite.getEnemy());
      if (success) {
        this.updatePotionDisplay();
        this.updateUI();
      }

      // Clear potion selection
      this.selectedPotionIndex = null;
      return;
    }

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
      // Check if this was a boss fight - if so, show victory screen
      if (this.isBoss && this.gameState) {
        this.time.delayedCall(1000, () => {
          this.scene.start('VictoryScene', {
            gameState: this.gameState
          });
        });
      } else {
        // Regular combat victory: calculate rewards
        const goldReward = this.calculateGoldReward();

        // Random potion drop (40% chance)
        const potionDrop = Math.random() < 0.4 ? DataLoader.getRandomWeightedPotion() : null;

        // Delay before transitioning to rewards
        this.time.delayedCall(1000, () => {
          if (this.gameState) {
            this.scene.start('RewardScene', {
              gameState: this.gameState,
              goldReward,
              potionDrop
            });
          } else {
            // Test mode: just go back to menu
            this.scene.start('MainMenuScene');
          }
        });
      }
    } else {
      // Defeat: determine what killed the player
      let killedBy = 'Unknown';
      const aliveEnemies = this.combat.enemies.filter(e => !e.isDead());
      if (aliveEnemies.length > 0) {
        killedBy = aliveEnemies[0].name;
      }

      // Delay before transitioning to defeat screen
      this.time.delayedCall(2000, () => {
        if (this.gameState) {
          this.scene.start('DefeatScene', {
            gameState: this.gameState,
            killedBy
          });
        } else {
          // Test mode: just go back to menu
          this.scene.start('MainMenuScene');
        }
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
   * Open deck view scene
   */
  private openDeckView(mode: 'DECK' | 'DRAW' | 'DISCARD' | 'EXHAUST'): void {
    if (this.combat.combatEnded) return;

    this.scene.pause();
    this.scene.launch('DeckViewScene', {
      cards: this.player.deck,
      discardPile: this.combat.discardPile,
      drawPile: this.combat.drawPile,
      exhaustPile: this.combat.exhaustPile,
      returnScene: 'CombatScene',
      viewMode: mode,
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
