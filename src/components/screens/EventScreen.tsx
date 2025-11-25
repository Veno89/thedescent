import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Panel } from '@/components/ui/Panel';
import { HpBar } from '@/components/ui/ProgressBar';
import { useGameStore } from '@/stores/gameStore';
import type { GameEvent, EventChoice, EventOutcome, Card, Relic, Potion, Enemy, StatusEffects } from '@/types';
import { clsx } from 'clsx';

// ============================================
// HELPER: Default Status Effects
// ============================================
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

// ============================================
// CARD POOL FOR REWARDS
// ============================================
const REWARD_CARDS: Record<string, Card> = {
  echo_strike: {
    id: 'echo_strike', name: 'Echo Strike', description: 'Deal 4 damage twice.',
    type: 'ATTACK', rarity: 'COMMON', cost: 1, upgraded: false, targetType: 'SINGLE_ENEMY',
    effects: [{ type: 'DAMAGE', value: 4 }, { type: 'DAMAGE', value: 4 }],
  },
  cave_in: {
    id: 'cave_in', name: 'Cave In', description: 'Deal 8 damage to ALL enemies.',
    type: 'ATTACK', rarity: 'COMMON', cost: 1, upgraded: false, targetType: 'ALL_ENEMIES',
    effects: [{ type: 'DAMAGE', value: 8 }],
  },
  pickaxe_swing: {
    id: 'pickaxe_swing', name: 'Pickaxe Swing', description: 'Deal 9 damage. Draw 1.',
    type: 'ATTACK', rarity: 'COMMON', cost: 1, upgraded: false, targetType: 'SINGLE_ENEMY',
    effects: [{ type: 'DAMAGE', value: 9 }, { type: 'DRAW', value: 1 }],
  },
  crushing_blow: {
    id: 'crushing_blow', name: 'Crushing Blow', description: 'Deal 14 damage. Apply 1 Weakened.',
    type: 'ATTACK', rarity: 'UNCOMMON', cost: 2, upgraded: false, targetType: 'SINGLE_ENEMY',
    effects: [{ type: 'DAMAGE', value: 14 }, { type: 'APPLY_WEAK', value: 1 }],
  },
  abyssal_strike: {
    id: 'abyssal_strike', name: 'Abyssal Strike', description: 'Deal 30 damage. Exhaust.',
    type: 'ATTACK', rarity: 'RARE', cost: 2, upgraded: false, targetType: 'SINGLE_ENEMY',
    effects: [{ type: 'DAMAGE', value: 30 }], exhaust: true,
  },
  void_cleave: {
    id: 'void_cleave', name: 'Void Cleave', description: 'Deal 18 damage to ALL.',
    type: 'ATTACK', rarity: 'RARE', cost: 3, upgraded: false, targetType: 'ALL_ENEMIES',
    effects: [{ type: 'DAMAGE', value: 18 }],
  },
  tunnel_vision: {
    id: 'tunnel_vision', name: 'Tunnel Vision', description: 'Gain 8 Block. Draw 1.',
    type: 'SKILL', rarity: 'COMMON', cost: 1, upgraded: false, targetType: 'SELF',
    effects: [{ type: 'BLOCK', value: 8 }, { type: 'DRAW', value: 1 }],
  },
  stone_skin: {
    id: 'stone_skin', name: 'Stone Skin', description: 'Gain 15 Block.',
    type: 'SKILL', rarity: 'COMMON', cost: 2, upgraded: false, targetType: 'SELF',
    effects: [{ type: 'BLOCK', value: 15 }],
  },
  miners_grit: {
    id: 'miners_grit', name: "Miner's Grit", description: 'Gain 6 Block. Gain 1 Might.',
    type: 'SKILL', rarity: 'COMMON', cost: 1, upgraded: false, targetType: 'SELF',
    effects: [{ type: 'BLOCK', value: 6 }, { type: 'APPLY_STRENGTH', value: 1 }],
  },
  ancient_ward: {
    id: 'ancient_ward', name: 'Ancient Ward', description: 'Gain 12 Block.',
    type: 'SKILL', rarity: 'UNCOMMON', cost: 2, upgraded: false, targetType: 'SELF',
    effects: [{ type: 'BLOCK', value: 12 }],
  },
  deep_breath: {
    id: 'deep_breath', name: 'Deep Breath', description: 'Draw 3 cards. Exhaust.',
    type: 'SKILL', rarity: 'UNCOMMON', cost: 1, upgraded: false, targetType: 'SELF',
    effects: [{ type: 'DRAW', value: 3 }], exhaust: true,
  },
  impenetrable: {
    id: 'impenetrable', name: 'Impenetrable', description: 'Gain 25 Block.',
    type: 'SKILL', rarity: 'RARE', cost: 3, upgraded: false, targetType: 'SELF',
    effects: [{ type: 'BLOCK', value: 25 }],
  },
  depth_adaptation: {
    id: 'depth_adaptation', name: 'Depth Adaptation', description: 'Gain 2 Might.',
    type: 'POWER', rarity: 'UNCOMMON', cost: 1, upgraded: false, targetType: 'SELF',
    effects: [{ type: 'APPLY_STRENGTH', value: 2 }],
  },
  delvers_instinct: {
    id: 'delvers_instinct', name: "Delver's Instinct", description: 'Gain 4 Block per turn.',
    type: 'POWER', rarity: 'UNCOMMON', cost: 1, upgraded: false, targetType: 'SELF',
    effects: [{ type: 'START_TURN_BLOCK', value: 4 }],
  },
  echoing_presence: {
    id: 'echoing_presence', name: 'Echoing Presence', description: 'Draw 1 extra card each turn.',
    type: 'POWER', rarity: 'UNCOMMON', cost: 1, upgraded: false, targetType: 'SELF',
    effects: [{ type: 'DRAW_PER_TURN', value: 1 }],
  },
  heart_of_stone: {
    id: 'heart_of_stone', name: 'Heart of Stone', description: 'Gain 1 Might per turn.',
    type: 'POWER', rarity: 'RARE', cost: 2, upgraded: false, targetType: 'SELF',
    effects: [{ type: 'RITUAL_STRENGTH', value: 1 }],
  },
  ancient_fortress: {
    id: 'ancient_fortress', name: 'Ancient Fortress', description: 'Gain 8 Block per turn.',
    type: 'POWER', rarity: 'RARE', cost: 2, upgraded: false, targetType: 'SELF',
    effects: [{ type: 'START_TURN_BLOCK', value: 8 }],
  },
};

