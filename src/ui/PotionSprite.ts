import Phaser from 'phaser';
import { Potion } from '@/entities/Potion';
import { CardRarity, TargetType } from '@/types';

/**
 * Visual representation of a potion in Phaser
 */
export class PotionSprite extends Phaser.GameObjects.Container {
  private potion: Potion;
  private slotIndex: number;
  private background!: Phaser.GameObjects.Rectangle;
  private isEmpty: boolean = false;

  private readonly POTION_SIZE = 50;

  constructor(scene: Phaser.Scene, x: number, y: number, potion: Potion | null, slotIndex: number) {
    super(scene, x, y);
    this.potion = potion || this.createEmptyPotion();
    this.slotIndex = slotIndex;
    this.isEmpty = potion === null;

    this.createPotion();
    this.setupInteraction();

    scene.add.existing(this);
  }

  /**
   * Create empty potion placeholder
   */
  private createEmptyPotion(): Potion {
    return new Potion({
      id: 'empty',
      name: 'Empty Slot',
      description: 'No potion in this slot',
      rarity: CardRarity.COMMON,
      targetType: TargetType.SELF,
      effects: [],
    });
  }

  /**
   * Create the visual potion elements
   */
  private createPotion(): void {
    // Potion background (circle or bottle shape)
    const bgColor = this.isEmpty ? 0x333333 : this.getPotionColor();
    this.background = this.scene.add.rectangle(
      0,
      0,
      this.POTION_SIZE,
      this.POTION_SIZE,
      bgColor,
      this.isEmpty ? 0.3 : 1
    );
    this.background.setStrokeStyle(2, this.isEmpty ? 0x666666 : 0x888888);
    this.add(this.background);

    if (!this.isEmpty) {
      // Potion icon placeholder
      const iconText = this.scene.add.text(0, 0, '🧪', {
        fontSize: '28px',
        fontFamily: 'monospace',
      });
      iconText.setOrigin(0.5);
      this.add(iconText);

      // Slot number
      const slotText = this.scene.add.text(
        -this.POTION_SIZE / 2 + 3,
        -this.POTION_SIZE / 2 + 3,
        (this.slotIndex + 1).toString(),
        {
          fontSize: '12px',
          color: '#ffffff',
          fontStyle: 'bold',
          fontFamily: 'monospace',
          backgroundColor: '#000000',
          padding: { x: 3, y: 2 },
        }
      );
      slotText.setOrigin(0, 0);
      this.add(slotText);
    } else {
      // Empty slot indicator
      const emptyText = this.scene.add.text(0, 0, '—', {
        fontSize: '24px',
        color: '#666666',
        fontFamily: 'monospace',
      });
      emptyText.setOrigin(0.5);
      this.add(emptyText);
    }
  }

  /**
   * Get potion background color based on rarity
   */
  private getPotionColor(): number {
    switch (this.potion.rarity) {
      case 'COMMON':
        return 0x4a9eff; // Blue
      case 'UNCOMMON':
        return 0x9932cc; // Purple
      case 'RARE':
        return 0xffd700; // Gold
      default:
        return 0x4a9eff;
    }
  }

  /**
   * Setup potion interaction (hover for tooltip, click to use)
   */
  private setupInteraction(): void {
    if (this.isEmpty) return;

    this.setSize(this.POTION_SIZE, this.POTION_SIZE);
    this.setInteractive({ useHandCursor: true });

    // Hover effects
    this.on('pointerover', () => {
      this.background.setStrokeStyle(3, 0xffffff); // White highlight
      this.setScale(1.1);
      this.setDepth(100);

      // Show tooltip
      this.showTooltip();
    });

    this.on('pointerout', () => {
      this.background.setStrokeStyle(2, 0x888888);
      this.setScale(1.0);
      this.setDepth(0);

      // Hide tooltip
      this.hideTooltip();
    });

    // Click handler (emits event for parent to handle)
    this.on('pointerdown', () => {
      this.emit('potionClicked', this.slotIndex, this.potion);
    });
  }

  /**
   * Show tooltip with potion info
   */
  private showTooltip(): void {
    const tooltipWidth = 250;
    const tooltipX = this.x + this.POTION_SIZE / 2 + 10;
    const tooltipY = this.y;

    // Create tooltip background
    const tooltip = this.scene.add.rectangle(
      tooltipX + tooltipWidth / 2,
      tooltipY,
      tooltipWidth,
      100,
      0x000000,
      0.9
    );
    tooltip.setStrokeStyle(2, 0x4a9eff);
    tooltip.setName('potionTooltip');
    tooltip.setDepth(150);

    // Potion name
    const nameText = this.scene.add.text(
      tooltipX + 10,
      tooltipY - 40,
      this.potion.name,
      {
        fontSize: '16px',
        color: '#4a9eff',
        fontStyle: 'bold',
        fontFamily: 'monospace',
      }
    );
    nameText.setName('potionTooltip');
    nameText.setDepth(150);

    // Potion description
    const descText = this.scene.add.text(
      tooltipX + 10,
      tooltipY - 15,
      this.potion.description,
      {
        fontSize: '12px',
        color: '#ffffff',
        fontFamily: 'monospace',
        wordWrap: { width: tooltipWidth - 20 },
      }
    );
    descText.setName('potionTooltip');
    descText.setDepth(150);

    // Adjust tooltip height based on text
    const textHeight = Math.max(100, descText.height + 60);
    tooltip.setSize(tooltipWidth, textHeight);
    tooltip.y = tooltipY + textHeight / 2 - 50;
    nameText.y = tooltip.y - textHeight / 2 + 10;
    descText.y = nameText.y + 20;
  }

  /**
   * Hide tooltip
   */
  private hideTooltip(): void {
    // Remove all tooltip elements
    this.scene.children.list
      .filter((child: any) => child.name === 'potionTooltip')
      .forEach((child) => child.destroy());
  }

  /**
   * Update potion display (for when potion is used)
   */
  updatePotion(potion: Potion | null): void {
    this.removeAll(true);
    this.potion = potion || this.createEmptyPotion();
    this.isEmpty = potion === null;
    this.createPotion();
    this.setupInteraction();
  }

  /**
   * Get the slot index
   */
  getSlotIndex(): number {
    return this.slotIndex;
  }

  /**
   * Get the potion data
   */
  getPotion(): Potion | null {
    return this.isEmpty ? null : this.potion;
  }
}
