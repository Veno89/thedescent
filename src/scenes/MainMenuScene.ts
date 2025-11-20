import Phaser from 'phaser';
import { Player } from '@/entities/Player';
import { GameStateManager } from '@/systems/GameStateManager';
import { DataLoader } from '@/utils/DataLoader';

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenuScene' });
  }

  create(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Title
    const title = this.add.text(width / 2, height / 3, 'THE DESCENT', {
      fontSize: '72px',
      color: '#ff6b6b',
      fontStyle: 'bold',
      fontFamily: 'monospace',
    });
    title.setOrigin(0.5);

    // Subtitle
    const subtitle = this.add.text(
      width / 2,
      height / 3 + 80,
      'A Deck-Building Roguelike',
      {
        fontSize: '24px',
        color: '#ffffff',
        fontFamily: 'monospace',
      }
    );
    subtitle.setOrigin(0.5);

    // Menu options
    const buttonY = height / 2 + 100;
    const buttonSpacing = 80;

    this.createMenuButton(
      width / 2,
      buttonY,
      'New Run',
      () => this.startNewRun()
    );
    this.createMenuButton(
      width / 2,
      buttonY + buttonSpacing,
      'Continue',
      () => this.continueRun()
    );
    this.createMenuButton(
      width / 2,
      buttonY + buttonSpacing * 2,
      'Settings',
      () => this.openSettings()
    );

    // Version number
    this.add.text(width - 20, height - 20, 'v0.1.0', {
      fontSize: '16px',
      color: '#666666',
      fontFamily: 'monospace',
    }).setOrigin(1);
  }

  createMenuButton(
    x: number,
    y: number,
    text: string,
    callback: () => void
  ): void {
    const button = this.add.text(x, y, text, {
      fontSize: '32px',
      color: '#ffffff',
      fontFamily: 'monospace',
      backgroundColor: '#333333',
      padding: { x: 20, y: 10 },
    });
    button.setOrigin(0.5);
    button.setInteractive({ useHandCursor: true });

    button.on('pointerover', () => {
      button.setStyle({ color: '#ff6b6b' });
    });

    button.on('pointerout', () => {
      button.setStyle({ color: '#ffffff' });
    });

    button.on('pointerdown', callback);
  }

  startNewRun(): void {
    console.log('Starting new run...');

    // Initialize data
    DataLoader.initialize();

    // Create new player
    const player = new Player(80, 99);
    player.deck = DataLoader.createStarterDeck();

    // Give starter relic
    const burningBlood = DataLoader.getRelic('burning_blood');
    if (burningBlood) {
      player.addRelic(burningBlood);
    }

    // Create game state
    const gameState = new GameStateManager(player);
    gameState.startRun();

    // Start at the map
    this.scene.start('MapScene', { gameState });
  }

  continueRun(): void {
    console.log('Continuing run...');
    // TODO: Load saved game state
  }

  openSettings(): void {
    console.log('Opening settings...');
    // TODO: Open settings menu
  }
}