// ============================================
// RELIC POOL
// ============================================
const REWARD_RELICS: Relic[] = [
  { id: 'ore_lantern', name: 'Ore Lantern', description: 'Gain 1 Energy at combat start.', rarity: 'COMMON', effects: [] },
  { id: 'cracked_compass', name: 'Cracked Compass', description: 'Draw 1 extra at combat start.', rarity: 'COMMON', effects: [] },
  { id: 'dusty_tome', name: 'Dusty Tome', description: 'Gain 1 Might at combat start.', rarity: 'COMMON', effects: [] },
  { id: 'climbing_gear', name: 'Climbing Gear', description: 'Gain 5 Max HP.', rarity: 'COMMON', effects: [] },
  { id: 'miners_helmet', name: "Miner's Helmet", description: 'Gain 3 Block at combat start.', rarity: 'COMMON', effects: [] },
  { id: 'echo_stone', name: 'Echo Stone', description: 'First Attack each turn plays twice.', rarity: 'UNCOMMON', effects: [] },
  { id: 'crystal_shard', name: 'Crystal Shard', description: 'Enemies start with 1 Exposed.', rarity: 'UNCOMMON', effects: [] },
  { id: 'ancient_coin', name: 'Ancient Coin', description: 'Gain 15 gold after combat.', rarity: 'UNCOMMON', effects: [] },
  { id: 'glowing_ore', name: 'Glowing Ore', description: 'Gain 2 Ore Plating each turn.', rarity: 'UNCOMMON', effects: [] },
  { id: 'fossilized_fang', name: 'Fossilized Fang', description: 'Deal 2 extra damage.', rarity: 'UNCOMMON', effects: [] },
  { id: 'abyssal_heart', name: 'Abyssal Heart', description: 'Gain 1 Energy each turn.', rarity: 'RARE', effects: [] },
  { id: 'void_pendant', name: 'Void Pendant', description: 'Revive at 50% HP once.', rarity: 'RARE', effects: [] },
  { id: 'primordial_core', name: 'Primordial Core', description: 'Start with 2 Might and 2 Agility.', rarity: 'RARE', effects: [] },
];

// ============================================
// POTION POOL
// ============================================
const REWARD_POTIONS: Potion[] = [
  { id: 'restoration_vial', name: 'Restoration Vial', description: 'Heal 20 HP.', rarity: 'COMMON', targetType: 'SELF', effects: [{ type: 'HEAL', value: 20 }] },
  { id: 'might_elixir', name: 'Might Elixir', description: 'Gain 2 Might.', rarity: 'COMMON', targetType: 'SELF', effects: [{ type: 'APPLY_STRENGTH', value: 2 }] },
  { id: 'stone_brew', name: 'Stone Brew', description: 'Gain 12 Block.', rarity: 'COMMON', targetType: 'SELF', effects: [{ type: 'BLOCK', value: 12 }] },
  { id: 'agility_serum', name: 'Agility Serum', description: 'Gain 2 Agility.', rarity: 'COMMON', targetType: 'SELF', effects: [{ type: 'APPLY_DEXTERITY', value: 2 }] },
  { id: 'echo_tonic', name: 'Echo Tonic', description: 'Draw 4 cards.', rarity: 'UNCOMMON', targetType: 'SELF', effects: [{ type: 'DRAW', value: 4 }] },
  { id: 'explosive_flask', name: 'Explosive Flask', description: 'Deal 20 to ALL.', rarity: 'UNCOMMON', targetType: 'ALL_ENEMIES', effects: [{ type: 'DAMAGE', value: 20 }] },
];

// ============================================
// CURSE CARDS
// ============================================
const CURSE_CARDS: Card[] = [
  { id: 'ancient_curse', name: 'Ancient Curse', description: 'Unplayable. Clogs your hand.', type: 'CURSE', rarity: 'SPECIAL', cost: -1, upgraded: false, targetType: 'SELF', effects: [] },
  { id: 'echoing_madness', name: 'Echoing Madness', description: 'Unplayable.', type: 'CURSE', rarity: 'SPECIAL', cost: -1, upgraded: false, targetType: 'SELF', effects: [] },
  { id: 'cave_sickness', name: 'Cave Sickness', description: 'Unplayable. Lose 1 HP at turn end.', type: 'CURSE', rarity: 'SPECIAL', cost: -1, upgraded: false, targetType: 'SELF', effects: [] },
  { id: 'depths_regret', name: "Depth's Regret", description: 'Unplayable.', type: 'CURSE', rarity: 'SPECIAL', cost: -1, upgraded: false, targetType: 'SELF', effects: [] },
];

// ============================================
// AMBUSH ENEMIES
// ============================================
const createAmbushEnemy = (floor: number): Enemy => {
  const baseHp = 25 + floor * 5;
  return {
    id: 'ambush_crawler',
    name: 'Ambush Crawler',
    maxHp: baseHp,
    currentHp: baseHp,
    type: 'normal',
    block: 0,
    statusEffects: createDefaultStatusEffects(),
    currentIntent: { type: 'ATTACK', value: 10 },
    moves: [
      { name: 'Surprise Attack', intent: { type: 'ATTACK', value: 10 }, weight: 2, actions: [{ type: 'DAMAGE', value: 10 }] },
      { name: 'Retreat', intent: { type: 'DEFEND', value: 6 }, weight: 1, actions: [{ type: 'BLOCK', value: 6 }] },
    ],
  };
};

const createEliteAmbushEnemy = (floor: number): Enemy => {
  const baseHp = 70 + floor * 8;
  return {
    id: 'awakened_automaton',
    name: 'Awakened Automaton',
    maxHp: baseHp,
    currentHp: baseHp,
    type: 'elite',
    block: 0,
    statusEffects: createDefaultStatusEffects(),
    currentIntent: { type: 'ATTACK', value: 15 },
    moves: [
      { name: 'Laser Beam', intent: { type: 'ATTACK', value: 15 }, weight: 2, actions: [{ type: 'DAMAGE', value: 15 }] },
      { name: 'Shield Protocol', intent: { type: 'DEFEND', value: 18 }, weight: 1, actions: [{ type: 'BLOCK', value: 18 }] },
      { name: 'Overcharge', intent: { type: 'BUFF', value: 2 }, weight: 1, actions: [{ type: 'APPLY_STRENGTH', value: 2 }] },
    ],
  };
};

