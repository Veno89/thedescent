import Phaser from 'phaser';
import { Enemy } from '@/entities/Enemy';

/**
 * Visual representation of an enemy in Phaser
 */
export class EnemySprite extends Phaser.GameObjects.Container {
  private enemy: Enemy;
  private background!: Phaser.GameObjects.Rectangle;
  private nameText!: Phaser.GameObjects.Text;
  private hpText!: Phaser.GameObjects.Text;
  private hpBar!: Phaser.GameObjects.Rectangle;
  private hpBarBg!: Phaser.GameObjects.Rectangle;
  private blockText: Phaser.GameObjects.Text | null = null;
  private intentIcon!: Phaser.GameObjects.Text;
  private intentText!: Phaser.GameObjects.Text;

  private readonly WIDTH = 200;
  private readonly HEIGHT = 280;

  private isSelected = false;

  constructor(scene: Phaser.Scene, x: number, y: number, enemy: Enemy) {
    super(scene, x, y);
    this.enemy = enemy;

    console.log(`EnemySprite constructor: ${enemy.name} at (${x}, ${y})`);

    this.createEnemy();
    this.setupInteraction();

    scene.add.existing(this);

    console.log(`EnemySprite added to scene: ${enemy.name}, visible=${this.visible}, alpha=${this.alpha}`);
  }

  /**
   * Create the visual enemy elements
   */
  private createEnemy(): void {
    // Enemy background/body
    this.background = this.scene.add.rectangle(
      0,
      0,
      this.WIDTH,
      this.HEIGHT,
      0x4a2a2a,
      0.9
    );
    this.background.setStrokeStyle(3, 0xff0000);
    this.add(this.background);

    // Enemy name
    this.nameText = this.scene.add.text(0, -110, this.enemy.name, {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold',
      fontFamily: 'monospace',
      align: 'center',
    });
    this.nameText.setOrigin(0.5);
    this.add(this.nameText);

    // Enemy art placeholder
    const artBg = this.scene.add.rectangle(0, -20, this.WIDTH - 40, 120, 0x333333);
    this.add(artBg);

    const artText = this.scene.add.text(0, -20, '[Enemy Sprite]', {
      fontSize: '14px',
      color: '#666666',
      fontFamily: 'monospace',
    });
    artText.setOrigin(0.5);
    this.add(artText);

    // HP bar background
    this.hpBarBg = this.scene.add.rectangle(0, 60, this.WIDTH - 40, 20, 0x330000);
    this.add(this.hpBarBg);

    // HP bar
    this.hpBar = this.scene.add.rectangle(
      -(this.WIDTH - 40) / 2,
      60,
      this.WIDTH - 40,
      20,
      0xff0000
    );
    this.hpBar.setOrigin(0, 0.5);
    this.add(this.hpBar);

    // HP text
    this.hpText = this.scene.add.text(
      0,
      60,
      `${this.enemy.currentHp}/${this.enemy.maxHp}`,
      {
        fontSize: '14px',
        color: '#ffffff',
        fontStyle: 'bold',
        fontFamily: 'monospace',
      }
    );
    this.hpText.setOrigin(0.5);
    this.add(this.hpText);

    // Intent display (above enemy)
    this.intentIcon = this.scene.add.text(0, -135, this.getIntentIcon(), {
      fontSize: '24px',
      color: '#ffff00',
      fontStyle: 'bold',
      fontFamily: 'monospace',
    });
    this.intentIcon.setOrigin(0.5);
    this.add(this.intentIcon);

    this.intentText = this.scene.add.text(
      0,
      -155,
      this.enemy.getIntentValue().toString(),
      {
        fontSize: '18px',
        color: '#ffffff',
        fontStyle: 'bold',
        fontFamily: 'monospace',
      }
    );
    this.intentText.setOrigin(0.5);
    this.add(this.intentText);

    // Block display (if any)
    this.updateBlock();

    // Status effects
    this.updateStatusEffects();
  }

