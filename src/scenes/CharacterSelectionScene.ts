import Phaser from 'phaser';
import { CharacterClass } from '@/types';
import { DataLoader } from '@/utils/DataLoader';
import { Player } from '@/entities/Player';
import { GameStateManager } from '@/systems/GameStateManager';

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

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x16213e, 1).setDepth(-1);

    // Title
    this.add.text(width / 2, 80, 'SELECT YOUR CHARACTER', {
      fontSize: '64px',
      color: '#e94560',
      fontStyle: 'bold',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Display all characters
    this.displayCharacters();

    // Instructions
    this.add.text(width / 2, height - 50, 'Click on a character to select and begin your journey', {
      fontSize: '20px',
      color: '#888888',
      fontFamily: 'monospace',
    }).setOrigin(0.5);
  }

  /**
   * Display all available characters as selectable cards
   */
  private displayCharacters(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const startX = width / 2 - (this.characters.length - 1) * 250;
    const centerY = height / 2 + 50;

    this.characters.forEach((character, index) => {
      const x = startX + index * 500;

      // Character card background
      const cardBg = this.add.rectangle(x, centerY, 380, 500, 0x1a1a2e, 1);
      cardBg.setStrokeStyle(4, 0x4a5568);

      // Character name
      this.add.text(x, centerY - 210, character.name, {
        fontSize: '36px',
        color: '#ffffff',
        fontStyle: 'bold',
        fontFamily: 'monospace',
      }).setOrigin(0.5);

      // Character description
      const descText = this.add.text(x, centerY - 150, character.description, {
        fontSize: '18px',
        color: '#cccccc',
        fontFamily: 'monospace',
        wordWrap: { width: 340 },
        align: 'center',
      });
      descText.setOrigin(0.5);

      // Stats section
      const statsY = centerY - 50;
      this.add.text(x, statsY, '═══ STATS ═══', {
        fontSize: '24px',
        color: '#e94560',
        fontStyle: 'bold',
        fontFamily: 'monospace',
      }).setOrigin(0.5);

      const stats = [
        `HP: ${character.maxHp}`,
        `Gold: ${character.startingGold}`,
        `Deck: ${character.startingDeck.length} cards`,
      ];

      stats.forEach((stat, statIndex) => {
        this.add.text(x, statsY + 50 + statIndex * 35, stat, {
          fontSize: '20px',
          color: '#ffffff',
          fontFamily: 'monospace',
        }).setOrigin(0.5);
      });

      // Starting relic info
      const relic = DataLoader.getRelic(character.startingRelic);
      if (relic) {
        this.add.text(x, centerY + 130, '═══ STARTING RELIC ═══', {
          fontSize: '20px',
          color: '#e94560',
          fontStyle: 'bold',
          fontFamily: 'monospace',
        }).setOrigin(0.5);

        this.add.text(x, centerY + 170, `🏺 ${relic.name}`, {
          fontSize: '18px',
          color: '#ffd700',
          fontFamily: 'monospace',
        }).setOrigin(0.5);
      }

      // Make card interactive
      cardBg.setInteractive({ useHandCursor: true });

      cardBg.on('pointerover', () => {
        cardBg.setStrokeStyle(4, 0xe94560);
        this.tweens.add({
          targets: cardBg,
          scaleX: 1.05,
          scaleY: 1.05,
          duration: 150,
          ease: 'Power2',
        });
      });

      cardBg.on('pointerout', () => {
        cardBg.setStrokeStyle(4, 0x4a5568);
        this.tweens.add({
          targets: cardBg,
          scaleX: 1.0,
          scaleY: 1.0,
          duration: 150,
          ease: 'Power2',
        });
      });

      cardBg.on('pointerdown', () => {
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