// ============================================
// EVENT DEFINITIONS (22 unique events)
// ============================================
const EVENTS: GameEvent[] = [
  {
    id: 'ancient_shrine',
    name: 'Ancient Shrine',
    description: 'You discover a crumbling shrine dedicated to a forgotten god. Faded offerings lie scattered at its base. A faint glow emanates from within.',
    choices: [
      {
        text: 'Pray at the shrine',
        outcomes: [
          { type: 'HEAL_PERCENT', value: 25, text: 'A warm light washes over you. You feel restored.', weight: 60 },
          { type: 'MAX_HP', value: 5, text: 'The forgotten god grants you its blessing. +5 Max HP!', weight: 30 },
          { type: 'DAMAGE', value: 10, text: 'The shrine crumbles and debris strikes you!', weight: 10 },
        ],
      },
      {
        text: 'Take the offerings (Gain 35 gold)',
        outcomes: [
          { type: 'GOLD', value: 35, text: 'You pocket the ancient coins.', weight: 70 },
          { type: 'GOLD_AND_CURSE', value: 35, text: 'A chill runs down your spine as you take the gold...', weight: 30 },
        ],
      },
      { text: 'Leave', outcomes: [{ type: 'NOTHING', text: 'You continue on your way.' }] },
    ],
  },
  {
    id: 'abandoned_camp',
    name: 'Abandoned Camp',
    description: 'You find the remains of a delver camp. Supplies are scattered about, and a cold fire pit sits in the center. No sign of the previous occupants...',
    choices: [
      {
        text: 'Search the supplies',
        outcomes: [
          { type: 'GOLD', value: 50, text: 'You find a hidden stash of gold!', weight: 35 },
          { type: 'POTION', value: 1, text: 'You find a potion among the supplies.', weight: 35 },
          { type: 'AMBUSH', value: 1, text: 'Enemies were hiding nearby! Ambush!', weight: 30 },
        ],
      },
      { text: 'Rest by the fire pit', outcomes: [{ type: 'HEAL', value: 15, text: 'You take a moment to rest. Heal 15 HP.' }] },
      { text: 'Leave', outcomes: [{ type: 'NOTHING', text: 'You leave the camp undisturbed.' }] },
    ],
  },
  {
    id: 'crystal_cave',
    name: 'Crystal Cave',
    description: 'The tunnel opens into a cavern filled with luminescent crystals. Their glow pulses rhythmically. You sense latent power here.',
    choices: [
      {
        text: 'Absorb the crystal energy',
        outcomes: [
          { type: 'UPGRADE_RANDOM', value: 1, text: 'Energy surges through you, enhancing a card!', weight: 60 },
          { type: 'LOSE_MAX_HP', value: 5, text: 'The energy is too much! -5 Max HP', weight: 40 },
        ],
      },
      { text: 'Harvest crystals (Gain 45 gold)', outcomes: [{ type: 'GOLD', value: 45, text: 'You carefully harvest the valuable crystals.' }] },
      { text: 'Meditate among the crystals', outcomes: [{ type: 'REMOVE_CARD', value: 1, text: 'In meditation, you let go of a weakness.' }] },
    ],
  },
  {
    id: 'mysterious_merchant',
    name: 'The Wandering Trader',
    description: 'A hooded figure sits by a small fire. "Rare goods, friend. Things you won\'t find elsewhere..."',
    choices: [
      { text: 'Buy artifact (Pay 80 gold)', outcomes: [{ type: 'RANDOM_RELIC', value: 1, text: 'You receive a strange but powerful artifact.' }] },
      { text: 'Buy rare card (Pay 55 gold)', outcomes: [{ type: 'RARE_CARD', value: 1, text: 'The trader hands you a powerful card.' }] },
      {
        text: 'Rob the merchant',
        outcomes: [
          { type: 'GOLD', value: 100, text: 'You overpower the merchant and take everything!', weight: 35 },
          { type: 'DAMAGE', value: 18, text: 'The merchant was prepared! You barely escape!', weight: 40 },
          { type: 'CURSE', value: 2, text: 'The merchant curses you as you flee!', weight: 25 },
        ],
      },
      { text: 'Leave', outcomes: [{ type: 'NOTHING', text: '"Perhaps another time, friend."' }] },
    ],
  },
  {
    id: 'underground_market',
    name: 'Underground Market',
    description: 'Shadowy figures have set up a black market. Stolen relics and forbidden cards change hands.',
    choices: [
      { text: 'Trade HP for power (Lose 10 Max HP)', outcomes: [{ type: 'TRADE_HP_FOR_CARD', value: 10, text: 'Pain is temporary, power is eternal. Gain a rare card!' }] },
      { text: 'Trade a card for gold', outcomes: [{ type: 'REMOVE_CARD_GAIN_GOLD', value: 40, text: 'The dealers are pleased. +40 gold!' }] },
      {
        text: 'Gamble (Pay 30 gold)',
        outcomes: [
          { type: 'GOLD', value: 90, text: 'Triple or nothing! You win! +90 gold!', weight: 33 },
          { type: 'NOTHING', value: 0, text: 'You lose your stake...', weight: 67 },
        ],
      },
      { text: 'Leave quickly', outcomes: [{ type: 'NOTHING', text: 'Best not to linger here.' }] },
    ],
  },
  {
    id: 'blood_altar',
    name: 'Blood Altar',
    description: 'A stone altar stained with ancient blood. Runes promise power to those willing to sacrifice.',
    choices: [
      { text: 'Offer blood (Lose 12 HP)', outcomes: [{ type: 'GAIN_STRENGTH', value: 2, text: 'Power courses through you! +2 permanent Might!' }] },
      { text: 'Offer a card', outcomes: [{ type: 'REMOVE_CARD_GAIN_MAX_HP', value: 8, text: 'The altar consumes your card. +8 Max HP!' }] },
      {
        text: 'Smash the altar',
        outcomes: [
          { type: 'GOLD', value: 30, text: 'The altar crumbles, revealing hidden gold.', weight: 50 },
          { type: 'DAMAGE', value: 18, text: 'Dark energy explodes outward!', weight: 50 },
        ],
      },
      { text: 'Leave', outcomes: [{ type: 'NOTHING', text: 'You leave the dark altar behind.' }] },
    ],
  },
  {
    id: 'the_well',
    name: 'The Wishing Well',
    description: 'A deep well with unnaturally still water. Ancient coins glitter at the bottom. "The depths give as they take."',
    choices: [
      {
        text: 'Toss in a coin (Pay 15 gold)',
        outcomes: [
          { type: 'HEAL_FULL', value: 1, text: 'You are fully healed!', weight: 25 },
          { type: 'RANDOM_RELIC', value: 1, text: 'The well gifts you a relic!', weight: 20 },
          { type: 'NOTHING', value: 0, text: 'Nothing happens...', weight: 55 },
        ],
      },
      {
        text: 'Dive for coins',
        outcomes: [
          { type: 'GOLD', value: 80, text: 'You surface with handfuls of gold!', weight: 40 },
          { type: 'DAMAGE', value: 20, text: 'Something grabs you! You barely escape!', weight: 35 },
          { type: 'LOSE_PERCENT_HP', value: 30, text: 'You nearly drown in the depths.', weight: 25 },
        ],
      },
      { text: 'Leave', outcomes: [{ type: 'NOTHING', text: 'You leave the mysterious well.' }] },
    ],
  },
  {
    id: 'fungal_garden',
    name: 'Fungal Garden',
    description: 'Massive mushrooms fill this cavern, releasing clouds of spores. Some glow warmly, others pulse with sickly colors.',
    choices: [
      {
        text: 'Eat the glowing mushrooms',
        outcomes: [
          { type: 'HEAL', value: 30, text: 'Delicious and revitalizing! Heal 30 HP!', weight: 45 },
          { type: 'DAMAGE', value: 10, text: 'Ugh! Poisonous!', weight: 30 },
          { type: 'RANDOM_CARDS', value: 2, text: 'You hallucinate... visions become cards!', weight: 25 },
        ],
      },
      { text: 'Harvest spores', outcomes: [{ type: 'POTIONS', value: 2, text: 'You collect useful spores. Gain 2 potions!' }] },
      {
        text: 'Burn the garden',
        outcomes: [
          { type: 'GOLD', value: 40, text: 'Strange coins revealed in the ash.', weight: 55 },
          { type: 'DAMAGE', value: 14, text: 'The fire spreads too quickly!', weight: 45 },
        ],
      },
    ],
  },
  {
    id: 'golden_idol',
    name: 'The Golden Idol',
    description: 'On a pedestal sits a golden idol, gleaming. It looks incredibly valuable... but the floor seems unstable.',
    choices: [
      {
        text: 'Grab the idol quickly',
        outcomes: [
          { type: 'GOLD', value: 150, text: 'You snatch the idol! It\'s worth a fortune!', weight: 40 },
          { type: 'DAMAGE', value: 25, text: 'The floor collapses! You barely escape!', weight: 35 },
          { type: 'CURSE', value: 1, text: 'The idol is cursed!', weight: 25 },
        ],
      },
      {
        text: 'Disable the trap first',
        outcomes: [
          { type: 'GOLD', value: 100, text: 'You safely retrieve the idol!', weight: 60 },
          { type: 'DAMAGE', value: 10, text: 'The trap partially triggers.', weight: 40 },
        ],
      },
      { text: 'Leave it', outcomes: [{ type: 'NOTHING', text: 'Some treasures aren\'t worth the risk.' }] },
    ],
  },
  {
    id: 'forgotten_forge',
    name: 'The Forgotten Forge',
    description: 'An ancient forge still burns with supernatural fire. Tools lie ready, as if the smith just stepped away.',
    choices: [
      { text: 'Upgrade a card', outcomes: [{ type: 'UPGRADE_CARD', value: 1, text: 'The forge enhances your card!' }] },
      { text: 'Transform a card', outcomes: [{ type: 'TRANSFORM_CARD', value: 1, text: 'Your card is reforged into something new!' }] },
      {
        text: 'Stoke the flames (Risky)',
        outcomes: [
          { type: 'UPGRADE_ALL', value: 1, text: 'All your cards are empowered!', weight: 35 },
          { type: 'DAMAGE', value: 20, text: 'The flames burn you badly!', weight: 65 },
        ],
      },
    ],
  },
  {
    id: 'ancient_library',
    name: 'Ancient Library',
    description: 'Towering bookshelves filled with dusty tomes. Knowledge from a forgotten age waits to be discovered.',
    choices: [
      { text: 'Study combat manuals', outcomes: [{ type: 'GAIN_RANDOM_ATTACK', value: 1, text: 'You learn a new attack!' }] },
      { text: 'Read defensive treatises', outcomes: [{ type: 'GAIN_RANDOM_SKILL', value: 1, text: 'You learn a new skill!' }] },
      {
        text: 'Decipher forbidden texts',
        outcomes: [
          { type: 'GAIN_RANDOM_POWER', value: 1, text: 'You learn forbidden knowledge!', weight: 55 },
          { type: 'CURSE', value: 1, text: 'The knowledge comes with a price...', weight: 45 },
        ],
      },
      { text: 'Take books to sell', outcomes: [{ type: 'GOLD', value: 35, text: 'These should fetch a good price.' }] },
    ],
  },
  {
    id: 'mirror_pool',
    name: 'The Mirror Pool',
    description: 'A perfectly still pool reflects not your image, but another version of yourself. It beckons...',
    choices: [
      { text: 'Reach through the mirror', outcomes: [{ type: 'DUPLICATE_CARD', value: 1, text: 'You pull a copy of one of your cards through!' }] },
      {
        text: 'Trade places with your reflection',
        outcomes: [
          { type: 'TRANSFORM_ALL', value: 1, text: 'Everything changes! Cards transform!', weight: 50 },
          { type: 'NOTHING', value: 0, text: 'Your reflection refuses to trade.', weight: 50 },
        ],
      },
      {
        text: 'Shatter the pool',
        outcomes: [
          { type: 'GOLD', value: 55, text: 'Mirror shards become valuable crystals!', weight: 50 },
          { type: 'DAMAGE', value: 12, text: 'Shards cut you as the pool shatters!', weight: 50 },
        ],
      },
      { text: 'Back away', outcomes: [{ type: 'NOTHING', text: 'Some things are better left alone.' }] },
    ],
  },
  {
    id: 'wounded_delver',
    name: 'Wounded Delver',
    description: 'A fellow delver lies wounded against the wall, barely conscious. They clutch a bag tightly to their chest.',
    choices: [
      { text: 'Help them (Lose 8 HP)', outcomes: [{ type: 'HELP_DELVER', value: 1, text: 'They give you a relic in gratitude!' }] },
      { text: 'Take their belongings', outcomes: [{ type: 'GOLD_AND_CURSE', value: 65, text: 'You take everything. Guilt weighs on your soul.' }] },
      { text: 'Ask for information', outcomes: [{ type: 'UPGRADE_RANDOM', value: 1, text: 'They share combat wisdom. Upgrade a card!' }] },
      { text: 'Leave', outcomes: [{ type: 'NOTHING', text: 'You continue without looking back.' }] },
    ],
  },
  {
    id: 'trapped_chest',
    name: 'Trapped Chest',
    description: 'An ornate chest sits in an alcove. The dust is suspiciously undisturbed. Clearly a trap... but the reward might be worth it.',
    choices: [
      {
        text: 'Open carefully',
        outcomes: [
          { type: 'GOLD', value: 85, text: 'You disarm the trap and claim the treasure!', weight: 40 },
          { type: 'DAMAGE', value: 16, text: 'The trap triggers! Poisoned darts!', weight: 30 },
          { type: 'RANDOM_RELIC', value: 1, text: 'A relic! And no trap!', weight: 30 },
        ],
      },
      { text: 'Trigger trap intentionally', outcomes: [{ type: 'DAMAGE_AND_GOLD', value: 8, text: 'You take minor damage but get the gold! +100 gold!' }] },
      { text: 'Leave it', outcomes: [{ type: 'NOTHING', text: 'Better safe than sorry.' }] },
    ],
  },
  {
    id: 'ore_vein',
    name: 'Rich Ore Vein',
    description: 'Precious minerals glitter in the cave wall. Mining would be profitable, but time-consuming and noisy.',
    choices: [
      { text: 'Mine quickly', outcomes: [{ type: 'GOLD', value: 30, text: 'You grab what you can. +30 gold!' }] },
      {
        text: 'Mine thoroughly',
        outcomes: [
          { type: 'GOLD', value: 80, text: 'You extract a fortune! +80 gold!', weight: 55 },
          { type: 'AMBUSH', value: 1, text: 'The noise attracts enemies!', weight: 45 },
        ],
      },
      {
        text: 'Search for rare gems',
        outcomes: [
          { type: 'RANDOM_RELIC', value: 1, text: 'You find a crystal of power!', weight: 30 },
          { type: 'GOLD', value: 45, text: 'Just regular gems, but still valuable.', weight: 70 },
        ],
      },
    ],
  },
  {
    id: 'ghostly_apparition',
    name: 'Ghostly Apparition',
    description: 'A translucent figure materializes. It was once a delver like yourself. It speaks without moving its mouth.',
    choices: [
      { text: '"Teach me your secrets"', outcomes: [{ type: 'UPGRADE_MULTIPLE', value: 2, text: 'Ancient knowledge flows into you! 2 cards upgraded!' }] },
      { text: '"Give me your power"', outcomes: [{ type: 'MAX_HP_AND_CURSE', value: 12, text: 'The ghost merges with you. +12 Max HP, but a curse lingers...' }] },
      { text: '"Find peace" (Banish it)', outcomes: [{ type: 'REMOVE_CURSE', value: 1, text: 'The ghost departs, taking a curse with it.' }] },
      { text: 'Flee', outcomes: [{ type: 'NOTHING', text: 'You run from the supernatural.' }] },
    ],
  },
  {
    id: 'collapsed_tunnel',
    name: 'Collapsed Tunnel',
    description: 'The path ahead is blocked by rubble. You could clear it with effort. A narrow crack might offer another way...',
    choices: [
      { text: 'Clear the rubble (Lose 10 HP)', outcomes: [{ type: 'CLEAR_RUBBLE', value: 1, text: 'Exhausting! But you find treasure in the debris. +55 gold!' }] },
      {
        text: 'Squeeze through the crack',
        outcomes: [
          { type: 'NOTHING', value: 0, text: 'You barely fit through.', weight: 55 },
          { type: 'DAMAGE', value: 10, text: 'Sharp rocks cut you!', weight: 45 },
        ],
      },
      { text: 'Find another path', outcomes: [{ type: 'HEAL', value: 10, text: 'The detour lets you rest. Heal 10 HP.' }] },
    ],
  },
  {
    id: 'echo_chamber',
    name: 'Chamber of Echoes',
    description: 'Your footsteps echo infinitely. Whispers seem to carry secrets from the depths below...',
    choices: [
      {
        text: 'Listen to the whispers',
        outcomes: [
          { type: 'GAIN_CARD', value: 1, cardId: 'echo_strike', text: 'The echoes teach you Echo Strike!', weight: 60 },
          { type: 'DAMAGE', value: 10, text: 'The whispers drive into your mind!', weight: 40 },
        ],
      },
      {
        text: 'Shout into the void',
        outcomes: [
          { type: 'GAIN_STRENGTH', value: 1, text: 'Your voice returns empowered! +1 permanent Might!', weight: 55 },
          { type: 'AMBUSH', value: 1, text: 'Something heard you... An enemy approaches!', weight: 45 },
        ],
      },
      { text: 'Move quietly', outcomes: [{ type: 'NOTHING', text: 'You pass through without incident.' }] },
    ],
  },
  {
    id: 'primordial_pool',
    name: 'Primordial Pool',
    description: 'A pool of thick, glowing liquid bubbles before you. Ancient creatures once bathed here to gain strength.',
    choices: [
      {
        text: 'Submerge yourself',
        outcomes: [
          { type: 'TRANSFORM_BODY', value: 1, text: 'Your body transforms! +10 Max HP, +1 Might!', weight: 50 },
          { type: 'DAMAGE', value: 25, text: 'The liquid burns! You barely survive!', weight: 50 },
        ],
      },
      { text: 'Dip your weapon', outcomes: [{ type: 'UPGRADE_ATTACKS', value: 2, text: 'Your attacks gain power! 2 Attacks upgraded!' }] },
      { text: 'Collect a sample', outcomes: [{ type: 'POTION', value: 1, text: 'You bottle the mysterious liquid.' }] },
    ],
  },
  {
    id: 'ancient_automaton',
    name: 'Dormant Automaton',
    description: 'A massive mechanical guardian stands motionless. Its power core still glows faintly. Perhaps it can be salvaged...',
    choices: [
      {
        text: 'Reactivate it',
        outcomes: [
          { type: 'AUTOMATON_ALLY', value: 1, text: 'The automaton awakens as your ally! Gain a relic!', weight: 40 },
          { type: 'AMBUSH_ELITE', value: 1, text: 'It attacks! Elite combat!', weight: 60 },
        ],
      },
      { text: 'Salvage the power core', outcomes: [{ type: 'GOLD', value: 60, text: 'The core is worth a fortune!' }] },
      { text: 'Take defensive parts', outcomes: [{ type: 'GAIN_RANDOM_SKILL', value: 1, text: 'You learn to defend better. Gain a skill!' }] },
    ],
  },
  {
    id: 'temporal_rift',
    name: 'Temporal Rift',
    description: 'Reality warps before you. Through the rift, you see yourself from another time. Past or future, you cannot tell.',
    choices: [
      {
        text: 'Step through',
        outcomes: [
          { type: 'TRANSFORM_ALL', value: 1, text: 'Your deck shifts! Cards transform!', weight: 50 },
          { type: 'DUPLICATE_BEST', value: 1, text: 'You emerge with copies of your best cards!', weight: 50 },
        ],
      },
      {
        text: 'Reach through for treasure',
        outcomes: [
          { type: 'GOLD', value: 100, text: 'Your other self hands you gold! +100 gold!', weight: 45 },
          { type: 'CURSE', value: 1, text: 'Your other self gives you a curse!', weight: 55 },
        ],
      },
      { text: 'Close the rift', outcomes: [{ type: 'HEAL', value: 15, text: 'Stability returns. Heal 15 HP.' }] },
    ],
  },
  {
    id: 'singing_crystals',
    name: 'Singing Crystals',
    description: 'Crystalline formations emit a haunting melody. The sound resonates with something deep within you.',
    choices: [
      {
        text: 'Join the harmony',
        outcomes: [
          { type: 'GAIN_RANDOM_POWER', value: 1, text: 'The crystals teach you an ancient power!', weight: 60 },
          { type: 'DAMAGE', value: 8, text: 'The resonance is too intense!', weight: 40 },
        ],
      },
      { text: 'Shatter a crystal', outcomes: [{ type: 'GOLD', value: 50, text: 'The fragments are valuable! +50 gold!' }] },
      { text: 'Listen peacefully', outcomes: [{ type: 'HEAL', value: 20, text: 'The melody soothes you. Heal 20 HP.' }] },
    ],
  },
  {
    id: 'the_abyss',
    name: 'The Abyss',
    description: 'You stand at the edge of a bottomless chasm. Strange lights flicker below. You feel drawn to jump.',
    choices: [
      {
        text: 'Leap into the abyss',
        outcomes: [
          { type: 'ABYSS_REWARD', value: 1, text: 'You land on a hidden ledge! Rare relic + 50 gold!', weight: 40 },
          { type: 'DAMAGE', value: 30, text: 'You fall far before catching yourself!', weight: 60 },
        ],
      },
      { text: 'Climb down carefully', outcomes: [{ type: 'GOLD', value: 40, text: 'You find treasures on the cliff face. +40 gold!' }] },
      { text: 'Step back', outcomes: [{ type: 'NOTHING', text: 'Some depths are not meant to be explored.' }] },
    ],
  },
];

