import Phaser from 'phaser';

export class CombatScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CombatScene' });
  }

  create(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Temporary combat placeholder
    const title = this.add.text(width / 2, 100, 'COMBAT', {
      fontSize: '48px',
      color: '#ffffff',
      fontFamily: 'monospace',
    });
    title.setOrigin(0.5);

    // Player area
    this.add.rectangle(width / 2, height - 200, 800, 250, 0x2a2a4a, 0.8);
    this.add.text(width / 2, height - 320, 'Player Area', {
      fontSize: '24px',
      color: '#ffffff',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Enemy area
    this.add.rectangle(width / 2, 300, 600, 200, 0x4a2a2a, 0.8);
    this.add.text(width / 2, 150, 'Enemy Area', {
      fontSize: '24px',
      color: '#ffffff',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Placeholder text
    const placeholder = this.add.text(
      width / 2,
      height / 2,
      'Combat System Coming Soon\n\nPress ESC to return to menu',
      {
        fontSize: '24px',
        color: '#cccccc',
        fontFamily: 'monospace',
        align: 'center',
      }
    );
    placeholder.setOrigin(0.5);

    // ESC to return to menu
    this.input.keyboard?.on('keydown-ESC', () => {
      this.scene.start('MainMenuScene');
    });
  }
}
