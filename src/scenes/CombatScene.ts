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
import { UICard } from '@/ui/UICard';
import { Button } from '@/ui/Button';
import { ProgressBar } from '@/ui/ProgressBar';
import { Theme } from '@/ui/theme';

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

  // UI Components
  private playerStatsCard!: UICard;
  private hpBar!: ProgressBar;
  private energyBar!: ProgressBar;
  private playerBlockText!: Phaser.GameObjects.Text;
  private turnText!: Phaser.GameObjects.Text;
  private endTurnButton!: Button;
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
      console.log(`Using player from game state: HP=${this.player.currentHp}/${this.player.maxHp}`);
    } else {
      this.player = new Player(80, 99);
      this.player.deck = DataLoader.createStarterDeck();
      console.log('Created test player');
    }

    // Create enemies based on difficulty
    const enemies = this.createEnemies();
    console.log(`Created ${enemies.length} enemies for combat`);

    // Create combat manager
    this.combat = new CombatManager(this.player, enemies);
    console.log(`CombatManager initialized with ${this.combat.enemies.length} enemies`);

    // Setup callbacks
    this.setupCombatCallbacks();

    // Create UI
    this.createUI(width, height);
    console.log('UI created');

    this.createEnemySprites(width);
    console.log(`After createEnemySprites: ${this.enemySprites.length} sprites`);

    this.createRelicSprites();
    this.createPotionSprites(width, height);

    // Start combat
    this.combat.startCombat();
    this.updateHand(); // Create cards FIRST
    this.updateUI();   // Then update UI

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
      console.log(`Normal combat: ${enemyCount} enemies needed, ${normalEnemies.length} normal enemies available`);
      console.log('Normal enemy IDs:', normalEnemies.map(e => `${e.id}(${e.type})`));

      for (let i = 0; i < enemyCount; i++) {
        if (normalEnemies.length > 0) {
          const randomEnemy = normalEnemies[Math.floor(Math.random() * normalEnemies.length)];
          console.log(`Selecting random enemy: ${randomEnemy.id} (${randomEnemy.type})`);
          const enemy = DataLoader.getEnemy(randomEnemy.id);
          console.log(`Got enemy instance:`, enemy ? `${enemy.name} (${enemy.type})` : 'undefined');
          if (enemy) enemies.push(enemy);
        }
      }
    }

    console.log(`createEnemies returning ${enemies.length} enemies`);
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
          // Show floating damage number
          this.showDamageNumber(enemySprite.x, enemySprite.y - 50, amount, 0xff4444);
        }
      } else {
        // Player took damage
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        this.showDamageNumber(width / 2, height - 200, amount, 0xff0000);

        // Screen shake on player damage
        this.cameras.main.shake(200, 0.005);
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
    // Combat title with act/floor indicator
    const combatType = this.isBoss ? 'BOSS' : this.isElite ? 'ELITE COMBAT' : 'COMBAT';
    this.add.text(width / 2, Theme.spacing.xxxl, combatType, {
      ...Theme.typography.styles.heading1,
      color: this.isBoss
        ? Theme.colors.boss
        : this.isElite
        ? Theme.colors.elite
        : Theme.colors.text,
    }).setOrigin(0.5);

    // Player stats card (left side)
    this.playerStatsCard = new UICard({
      scene: this,
      x: 220,
      y: height / 2 - 50,
      width: 350,
      height: 350,
      title: 'PLAYER',
      backgroundColor: Theme.helpers.hexToColor(Theme.colors.backgroundLight),
      borderColor: Theme.helpers.hexToColor(Theme.colors.primary),
      alpha: 0.92,
    });

    const statsStartY = this.playerStatsCard.getContentStartY();

    // HP Progress Bar
    this.hpBar = new ProgressBar({
      scene: this,
      x: -this.playerStatsCard.width / 2 + Theme.spacing.lg,
      y: statsStartY,
      width: this.playerStatsCard.width - Theme.spacing.xl * 2,
      height: Theme.dimensions.progressBar.height,
      barColor: Theme.helpers.hexToColor(Theme.colors.danger),
      showLabel: true,
      labelStyle: 'both',
    });
    this.playerStatsCard.add(this.hpBar);

    this.playerStatsCard.addText(
      'HEALTH',
      -this.playerStatsCard.width / 2 + Theme.spacing.lg,
      statsStartY - Theme.spacing.lg,
      {
        ...Theme.typography.styles.label,
        color: Theme.colors.textSecondary,
      }
    );

    // Energy Progress Bar
    this.energyBar = new ProgressBar({
      scene: this,
      x: -this.playerStatsCard.width / 2 + Theme.spacing.lg,
      y: statsStartY + Theme.spacing.xxxl + Theme.spacing.md,
      width: this.playerStatsCard.width - Theme.spacing.xl * 2,
      height: Theme.dimensions.progressBar.height,
      barColor: Theme.helpers.hexToColor(Theme.colors.info),
      showLabel: true,
      labelStyle: 'both',
    });
    this.playerStatsCard.add(this.energyBar);

    this.playerStatsCard.addText(
      'ENERGY',
      -this.playerStatsCard.width / 2 + Theme.spacing.lg,
      statsStartY + Theme.spacing.xxxl + Theme.spacing.md - Theme.spacing.lg,
      {
        ...Theme.typography.styles.label,
        color: Theme.colors.textSecondary,
      }
    );

    // Block Display
    this.playerBlockText = this.playerStatsCard.addText(
      '',
      -this.playerStatsCard.width / 2 + Theme.spacing.lg,
      statsStartY + (Theme.spacing.xxxl + Theme.spacing.md) * 2,
      {
        ...Theme.typography.styles.heading3,
        color: Theme.colors.info,
      }
    );

    // Deck management buttons
    const deckButtonY = statsStartY + (Theme.spacing.xxxl + Theme.spacing.md) * 2 + Theme.spacing.xxxl;

    this.drawPileText = this.playerStatsCard.addText(
      '',
      -this.playerStatsCard.width / 2 + Theme.spacing.lg,
      deckButtonY,
      Theme.typography.styles.small
    );
    this.drawPileText.setInteractive({ useHandCursor: true });
    this.drawPileText.on('pointerover', () => {
      this.drawPileText.setColor(Theme.colors.gold);
    });
    this.drawPileText.on('pointerout', () => {
      this.drawPileText.setColor(Theme.colors.text);
    });
    this.drawPileText.on('pointerdown', () => {
      this.openDeckView('DRAW');
    });

    this.discardPileText = this.playerStatsCard.addText(
      '',
      -this.playerStatsCard.width / 2 + Theme.spacing.lg,
      deckButtonY + Theme.spacing.lg,
      Theme.typography.styles.small
    );
    this.discardPileText.setInteractive({ useHandCursor: true });
    this.discardPileText.on('pointerover', () => {
      this.discardPileText.setColor(Theme.colors.gold);
    });
    this.discardPileText.on('pointerout', () => {
      this.discardPileText.setColor(Theme.colors.text);
    });
    this.discardPileText.on('pointerdown', () => {
      this.openDeckView('DISCARD');
    });

    new Button({
      scene: this,
      x: this.playerStatsCard.x,
      y: this.playerStatsCard.y + this.playerStatsCard.height / 2 - Theme.spacing.xxxl,
      text: 'VIEW DECK',
      width: this.playerStatsCard.width - Theme.spacing.xl * 2,
      height: Theme.dimensions.button.height - Theme.spacing.md,
      style: 'secondary',
      onClick: () => this.openDeckView('DECK'),
    });

    // Turn/Actions card (right side, more visible)
    const actionsCard = new UICard({
      scene: this,
      x: width - 180,
      y: height / 2 - 100,
      width: 280,
      height: 250,
      title: 'TURN INFO',
      backgroundColor: Theme.helpers.hexToColor(Theme.colors.backgroundLight),
      borderColor: Theme.helpers.hexToColor(Theme.colors.gold),
      alpha: 0.95,
    });

    const turnStartY = actionsCard.getContentStartY();

    this.turnText = actionsCard.addText(
      '',
      0,
      turnStartY + Theme.spacing.md,
      {
        ...Theme.typography.styles.heading2,
        align: 'center',
      }
    ).setOrigin(0.5, 0);

    // End Turn Button - large and prominent
    this.endTurnButton = new Button({
      scene: this,
      x: actionsCard.x,
      y: actionsCard.y + actionsCard.height / 2 - Theme.spacing.xxxl - Theme.spacing.md,
      text: '⏭️ END TURN',
      width: actionsCard.width - Theme.spacing.xl * 2,
      height: Theme.dimensions.button.height + Theme.spacing.md,
      style: 'primary',
      onClick: () => {
        if (this.combat.isPlayerTurn && !this.combat.combatEnded) {
          this.combat.endPlayerTurn();
          this.updateHand();
          this.updateUI();
        }
      },
    });

    // Player area background (hand)
    this.add.rectangle(
      width / 2,
      height - 150,
      width - 100,
      250,
      Theme.helpers.hexToColor(Theme.colors.backgroundLight),
      0.4
    );

    // Instructions
    this.add
      .text(width / 2, height - Theme.spacing.xxxl, 'Drag cards onto enemies to attack • Click self-target cards to play', {
        ...Theme.typography.styles.small,
        color: Theme.colors.textMuted,
        align: 'center',
      })
      .setOrigin(0.5);
  }

  /**
   * Create enemy sprites
   */
  private createEnemySprites(width: number): void {
    const enemies = this.combat.getAliveEnemies();
    console.log(`Creating ${enemies.length} enemy sprites`);

    const spacing = 250;
    const startX = width / 2 - ((enemies.length - 1) * spacing) / 2;

    enemies.forEach((enemy, index) => {
      const x = startX + index * spacing;
      const y = 300;
      console.log(`Creating enemy sprite for ${enemy.name} at (${x}, ${y})`);

      const sprite = new EnemySprite(this, x, y, enemy);
      this.enemySprites.push(sprite);

      // Make enemy clickable for targeting
      sprite.on('pointerdown', () => {
        this.onEnemyClicked(sprite);
      });
    });

    console.log(`Total enemy sprites created: ${this.enemySprites.length}`);
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

    // Update HP bar with animation
    this.hpBar.setValues(player.currentHp, player.maxHp, true);

    // Update HP bar color based on percentage
    const hpPercent = this.hpBar.getPercentage();
    if (hpPercent < 0.3) {
      this.hpBar.setBarColor(Theme.helpers.hexToColor(Theme.colors.danger));
    } else if (hpPercent < 0.6) {
      this.hpBar.setBarColor(Theme.helpers.hexToColor(Theme.colors.warning));
    } else {
      this.hpBar.setBarColor(Theme.helpers.hexToColor(Theme.colors.success));
    }

    // Update Energy bar with animation
    this.energyBar.setValues(player.energy, player.maxEnergy, true);

    // Update Block display
    if (player.block > 0) {
      this.playerBlockText.setText(`🛡️ Block: ${player.block}`);
      this.playerBlockText.setVisible(true);
    } else {
      this.playerBlockText.setVisible(false);
    }

    // Turn info
    this.turnText.setText(`Turn ${this.combat.turn}`);

    // Pile counts
    this.drawPileText.setText(`📚 Draw: ${this.combat.drawPile.length}`);
    this.discardPileText.setText(`🗑️ Discard: ${this.combat.discardPile.length}`);

    // Update enemy sprites
    this.enemySprites.forEach((sprite) => sprite.update());

    // Update card playability
    this.updateCardPlayability();

    // Update end turn button state
    if (!this.combat.isPlayerTurn || this.combat.combatEnded) {
      this.endTurnButton.disable();
    } else {
      this.endTurnButton.enable();
    }
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
      const originalX = startX + index * actualSpacing;
      const originalY = cardY;

      const cardSprite = new CardSprite(
        this,
        originalX,
        originalY,
        card
      );
      this.cardSprites.push(cardSprite);

      cardSprite.drawAnimation();

      // Store original position for returning card to hand
      cardSprite.setData('originalX', originalX);
      cardSprite.setData('originalY', originalY);
      cardSprite.setData('isDragging', false);

      // Enable drag-and-drop
      this.input.setDraggable(cardSprite);

      // Drag start - lift card and make it larger
      cardSprite.on('dragstart', () => {
        const canPlay = this.combat.player.energy >= card.cost && this.combat.isPlayerTurn;
        if (!canPlay) return;

        cardSprite.setData('isDragging', true);
        cardSprite.setDepth(1000); // Bring to front

        this.tweens.add({
          targets: cardSprite,
          scaleX: 1.2,
          scaleY: 1.2,
          duration: 100,
          ease: 'Power2',
        });
      });

      // During drag - follow mouse
      cardSprite.on('drag', (_pointer: any, dragX: number, dragY: number) => {
        if (!cardSprite.getData('isDragging')) return;

        cardSprite.x = dragX;
        cardSprite.y = dragY;

        // Check if hovering over an enemy and highlight them
        this.enemySprites.forEach((enemySprite) => {
          const enemy = enemySprite.getEnemy();
          if (enemy.isDead()) return;

          const bounds = enemySprite.getBounds();
          if (bounds.contains(dragX, dragY)) {
            enemySprite.setSelected(true);
          } else {
            enemySprite.setSelected(false);
          }
        });
      });

      // Drag end - play card or return to hand
      cardSprite.on('dragend', (_pointer: any, _dragX: number, _dragY: number, _dropped: boolean) => {
        if (!cardSprite.getData('isDragging')) return;

        cardSprite.setData('isDragging', false);

        // Check if dropped on an enemy
        let targetEnemySprite: EnemySprite | undefined;
        this.enemySprites.forEach((enemySprite) => {
          const enemy = enemySprite.getEnemy();
          if (enemy.isDead()) return;

          const bounds = enemySprite.getBounds();
          if (bounds.contains(cardSprite.x, cardSprite.y)) {
            targetEnemySprite = enemySprite;
          }
          enemySprite.setSelected(false);
        });

        if (targetEnemySprite && card.targetType === 'SINGLE_ENEMY') {
          // Play card on target - pass the Enemy entity, not the sprite
          const targetEnemy = targetEnemySprite.getEnemy();
          this.playCard(cardSprite, targetEnemy);
        } else if (!targetEnemySprite && card.targetType !== 'SINGLE_ENEMY') {
          // Self-target or AOE card - play it
          this.playCard(cardSprite, undefined);
        } else {
          // Return to hand
          this.tweens.add({
            targets: cardSprite,
            x: cardSprite.getData('originalX'),
            y: cardSprite.getData('originalY'),
            scaleX: 1,
            scaleY: 1,
            duration: 200,
            ease: 'Power2',
          });
          cardSprite.setDepth(10);
        }
      });

      // Keep old click behavior as fallback
      cardSprite.on('pointerdown', () => {
        // Only trigger if not dragging
        if (!cardSprite.getData('isDragging')) {
          this.onCardClicked(cardSprite);
        }
      });
    });

    this.updateCardPlayability();
  }

  /**
   * Update which cards can be played
   */
  private updateCardPlayability(): void {
    this.cardSprites.forEach((sprite) => {
      // Safety check: ensure sprite hasn't been destroyed
      if (!sprite.scene) return;

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
      try {
        cardSprite.playAnimation(() => {
          this.updateHand();
          this.updateUI();
        });
      } catch (error) {
        // If animation fails, still update hand and UI
        console.warn('Card animation failed:', error);
        this.updateHand();
        this.updateUI();
      }
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
   * Show floating damage number
   */
  private showDamageNumber(x: number, y: number, amount: number, color: number): void {
    const damageText = this.add.text(x, y, `-${amount}`, {
      fontSize: '48px',
      color: `#${color.toString(16).padStart(6, '0')}`,
      fontStyle: 'bold',
      fontFamily: 'monospace',
      stroke: '#000000',
      strokeThickness: 4,
    });
    damageText.setOrigin(0.5);
    damageText.setDepth(1000);

    // Animate floating up and fading out
    this.tweens.add({
      targets: damageText,
      y: y - 100,
      alpha: 0,
      scale: 1.5,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => {
        damageText.destroy();
      },
    });
  }

  /**
   * Calculate gold reward based on enemies
   */
  private calculateGoldReward(): number {
    let gold = 0;

    this.combat.enemies.forEach(_enemy => {
      // Base gold per enemy: 12-25 (increased from 10-20)
      gold += 12 + Math.floor(Math.random() * 14);
    });

    // Bonus for elite/boss (increased multipliers)
    if (this.isElite) gold = Math.floor(gold * 2); // Increased from 1.5x to 2x
    if (this.isBoss) gold = Math.floor(gold * 3); // Increased from 2x to 3x

    // Floor bonus (increased)
    if (this.gameState) {
      gold += this.gameState.currentFloor * 3; // Increased from 2 to 3
    }

    return gold;
  }
}