  /**
   * Get intent icon based on intent type
   */
  private getIntentIcon(): string {
    switch (this.enemy.getIntent().type) {
      case 'ATTACK':
        return '⚔️';
      case 'DEFEND':
        return '🛡️';
      case 'BUFF':
        return '⬆️';
      case 'DEBUFF':
        return '⬇️';
      case 'UNKNOWN':
        return '❓';
      default:
        return '?';
    }
  }

  /**
   * Setup interaction
   */
  private setupInteraction(): void {
    this.setSize(this.WIDTH, this.HEIGHT);
    this.setInteractive({ useHandCursor: true });

    this.on('pointerover', () => {
      if (!this.enemy.isDead()) {
        this.background.setStrokeStyle(4, 0xffff00);
      }
    });

    this.on('pointerout', () => {
      if (!this.isSelected) {
        this.background.setStrokeStyle(3, 0xff0000);
      }
    });
  }

  /**
   * Update enemy visual state
   */
  update(): void {
    // Update HP bar
    const hpPercent = this.enemy.currentHp / this.enemy.maxHp;
    this.hpBar.width = (this.WIDTH - 40) * hpPercent;
    this.hpText.setText(`${this.enemy.currentHp}/${this.enemy.maxHp}`);

    // Update intent
    this.intentIcon.setText(this.getIntentIcon());
    const intentValue = this.enemy.getIntentValue();
    this.intentText.setText(intentValue > 0 ? intentValue.toString() : '');

    // Update block
    this.updateBlock();

    // Update status effects
    this.updateStatusEffects();

    // Gray out if dead
    if (this.enemy.isDead()) {
      this.setAlpha(0.5);
      this.disableInteractive();
    }
  }

  /**
   * Update block display
   */
  private updateBlock(): void {
    if (this.enemy.block > 0) {
      if (!this.blockText) {
        this.blockText = this.scene.add.text(-80, 90, '', {
          fontSize: '18px',
          color: '#00ffff',
          fontStyle: 'bold',
          fontFamily: 'monospace',
          backgroundColor: '#004444',
          padding: { x: 8, y: 4 },
        });
        this.add(this.blockText);
      }
      this.blockText.setText(`🛡️${this.enemy.block}`);
    } else if (this.blockText) {
      this.blockText.destroy();
      this.blockText = null;
    }
  }

  /**
   * Update status effects display
   */
  private updateStatusEffects(): void {
    // TODO: Create a more sophisticated status effect display
    // For now, just show them as text

    const statuses: string[] = [];
    if (this.enemy.strength !== 0) {
      statuses.push(`STR:${this.enemy.strength > 0 ? '+' : ''}${this.enemy.strength}`);
    }
    if (this.enemy.weak > 0) {
      statuses.push(`WEAK:${this.enemy.weak}`);
    }
    if (this.enemy.vulnerable > 0) {
      statuses.push(`VULN:${this.enemy.vulnerable}`);
    }
    if (this.enemy.poison > 0) {
      statuses.push(`POISON:${this.enemy.poison}`);
    }

    // Display status effects (placeholder - could be improved with icons)
    if (statuses.length > 0) {
      // TODO: Add status effect icons
    }
  }

  /**
   * Set selected state
   */
  setSelected(selected: boolean): void {
    this.isSelected = selected;
    if (selected) {
      this.background.setStrokeStyle(4, 0xffff00);
    } else {
      this.background.setStrokeStyle(3, 0xff0000);
    }
  }

  /**
   * Animate damage taken
   */
  animateDamage(amount: number): void {
    // Flash red
    this.scene.tweens.add({
      targets: this.background,
      fillColor: 0xff0000,
      duration: 100,
      yoyo: true,
      ease: 'Power2',
    });

    // Damage number
    const damageText = this.scene.add.text(0, 0, `-${amount}`, {
      fontSize: '32px',
      color: '#ff0000',
      fontStyle: 'bold',
      fontFamily: 'monospace',
    });
    damageText.setOrigin(0.5);
    this.add(damageText);

    this.scene.tweens.add({
      targets: damageText,
      y: -80,
      alpha: 0,
      duration: 800,
      ease: 'Power2',
      onComplete: () => damageText.destroy(),
    });

    this.update();
  }

  /**
   * Get the enemy entity
   */
  getEnemy(): Enemy {
    return this.enemy;
  }
}
