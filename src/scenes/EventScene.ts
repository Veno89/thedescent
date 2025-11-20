import Phaser from 'phaser';
import { GameEvent, EventChoice, EventOutcome, Card, CardType, CardRarity, TargetType } from '@/types';
import { GameStateManager } from '@/systems/GameStateManager';
import { DataLoader } from '@/utils/DataLoader';

/**
 * EventScene handles random events with player choices
 */
export class EventScene extends Phaser.Scene {
  private gameState!: GameStateManager;
  private event!: GameEvent;
  private chosenOutcomes: EventOutcome[] = [];
  private outcomeIndex: number = 0;

  constructor() {
    super({ key: 'EventScene' });
  }

  init(data: { gameState: GameStateManager; event?: GameEvent }) {
    this.gameState = data.gameState;
    this.event = data.event || DataLoader.getRandomEvent()!;
    this.chosenOutcomes = [];
    this.outcomeIndex = 0;
  }

  create(): void {
    const width = this.cameras.main.width;

    // Title
    this.add.text(width / 2, 80, this.event.name, {
      fontSize: '48px',
      color: '#ffaa00',
      fontStyle: 'bold',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Description
    const descText = this.add.text(width / 2, 160, this.event.description, {
      fontSize: '20px',
      color: '#ffffff',
      fontFamily: 'monospace',
      align: 'center',
      wordWrap: { width: 700 },
    });
    descText.setOrigin(0.5);

    // Display choices
    this.displayChoices(width);
  }

  /**
   * Display choice buttons
   */
  private displayChoices(width: number): void {
    const startY = 280;
    const spacing = 80;

    this.event.choices.forEach((choice, index) => {
      const y = startY + index * spacing;

      // Create choice button
      const button = this.add.text(width / 2, y, choice.text, {
        fontSize: '18px',
        color: '#ffffff',
        fontFamily: 'monospace',
        backgroundColor: '#333333',
        padding: { x: 20, y: 10 },
        wordWrap: { width: 600 },
      });
      button.setOrigin(0.5);
      button.setInteractive({ useHandCursor: true });

      button.on('pointerover', () => {
        button.setStyle({ backgroundColor: '#555555', color: '#ffaa00' });
      });

      button.on('pointerout', () => {
        button.setStyle({ backgroundColor: '#333333', color: '#ffffff' });
      });

      button.on('pointerdown', () => {
        this.onChoiceSelected(choice);
      });
    });
  }

  /**
   * Handle choice selection
   */
  private onChoiceSelected(choice: EventChoice): void {
    // Clear the scene
    this.children.removeAll();

    // Determine which outcomes to execute (handle weighted random outcomes)
    this.chosenOutcomes = this.selectOutcomes(choice.outcomes);
    this.outcomeIndex = 0;

    // Start executing outcomes
    this.displayNextOutcome();
  }

  /**
   * Select outcomes (handles weighted random selection)
   */
  private selectOutcomes(outcomes: EventOutcome[]): EventOutcome[] {
    // If all outcomes have weight, pick one randomly
    const allWeighted = outcomes.every(o => o.weight !== undefined);

    if (allWeighted && outcomes.length > 1) {
      // Random weighted selection
      const totalWeight = outcomes.reduce((sum, o) => sum + (o.weight || 1), 0);
      const roll = Math.random() * totalWeight;

      let currentWeight = 0;
      for (const outcome of outcomes) {
        currentWeight += outcome.weight || 1;
        if (roll <= currentWeight) {
          return [outcome];
        }
      }
      return [outcomes[0]]; // Fallback
    }

    // Execute all outcomes
    return outcomes;
  }

  /**
   * Display next outcome in sequence
   */
  private displayNextOutcome(): void {
    if (this.outcomeIndex >= this.chosenOutcomes.length) {
      // All outcomes executed, return to map
      this.returnToMap();
      return;
    }

    const outcome = this.chosenOutcomes[this.outcomeIndex];
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Clear previous outcome display
    this.children.removeAll();

    // Title
    this.add.text(width / 2, 80, 'Event Outcome', {
      fontSize: '36px',
      color: '#ffaa00',
      fontStyle: 'bold',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Execute the outcome
    this.executeOutcome(outcome);

    // Display outcome text
    this.add.text(width / 2, height / 2, outcome.text, {
      fontSize: '24px',
      color: '#ffffff',
      fontFamily: 'monospace',
      align: 'center',
      wordWrap: { width: 700 },
    }).setOrigin(0.5);

    // Continue button
    const continueButton = this.add.text(width / 2, height - 150, 'Continue', {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold',
      fontFamily: 'monospace',
      backgroundColor: '#4a4a4a',
      padding: { x: 30, y: 15 },
    });
    continueButton.setOrigin(0.5);
    continueButton.setInteractive({ useHandCursor: true });

    continueButton.on('pointerover', () => {
      continueButton.setStyle({ backgroundColor: '#6a6a6a' });
    });

    continueButton.on('pointerout', () => {
      continueButton.setStyle({ backgroundColor: '#4a4a4a' });
    });

    continueButton.on('pointerdown', () => {
      this.outcomeIndex++;
      this.displayNextOutcome();
    });
  }

  /**
   * Execute a single outcome
   */
  private executeOutcome(outcome: EventOutcome): void {
    const player = this.gameState.player;
    const value = outcome.value || 0;

    switch (outcome.type) {
      case 'NOTHING':
        // Do nothing
        break;

      case 'HEAL':
        player.heal(value);
        break;

      case 'HEAL_FULL':
        player.currentHp = player.maxHp;
        break;

      case 'HEAL_PERCENT':
        player.heal(Math.floor(player.maxHp * (value / 100)));
        break;

      case 'LOSE_HP':
        player.loseHp(value);
        break;

      case 'LOSE_HP_PERCENT':
        player.loseHp(Math.floor(player.maxHp * (value / 100)));
        break;

      case 'GAIN_MAX_HP':
        player.maxHp += value;
        player.currentHp += value; // Also heal
        break;

      case 'LOSE_MAX_HP_PERCENT':
        const hpLost = Math.floor(player.maxHp * (value / 100));
        player.maxHp -= hpLost;
        player.currentHp = Math.min(player.currentHp, player.maxHp);
        break;

      case 'GAIN_GOLD':
        player.addGold(value);
        break;

      case 'LOSE_GOLD':
        player.gold = Math.max(0, player.gold - value);
        break;

      case 'GAIN_RANDOM_RELIC':
        const relic = DataLoader.getRandomWeightedRelic();
        if (relic) {
          player.addRelic(relic);
        }
        break;

      case 'GAIN_RANDOM_POTION':
        const potion = DataLoader.getRandomWeightedPotion();
        if (potion) {
          player.addPotion(potion);
        }
        break;

      case 'REMOVE_CARD':
        // TODO: Show card selection screen
        // For now: remove a random card
        if (player.deck.length > 0) {
          const randomIndex = Math.floor(Math.random() * player.deck.length);
          player.deck.splice(randomIndex, 1);
        }
        break;

      case 'TRANSFORM_CARD':
        // TODO: Show card selection screen
        // For now: transform a random card
        if (player.deck.length > 0) {
          const randomIndex = Math.floor(Math.random() * player.deck.length);
          const allCards = DataLoader.getAllCards();
          const newCard = allCards[Math.floor(Math.random() * allCards.length)];
          if (newCard) {
            player.deck[randomIndex] = { ...newCard };
          }
        }
        break;

      case 'UPGRADE_RANDOM_CARD':
        const upgradeableCards = player.deck.filter(c => !c.upgraded);
        if (upgradeableCards.length > 0) {
          const randomCard = upgradeableCards[Math.floor(Math.random() * upgradeableCards.length)];
          randomCard.upgraded = true;
          randomCard.name = `${randomCard.name}+`;
        }
        break;

      case 'UPGRADE_ALL_HAND':
        // Upgrade all cards (simulated as first 5 cards)
        player.deck.slice(0, 5).forEach(card => {
          if (!card.upgraded) {
            card.upgraded = true;
            card.name = `${card.name}+`;
          }
        });
        break;

      case 'UPGRADE_STRIKES_AND_DEFENDS':
        player.deck.forEach(card => {
          if ((card.id === 'strike' || card.id === 'defend') && !card.upgraded) {
            card.upgraded = true;
            card.name = `${card.name}+`;
          }
        });
        break;

      case 'REMOVE_ALL_STRIKES':
        player.deck = player.deck.filter(c => c.id !== 'strike');
        break;

      case 'ADD_CARD':
        if (outcome.cardId) {
          const card = DataLoader.getCard(outcome.cardId);
          if (card) {
            for (let i = 0; i < value; i++) {
              player.addCardToDeck({ ...card });
            }
          }
        }
        break;

      case 'ADD_RARE_CARD':
        const rareCards = DataLoader.getAllCards().filter(c => c.rarity === 'RARE');
        if (rareCards.length > 0) {
          const randomRare = rareCards[Math.floor(Math.random() * rareCards.length)];
          player.addCardToDeck({ ...randomRare });
        }
        break;

      case 'ADD_CURSE':
        // TODO: Add actual curse cards
        // For now: add a dummy curse card
        for (let i = 0; i < value; i++) {
          const curse: Card = {
            id: 'curse_wound',
            name: 'Wound',
            description: 'Unplayable. Ethereal.',
            type: CardType.STATUS,
            rarity: CardRarity.SPECIAL,
            cost: -1,
            upgraded: false,
            targetType: TargetType.SELF,
            effects: [],
            ethereal: true,
          };
          player.addCardToDeck(curse);
        }
        break;

      default:
        console.warn(`Unknown outcome type: ${outcome.type}`);
    }
  }

  /**
   * Return to map
   */
  private returnToMap(): void {
    this.scene.start('MapScene', { gameState: this.gameState });
  }
}
