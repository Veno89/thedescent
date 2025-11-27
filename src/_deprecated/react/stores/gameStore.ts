import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { DataLoader } from '@/utils/DataLoader';
import type {
  GameScreen,
  Player,
  Card,
  Relic,
  Potion,
  Room,
  Enemy,
  CombatState,
  CharacterClass,
  GameEvent,
  StatusEffects
} from '@/types';

// Helper to create default status effects
const createDefaultStatusEffects = (): StatusEffects => ({
  strength: 0,
  dexterity: 0,
  weak: 0,
  vulnerable: 0,
  frail: 0,
  poison: 0,
  artifact: 0,
  platedArmor: 0,
  thorns: 0,
  ritual: 0,
  intangible: 0,
  block: 0,
});

// Helper to create default player
const createDefaultPlayer = (): Player => ({
  maxHp: 80,
  currentHp: 80,
  gold: 99,
  block: 0,
  energy: 3,
  maxEnergy: 3,
  statusEffects: createDefaultStatusEffects(),
  deck: [],
  relics: [],
  potions: [null, null, null],
  maxPotions: 3,
});

// Card templates have been moved to JSON files and are loaded via DataLoader
// See: src/data/cards/starter.json and src/data/cards/advanced.json

// Relic templates
const RELIC_TEMPLATES: Record<string, Omit<Relic, 'counter'>> = {
  // ============================================
  // === STARTER RELICS ===
  // ============================================
  miners_resolve: {
    id: 'miners_resolve',
    name: "Miner's Resolve",
    description: 'At the end of combat, heal 6 HP.',
    rarity: 'STARTER',
    effects: [{ trigger: 'END_COMBAT', action: 'HEAL', value: 6 }],
  },
  serpent_ring: {
    id: 'serpent_ring',
    name: 'Serpent Ring',
    description: 'At the start of each combat, draw 2 additional cards.',
    rarity: 'STARTER',
    effects: [{ trigger: 'START_COMBAT', action: 'DRAW', value: 2 }],
  },
  iron_anchor: {
    id: 'iron_anchor',
    name: 'Iron Anchor',
    description: 'At the start of each combat, gain 10 Block.',
    rarity: 'STARTER',
    effects: [{ trigger: 'START_COMBAT', action: 'BLOCK', value: 10 }],
  },

  // ============================================
  // === COMMON RELICS ===
  // ============================================
  ore_lantern: {
    id: 'ore_lantern',
    name: 'Ore Lantern',
    description: 'Gain 1 Energy at the start of each combat.',
    rarity: 'COMMON',
    effects: [{ trigger: 'START_COMBAT', action: 'ENERGY', value: 1 }],
  },
  cracked_compass: {
    id: 'cracked_compass',
    name: 'Cracked Compass',
    description: 'At the start of each combat, draw 1 additional card.',
    rarity: 'COMMON',
    effects: [{ trigger: 'START_COMBAT', action: 'DRAW', value: 1 }],
  },
  dusty_tome: {
    id: 'dusty_tome',
    name: 'Dusty Tome',
    description: 'Gain 1 Might at the start of each combat.',
    rarity: 'COMMON',
    effects: [{ trigger: 'START_COMBAT', action: 'STRENGTH', value: 1 }],
  },
  climbing_gear: {
    id: 'climbing_gear',
    name: 'Climbing Gear',
    description: 'Gain 5 Max HP.',
    rarity: 'COMMON',
    effects: [{ trigger: 'PICKUP', action: 'MAX_HP', value: 5 }],
  },
  worn_pickaxe: {
    id: 'worn_pickaxe',
    name: 'Worn Pickaxe',
    description: 'The first Attack you play each combat deals 4 additional damage.',
    rarity: 'COMMON',
    effects: [{ trigger: 'FIRST_ATTACK_COMBAT', action: 'DAMAGE', value: 4 }],
  },
  hardhat: {
    id: 'hardhat',
    name: 'Hardhat',
    description: 'The first time you would take damage each combat, reduce it by 5.',
    rarity: 'COMMON',
    effects: [{ trigger: 'FIRST_DAMAGE', action: 'REDUCE', value: 5 }],
  },
  miners_flask: {
    id: 'miners_flask',
    name: "Miner's Flask",
    description: 'Start each combat with 1 additional potion slot.',
    rarity: 'COMMON',
    effects: [{ trigger: 'PASSIVE', action: 'POTION_SLOT', value: 1 }],
  },
  bag_of_ore: {
    id: 'bag_of_ore',
    name: 'Bag of Ore',
    description: 'Gain 25 gold.',
    rarity: 'COMMON',
    effects: [{ trigger: 'PICKUP', action: 'GOLD', value: 25 }],
  },
  lucky_pickaxe: {
    id: 'lucky_pickaxe',
    name: 'Lucky Pickaxe',
    description: 'Gain 20% more gold from all sources.',
    rarity: 'COMMON',
    effects: [{ trigger: 'GOLD_GAIN', action: 'MULTIPLY', value: 20 }],
  },
  rusty_lantern: {
    id: 'rusty_lantern',
    name: 'Rusty Lantern',
    description: 'At the end of your turn, if you have 0 cards in hand, draw 1.',
    rarity: 'COMMON',
    effects: [{ trigger: 'END_TURN_EMPTY_HAND', action: 'DRAW', value: 1 }],
  },
  sturdy_boots: {
    id: 'sturdy_boots',
    name: 'Sturdy Boots',
    description: 'When you enter a ? room, gain 3 Block.',
    rarity: 'COMMON',
    effects: [{ trigger: 'ENTER_EVENT', action: 'BLOCK', value: 3 }],
  },

  // ============================================
  // === UNCOMMON RELICS ===
  // ============================================
  echo_stone: {
    id: 'echo_stone',
    name: 'Echo Stone',
    description: 'The first Attack you play each turn is played twice.',
    rarity: 'UNCOMMON',
    effects: [{ trigger: 'FIRST_ATTACK', action: 'DOUBLE', value: 1 }],
  },
  depths_blessing: {
    id: 'depths_blessing',
    name: "Depth's Blessing",
    description: 'Whenever you enter a Rest Site, heal an additional 5 HP.',
    rarity: 'UNCOMMON',
    effects: [{ trigger: 'REST', action: 'HEAL', value: 5 }],
  },
  crystal_shard: {
    id: 'crystal_shard',
    name: 'Crystal Shard',
    description: 'Enemies start combat with 1 Exposed.',
    rarity: 'UNCOMMON',
    effects: [{ trigger: 'START_COMBAT', action: 'ENEMY_VULNERABLE', value: 1 }],
  },
  ancient_coin: {
    id: 'ancient_coin',
    name: 'Ancient Coin',
    description: 'Gain 15 gold after each combat.',
    rarity: 'UNCOMMON',
    effects: [{ trigger: 'END_COMBAT', action: 'GOLD', value: 15 }],
  },
  glowing_ore: {
    id: 'glowing_ore',
    name: 'Glowing Ore',
    description: 'At the start of each turn, gain 2 Ore Plating.',
    rarity: 'UNCOMMON',
    effects: [{ trigger: 'START_TURN', action: 'PLATED_ARMOR', value: 2 }],
  },
  tuning_fork: {
    id: 'tuning_fork',
    name: 'Tuning Fork',
    description: 'Whenever you shuffle your draw pile, gain 1 Might.',
    rarity: 'UNCOMMON',
    effects: [{ trigger: 'SHUFFLE', action: 'STRENGTH', value: 1 }],
  },
  crystallized_fear: {
    id: 'crystallized_fear',
    name: 'Crystallized Fear',
    description: 'Enemies start combat with 1 Weakened.',
    rarity: 'UNCOMMON',
    effects: [{ trigger: 'START_COMBAT', action: 'ENEMY_WEAK', value: 1 }],
  },
  bottled_echo: {
    id: 'bottled_echo',
    name: 'Bottled Echo',
    description: 'At the start of each combat, add a copy of your first card to your hand.',
    rarity: 'UNCOMMON',
    effects: [{ trigger: 'START_COMBAT', action: 'COPY_FIRST_CARD', value: 1 }],
  },
  miners_canary: {
    id: 'miners_canary',
    name: "Miner's Canary",
    description: 'The first time you would be reduced to 0 HP each combat, heal 10 HP instead.',
    rarity: 'UNCOMMON',
    effects: [{ trigger: 'NEAR_DEATH', action: 'HEAL', value: 10 }],
  },
  depth_gauge: {
    id: 'depth_gauge',
    name: 'Depth Gauge',
    description: 'Gain 2 Max HP after each floor.',
    rarity: 'UNCOMMON',
    effects: [{ trigger: 'FLOOR_END', action: 'MAX_HP', value: 2 }],
  },
  resonance_gem: {
    id: 'resonance_gem',
    name: 'Resonance Gem',
    description: 'Whenever you play a Power, draw 1 card.',
    rarity: 'UNCOMMON',
    effects: [{ trigger: 'PLAY_POWER', action: 'DRAW', value: 1 }],
  },
  stone_heart: {
    id: 'stone_heart',
    name: 'Stone Heart',
    description: 'If you end your turn with Block, gain 3 additional Block.',
    rarity: 'UNCOMMON',
    effects: [{ trigger: 'END_TURN_WITH_BLOCK', action: 'BLOCK', value: 3 }],
  },
  tunnel_map: {
    id: 'tunnel_map',
    name: 'Tunnel Map',
    description: 'You can now see 2 floors ahead on the map.',
    rarity: 'UNCOMMON',
    effects: [{ trigger: 'PASSIVE', action: 'MAP_VISION', value: 2 }],
  },
  unstable_core: {
    id: 'unstable_core',
    name: 'Unstable Core',
    description: 'Whenever you Exhaust a card, deal 3 damage to ALL enemies.',
    rarity: 'UNCOMMON',
    effects: [{ trigger: 'EXHAUST', action: 'DAMAGE_ALL', value: 3 }],
  },
  philosophers_stone: {
    id: 'philosophers_stone',
    name: "Philosopher's Stone",
    description: 'Gain 1 Energy at the start of each turn. Enemies start with 1 Might.',
    rarity: 'UNCOMMON',
    effects: [
      { trigger: 'START_TURN', action: 'ENERGY', value: 1 },
      { trigger: 'START_COMBAT', action: 'ENEMY_STRENGTH', value: 1 },
    ],
  },

  // ============================================
  // === RARE RELICS ===
  // ============================================
  abyssal_heart: {
    id: 'abyssal_heart',
    name: 'Abyssal Heart',
    description: 'Gain 1 Energy at the start of each turn.',
    rarity: 'RARE',
    effects: [{ trigger: 'START_TURN', action: 'ENERGY', value: 1 }],
  },
  fossilized_scale: {
    id: 'fossilized_scale',
    name: 'Fossilized Scale',
    description: 'Reduce ALL damage taken by 1.',
    rarity: 'RARE',
    effects: [{ trigger: 'DAMAGE_TAKEN', action: 'REDUCE', value: 1 }],
  },
  primordial_ember: {
    id: 'primordial_ember',
    name: 'Primordial Ember',
    description: 'Whenever you play a Power, gain 1 Might.',
    rarity: 'RARE',
    effects: [{ trigger: 'PLAY_POWER', action: 'STRENGTH', value: 1 }],
  },
  void_pendant: {
    id: 'void_pendant',
    name: 'Void Pendant',
    description: 'Once per combat, when you would die, heal to 50% HP instead.',
    rarity: 'RARE',
    effects: [{ trigger: 'DEATH', action: 'REVIVE', value: 50 }],
  },
  ancient_core: {
    id: 'ancient_core',
    name: 'Ancient Core',
    description: 'At the start of each combat, gain 3 Might and 3 Agility.',
    rarity: 'RARE',
    effects: [
      { trigger: 'START_COMBAT', action: 'STRENGTH', value: 3 },
      { trigger: 'START_COMBAT', action: 'DEXTERITY', value: 3 },
    ],
  },
  echo_blade: {
    id: 'echo_blade',
    name: 'Echo Blade',
    description: 'Whenever you deal 20+ damage in a single hit, draw 2 cards.',
    rarity: 'RARE',
    effects: [{ trigger: 'BIG_DAMAGE', action: 'DRAW', value: 2 }],
  },
  crystalline_heart: {
    id: 'crystalline_heart',
    name: 'Crystalline Heart',
    description: 'At the end of your turn, if you played 5+ cards, gain 15 Block.',
    rarity: 'RARE',
    effects: [{ trigger: 'END_TURN_MANY_CARDS', action: 'BLOCK', value: 15 }],
  },
  depths_embrace: {
    id: 'depths_embrace',
    name: "Depth's Embrace",
    description: 'At the start of each combat, gain 2 Warding.',
    rarity: 'RARE',
    effects: [{ trigger: 'START_COMBAT', action: 'ARTIFACT', value: 2 }],
  },
  eternal_flame: {
    id: 'eternal_flame',
    name: 'Eternal Flame',
    description: 'Your Attacks deal 3 additional damage.',
    rarity: 'RARE',
    effects: [{ trigger: 'ATTACK', action: 'DAMAGE', value: 3 }],
  },
  primordial_shard: {
    id: 'primordial_shard',
    name: 'Primordial Shard',
    description: 'Once per turn, when you play a card that costs 2+, gain 1 Energy.',
    rarity: 'RARE',
    effects: [{ trigger: 'PLAY_EXPENSIVE', action: 'ENERGY', value: 1 }],
  },
  hollow_crown: {
    id: 'hollow_crown',
    name: 'Hollow Crown',
    description: 'At the start of boss fights, gain 3 Might, 3 Agility, and draw 3 cards.',
    rarity: 'RARE',
    effects: [
      { trigger: 'START_BOSS', action: 'STRENGTH', value: 3 },
      { trigger: 'START_BOSS', action: 'DEXTERITY', value: 3 },
      { trigger: 'START_BOSS', action: 'DRAW', value: 3 },
    ],
  },
  worldstone_fragment: {
    id: 'worldstone_fragment',
    name: 'Worldstone Fragment',
    description: 'Retain 1 card at the end of each turn.',
    rarity: 'RARE',
    effects: [{ trigger: 'END_TURN', action: 'RETAIN', value: 1 }],
  },
  cursed_pickaxe: {
    id: 'cursed_pickaxe',
    name: 'Cursed Pickaxe',
    description: 'Your Attacks deal 50% more damage. Start each combat Exposed for 1 turn.',
    rarity: 'RARE',
    effects: [
      { trigger: 'ATTACK', action: 'DAMAGE_MULTIPLY', value: 50 },
      { trigger: 'START_COMBAT', action: 'SELF_VULNERABLE', value: 1 },
    ],
  },

  // ============================================
  // === BOSS RELICS ===
  // ============================================
  hollow_guardians_core: {
    id: 'hollow_guardians_core',
    name: "Hollow Guardian's Core",
    description: 'Gain 15 Max HP. Start each combat with 15 Block.',
    rarity: 'RARE',
    effects: [
      { trigger: 'PICKUP', action: 'MAX_HP', value: 15 },
      { trigger: 'START_COMBAT', action: 'BLOCK', value: 15 },
    ],
  },
  crystal_wyrms_scale: {
    id: 'crystal_wyrms_scale',
    name: "Crystal Wyrm's Scale",
    description: 'At the start of each turn, gain 5 Ore Plating.',
    rarity: 'RARE',
    effects: [{ trigger: 'START_TURN', action: 'PLATED_ARMOR', value: 5 }],
  },
  the_forgottens_mask: {
    id: 'the_forgottens_mask',
    name: "The Forgotten's Mask",
    description: 'Gain 1 Energy each turn. Draw 1 fewer card at the start of combat.',
    rarity: 'RARE',
    effects: [
      { trigger: 'START_TURN', action: 'ENERGY', value: 1 },
      { trigger: 'START_COMBAT', action: 'DRAW', value: -1 },
    ],
  },
};

