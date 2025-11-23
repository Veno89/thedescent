import Phaser from 'phaser';
import { CharacterClass } from '@/types';
import { DataLoader } from '@/utils/DataLoader';
import { Player } from '@/entities/Player';
import { GameStateManager } from '@/systems/GameStateManager';
import { UICard } from '@/ui/UICard';
import { Theme } from '@/ui/theme';

/**
 * Character Selection Scene - Choose your character before starting a run
 */
export class CharacterSelectionScene extends Phaser.Scene {
  private characters: CharacterClass[] = [];

  constructor() {
    super({ key: 'CharacterSelectionScene' });
  }

  create(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Load all available characters
    this.characters = DataLoader.getAllCharacterClasses();

    if (this.characters.length === 0) {
      console.error('No characters loaded!');
      this.scene.start('MainMenuScene');
      return;
    }

    // Background gradient
    const bgGraphics = this.add.graphics();
    bgGraphics.fillGradientStyle(
      Theme.helpers.hexToColor(Theme.colors.background),
      Theme.helpers.hexToColor(Theme.colors.background),
      Theme.helpers.hexToColor(Theme.colors.backgroundLight),
      Theme.helpers.hexToColor(Theme.colors.backgroundLight),
      1,
      1,
      1,
      1
    );
    bgGraphics.fillRect(0, 0, width, height);

    // Title
    this.add.text(width / 2, Theme.spacing.xxxl + Theme.spacing.lg, 'SELECT YOUR CHARACTER', {
      ...Theme.typography.styles.title,
      fontSize: '72px',
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(
      width / 2,
      Theme.spacing.xxxl * 2 + Theme.spacing.xl,
      'Choose wisely - each warrior has unique abilities',
      {
        ...Theme.typography.styles.body,
        color: Theme.colors.textSecondary,
      }
    ).setOrigin(0.5);

    // Display all characters
    this.displayCharacters();

    // Instructions
    this.add.text(
      width / 2,
      height - Theme.spacing.xxxl,
      'Click on a character to begin your descent',
      {
        ...Theme.typography.styles.body,
        color: Theme.colors.textMuted,
      }
    ).setOrigin(0.5);

    // Fade in animation
    this.cameras.main.fadeIn(Theme.animation.slow);
  }

  /**
   * Display all available characters as selectable cards
   */
  private displayCharacters(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const cardSpacing = 520;
    const startX = width / 2 - ((this.characters.length - 1) * cardSpacing) / 2;
    const centerY = height / 2 + Theme.spacing.xxxl;

    this.characters.forEach((character, index) => {
      const x = startX + index * cardSpacing;

      // Character card
      const characterCard = new UICard({
        scene: this,
        x: x,
        y: centerY,
        width: 450,
        height: 600,
        title: character.name.toUpperCase(),
        backgroundColor: Theme.helpers.hexToColor(Theme.colors.backgroundLight),
        borderColor: Theme.helpers.hexToColor(Theme.colors.primary),
        alpha: 0.95,
      });

      const contentY = characterCard.getContentStartY();

      // Character description
      characterCard.addText(character.description, 0, contentY, {
        ...Theme.typography.styles.body,
        color: Theme.colors.textSecondary,
        wordWrap: { width: 380 },
        align: 'center',
      }).setOrigin(0.5, 0);

      // Stats section divider
      characterCard.addText(
        Theme.helpers.getSectionDivider('STATS'),
        0,
        contentY + Theme.spacing.xxxl * 2,
        {
          ...Theme.typography.styles.heading3,
          color: Theme.colors.gold,
        }
      ).setOrigin(0.5, 0);

      // Stats
      const statsY = contentY + Theme.spacing.xxxl * 2 + Theme.spacing.xxxl;
      const stats = [
        { icon: '❤️', label: 'HP', value: character.maxHp, color: Theme.colors.danger },
        {
          icon: '💰',
          label: 'Gold',
          value: character.startingGold,
          color: Theme.colors.gold,
        },
        {
          icon: '🎴',
          label: 'Deck',
          value: `${character.startingDeck.length} cards`,
          color: Theme.colors.info,
        },
      ];

      stats.forEach((stat, statIndex) => {
        characterCard.addText(
          `${stat.icon} ${stat.label}: ${stat.value}`,
          0,
          statsY + statIndex * Theme.spacing.xl,
          {
            ...Theme.typography.styles.body,
            color: stat.color,
          }
        ).setOrigin(0.5, 0);
      });

      // Starting relic section
      const relic = DataLoader.getRelic(character.startingRelic);
      if (relic) {
        characterCard.addText(
          Theme.helpers.getSectionDivider('STARTING RELIC'),
          0,
          statsY + stats.length * Theme.spacing.xl + Theme.spacing.xl,
          {
            ...Theme.typography.styles.heading3,
            color: Theme.colors.gold,
          }
        ).setOrigin(0.5, 0);

        characterCard.addText(
          `🏺 ${relic.name}`,
          0,
          statsY + stats.length * Theme.spacing.xl + Theme.spacing.xxxl + Theme.spacing.md,
          {
            ...Theme.typography.styles.body,
            color: Theme.colors.legendary,
          }
        ).setOrigin(0.5, 0);

        characterCard.addText(
          relic.description,
          0,
          statsY + stats.length * Theme.spacing.xl + Theme.spacing.xxxl * 2,
          {
            ...Theme.typography.styles.small,
            color: Theme.colors.textSecondary,
            wordWrap: { width: 380 },
            align: 'center',
          }
        ).setOrigin(0.5, 0);
      }

      // Make card interactive
      characterCard.makeInteractive(() => {
        this.selectCharacter(character);
      });
    });
  }

  /**
   * Handle character selection and start the game
   */
  private selectCharacter(character: CharacterClass): void {
    console.log(`Selected character: ${character.name}`);

    // Create player from character class
    const player = Player.fromCharacterClass(character);

    // Create game state
    const gameState = new GameStateManager(player);
    gameState.startRun();

    // Start the game on the map scene
    this.scene.start('MapScene', { gameState });
  }
}
