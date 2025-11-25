import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
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

// Card templates for starter deck
const CARD_TEMPLATES: Record<string, Omit<Card, 'upgraded'>> = {
  // ============================================
  // === STARTER CARDS ===
  // ============================================
  delve: {
    id: 'delve',
    name: 'Delve',
    description: 'Deal {0} damage.',
    type: 'ATTACK',
    rarity: 'STARTER',
    cost: 1,
    targetType: 'SINGLE_ENEMY',
    effects: [{ type: 'DAMAGE', value: 6 }],
  },
  brace: {
    id: 'brace',
    name: 'Brace',
    description: 'Gain {0} Block.',
    type: 'SKILL',
    rarity: 'STARTER',
    cost: 1,
    targetType: 'SELF',
    effects: [{ type: 'BLOCK', value: 5 }],
  },
  sunder: {
    id: 'sunder',
    name: 'Sunder',
    description: 'Deal {0} damage. Apply {1} Exposed.',
    type: 'ATTACK',
    rarity: 'STARTER',
    cost: 2,
    targetType: 'SINGLE_ENEMY',
    effects: [
      { type: 'DAMAGE', value: 8 },
      { type: 'APPLY_VULNERABLE', value: 2 },
    ],
  },
  
  // ============================================
  // === COMMON ATTACKS ===
  // ============================================
  pickaxe_swing: {
    id: 'pickaxe_swing',
    name: 'Pickaxe Swing',
    description: 'Deal {0} damage. Draw {1} card.',
    type: 'ATTACK',
    rarity: 'COMMON',
    cost: 1,
    targetType: 'SINGLE_ENEMY',
    effects: [
      { type: 'DAMAGE', value: 9 },
      { type: 'DRAW', value: 1 },
    ],
  },
  echo_strike: {
    id: 'echo_strike',
    name: 'Echo Strike',
    description: 'Deal {0} damage twice.',
    type: 'ATTACK',
    rarity: 'COMMON',
    cost: 1,
    targetType: 'SINGLE_ENEMY',
    effects: [
      { type: 'DAMAGE', value: 4 },
      { type: 'DAMAGE', value: 4 },
    ],
  },
  lantern_bash: {
    id: 'lantern_bash',
    name: 'Lantern Bash',
    description: 'Deal {0} damage. Gain {1} Block.',
    type: 'ATTACK',
    rarity: 'COMMON',
    cost: 1,
    targetType: 'SINGLE_ENEMY',
    effects: [
      { type: 'DAMAGE', value: 5 },
      { type: 'BLOCK', value: 5 },
    ],
  },
  cave_in: {
    id: 'cave_in',
    name: 'Cave In',
    description: 'Deal {0} damage to ALL enemies.',
    type: 'ATTACK',
    rarity: 'COMMON',
    cost: 1,
    targetType: 'ALL_ENEMIES',
    effects: [{ type: 'DAMAGE', value: 8 }],
  },
  reckless_dive: {
    id: 'reckless_dive',
    name: 'Reckless Dive',
    description: 'Deal {0} damage. Take {1} damage.',
    type: 'ATTACK',
    rarity: 'COMMON',
    cost: 0,
    targetType: 'SINGLE_ENEMY',
    effects: [
      { type: 'DAMAGE', value: 7 },
      { type: 'SELF_DAMAGE', value: 3 },
    ],
  },
  ore_toss: {
    id: 'ore_toss',
    name: 'Ore Toss',
    description: 'Deal {0} damage to a random enemy twice.',
    type: 'ATTACK',
    rarity: 'COMMON',
    cost: 1,
    targetType: 'RANDOM_ENEMY',
    effects: [
      { type: 'DAMAGE', value: 5 },
      { type: 'DAMAGE', value: 5 },
    ],
  },
  drilling_strike: {
    id: 'drilling_strike',
    name: 'Drilling Strike',
    description: 'Deal {0} damage. If this kills the enemy, gain {1} Energy.',
    type: 'ATTACK',
    rarity: 'COMMON',
    cost: 1,
    targetType: 'SINGLE_ENEMY',
    effects: [
      { type: 'DAMAGE', value: 7 },
      { type: 'CONDITIONAL_ENERGY_ON_KILL', value: 1 },
    ],
  },
  tunnel_rush: {
    id: 'tunnel_rush',
    name: 'Tunnel Rush',
    description: 'Deal {0} damage. Draw {1} card if you have no Block.',
    type: 'ATTACK',
    rarity: 'COMMON',
    cost: 1,
    targetType: 'SINGLE_ENEMY',
    effects: [
      { type: 'DAMAGE', value: 8 },
      { type: 'CONDITIONAL_DRAW_NO_BLOCK', value: 1 },
    ],
  },
  chip_away: {
    id: 'chip_away',
    name: 'Chip Away',
    description: 'Deal {0} damage. Apply {1} Exposed.',
    type: 'ATTACK',
    rarity: 'COMMON',
    cost: 1,
    targetType: 'SINGLE_ENEMY',
    effects: [
      { type: 'DAMAGE', value: 5 },
      { type: 'APPLY_VULNERABLE', value: 1 },
    ],
  },
  hammer_down: {
    id: 'hammer_down',
    name: 'Hammer Down',
    description: 'Deal {0} damage. Apply {1} Weakened.',
    type: 'ATTACK',
    rarity: 'COMMON',
    cost: 1,
    targetType: 'SINGLE_ENEMY',
    effects: [
      { type: 'DAMAGE', value: 6 },
      { type: 'APPLY_WEAK', value: 1 },
    ],
  },
  tremor_strike: {
    id: 'tremor_strike',
    name: 'Tremor Strike',
    description: 'Deal {0} damage to ALL enemies. Gain {1} Block.',
    type: 'ATTACK',
    rarity: 'COMMON',
    cost: 2,
    targetType: 'ALL_ENEMIES',
    effects: [
      { type: 'DAMAGE', value: 7 },
      { type: 'BLOCK', value: 5 },
    ],
  },
  
  // ============================================
  // === COMMON SKILLS ===
  // ============================================
  tunnel_vision: {
    id: 'tunnel_vision',
    name: 'Tunnel Vision',
    description: 'Gain {0} Block. Draw {1} card.',
    type: 'SKILL',
    rarity: 'COMMON',
    cost: 1,
    targetType: 'SELF',
    effects: [
      { type: 'BLOCK', value: 8 },
      { type: 'DRAW', value: 1 },
    ],
  },
  stone_skin: {
    id: 'stone_skin',
    name: 'Stone Skin',
    description: 'Gain {0} Block.',
    type: 'SKILL',
    rarity: 'COMMON',
    cost: 2,
    targetType: 'SELF',
    effects: [{ type: 'BLOCK', value: 15 }],
  },
  map_the_depths: {
    id: 'map_the_depths',
    name: 'Map the Depths',
    description: 'Draw {0} cards.',
    type: 'SKILL',
    rarity: 'COMMON',
    cost: 1,
    targetType: 'SELF',
    effects: [{ type: 'DRAW', value: 3 }],
  },
  gear_up: {
    id: 'gear_up',
    name: 'Gear Up',
    description: 'Gain {0} Block. Upgrade a card in your hand.',
    type: 'SKILL',
    rarity: 'COMMON',
    cost: 1,
    targetType: 'SELF',
    effects: [
      { type: 'BLOCK', value: 5 },
      { type: 'UPGRADE_HAND', value: 1 },
    ],
  },
  quickstep: {
    id: 'quickstep',
    name: 'Quickstep',
    description: 'Gain {0} Block. Draw {1} card.',
    type: 'SKILL',
    rarity: 'COMMON',
    cost: 0,
    targetType: 'SELF',
    effects: [
      { type: 'BLOCK', value: 3 },
      { type: 'DRAW', value: 1 },
    ],
  },
  reinforce: {
    id: 'reinforce',
    name: 'Reinforce',
    description: 'Double your current Block.',
    type: 'SKILL',
    rarity: 'COMMON',
    cost: 1,
    targetType: 'SELF',
    effects: [{ type: 'DOUBLE_BLOCK', value: 1 }],
  },
  miners_grit: {
    id: 'miners_grit',
    name: "Miner's Grit",
    description: 'Gain {0} Block. Gain {1} Might.',
    type: 'SKILL',
    rarity: 'COMMON',
    cost: 2,
    targetType: 'SELF',
    effects: [
      { type: 'BLOCK', value: 8 },
      { type: 'APPLY_STRENGTH', value: 1 },
    ],
  },
  survey: {
    id: 'survey',
    name: 'Survey',
    description: 'Draw {0} cards. Discard 1 card.',
    type: 'SKILL',
    rarity: 'COMMON',
    cost: 0,
    targetType: 'SELF',
    effects: [
      { type: 'DRAW', value: 2 },
      { type: 'DISCARD', value: 1 },
    ],
  },
  hunker_down: {
    id: 'hunker_down',
    name: 'Hunker Down',
    description: 'Gain {0} Block. Exhaust.',
    type: 'SKILL',
    rarity: 'COMMON',
    cost: 1,
    targetType: 'SELF',
    effects: [{ type: 'BLOCK', value: 14 }],
    exhaust: true,
  },
  emergency_supplies: {
    id: 'emergency_supplies',
    name: 'Emergency Supplies',
    description: 'Gain {0} Block. Heal {1} HP. Exhaust.',
    type: 'SKILL',
    rarity: 'COMMON',
    cost: 1,
    targetType: 'SELF',
    effects: [
      { type: 'BLOCK', value: 6 },
      { type: 'HEAL', value: 4 },
    ],
    exhaust: true,
  },
  dust_cloud: {
    id: 'dust_cloud',
    name: 'Dust Cloud',
    description: 'Gain {0} Block. Apply {1} Weakened to ALL enemies.',
    type: 'SKILL',
    rarity: 'COMMON',
    cost: 1,
    targetType: 'ALL_ENEMIES',
    effects: [
      { type: 'BLOCK', value: 4 },
      { type: 'APPLY_WEAK', value: 1 },
    ],
  },
  deep_breath: {
    id: 'deep_breath',
    name: 'Deep Breath',
    description: 'Shuffle your discard pile into your draw pile. Draw {0} card.',
    type: 'SKILL',
    rarity: 'COMMON',
    cost: 0,
    targetType: 'SELF',
    effects: [
      { type: 'SHUFFLE_DISCARD', value: 1 },
      { type: 'DRAW', value: 1 },
    ],
  },
  
  // ============================================
  // === UNCOMMON ATTACKS ===
  // ============================================
  crystalline_blade: {
    id: 'crystalline_blade',
    name: 'Crystalline Blade',
    description: 'Deal {0} damage. If enemy has Exposed, deal {0} again.',
    type: 'ATTACK',
    rarity: 'UNCOMMON',
    cost: 2,
    targetType: 'SINGLE_ENEMY',
    effects: [
      { type: 'DAMAGE', value: 10 },
      { type: 'CONDITIONAL_DAMAGE_VULNERABLE', value: 10 },
    ],
  },
  depth_charge: {
    id: 'depth_charge',
    name: 'Depth Charge',
    description: 'Deal {0} damage to ALL enemies. Apply {1} Weakened.',
    type: 'ATTACK',
    rarity: 'UNCOMMON',
    cost: 2,
    targetType: 'ALL_ENEMIES',
    effects: [
      { type: 'DAMAGE', value: 12 },
      { type: 'APPLY_WEAK', value: 2 },
    ],
  },
  piercing_light: {
    id: 'piercing_light',
    name: 'Piercing Light',
    description: 'Deal {0} damage. Ignores Block.',
    type: 'ATTACK',
    rarity: 'UNCOMMON',
    cost: 2,
    targetType: 'SINGLE_ENEMY',
    effects: [{ type: 'DAMAGE_IGNORE_BLOCK', value: 15 }],
  },
  fissure: {
    id: 'fissure',
    name: 'Fissure',
    description: 'Deal {0} damage. Deal {1} additional damage for each card in your discard pile.',
    type: 'ATTACK',
    rarity: 'UNCOMMON',
    cost: 1,
    targetType: 'SINGLE_ENEMY',
    effects: [
      { type: 'DAMAGE', value: 4 },
      { type: 'DAMAGE_PER_DISCARD', value: 1 },
    ],
  },
  seismic_slam: {
    id: 'seismic_slam',
    name: 'Seismic Slam',
    description: 'Deal {0} damage to ALL enemies. Apply {1} Exposed.',
    type: 'ATTACK',
    rarity: 'UNCOMMON',
    cost: 2,
    targetType: 'ALL_ENEMIES',
    effects: [
      { type: 'DAMAGE', value: 10 },
      { type: 'APPLY_VULNERABLE', value: 1 },
    ],
  },
  vein_strike: {
    id: 'vein_strike',
    name: 'Vein Strike',
    description: 'Deal {0} damage. Gain {1} gold.',
    type: 'ATTACK',
    rarity: 'UNCOMMON',
    cost: 1,
    targetType: 'SINGLE_ENEMY',
    effects: [
      { type: 'DAMAGE', value: 8 },
      { type: 'GAIN_GOLD', value: 5 },
    ],
  },
  rupture: {
    id: 'rupture',
    name: 'Rupture',
    description: 'Deal {0} damage. If enemy has Corroded, deal damage equal to their Corroded.',
    type: 'ATTACK',
    rarity: 'UNCOMMON',
    cost: 1,
    targetType: 'SINGLE_ENEMY',
    effects: [
      { type: 'DAMAGE', value: 6 },
      { type: 'DAMAGE_EQUAL_POISON', value: 1 },
    ],
  },
  stalactite_barrage: {
    id: 'stalactite_barrage',
    name: 'Stalactite Barrage',
    description: 'Deal {0} damage to a random enemy 4 times.',
    type: 'ATTACK',
    rarity: 'UNCOMMON',
    cost: 2,
    targetType: 'RANDOM_ENEMY',
    effects: [
      { type: 'DAMAGE', value: 4 },
      { type: 'DAMAGE', value: 4 },
      { type: 'DAMAGE', value: 4 },
      { type: 'DAMAGE', value: 4 },
    ],
  },
  heavy_strike: {
    id: 'heavy_strike',
    name: 'Heavy Strike',
    description: 'Deal {0} damage. Might affects this card 3 times.',
    type: 'ATTACK',
    rarity: 'UNCOMMON',
    cost: 2,
    targetType: 'SINGLE_ENEMY',
    effects: [{ type: 'DAMAGE_TRIPLE_STRENGTH', value: 14 }],
  },
  excavate: {
    id: 'excavate',
    name: 'Excavate',
    description: 'Deal {0} damage. Add a random common Attack to your hand. It costs 0 this turn.',
    type: 'ATTACK',
    rarity: 'UNCOMMON',
    cost: 1,
    targetType: 'SINGLE_ENEMY',
    effects: [
      { type: 'DAMAGE', value: 7 },
      { type: 'ADD_RANDOM_ATTACK', value: 0 },
    ],
  },
  unstable_ground: {
    id: 'unstable_ground',
    name: 'Unstable Ground',
    description: 'Deal {0} damage to ALL enemies twice.',
    type: 'ATTACK',
    rarity: 'UNCOMMON',
    cost: 2,
    targetType: 'ALL_ENEMIES',
    effects: [
      { type: 'DAMAGE', value: 6 },
      { type: 'DAMAGE', value: 6 },
    ],
  },
  
  // ============================================
  // === UNCOMMON SKILLS ===
  // ============================================
  ancient_ward: {
    id: 'ancient_ward',
    name: 'Ancient Ward',
    description: 'Gain {0} Block. Block is not removed next turn.',
    type: 'SKILL',
    rarity: 'UNCOMMON',
    cost: 2,
    targetType: 'SELF',
    effects: [
      { type: 'BLOCK', value: 12 },
      { type: 'RETAIN_BLOCK', value: 1 },
    ],
  },
  mineral_extraction: {
    id: 'mineral_extraction',
    name: 'Mineral Extraction',
    description: 'Gain {0} Ore Plating.',
    type: 'SKILL',
    rarity: 'UNCOMMON',
    cost: 1,
    targetType: 'SELF',
    effects: [{ type: 'APPLY_PLATED_ARMOR', value: 4 }],
  },
  blinding_dust: {
    id: 'blinding_dust',
    name: 'Blinding Dust',
    description: 'Apply {0} Weakened to ALL enemies.',
    type: 'SKILL',
    rarity: 'UNCOMMON',
    cost: 1,
    targetType: 'ALL_ENEMIES',
    effects: [{ type: 'APPLY_WEAK', value: 2 }],
  },
  fortify: {
    id: 'fortify',
    name: 'Fortify',
    description: 'Gain {0} Block. Gain {1} Agility.',
    type: 'SKILL',
    rarity: 'UNCOMMON',
    cost: 1,
    targetType: 'SELF',
    effects: [
      { type: 'BLOCK', value: 8 },
      { type: 'APPLY_DEXTERITY', value: 1 },
    ],
  },
  safety_rope: {
    id: 'safety_rope',
    name: 'Safety Rope',
    description: 'Gain {0} Block. Draw cards until you have 5 in hand.',
    type: 'SKILL',
    rarity: 'UNCOMMON',
    cost: 1,
    targetType: 'SELF',
    effects: [
      { type: 'BLOCK', value: 5 },
      { type: 'DRAW_TO_HAND_SIZE', value: 5 },
    ],
  },
  cave_echo: {
    id: 'cave_echo',
    name: 'Cave Echo',
    description: 'This turn, your next Attack is played twice.',
    type: 'SKILL',
    rarity: 'UNCOMMON',
    cost: 1,
    targetType: 'SELF',
    effects: [{ type: 'NEXT_ATTACK_TWICE', value: 1 }],
  },
  pressure_release: {
    id: 'pressure_release',
    name: 'Pressure Release',
    description: 'Lose all Block. Deal damage to ALL enemies equal to Block lost.',
    type: 'SKILL',
    rarity: 'UNCOMMON',
    cost: 1,
    targetType: 'ALL_ENEMIES',
    effects: [{ type: 'DAMAGE_EQUAL_BLOCK', value: 1 }],
  },
  stalwart_defense: {
    id: 'stalwart_defense',
    name: 'Stalwart Defense',
    description: 'Gain {0} Block. If you have Ore Plating, gain {1} additional Block.',
    type: 'SKILL',
    rarity: 'UNCOMMON',
    cost: 1,
    targetType: 'SELF',
    effects: [
      { type: 'BLOCK', value: 10 },
      { type: 'CONDITIONAL_BLOCK_PLATED', value: 5 },
    ],
  },
  corrode: {
    id: 'corrode',
    name: 'Corrode',
    description: 'Apply {0} Corroded.',
    type: 'SKILL',
    rarity: 'UNCOMMON',
    cost: 1,
    targetType: 'SINGLE_ENEMY',
    effects: [{ type: 'APPLY_POISON', value: 7 }],
  },
  toxic_spores: {
    id: 'toxic_spores',
    name: 'Toxic Spores',
    description: 'Apply {0} Corroded to ALL enemies.',
    type: 'SKILL',
    rarity: 'UNCOMMON',
    cost: 2,
    targetType: 'ALL_ENEMIES',
    effects: [{ type: 'APPLY_POISON', value: 4 }],
  },
  warding_sigil: {
    id: 'warding_sigil',
    name: 'Warding Sigil',
    description: 'Gain {0} Warding.',
    type: 'SKILL',
    rarity: 'UNCOMMON',
    cost: 1,
    targetType: 'SELF',
    effects: [{ type: 'APPLY_ARTIFACT', value: 2 }],
  },
  adrenaline_surge: {
    id: 'adrenaline_surge',
    name: 'Adrenaline Surge',
    description: 'Gain {0} Energy. Draw {1} cards. Exhaust.',
    type: 'SKILL',
    rarity: 'UNCOMMON',
    cost: 0,
    targetType: 'SELF',
    effects: [
      { type: 'GAIN_ENERGY', value: 2 },
      { type: 'DRAW', value: 2 },
    ],
    exhaust: true,
  },
  calculated_defense: {
    id: 'calculated_defense',
    name: 'Calculated Defense',
    description: 'Gain Block equal to the number of cards in your hand x3.',
    type: 'SKILL',
    rarity: 'UNCOMMON',
    cost: 1,
    targetType: 'SELF',
    effects: [{ type: 'BLOCK_PER_CARD_IN_HAND', value: 3 }],
  },
  
  // ============================================
  // === UNCOMMON POWERS ===
  // ============================================
  depth_adaptation: {
    id: 'depth_adaptation',
    name: 'Depth Adaptation',
    description: 'Gain {0} Might.',
    type: 'POWER',
    rarity: 'UNCOMMON',
    cost: 1,
    targetType: 'SELF',
    effects: [{ type: 'APPLY_STRENGTH', value: 2 }],
  },
  echoing_presence: {
    id: 'echoing_presence',
    name: 'Echoing Presence',
    description: 'At the end of your turn, deal {0} damage to ALL enemies.',
    type: 'POWER',
    rarity: 'UNCOMMON',
    cost: 1,
    targetType: 'SELF',
    effects: [{ type: 'END_TURN_DAMAGE_ALL', value: 3 }],
  },
  delvers_instinct: {
    id: 'delvers_instinct',
    name: "Delver's Instinct",
    description: 'At the start of your turn, gain {0} Block.',
    type: 'POWER',
    rarity: 'UNCOMMON',
    cost: 1,
    targetType: 'SELF',
    effects: [{ type: 'START_TURN_BLOCK', value: 4 }],
  },
  iron_will: {
    id: 'iron_will',
    name: 'Iron Will',
    description: 'Gain {0} Agility.',
    type: 'POWER',
    rarity: 'UNCOMMON',
    cost: 1,
    targetType: 'SELF',
    effects: [{ type: 'APPLY_DEXTERITY', value: 2 }],
  },
  resonant_crystal: {
    id: 'resonant_crystal',
    name: 'Resonant Crystal',
    description: 'Whenever you play an Attack, apply {0} Exposed.',
    type: 'POWER',
    rarity: 'UNCOMMON',
    cost: 1,
    targetType: 'SELF',
    effects: [{ type: 'ATTACK_APPLY_VULNERABLE', value: 1 }],
  },
  miners_rage: {
    id: 'miners_rage',
    name: "Miner's Rage",
    description: 'Whenever you take damage, gain {0} Might.',
    type: 'POWER',
    rarity: 'UNCOMMON',
    cost: 1,
    targetType: 'SELF',
    effects: [{ type: 'GAIN_STRENGTH_ON_DAMAGE', value: 1 }],
  },
  echo_field: {
    id: 'echo_field',
    name: 'Echo Field',
    description: 'Whenever you draw a Status or Curse, draw {0} card.',
    type: 'POWER',
    rarity: 'UNCOMMON',
    cost: 1,
    targetType: 'SELF',
    effects: [{ type: 'DRAW_ON_STATUS', value: 1 }],
  },
  ore_coating: {
    id: 'ore_coating',
    name: 'Ore Coating',
    description: 'At the start of your turn, gain {0} Ore Plating.',
    type: 'POWER',
    rarity: 'UNCOMMON',
    cost: 2,
    targetType: 'SELF',
    effects: [{ type: 'START_TURN_PLATED', value: 2 }],
  },
  
  // ============================================
  // === RARE ATTACKS ===
  // ============================================
  abyssal_strike: {
    id: 'abyssal_strike',
    name: 'Abyssal Strike',
    description: 'Deal {0} damage. Exhaust.',
    type: 'ATTACK',
    rarity: 'RARE',
    cost: 2,
    targetType: 'SINGLE_ENEMY',
    effects: [{ type: 'DAMAGE', value: 30 }],
    exhaust: true,
  },
  resonance_cascade: {
    id: 'resonance_cascade',
    name: 'Resonance Cascade',
    description: 'Deal {0} damage to ALL enemies 3 times.',
    type: 'ATTACK',
    rarity: 'RARE',
    cost: 3,
    targetType: 'ALL_ENEMIES',
    effects: [
      { type: 'DAMAGE', value: 6 },
      { type: 'DAMAGE', value: 6 },
      { type: 'DAMAGE', value: 6 },
    ],
  },
  worldsplitter: {
    id: 'worldsplitter',
    name: 'Worldsplitter',
    description: 'Deal {0} damage. If enemy dies, deal {0} damage to ALL enemies.',
    type: 'ATTACK',
    rarity: 'RARE',
    cost: 3,
    targetType: 'SINGLE_ENEMY',
    effects: [
      { type: 'DAMAGE', value: 25 },
      { type: 'CONDITIONAL_AOE_ON_KILL', value: 25 },
    ],
  },
  primordial_fury: {
    id: 'primordial_fury',
    name: 'Primordial Fury',
    description: 'Deal {0} damage for each Might you have.',
    type: 'ATTACK',
    rarity: 'RARE',
    cost: 1,
    targetType: 'SINGLE_ENEMY',
    effects: [{ type: 'DAMAGE_PER_STRENGTH', value: 8 }],
  },
  annihilate: {
    id: 'annihilate',
    name: 'Annihilate',
    description: 'Deal {0} damage {1} times.',
    type: 'ATTACK',
    rarity: 'RARE',
    cost: 2,
    targetType: 'SINGLE_ENEMY',
    effects: [
      { type: 'DAMAGE', value: 5 },
      { type: 'DAMAGE', value: 5 },
      { type: 'DAMAGE', value: 5 },
      { type: 'DAMAGE', value: 5 },
    ],
  },
  depth_walker: {
    id: 'depth_walker',
    name: 'Depth Walker',
    description: 'Deal {0} damage. If you have no Block, gain Energy equal to unblocked damage dealt.',
    type: 'ATTACK',
    rarity: 'RARE',
    cost: 2,
    targetType: 'SINGLE_ENEMY',
    effects: [
      { type: 'DAMAGE', value: 18 },
      { type: 'GAIN_ENERGY_FROM_UNBLOCKED', value: 1 },
    ],
  },
  grand_excavation: {
    id: 'grand_excavation',
    name: 'Grand Excavation',
    description: 'Deal {0} damage to ALL enemies. Apply {1} Corroded, Exposed, and Weakened.',
    type: 'ATTACK',
    rarity: 'RARE',
    cost: 3,
    targetType: 'ALL_ENEMIES',
    effects: [
      { type: 'DAMAGE', value: 15 },
      { type: 'APPLY_POISON', value: 3 },
      { type: 'APPLY_VULNERABLE', value: 2 },
      { type: 'APPLY_WEAK', value: 2 },
    ],
  },
  
  // ============================================
  // === RARE SKILLS ===
  // ============================================
  essence_drain: {
    id: 'essence_drain',
    name: 'Essence Drain',
    description: 'Gain {0} HP. Exhaust.',
    type: 'SKILL',
    rarity: 'RARE',
    cost: 2,
    targetType: 'SELF',
    effects: [{ type: 'HEAL', value: 12 }],
    exhaust: true,
  },
  impenetrable: {
    id: 'impenetrable',
    name: 'Impenetrable',
    description: 'Gain {0} Block. Block is not removed this combat.',
    type: 'SKILL',
    rarity: 'RARE',
    cost: 3,
    targetType: 'SELF',
    effects: [
      { type: 'BLOCK', value: 20 },
      { type: 'PERMANENT_BLOCK', value: 1 },
    ],
  },
  echoes_of_the_deep: {
    id: 'echoes_of_the_deep',
    name: 'Echoes of the Deep',
    description: 'Draw {0} cards. Cards drawn cost 0 this turn.',
    type: 'SKILL',
    rarity: 'RARE',
    cost: 2,
    targetType: 'SELF',
    effects: [{ type: 'DRAW_FREE', value: 4 }],
  },
  petrify: {
    id: 'petrify',
    name: 'Petrify',
    description: 'Enemy loses {0} Might. Gain Block equal to Might removed x5.',
    type: 'SKILL',
    rarity: 'RARE',
    cost: 1,
    targetType: 'SINGLE_ENEMY',
    effects: [
      { type: 'REMOVE_STRENGTH', value: 3 },
      { type: 'BLOCK_FROM_REMOVED_STRENGTH', value: 5 },
    ],
  },
  absolute_zero: {
    id: 'absolute_zero',
    name: 'Absolute Zero',
    description: 'Enemy loses ALL Might. They cannot gain Might this combat.',
    type: 'SKILL',
    rarity: 'RARE',
    cost: 2,
    targetType: 'SINGLE_ENEMY',
    effects: [
      { type: 'REMOVE_ALL_STRENGTH', value: 1 },
      { type: 'PREVENT_STRENGTH', value: 1 },
    ],
  },
  spirit_shield: {
    id: 'spirit_shield',
    name: 'Spirit Shield',
    description: 'Gain {0} Block for each card in your hand.',
    type: 'SKILL',
    rarity: 'RARE',
    cost: 2,
    targetType: 'SELF',
    effects: [{ type: 'BLOCK_PER_CARD_IN_HAND', value: 5 }],
  },
  offering_to_the_depths: {
    id: 'offering_to_the_depths',
    name: 'Offering to the Depths',
    description: 'Lose {0} HP. Gain {1} Energy. Draw {2} cards.',
    type: 'SKILL',
    rarity: 'RARE',
    cost: 0,
    targetType: 'SELF',
    effects: [
      { type: 'SELF_DAMAGE', value: 6 },
      { type: 'GAIN_ENERGY', value: 2 },
      { type: 'DRAW', value: 3 },
    ],
  },
  
  // ============================================
  // === RARE POWERS ===
  // ============================================
  heart_of_stone: {
    id: 'heart_of_stone',
    name: 'Heart of Stone',
    description: 'Gain {0} Might at the start of each turn.',
    type: 'POWER',
    rarity: 'RARE',
    cost: 2,
    targetType: 'SELF',
    effects: [{ type: 'RITUAL_STRENGTH', value: 1 }],
  },
  echo_chamber: {
    id: 'echo_chamber',
    name: 'Echo Chamber',
    description: 'Whenever you play an Attack, deal {0} additional damage.',
    type: 'POWER',
    rarity: 'RARE',
    cost: 2,
    targetType: 'SELF',
    effects: [{ type: 'ATTACK_BONUS', value: 4 }],
  },
  living_fortress: {
    id: 'living_fortress',
    name: 'Living Fortress',
    description: 'At the end of your turn, if you have Block, gain {0} additional Block.',
    type: 'POWER',
    rarity: 'RARE',
    cost: 2,
    targetType: 'SELF',
    effects: [{ type: 'END_TURN_BLOCK_IF_BLOCK', value: 5 }],
  },
  the_depths_hunger: {
    id: 'the_depths_hunger',
    name: "The Depth's Hunger",
    description: 'Whenever an enemy dies, heal {0} HP and draw {1} card.',
    type: 'POWER',
    rarity: 'RARE',
    cost: 1,
    targetType: 'SELF',
    effects: [
      { type: 'HEAL_ON_KILL', value: 6 },
      { type: 'DRAW_ON_KILL', value: 1 },
    ],
  },
  crystal_resonance: {
    id: 'crystal_resonance',
    name: 'Crystal Resonance',
    description: 'Whenever you play a Skill, gain {0} Might.',
    type: 'POWER',
    rarity: 'RARE',
    cost: 2,
    targetType: 'SELF',
    effects: [{ type: 'STRENGTH_ON_SKILL', value: 1 }],
  },
  ancient_fortress: {
    id: 'ancient_fortress',
    name: 'Ancient Fortress',
    description: 'Block is not removed at the start of your turn.',
    type: 'POWER',
    rarity: 'RARE',
    cost: 3,
    targetType: 'SELF',
    effects: [{ type: 'RETAIN_ALL_BLOCK', value: 1 }],
  },
  primordial_echo: {
    id: 'primordial_echo',
    name: 'Primordial Echo',
    description: 'The first card you play each turn is played twice.',
    type: 'POWER',
    rarity: 'RARE',
    cost: 3,
    targetType: 'SELF',
    effects: [{ type: 'FIRST_CARD_TWICE', value: 1 }],
  },
  
  // ============================================
  // === STATUS/CURSE CARDS ===
  // ============================================
  rubble: {
    id: 'rubble',
    name: 'Rubble',
    description: 'Unplayable.',
    type: 'STATUS',
    rarity: 'SPECIAL',
    cost: -1,
    targetType: 'SELF',
    effects: [],
  },
  cave_sickness: {
    id: 'cave_sickness',
    name: 'Cave Sickness',
    description: 'Unplayable. At the end of your turn, take {0} damage.',
    type: 'STATUS',
    rarity: 'SPECIAL',
    cost: -1,
    targetType: 'SELF',
    effects: [{ type: 'END_TURN_DAMAGE', value: 2 }],
  },
  ancient_curse: {
    id: 'ancient_curse',
    name: 'Ancient Curse',
    description: 'Unplayable. Cannot be removed from your deck.',
    type: 'CURSE',
    rarity: 'SPECIAL',
    cost: -1,
    targetType: 'SELF',
    effects: [],
  },
  echoing_madness: {
    id: 'echoing_madness',
    name: 'Echoing Madness',
    description: 'Unplayable. When drawn, add a copy to your discard pile.',
    type: 'CURSE',
    rarity: 'SPECIAL',
    cost: -1,
    targetType: 'SELF',
    effects: [{ type: 'DUPLICATE_ON_DRAW', value: 1 }],
  },
};

// Relic templates
const RELIC_TEMPLATES: Record<string, Relic> = {
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
  return cardIds.map(id => {
    const template = CARD_TEMPLATES[id];
    if (!template) {
      console.warn(`Unknown card ID: ${id}`);
      return null;
    }
    return { ...template, upgraded: false };
  }).filter((card): card is Card => card !== null);
}

// Create starter relic
function createStarterRelic(relicId: string): Relic | null {
  const relic = RELIC_TEMPLATES[relicId];
  if (!relic) {
    console.warn(`Unknown relic ID: ${relicId}`);
    return null;
  }
  return { ...relic };
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