// Create starter deck from card IDs
function createStarterDeck(cardIds: string[]): Card[] {
  // Ensure DataLoader is initialized
  DataLoader.initialize();
  
  return cardIds.map(id => {
    const template = DataLoader.getCardById(id);
    if (!template) {
      console.warn(`Unknown card ID: ${id}`);
      return null;
    }
    return { ...template, upgraded: false };
  }).filter((card): card is Card => card !== null);
}

// Create starter relic
function createStarterRelic(relicId: string): Relic | null {
  // Ensure DataLoader is initialized
  DataLoader.initialize();
  
  const relicData = DataLoader.getRelicById(relicId);
  if (!relicData) {
    console.warn(`Unknown relic ID: ${relicId}`);
    return null;
  }
  return { ...relicData, counter: 0 };
}

interface GameState {
  // Screen management
  screen: GameScreen;
  previousScreen: GameScreen | null;

  // Run state
  player: Player;
  currentAct: number;
  currentFloor: number;
  map: Room[];
  currentRoomIndex: number;
  seed: string;

  // Combat state
  combat: CombatState | null;

  // UI state
  showDeckView: boolean;
  deckViewMode: 'DECK' | 'DRAW' | 'DISCARD' | 'EXHAUST';
  showMap: boolean;
  selectedCardIndex: number | null;
  hoveredCard: Card | null;