// ============================================
// EVENT SCREEN COMPONENT
// ============================================
export function EventScreen() {
  const { 
    player, 
    currentFloor,
    setScreen, 
    heal, 
    takeDamage,
    addGold,
    addCardToDeck,
    removeCardFromDeck,
    upgradeCard,
    addRelic,
    addPotion,
    updatePlayer,
    startCombat,
  } = useGameStore();
  
  const [currentEvent, setCurrentEvent] = useState<GameEvent | null>(null);
  const [resolvedOutcome, setResolvedOutcome] = useState<EventOutcome | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [showCardSelect, setShowCardSelect] = useState<'upgrade' | 'remove' | 'transform' | 'duplicate' | null>(null);
  const [upgradesRemaining, setUpgradesRemaining] = useState(0);

  useEffect(() => {
    const randomEvent = EVENTS[Math.floor(Math.random() * EVENTS.length)];
    setCurrentEvent(randomEvent);
  }, []);

  const getRandom = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
  
  const getRandomCard = (type?: 'ATTACK' | 'SKILL' | 'POWER', rarity?: string): Card => {
    let cards = Object.values(REWARD_CARDS);
    if (type) cards = cards.filter(c => c.type === type);
    if (rarity) cards = cards.filter(c => c.rarity === rarity);
    const card = getRandom(cards);
    return { ...card, id: `${card.id}_${Date.now()}` };
  };

  const canAffordChoice = (choice: EventChoice): boolean => {
    const text = choice.text.toLowerCase();
    const goldMatch = text.match(/pay (\d+) gold/);
    if (goldMatch) return player.gold >= parseInt(goldMatch[1]);
    return true;
  };

  const getCost = (choice: EventChoice): number => {
    const text = choice.text.toLowerCase();
    const goldMatch = text.match(/pay (\d+) gold/);
    return goldMatch ? parseInt(goldMatch[1]) : 0;
  };

  const resolveOutcome = (outcomes: EventOutcome[]): EventOutcome => {
    if (outcomes.length === 1) return outcomes[0];
    const totalWeight = outcomes.reduce((sum, o) => sum + (o.weight || 100), 0);
    let roll = Math.random() * totalWeight;
    for (const outcome of outcomes) {
      roll -= outcome.weight || 100;
      if (roll <= 0) return outcome;
    }
    return outcomes[outcomes.length - 1];
  };

  const applyOutcome = useCallback((outcome: EventOutcome, choice: EventChoice) => {
    const cost = getCost(choice);
    if (cost > 0) addGold(-cost);

    switch (outcome.type) {
      case 'HEAL': heal(outcome.value || 0); break;
      case 'HEAL_PERCENT': heal(Math.floor(player.maxHp * (outcome.value || 0) / 100)); break;
      case 'HEAL_FULL': heal(player.maxHp - player.currentHp); break;
      case 'DAMAGE':
      case 'LOSE_HP': takeDamage(outcome.value || 0); break;
      case 'LOSE_PERCENT_HP': takeDamage(Math.floor(player.currentHp * (outcome.value || 0) / 100)); break;
      case 'DAMAGE_AND_GOLD': takeDamage(outcome.value || 0); addGold(100); break;
      case 'GOLD': addGold(outcome.value || 0); break;
      case 'GOLD_AND_CURSE':
        addGold(outcome.value || 0);
        addCardToDeck({ ...getRandom(CURSE_CARDS), id: `curse_${Date.now()}` });
        break;
      case 'MAX_HP':
        updatePlayer({ maxHp: player.maxHp + (outcome.value || 0), currentHp: player.currentHp + (outcome.value || 0) });
        break;
      case 'LOSE_MAX_HP': {
        const newMax = player.maxHp - (outcome.value || 0);
        updatePlayer({ maxHp: newMax, currentHp: Math.min(player.currentHp, newMax) });
        break;
      }
      case 'MAX_HP_AND_CURSE':
        updatePlayer({ maxHp: player.maxHp + (outcome.value || 0), currentHp: player.currentHp + (outcome.value || 0) });
        addCardToDeck({ ...getRandom(CURSE_CARDS), id: `curse_${Date.now()}` });
        break;
      case 'GAIN_STRENGTH':
        updatePlayer({ statusEffects: { ...player.statusEffects, strength: player.statusEffects.strength + (outcome.value || 0) } });
        break;
      case 'TRANSFORM_BODY':
        updatePlayer({ 
          maxHp: player.maxHp + 10, 
          currentHp: player.currentHp + 10,
          statusEffects: { ...player.statusEffects, strength: player.statusEffects.strength + 1 } 
        });
        break;
      case 'UPGRADE_CARD':
      case 'UPGRADE_RANDOM':
        setShowCardSelect('upgrade');
        setUpgradesRemaining(1);
        break;
      case 'UPGRADE_MULTIPLE':
        setShowCardSelect('upgrade');
        setUpgradesRemaining(outcome.value || 2);
        break;
      case 'REMOVE_CARD': setShowCardSelect('remove'); break;
      case 'REMOVE_CARD_GAIN_MAX_HP':
        setShowCardSelect('remove');
        updatePlayer({ maxHp: player.maxHp + (outcome.value || 0), currentHp: player.currentHp + (outcome.value || 0) });
        break;
      case 'REMOVE_CARD_GAIN_GOLD':
        setShowCardSelect('remove');
        addGold(outcome.value || 0);
        break;
      case 'TRANSFORM_CARD': setShowCardSelect('transform'); break;
      case 'DUPLICATE_CARD': setShowCardSelect('duplicate'); break;
      case 'TRADE_HP_FOR_CARD':
        updatePlayer({ maxHp: player.maxHp - (outcome.value || 0), currentHp: Math.min(player.currentHp, player.maxHp - (outcome.value || 0)) });
        addCardToDeck(getRandomCard(undefined, 'RARE'));
        break;
      case 'GAIN_CARD':
        if (outcome.cardId && REWARD_CARDS[outcome.cardId]) {
          addCardToDeck({ ...REWARD_CARDS[outcome.cardId], id: `${outcome.cardId}_${Date.now()}` });
        }
        break;
      case 'RARE_CARD': addCardToDeck(getRandomCard(undefined, 'RARE')); break;
      case 'GAIN_RANDOM_ATTACK': addCardToDeck(getRandomCard('ATTACK')); break;
      case 'GAIN_RANDOM_SKILL': addCardToDeck(getRandomCard('SKILL')); break;
      case 'GAIN_RANDOM_POWER': addCardToDeck(getRandomCard('POWER')); break;
      case 'RANDOM_CARDS':
        for (let i = 0; i < (outcome.value || 1); i++) addCardToDeck(getRandomCard());
        break;
      case 'UPGRADE_ATTACKS': {
        let count = 0;
        player.deck.forEach((card, index) => {
          if (card.type === 'ATTACK' && !card.upgraded && count < (outcome.value || 1)) {
            upgradeCard(index);
            count++;
          }
        });
        break;
      }
      case 'UPGRADE_ALL':
        player.deck.forEach((card, index) => {
          if (!card.upgraded && card.type !== 'CURSE' && card.type !== 'STATUS') upgradeCard(index);
        });
        break;
      case 'TRANSFORM_ALL': {
        const nonStarters = player.deck.filter(c => c.rarity !== 'STARTER' && c.type !== 'CURSE');
        nonStarters.forEach(() => {
          const idx = player.deck.findIndex(c => c.rarity !== 'STARTER' && c.type !== 'CURSE');
          if (idx >= 0) { removeCardFromDeck(idx); addCardToDeck(getRandomCard()); }
        });
        break;
      }
      case 'DUPLICATE_BEST': {
        const goodCards = player.deck.filter(c => c.rarity === 'RARE' || c.rarity === 'UNCOMMON');
        if (goodCards.length > 0) {
          const card = getRandom(goodCards);
          addCardToDeck({ ...card, id: `${card.id}_copy_${Date.now()}` });
          addCardToDeck({ ...card, id: `${card.id}_copy2_${Date.now()}` });
        }
        break;
      }
      case 'POTION': addPotion(getRandom(REWARD_POTIONS)); break;
      case 'POTIONS':
        for (let i = 0; i < (outcome.value || 1); i++) addPotion(getRandom(REWARD_POTIONS));
        break;
      case 'RANDOM_RELIC':
      case 'AUTOMATON_ALLY': addRelic(getRandom(REWARD_RELICS)); break;
      case 'HELP_DELVER': takeDamage(8); addRelic(getRandom(REWARD_RELICS)); break;
      case 'CLEAR_RUBBLE': takeDamage(10); addGold(55); break;
      case 'ABYSS_REWARD':
        addRelic(getRandom(REWARD_RELICS.filter(r => r.rarity === 'RARE')));
        addGold(50);
        break;
      case 'CURSE':
        for (let i = 0; i < (outcome.value || 1); i++) {
          addCardToDeck({ ...getRandom(CURSE_CARDS), id: `curse_${Date.now()}_${i}` });
        }
        break;
      case 'REMOVE_CURSE': {
        const curseIndex = player.deck.findIndex(c => c.type === 'CURSE');
        if (curseIndex >= 0) removeCardFromDeck(curseIndex);
        break;
      }
      case 'AMBUSH': {
        const enemy = createAmbushEnemy(currentFloor);
        setTimeout(() => startCombat([enemy]), 1500);
        break;
      }
      case 'AMBUSH_ELITE': {
        const eliteEnemy = createEliteAmbushEnemy(currentFloor);
        setTimeout(() => startCombat([eliteEnemy]), 1500);
        break;
      }
      case 'NOTHING':
      default: break;
    }
  }, [player, heal, takeDamage, addGold, addCardToDeck, removeCardFromDeck, upgradeCard, addRelic, addPotion, updatePlayer, currentFloor, startCombat]);

  const handleChoice = (choice: EventChoice) => {
    if (!canAffordChoice(choice)) return;
    setIsResolving(true);
    const outcome = resolveOutcome(choice.outcomes);
    setResolvedOutcome(outcome);
    applyOutcome(outcome, choice);
  };

  const handleCardSelect = (cardIndex: number) => {
    if (showCardSelect === 'upgrade') {
      upgradeCard(cardIndex);
      if (upgradesRemaining > 1) { setUpgradesRemaining(upgradesRemaining - 1); return; }
    } else if (showCardSelect === 'remove') {
      removeCardFromDeck(cardIndex);
    } else if (showCardSelect === 'transform') {
      removeCardFromDeck(cardIndex);
      addCardToDeck(getRandomCard());
    } else if (showCardSelect === 'duplicate') {
      const card = player.deck[cardIndex];
      addCardToDeck({ ...card, id: `${card.id}_copy_${Date.now()}` });
    }
    setShowCardSelect(null);
    setUpgradesRemaining(0);
  };

  const handleContinue = () => setScreen('MAP');

  if (!currentEvent) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <span className="text-white">Loading event...</span>
      </div>
    );
  }

  const getEventIcon = (id: string): string => {
    const icons: Record<string, string> = {
      ancient_shrine: '⛩️', abandoned_camp: '🏕️', crystal_cave: '💎',
      mysterious_merchant: '🧙', underground_market: '🏴', blood_altar: '🩸',
      the_well: '🕳️', fungal_garden: '🍄', golden_idol: '🏆',
      forgotten_forge: '🔥', ancient_library: '📚', mirror_pool: '🪞',
      wounded_delver: '🧑‍🤝‍🧑', trapped_chest: '📦', ore_vein: '⛏️',
      ghostly_apparition: '👻', collapsed_tunnel: '🚧', echo_chamber: '🔊',
      primordial_pool: '🧪', ancient_automaton: '🤖', temporal_rift: '🌀',
      singing_crystals: '🎵', the_abyss: '🕳️',
    };
    return icons[id] || '❓';
  };

  // Card selection modal
  if (showCardSelect) {
    const getFilteredCards = () => {
      switch (showCardSelect) {
        case 'upgrade': return player.deck.filter(c => !c.upgraded && c.type !== 'CURSE' && c.type !== 'STATUS');
        case 'remove': return player.deck.filter(c => c.rarity !== 'STARTER');
        default: return player.deck.filter(c => c.type !== 'CURSE' && c.type !== 'STATUS');
      }
    };
    const cardsToShow = getFilteredCards();
    
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-panel-dark to-black p-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-game text-yellow-400 text-center mb-2">
            {showCardSelect === 'upgrade' && `Choose a card to UPGRADE${upgradesRemaining > 1 ? ` (${upgradesRemaining} remaining)` : ''}`}
            {showCardSelect === 'remove' && 'Choose a card to REMOVE'}
            {showCardSelect === 'transform' && 'Choose a card to TRANSFORM'}
            {showCardSelect === 'duplicate' && 'Choose a card to DUPLICATE'}
          </h2>
          <p className="text-gray-400 text-center mb-6 text-sm">
            {showCardSelect === 'upgrade' && 'Upgraded cards have improved effects'}
            {showCardSelect === 'remove' && 'This card will be permanently removed from your deck'}
            {showCardSelect === 'transform' && 'This card will become a random new card'}
            {showCardSelect === 'duplicate' && 'A copy of this card will be added to your deck'}
          </p>
          
          {cardsToShow.length === 0 ? (
            <div className="text-center">
              <p className="text-gray-400 mb-6">No eligible cards available.</p>
              <Button variant="secondary" onClick={() => { setShowCardSelect(null); setUpgradesRemaining(0); }}>Continue</Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-4 gap-4 max-h-96 overflow-y-auto">
                {cardsToShow.map((card, index) => {
                  const originalIndex = player.deck.indexOf(card);
                  return (
                    <div
                      key={`${card.id}-${index}`}
                      onClick={() => handleCardSelect(originalIndex)}
                      className={clsx(
                        'p-3 rounded-lg border-2 cursor-pointer transition-all',
                        'bg-gradient-to-b from-panel-light to-panel-dark',
                        'hover:border-yellow-500 hover:scale-105',
                        card.type === 'ATTACK' && 'border-red-700',
                        card.type === 'SKILL' && 'border-green-700',
                        card.type === 'POWER' && 'border-blue-700',
                      )}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-white text-sm font-medium truncate">{card.name}</span>
                        <span className="text-yellow-400 text-xs bg-black/50 px-1 rounded">{card.cost}</span>
                      </div>
                      <p className="text-gray-400 text-xs line-clamp-2">{card.description}</p>
                      <div className="flex justify-between mt-1">
                        <span className={clsx(
                          'text-xs',
                          card.rarity === 'COMMON' && 'text-gray-500',
                          card.rarity === 'UNCOMMON' && 'text-blue-400',
                          card.rarity === 'RARE' && 'text-yellow-400',
                        )}>{card.rarity}</span>
                        {card.upgraded && <span className="text-green-400 text-xs">+</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="text-center mt-6">
                <Button variant="secondary" onClick={() => { setShowCardSelect(null); setUpgradesRemaining(0); }}>Skip</Button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-panel-dark to-black p-8">
      {/* Top bar */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="flex items-center justify-between bg-panel/80 rounded-lg p-3">
          <div className="flex items-center gap-4">
            <HpBar current={player.currentHp} max={player.maxHp} size="md" />
            <span className="text-yellow-400">💰 {player.gold}</span>
          </div>
          <span className="text-gray-400">Floor {currentFloor + 1}</span>
        </div>
      </div>

      {/* Event content */}
      <div className="max-w-2xl mx-auto">
        <Panel border="gold" className="mb-6">
          {/* Event icon and title */}
          <div className="text-center mb-6">
            <span className="text-6xl block mb-4">{getEventIcon(currentEvent.id)}</span>
            <h1 className="text-3xl font-game text-yellow-400 mb-2">{currentEvent.name}</h1>
          </div>

          {/* Event description */}
          <p className="text-gray-300 text-center mb-8 leading-relaxed px-4">
            {currentEvent.description}
          </p>

          {/* Outcome display */}
          {resolvedOutcome && (
            <div className={clsx(
              'rounded-lg p-4 mb-6 border',
              resolvedOutcome.type.includes('DAMAGE') || resolvedOutcome.type.includes('LOSE') || resolvedOutcome.type.includes('CURSE') || resolvedOutcome.type.includes('AMBUSH')
                ? 'bg-red-900/30 border-red-500/50'
                : 'bg-green-900/30 border-green-500/50'
            )}>
              <p className="text-center italic text-white">{resolvedOutcome.text}</p>
            </div>
          )}

          {/* Choices or Continue */}
          {!isResolving ? (
            <div className="space-y-3">
              {currentEvent.choices.map((choice, index) => {
                const affordable = canAffordChoice(choice);
                return (
                  <button
                    key={index}
                    onClick={() => handleChoice(choice)}
                    disabled={!affordable}
                    className={clsx(
                      'w-full p-4 rounded-lg border-2 text-left transition-all',
                      affordable
                        ? 'bg-panel-light border-gray-600 hover:border-yellow-500 hover:bg-panel cursor-pointer'
                        : 'bg-gray-800/50 border-gray-700 opacity-50 cursor-not-allowed'
                    )}
                  >
                    <span className="text-white">[{index + 1}] {choice.text}</span>
                    {!affordable && <span className="text-red-400 text-sm ml-2">(Not enough gold)</span>}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-center">
              <Button variant="gold" onClick={handleContinue}>Continue</Button>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
