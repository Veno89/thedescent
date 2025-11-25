// Core game types

export type CardType = 'ATTACK' | 'SKILL' | 'POWER' | 'STATUS' | 'CURSE';
export type CardRarity = 'STARTER' | 'COMMON' | 'UNCOMMON' | 'RARE' | 'SPECIAL';
export type TargetType = 'SELF' | 'SINGLE_ENEMY' | 'ALL_ENEMIES' | 'RANDOM_ENEMY';

export interface CardEffect {
  type: string;
  value: number;
  target?: TargetType;
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
  exhaust?: boolean;
  retain?: boolean;
  innate?: boolean;
  ethereal?: boolean;
  isXCost?: boolean;
  upgradedStats?: Partial<Card>;
}

export interface StatusEffects {
  strength: number;
  dexterity: number;
  weak: number;
  vulnerable: number;
  frail: number;
  poison: number;
  artifact: number;
  platedArmor: number;
  thorns: number;
  ritual: number;
  intangible: number;
  block: number;
}

export interface RelicEffect {
  trigger: string;
  action: string;
  value?: number;
}

export interface Relic {
  id: string;
  name: string;
  description: string;
  rarity: CardRarity;
  effects: RelicEffect[];
  counter?: number;
}

export interface Potion {
  id: string;
  name: string;
  description: string;
  rarity: CardRarity;
  targetType: TargetType;
  effects: CardEffect[];
}

export interface EnemyIntent {
  type: 'ATTACK' | 'DEFEND' | 'BUFF' | 'DEBUFF' | 'UNKNOWN' | 'STUN';
  value?: number;
  times?: number;
}

export interface EnemyAction {
  type: string;
  value: number;
}

export interface EnemyMove {
  name: string;
  intent: EnemyIntent;
  weight: number;
  actions: EnemyAction[];
}

export interface EnemyData {
  id: string;
  name: string;
  maxHp: number;
  type: 'normal' | 'elite' | 'boss';
  moves: EnemyMove[];
}

export interface Enemy extends EnemyData {
  currentHp: number;
  block: number;
  statusEffects: StatusEffects;
  currentIntent: EnemyIntent;
}

export interface Player {
  maxHp: number;
  currentHp: number;
  gold: number;
  block: number;
  energy: number;
  maxEnergy: number;
  statusEffects: StatusEffects;
  deck: Card[];
  relics: Relic[];
  potions: (Potion | null)[];
  maxPotions: number;
}

export type RoomType = 'COMBAT' | 'ELITE' | 'BOSS' | 'REST' | 'MERCHANT' | 'TREASURE' | 'EVENT';

export interface Room {
  type: RoomType;
  x: number;
  y: number;
  connections: number[];
  visited: boolean;
}

export interface EventChoice {
  text: string;
  outcomes: EventOutcome[];
  disabled?: boolean;
  disabledReason?: string;
}

export interface EventOutcome {
  type: string;
  value?: number;
  text: string;
  cardId?: string;
  relicId?: string;
  weight?: number;
}

export interface GameEvent {
  id: string;
  name: string;
  description: string;
  image?: string;
  choices: EventChoice[];
}

export interface CharacterClass {
  id: string;
  name: string;
  description: string;
  maxHp: number;
  startingGold: number;
  startingDeck: string[];
  startingRelic: string;
}

// Game state types
export type GameScreen = 
  | 'MAIN_MENU'
  | 'CHARACTER_SELECT'
  | 'MAP'
  | 'COMBAT'
  | 'REWARD'
  | 'REST'
  | 'MERCHANT'
  | 'EVENT'
  | 'CARD_SELECT'
  | 'VICTORY'
  | 'DEFEAT';

export interface CombatState {
  enemies: Enemy[];
  hand: Card[];
  drawPile: Card[];
  discardPile: Card[];
  exhaustPile: Card[];
  turn: number;
  isPlayerTurn: boolean;
  selectedCard: Card | null;
  targetingMode: boolean;
}