  // Current event (for event rooms)
  currentEvent: GameEvent | null;

  // Actions
  setScreen: (screen: GameScreen) => void;
  startNewRun: (character: CharacterClass) => void;

  // Player actions
  updatePlayer: (updates: Partial<Player>) => void;
  addCardToDeck: (card: Card) => void;
  removeCardFromDeck: (cardIndex: number) => void;
  upgradeCard: (cardIndex: number) => void;
  addRelic: (relic: Relic) => void;
  addPotion: (potion: Potion) => boolean;
  usePotion: (index: number) => Potion | null;
  addGold: (amount: number) => void;
  spendGold: (amount: number) => boolean;
  heal: (amount: number) => void;
  takeDamage: (amount: number) => number;

  // Map actions
  setMap: (map: Room[]) => void;
  moveToRoom: (roomIndex: number) => void;

  // Combat actions
  startCombat: (enemies: Enemy[]) => void;
  endCombat: (victory: boolean) => void;
  setCombat: (combat: CombatState | null) => void;
  updateCombat: (updates: Partial<CombatState>) => void;
  playCard: (cardIndex: number, targetIndex: number | null) => void;
  endPlayerTurn: () => void;

  // UI actions
  setShowDeckView: (show: boolean, mode?: 'DECK' | 'DRAW' | 'DISCARD' | 'EXHAUST') => void;
  setShowMap: (show: boolean) => void;
  setSelectedCard: (index: number | null) => void;
  setHoveredCard: (card: Card | null) => void;

