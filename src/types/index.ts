// Core game types

export enum CardType {
  ATTACK = 'ATTACK',
  SKILL = 'SKILL',
  POWER = 'POWER',
  STATUS = 'STATUS',
  CURSE = 'CURSE',
}

export enum CardRarity {
  STARTER = 'STARTER',
  COMMON = 'COMMON',
  UNCOMMON = 'UNCOMMON',
  RARE = 'RARE',
  SPECIAL = 'SPECIAL',
}

export enum TargetType {
  SELF = 'SELF',
  SINGLE_ENEMY = 'SINGLE_ENEMY',
  ALL_ENEMIES = 'ALL_ENEMIES',
  RANDOM_ENEMY = 'RANDOM_ENEMY',
}

export interface Card {
  id: string;
  name: string;
  description: string;
  type: CardType;
  rarity: CardRarity;
  cost: number;
  upgraded: boolean;
  targetType: TargetType;
  effects: CardEffect[];

  // Card keywords/mechanics
  exhaust?: boolean;      // Card is removed from combat when played
  retain?: boolean;       // Card is kept in hand at end of turn
  innate?: boolean;       // Card starts in your hand
  ethereal?: boolean;     // Card is exhausted if not played this turn
  isXCost?: boolean;      // Card costs all remaining energy
}

export interface CardEffect {
  type: string;
  value: number;
  target?: TargetType;
}

export interface Relic {
  id: string;
  name: string;
  description: string;
  rarity: CardRarity;
  effects: RelicEffect[];
}

export interface RelicEffect {
  trigger: string; // e.g., 'onCombatStart', 'onCardPlayed', 'onTurnEnd'
  action: string;
  value?: number;
}

export interface Character {
  id: string;
  name: string;
  maxHp: number;
  currentHp: number;
  gold: number;
  deck: Card[];
  relics: Relic[];
  potions: Potion[];
}

export interface CharacterClass {
  id: string;
  name: string;
  description: string;
  maxHp: number;
  startingGold: number;
  startingDeck: string[]; // Card IDs
  startingRelic: string; // Relic ID
}

export interface Enemy {
  id: string;
  name: string;
  maxHp: number;
  currentHp: number;
  block: number;
  intent: EnemyIntent;
  moves: EnemyMove[];
}

export interface EnemyIntent {
  type: 'ATTACK' | 'DEFEND' | 'BUFF' | 'DEBUFF' | 'UNKNOWN';
  value?: number;
}

export interface EnemyMove {
  name: string;
  intent: EnemyIntent;
  weight: number;
  actions: string[];
}

export interface Potion {
  id: string;
  name: string;
  description: string;
  rarity: CardRarity;
  targetType: TargetType;
  effects: CardEffect[];
}

export interface GameState {
  character: Character;
  floor: number;
  act: number;
  seed: string;
  ascensionLevel: number;
}

export interface CombatState {
  player: {
    hp: number;
    maxHp: number;
    block: number;
    energy: number;
    maxEnergy: number;
  };
  enemies: Enemy[];
  drawPile: Card[];
  hand: Card[];
  discardPile: Card[];
  exhaustPile: Card[];
  turn: number;
  playerTurn: boolean;
}

export enum RoomType {
  COMBAT = 'COMBAT',
  ELITE = 'ELITE',
  BOSS = 'BOSS',
  REST = 'REST',
  MERCHANT = 'MERCHANT',
  TREASURE = 'TREASURE',
  EVENT = 'EVENT',
}

export interface Room {
  type: RoomType;
  x: number;
  y: number;
  connections: number[]; // Indices of connected rooms
  visited: boolean;
}

export interface MapNode {
  room: Room;
  availablePaths: number[];
}

// Event system types
export interface EventChoice {
  text: string;
  outcomes: EventOutcome[];
}

export interface EventOutcome {
  type: string; // e.g., 'HEAL', 'LOSE_HP', 'GAIN_GOLD', 'LOSE_GOLD', 'ADD_CARD', 'REMOVE_CARD', 'GAIN_RELIC', 'TRANSFORM_CARD', 'UPGRADE_CARD'
  value?: number;
  text: string; // Description of what happens
  cardId?: string; // For ADD_CARD outcome
  relicId?: string; // For GAIN_RELIC outcome
  weight?: number; // For random outcomes (default: 1)
}

export interface GameEvent {
  id: string;
  name: string;
  description: string;
  image?: string; // Placeholder for future image support
  choices: EventChoice[];
}
