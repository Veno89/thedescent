import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { MainMenuScene } from './scenes/MainMenuScene';
import { CharacterSelectionScene } from './scenes/CharacterSelectionScene';
import { MapScene } from './scenes/MapScene';
import { CombatScene } from './scenes/CombatScene';
import { RewardScene } from './scenes/RewardScene';
import { RestScene } from './scenes/RestScene';
import { EventScene } from './scenes/EventScene';
import { MerchantScene } from './scenes/MerchantScene';
import { CardSelectionScene } from './scenes/CardSelectionScene';
import { VictoryScene } from './scenes/VictoryScene';
import { DefeatScene } from './scenes/DefeatScene';
import { DeckViewScene } from './scenes/DeckViewScene';
import { OptionsScene } from './scenes/OptionsScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1920,
  height: 1080,
  parent: 'game-container',
  backgroundColor: '#1a1a2e',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, MainMenuScene, CharacterSelectionScene, MapScene, CombatScene, RewardScene, RestScene, EventScene, MerchantScene, CardSelectionScene, VictoryScene, DefeatScene, DeckViewScene, OptionsScene],
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
    },
  },
};

const game = new Phaser.Game(config);

export default game;