  // Event actions
  setCurrentEvent: (event: GameEvent | null) => void;

  // Reset
  resetGame: () => void;
}

export const useGameStore = create<GameState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    screen: 'MAIN_MENU',
    previousScreen: null,
    player: createDefaultPlayer(),
    currentAct: 1,
    currentFloor: 0,
    map: [],
    currentRoomIndex: 0,
    seed: '',
    combat: null,
    showDeckView: false,
    deckViewMode: 'DECK',
    showMap: false,
    selectedCardIndex: null,
    hoveredCard: null,
    currentEvent: null,

    // Screen management
    setScreen: (screen) => set((state) => ({
      screen,
      previousScreen: state.screen
    })),

    // Start new run
    startNewRun: (character) => {
      const seed = Math.random().toString(36).substring(2, 15);

      // Create starter deck from character's starting cards
      const starterDeck = createStarterDeck(character.startingDeck);

      // Create the starting relic
      const startingRelic = createStarterRelic(character.startingRelic);

      set({
        screen: 'MAP',
        player: {
          ...createDefaultPlayer(),
          maxHp: character.maxHp,
          currentHp: character.maxHp,
          gold: character.startingGold,
          deck: starterDeck,
          relics: startingRelic ? [startingRelic] : [],
        },
        currentAct: 1,
        currentFloor: 0,
        currentRoomIndex: -1, // -1 means at the start, not on any room yet
        map: [], // Will be generated by MapScreen
        seed,
        combat: null,
      });
    },

    // Player actions
    updatePlayer: (updates) => set((state) => ({
      player: { ...state.player, ...updates }
    })),

    addCardToDeck: (card) => set((state) => ({
      player: {
        ...state.player,
        deck: [...state.player.deck, card]
      }
    })),

    removeCardFromDeck: (cardIndex) => set((state) => ({
      player: {
        ...state.player,
        deck: state.player.deck.filter((_, i) => i !== cardIndex)
      }
    })),

    upgradeCard: (cardIndex) => set((state) => {
      const deck = [...state.player.deck];
      const card = deck[cardIndex];
      if (card && !card.upgraded) {
        deck[cardIndex] = {
          ...card,
          upgraded: true,
          name: `${card.name}+`,
          // Apply upgrade stats if they exist
          ...(card.upgradedStats || {})
        };
      }
      return { player: { ...state.player, deck } };
    }),

    addRelic: (relic) => set((state) => ({
      player: {
        ...state.player,
        relics: [...state.player.relics, relic]
      }
    })),

    addPotion: (potion) => {
      const state = get();
      const emptySlot = state.player.potions.findIndex(p => p === null);
      if (emptySlot === -1) return false;

      const potions = [...state.player.potions];
      potions[emptySlot] = potion;
      set({ player: { ...state.player, potions } });
      return true;
    },

    usePotion: (index) => {
      const state = get();
      const potion = state.player.potions[index];
      if (!potion) return null;

      const potions = [...state.player.potions];
      potions[index] = null;
      set({ player: { ...state.player, potions } });
      return potion;
    },

    addGold: (amount) => set((state) => ({
      player: { ...state.player, gold: state.player.gold + amount }
    })),

    spendGold: (amount) => {
      const state = get();
      if (state.player.gold < amount) return false;
      set({ player: { ...state.player, gold: state.player.gold - amount } });
      return true;
    },

    heal: (amount) => set((state) => ({
      player: {
        ...state.player,
        currentHp: Math.min(state.player.maxHp, state.player.currentHp + amount)
      }
    })),

    takeDamage: (amount) => {
      const state = get();
      const { player } = state;

      // Apply vulnerable
      let damage = amount;
      if (player.statusEffects.vulnerable > 0) {
        damage = Math.floor(damage * 1.5);
      }

      // Block absorbs damage
      const damageAfterBlock = Math.max(0, damage - player.block);
      const newBlock = Math.max(0, player.block - damage);
      const newHp = Math.max(0, player.currentHp - damageAfterBlock);

      set({
        player: {
          ...player,
          currentHp: newHp,
          block: newBlock
        }
      });

      return damageAfterBlock;
    },

    // Map actions
    setMap: (map) => set({ map }),

    moveToRoom: (roomIndex) => set((state) => {
      const map = [...state.map];
      map[roomIndex] = { ...map[roomIndex], visited: true };
      return {
        map,
        currentRoomIndex: roomIndex,
        currentFloor: map[roomIndex].y
      };
    }),

    // Combat actions
    startCombat: (enemies) => {
      const state = get();

      // Shuffle deck into draw pile
      const shuffledDeck = [...state.player.deck].sort(() => Math.random() - 0.5);

      // Draw initial hand (5 cards)
      const handSize = 5;
      const hand = shuffledDeck.slice(0, handSize);
      const drawPile = shuffledDeck.slice(handSize);

      set({
        screen: 'COMBAT',
        player: {
          ...state.player,
          energy: state.player.maxEnergy,
          block: 0,
        },
        combat: {
          enemies,
          hand,
          drawPile,
          discardPile: [],
          exhaustPile: [],
          turn: 1,
          isPlayerTurn: true,
          selectedCard: null,
          targetingMode: false,
        }
      });
    },

    endCombat: (victory) => set((state) => ({
      screen: victory ? 'REWARD' : 'DEFEAT',
      combat: null,
      player: {
        ...state.player,
        block: 0,
        statusEffects: createDefaultStatusEffects()
      }
    })),

    setCombat: (combat) => set({ combat }),

    updateCombat: (updates) => set((state) => ({
      combat: state.combat ? { ...state.combat, ...updates } : null
    })),

    playCard: (cardIndex, targetIndex) => {
      const state = get();
      const { combat, player } = state;

      if (!combat || !combat.isPlayerTurn) return;

      const card = combat.hand[cardIndex];
      if (!card) return;

      // Check energy cost
      if (card.cost > player.energy && !card.isXCost) return;

      // Calculate energy cost
      const energyCost = card.isXCost ? player.energy : card.cost;

      // Apply card effects
      let newPlayer = { ...player, energy: player.energy - energyCost };
      let newEnemies = [...combat.enemies];

      // Process each effect in the card
      for (const effect of card.effects) {
        switch (effect.type) {
          case 'DAMAGE': {
            if (targetIndex !== null && newEnemies[targetIndex]) {
              let damage = effect.value;

              // Apply strength bonus
              damage += newPlayer.statusEffects.strength;

              // Apply vulnerable multiplier (50% more damage)
              if (newEnemies[targetIndex].statusEffects.vulnerable > 0) {
                damage = Math.floor(damage * 1.5);
              }

              // Apply weak  penalty (25% less damage)
              if (newPlayer.statusEffects.weak > 0) {
                damage = Math.floor(damage * 0.75);
              }

              // Apply damage after block
              const enemy = newEnemies[targetIndex];
              const damageAfterBlock = Math.max(0, damage - enemy.block);
              enemy.currentHp = Math.max(0, enemy.currentHp - damageAfterBlock);
              enemy.block = Math.max(0, enemy.block - damage);
            }
            break;
          }

          case 'BLOCK': {
            let blockGained = effect.value;

            // Apply dexterity bonus
            blockGained += newPlayer.statusEffects.dexterity;

            // Apply frail penalty (25% less block)
            if (newPlayer.statusEffects.frail > 0) {
              blockGained = Math.floor(blockGained * 0.75);
            }

            newPlayer.block += blockGained;
            break;
          }

          case 'APPLY_VULNERABLE': {
            if (targetIndex !== null && newEnemies[targetIndex]) {
              newEnemies[targetIndex].statusEffects.vulnerable += effect.value;
            }
            break;
          }

          case 'APPLY_WEAK': {
            if (targetIndex !== null && newEnemies[targetIndex]) {
              newEnemies[targetIndex].statusEffects.weak += effect.value;
            }
            break;
          }

          case 'APPLY_STRENGTH': {
            newPlayer.statusEffects.strength += effect.value;
            break;
          }

          case 'APPLY_DEXTERITY': {
            newPlayer.statusEffects.dexterity += effect.value;
            break;
          }

          case 'DRAW': {
            // Will handle drawing cards below
            break;
          }

          case 'HEAL': {
            newPlayer.currentHp = Math.min(newPlayer.maxHp, newPlayer.currentHp + effect.value);
            break;
          }

          case 'APPLY_POISON': {
            if (targetIndex !== null && newEnemies[targetIndex]) {
              newEnemies[targetIndex].statusEffects.poison += effect.value;
            }
            break;
          }
        }
      }

      // Remove dead enemies
      newEnemies = newEnemies.filter(e => e.currentHp > 0);

      // Move card to appropriate pile
      const newHand = [...combat.hand];
      const playedCard = newHand.splice(cardIndex, 1)[0];
      const newExhaustPile = card.exhaust ? [...combat.exhaustPile, playedCard] : combat.exhaustPile;
      const newDiscardPile = !card.exhaust ? [...combat.discardPile, playedCard] : combat.discardPile;

      // Draw cards if card has draw effect
      const drawEffect = card.effects.find(e => e.type === 'DRAW');
      let newDrawPile = [...combat.drawPile];
      if (drawEffect) {
        for (let i = 0; i < drawEffect.value; i++) {
          if (newDrawPile.length === 0) {
            // Shuffle discard back into draw
            newDrawPile = [...newDiscardPile].sort(() => Math.random() - 0.5);
            newDiscardPile.length = 0;
          }
          if (newDrawPile.length > 0) {
            newHand.push(newDrawPile.shift()!);
          }
        }
      }

      // Check victory
      if (newEnemies.length === 0) {
        set({
          player: newPlayer,
          screen: 'REWARD',
          combat: null
        });
        return;
      }

      set({
        player: newPlayer,
        combat: {
          ...combat,
          hand: newHand,
          drawPile: newDrawPile,
          discardPile: newDiscardPile,
          exhaustPile: newExhaustPile,
          enemies: newEnemies
        }
      });
    },

    endPlayerTurn: () => {
      const state = get();
      const { combat, player } = state;

      if (!combat || !combat.isPlayerTurn) return;

      // Set to enemy turn
      set({
        combat: {
          ...combat,
          isPlayerTurn: false
        }
      });

      // Execute enemy turn after a delay (for animation)
      setTimeout(() => {
        const currentState = get();
        if (!currentState.combat) return;

        let newPlayer = { ...currentState.player };
        const newEnemies = [...currentState.combat.enemies];

        // Each enemy executes their intent
        for (const enemy of newEnemies) {
          const intent = enemy.currentIntent;

          switch (intent.type) {
            case 'ATTACK': {
              let damage = intent.value || 0;

              // Apply enemy strength
              damage += enemy.statusEffects.strength;

              // Apply player vulnerable (50% more damage taken)
              if (newPlayer.statusEffects.vulnerable > 0) {
                damage = Math.floor(damage * 1.5);
              }

              // Apply enemy weak (25% less damage dealt)
              if (enemy.statusEffects.weak > 0) {
                damage = Math.floor(damage * 0.75);
              }

              // Apply damage through block
              const damageAfterBlock = Math.max(0, damage - newPlayer.block);
              newPlayer.currentHp = Math.max(0, newPlayer.currentHp - damageAfterBlock);
              newPlayer.block = Math.max(0, newPlayer.block - damage);
              break;
            }

            case 'DEFEND': {
              enemy.block += intent.value || 0;
              break;
            }

            case 'BUFF': {
              enemy.statusEffects.strength += 1;
              break;
            }

            case 'DEBUFF': {
              newPlayer.statusEffects.weak += 1;
              break;
            }
          }

          // Choose next intent randomly from enemy moves
          if (enemy.moves && enemy.moves.length > 0) {
            const totalWeight = enemy.moves.reduce((sum, move) => sum + move.weight, 0);
            let random = Math.random() * totalWeight;

            for (const move of enemy.moves) {
              random -= move.weight;
              if (random <= 0) {
                enemy.currentIntent = move.intent;
                break;
              }
            }
          }
        }

        // Check defeat
        if (newPlayer.currentHp <= 0) {
          set({
            player: newPlayer,
            screen: 'DEFEAT',
            combat: null
          });
          return;
        }

        // Start new turn
        // Decrement status effects
        if (newPlayer.statusEffects.weak > 0) newPlayer.statusEffects.weak--;
        if (newPlayer.statusEffects.vulnerable > 0) newPlayer.statusEffects.vulnerable--;
        if (newPlayer.statusEffects.frail > 0) newPlayer.statusEffects.frail--;

        for (const enemy of newEnemies) {
          if (enemy.statusEffects.weak > 0) enemy.statusEffects.weak--;
          if (enemy.statusEffects.vulnerable > 0) enemy.statusEffects.vulnerable--;

          // Apply poison damage
          if (enemy.statusEffects.poison > 0) {
            enemy.currentHp = Math.max(0, enemy.currentHp - enemy.statusEffects.poison);
          }

          // Reset enemy block
          enemy.block = 0;
        }

        // Reset player block and energy
        newPlayer.block = 0;
        newPlayer.energy = newPlayer.maxEnergy;

        // Draw new hand
        let newDrawPile = [...currentState.combat.drawPile];
        let newDiscardPile = [...currentState.combat.discardPile];

        // Discard all remaining cards in hand first
        newDiscardPile.push(...currentState.combat.hand);
        const newHand: typeof currentState.combat.hand = [];

        for (let i = 0; i < 5; i++) {
          if (newDrawPile.length === 0) {
            // Shuffle discard into draw
            newDrawPile = [...newDiscardPile].sort(() => Math.random() - 0.5);
            newDiscardPile = [];
          }
          if (newDrawPile.length > 0) {
            newHand.push(newDrawPile.shift()!);
          }
        }

        set({
          player: newPlayer,
          combat: {
            ...currentState.combat,
            enemies: newEnemies.filter(e => e.currentHp > 0),
            hand: newHand,
            drawPile: newDrawPile,
            discardPile: newDiscardPile,
            turn: currentState.combat.turn + 1,
            isPlayerTurn: true
          }
        });
      }, 1500);
    },

    // UI actions
    setShowDeckView: (show, mode = 'DECK') => set({
      showDeckView: show,
      deckViewMode: mode
    }),

    setShowMap: (show) => set({ showMap: show }),

    setSelectedCard: (index) => set({ selectedCardIndex: index }),

    setHoveredCard: (card) => set({ hoveredCard: card }),

    // Event actions
    setCurrentEvent: (event) => set({ currentEvent: event }),

    // Reset
    resetGame: () => set({
      screen: 'MAIN_MENU',
      previousScreen: null,
      player: createDefaultPlayer(),
      currentAct: 1,
      currentFloor: 0,
      map: [],
      currentRoomIndex: 0,
      seed: '',
      combat: null,
      showDeckView: false,
      showMap: false,
      selectedCardIndex: null,
      hoveredCard: null,
      currentEvent: null,
    }),
  }))
);

// Selectors for common derived state
export const selectCurrentRoom = (state: GameState) =>
  state.map[state.currentRoomIndex];

export const selectAvailableRooms = (state: GameState) => {
  const currentRoom = state.map[state.currentRoomIndex];
  if (!currentRoom) return [];
  return currentRoom.connections.map(i => state.map[i]);
};

export const selectPlayerHpPercent = (state: GameState) =>
  state.player.currentHp / state.player.maxHp;

export const selectIsLowHp = (state: GameState) =>
  selectPlayerHpPercent(state) < 0.3;
