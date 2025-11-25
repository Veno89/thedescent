import { useState } from 'react';
import { clsx } from 'clsx';
import { Button } from '@/components/ui/Button';
import { Panel } from '@/components/ui/Panel';
import { Card } from '@/components/game/Card';
import { useGameStore } from '@/stores/gameStore';
import type { Card as CardType, Relic, Potion } from '@/types';

interface Reward {
  type: 'gold' | 'card' | 'relic' | 'potion';
  value?: number;
  cards?: CardType[];
  relic?: Relic;
  potion?: Potion;
  claimed: boolean;
}

export function RewardScreen() {
  const { addGold, addCardToDeck, addRelic, addPotion, setScreen } = useGameStore();
  
  // Generate rewards (would come from combat result in full implementation)
  const [rewards, setRewards] = useState<Reward[]>(() => [
    { type: 'gold', value: 25 + Math.floor(Math.random() * 25), claimed: false },
    { 
      type: 'card', 
      cards: generateCardRewards(), 
      claimed: false 
    },
    // Random chance for potion
    ...(Math.random() > 0.6 ? [{ 
      type: 'potion' as const, 
      potion: generatePotionReward(), 
      claimed: false 
    }] : []),
  ]);

  const [selectedCardReward, setSelectedCardReward] = useState<number | null>(null);
  const [showCardSelection, setShowCardSelection] = useState(false);

  // Claim gold
  const claimGold = (index: number) => {
    const reward = rewards[index];
    if (reward.type === 'gold' && reward.value) {
      addGold(reward.value);
      markClaimed(index);
    }
  };

  // Show card selection
  const openCardSelection = (index: number) => {
    setSelectedCardReward(index);
    setShowCardSelection(true);
  };

  // Select a card from rewards
  const selectCard = (card: CardType) => {
    if (selectedCardReward !== null) {
      addCardToDeck(card);
      markClaimed(selectedCardReward);
      setShowCardSelection(false);
      setSelectedCardReward(null);
    }
  };

  // Claim relic
  const claimRelic = (index: number) => {
    const reward = rewards[index];
    if (reward.type === 'relic' && reward.relic) {
      addRelic(reward.relic);
      markClaimed(index);
    }
  };

  // Claim potion
  const claimPotion = (index: number) => {
    const reward = rewards[index];
    if (reward.type === 'potion' && reward.potion) {
      const added = addPotion(reward.potion);
      if (added) {
        markClaimed(index);
      } else {
        // Potion slots full - could show discard option
        alert('Potion slots full!');
      }
    }
  };

  const markClaimed = (index: number) => {
    setRewards(prev => prev.map((r, i) => 
      i === index ? { ...r, claimed: true } : r
    ));
  };

  const handleContinue = () => {
    setScreen('MAP');
  };

  const allClaimed = rewards.every(r => r.claimed);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-yellow-950/10 to-black flex items-center justify-center p-8">
      <Panel className="w-full max-w-2xl" border="gold">
        {/* Header */}
        <div className="text-center mb-8">
          <span className="text-6xl mb-4 block">🏆</span>
          <h1 className="text-4xl font-game text-yellow-400 mb-2">Victory!</h1>
          <p className="text-gray-400">Choose your rewards</p>
        </div>

        {/* Rewards List */}
        <div className="space-y-4 mb-8">
          {rewards.map((reward, index) => (
            <RewardItem
              key={index}
              reward={reward}
              onClaim={() => {
                switch (reward.type) {
                  case 'gold':
                    claimGold(index);
                    break;
                  case 'card':
                    openCardSelection(index);
                    break;
                  case 'relic':
                    claimRelic(index);
                    break;
                  case 'potion':
                    claimPotion(index);
                    break;
                }
              }}
            />
          ))}
        </div>

        {/* Continue Button */}
        <div className="text-center">
          <Button 
            variant={allClaimed ? 'gold' : 'secondary'} 
            size="lg" 
            onClick={handleContinue}
          >
            {allClaimed ? 'Continue' : 'Skip Remaining'}
          </Button>
        </div>
      </Panel>

      {/* Card Selection Modal */}
      {showCardSelection && selectedCardReward !== null && (
        <CardSelectionModal
          cards={rewards[selectedCardReward].cards || []}
          onSelect={selectCard}
          onSkip={() => {
            setShowCardSelection(false);
            setSelectedCardReward(null);
          }}
        />
      )}
    </div>
  );
}

interface RewardItemProps {
  reward: Reward;
  onClaim: () => void;
}

function RewardItem({ reward, onClaim }: RewardItemProps) {
  const getRewardDisplay = () => {
    switch (reward.type) {
      case 'gold':
        return (
          <>
            <span className="text-2xl">💰</span>
            <span className="text-yellow-400 font-bold">{reward.value} Gold</span>
          </>
        );
      case 'card':
        return (
          <>
            <span className="text-2xl">🎴</span>
            <span className="text-blue-400 font-bold">Add a Card</span>
          </>
        );
      case 'relic':
        return (
          <>
            <span className="text-2xl">🔮</span>
            <span className="text-purple-400 font-bold">{reward.relic?.name}</span>
          </>
        );
      case 'potion':
        return (
          <>
            <span className="text-2xl">🧪</span>
            <span className="text-green-400 font-bold">{reward.potion?.name}</span>
          </>
        );
    }
  };

  return (
    <button
      onClick={onClaim}
      disabled={reward.claimed}
      className={clsx(
        'w-full p-4 rounded-lg border-2 flex items-center gap-4',
        'transition-all duration-200',
        reward.claimed
          ? 'bg-gray-800/50 border-gray-700 opacity-50 cursor-not-allowed'
          : 'bg-panel-light border-gray-600 hover:border-yellow-500 hover:bg-panel cursor-pointer'
      )}
    >
      {getRewardDisplay()}
      
      {reward.claimed && (
        <span className="ml-auto text-green-400">✓ Claimed</span>
      )}
    </button>
  );
}

interface CardSelectionModalProps {
  cards: CardType[];
  onSelect: (card: CardType) => void;
  onSkip: () => void;
}

function CardSelectionModal({ cards, onSelect, onSkip }: CardSelectionModalProps) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-8">
      <Panel className="max-w-4xl" border="gold">
        <h2 className="text-2xl font-game text-yellow-500 text-center mb-6">
          Choose a Card
        </h2>
        
        <div className="flex justify-center gap-6 mb-6">
          {cards.map((card, index) => (
            <Card
              key={index}
              card={card}
              size="lg"
              onClick={() => onSelect(card)}
            />
          ))}
        </div>

        <div className="text-center">
          <Button variant="ghost" onClick={onSkip}>
            Skip Card Reward
          </Button>
        </div>
      </Panel>
    </div>
  );
}

// Helper functions for generating rewards
function generateCardRewards(): CardType[] {
  // Pool of cards that can appear as rewards
  const cardPool: CardType[] = [
    // ===== COMMON ATTACKS =====
    {
      id: 'pickaxe_swing',
      name: 'Pickaxe Swing',
      description: 'Deal {0} damage. Draw {1} card.',
      type: 'ATTACK',
      rarity: 'COMMON',
      cost: 1,
      upgraded: false,
      targetType: 'SINGLE_ENEMY',
      effects: [{ type: 'DAMAGE', value: 9 }, { type: 'DRAW', value: 1 }],
    },
    {
      id: 'echo_strike',
      name: 'Echo Strike',
      description: 'Deal {0} damage twice.',
      type: 'ATTACK',
      rarity: 'COMMON',
      cost: 1,
      upgraded: false,
      targetType: 'SINGLE_ENEMY',
      effects: [{ type: 'DAMAGE', value: 4 }, { type: 'DAMAGE', value: 4 }],
    },
    {
      id: 'cave_in',
      name: 'Cave In',
      description: 'Deal {0} damage to ALL enemies.',
      type: 'ATTACK',
      rarity: 'COMMON',
      cost: 1,
      upgraded: false,
      targetType: 'ALL_ENEMIES',
      effects: [{ type: 'DAMAGE', value: 8 }],
    },
    {
      id: 'lantern_bash',
      name: 'Lantern Bash',
      description: 'Deal {0} damage. Gain {1} Block.',
      type: 'ATTACK',
      rarity: 'COMMON',
      cost: 1,
      upgraded: false,
      targetType: 'SINGLE_ENEMY',
      effects: [{ type: 'DAMAGE', value: 5 }, { type: 'BLOCK', value: 5 }],
    },
    {
      id: 'reckless_dive',
      name: 'Reckless Dive',
      description: 'Deal {0} damage. Take {1} damage.',
      type: 'ATTACK',
      rarity: 'COMMON',
      cost: 0,
      upgraded: false,
      targetType: 'SINGLE_ENEMY',
      effects: [{ type: 'DAMAGE', value: 7 }, { type: 'SELF_DAMAGE', value: 3 }],
    },
    {
      id: 'chip_away',
      name: 'Chip Away',
      description: 'Deal {0} damage. Apply {1} Exposed.',
      type: 'ATTACK',
      rarity: 'COMMON',
      cost: 1,
      upgraded: false,
      targetType: 'SINGLE_ENEMY',
      effects: [{ type: 'DAMAGE', value: 5 }, { type: 'APPLY_VULNERABLE', value: 1 }],
    },
    {
      id: 'hammer_down',
      name: 'Hammer Down',
      description: 'Deal {0} damage. Apply {1} Weakened.',
      type: 'ATTACK',
      rarity: 'COMMON',
      cost: 1,
      upgraded: false,
      targetType: 'SINGLE_ENEMY',
      effects: [{ type: 'DAMAGE', value: 6 }, { type: 'APPLY_WEAK', value: 1 }],
    },
    {
      id: 'tremor_strike',
      name: 'Tremor Strike',
      description: 'Deal {0} damage to ALL enemies. Gain {1} Block.',
      type: 'ATTACK',
      rarity: 'COMMON',
      cost: 2,
      upgraded: false,
      targetType: 'ALL_ENEMIES',
      effects: [{ type: 'DAMAGE', value: 7 }, { type: 'BLOCK', value: 5 }],
    },
    
    // ===== COMMON SKILLS =====
    {
      id: 'tunnel_vision',
      name: 'Tunnel Vision',
      description: 'Gain {0} Block. Draw {1} card.',
      type: 'SKILL',
      rarity: 'COMMON',
      cost: 1,
      upgraded: false,
      targetType: 'SELF',
      effects: [{ type: 'BLOCK', value: 8 }, { type: 'DRAW', value: 1 }],
    },
    {
      id: 'stone_skin',
      name: 'Stone Skin',
      description: 'Gain {0} Block.',
      type: 'SKILL',
      rarity: 'COMMON',
      cost: 2,
      upgraded: false,
      targetType: 'SELF',
      effects: [{ type: 'BLOCK', value: 15 }],
    },
    {
      id: 'map_the_depths',
      name: 'Map the Depths',
      description: 'Draw {0} cards.',
      type: 'SKILL',
      rarity: 'COMMON',
      cost: 1,
      upgraded: false,
      targetType: 'SELF',
      effects: [{ type: 'DRAW', value: 3 }],
    },
    {
      id: 'reinforce',
      name: 'Reinforce',
      description: 'Double your current Block.',
      type: 'SKILL',
      rarity: 'COMMON',
      cost: 1,
      upgraded: false,
      targetType: 'SELF',
      effects: [{ type: 'DOUBLE_BLOCK', value: 1 }],
    },
    {
      id: 'miners_grit',
      name: "Miner's Grit",
      description: 'Gain {0} Block. Gain {1} Might.',
      type: 'SKILL',
      rarity: 'COMMON',
      cost: 2,
      upgraded: false,
      targetType: 'SELF',
      effects: [{ type: 'BLOCK', value: 8 }, { type: 'APPLY_STRENGTH', value: 1 }],
    },
    {
      id: 'survey',
      name: 'Survey',
      description: 'Draw {0} cards. Discard 1 card.',
      type: 'SKILL',
      rarity: 'COMMON',
      cost: 0,
      upgraded: false,
      targetType: 'SELF',
      effects: [{ type: 'DRAW', value: 2 }, { type: 'DISCARD', value: 1 }],
    },
    {
      id: 'dust_cloud',
      name: 'Dust Cloud',
      description: 'Gain {0} Block. Apply {1} Weakened to ALL enemies.',
      type: 'SKILL',
      rarity: 'COMMON',
      cost: 1,
      upgraded: false,
      targetType: 'ALL_ENEMIES',
      effects: [{ type: 'BLOCK', value: 4 }, { type: 'APPLY_WEAK', value: 1 }],
    },
    
    // ===== UNCOMMON ATTACKS =====
    {
      id: 'depth_adaptation',
      name: 'Depth Adaptation',
      description: 'Gain {0} Might.',
      type: 'POWER',
      rarity: 'UNCOMMON',
      cost: 1,
      upgraded: false,
      targetType: 'SELF',
      effects: [{ type: 'APPLY_STRENGTH', value: 2 }],
    },
    {
      id: 'crystalline_blade',
      name: 'Crystalline Blade',
      description: 'Deal {0} damage. If enemy has Exposed, deal {0} again.',
      type: 'ATTACK',
      rarity: 'UNCOMMON',
      cost: 2,
      upgraded: false,
      targetType: 'SINGLE_ENEMY',
      effects: [{ type: 'DAMAGE', value: 10 }, { type: 'CONDITIONAL_DAMAGE_VULNERABLE', value: 10 }],
    },
    {
      id: 'delvers_instinct',
      name: "Delver's Instinct",
      description: 'At the start of your turn, gain {0} Block.',
      type: 'POWER',
      rarity: 'UNCOMMON',
      cost: 1,
      upgraded: false,
      targetType: 'SELF',
      effects: [{ type: 'START_TURN_BLOCK', value: 4 }],
    },
    {
      id: 'depth_charge',
      name: 'Depth Charge',
      description: 'Deal {0} damage to ALL enemies. Apply {1} Weakened.',
      type: 'ATTACK',
      rarity: 'UNCOMMON',
      cost: 2,
      upgraded: false,
      targetType: 'ALL_ENEMIES',
      effects: [{ type: 'DAMAGE', value: 12 }, { type: 'APPLY_WEAK', value: 2 }],
    },
    {
      id: 'ancient_ward',
      name: 'Ancient Ward',
      description: 'Gain {0} Block. Block is not removed next turn.',
      type: 'SKILL',
      rarity: 'UNCOMMON',
      cost: 2,
      upgraded: false,
      targetType: 'SELF',
      effects: [{ type: 'BLOCK', value: 12 }, { type: 'RETAIN_BLOCK', value: 1 }],
    },
    {
      id: 'corrode',
      name: 'Corrode',
      description: 'Apply {0} Corroded.',
      type: 'SKILL',
      rarity: 'UNCOMMON',
      cost: 1,
      upgraded: false,
      targetType: 'SINGLE_ENEMY',
      effects: [{ type: 'APPLY_POISON', value: 7 }],
    },
    {
      id: 'iron_will',
      name: 'Iron Will',
      description: 'Gain {0} Agility.',
      type: 'POWER',
      rarity: 'UNCOMMON',
      cost: 1,
      upgraded: false,
      targetType: 'SELF',
      effects: [{ type: 'APPLY_DEXTERITY', value: 2 }],
    },
    {
      id: 'echoing_presence',
      name: 'Echoing Presence',
      description: 'At the end of your turn, deal {0} damage to ALL enemies.',
      type: 'POWER',
      rarity: 'UNCOMMON',
      cost: 1,
      upgraded: false,
      targetType: 'SELF',
      effects: [{ type: 'END_TURN_DAMAGE_ALL', value: 3 }],
    },
    // RARE CARDS
    {
      id: 'abyssal_strike',
      name: 'Abyssal Strike',
      description: 'Deal {0} damage. Exhaust.',
      type: 'ATTACK',
      rarity: 'RARE',
      cost: 2,
      upgraded: false,
      targetType: 'SINGLE_ENEMY',
      effects: [{ type: 'DAMAGE', value: 30 }],
      exhaust: true,
    },
    {
      id: 'heart_of_stone',
      name: 'Heart of Stone',
      description: 'Gain {0} Might at the start of each turn.',
      type: 'POWER',
      rarity: 'RARE',
      cost: 2,
      upgraded: false,
      targetType: 'SELF',
      effects: [{ type: 'RITUAL_STRENGTH', value: 1 }],
    },
    {
      id: 'ancient_fortress',
      name: 'Ancient Fortress',
      description: 'Block is not removed at the start of your turn.',
      type: 'POWER',
      rarity: 'RARE',
      cost: 3,
      upgraded: false,
      targetType: 'SELF',
      effects: [{ type: 'RETAIN_ALL_BLOCK', value: 1 }],
    },
  ];

  // Weight by rarity - Common appears more often
  const weightedCards: CardType[] = [];
  cardPool.forEach(c => {
    const weight = c.rarity === 'COMMON' ? 3 : c.rarity === 'UNCOMMON' ? 2 : 1;
    for (let i = 0; i < weight; i++) {
      weightedCards.push(c);
    }
  });

  // Randomly select 3 cards from weighted pool
  const shuffled = [...weightedCards].sort(() => Math.random() - 0.5);
  // Get unique cards only
  const unique: CardType[] = [];
  const seen = new Set<string>();
  for (const card of shuffled) {
    if (!seen.has(card.id)) {
      seen.add(card.id);
      unique.push(card);
      if (unique.length >= 3) break;
    }
  }
  return unique;
}

function generatePotionReward(): Potion {
  const potions: Potion[] = [
    // Common Potions
    {
      id: 'restoration_vial',
      name: 'Restoration Vial',
      description: 'Heal 20 HP.',
      rarity: 'COMMON',
      targetType: 'SELF',
      effects: [{ type: 'HEAL', value: 20 }],
    },
    {
      id: 'might_elixir',
      name: 'Might Elixir',
      description: 'Gain 2 Might this combat.',
      rarity: 'COMMON',
      targetType: 'SELF',
      effects: [{ type: 'APPLY_STRENGTH', value: 2 }],
    },
    {
      id: 'stone_brew',
      name: 'Stone Brew',
      description: 'Gain 12 Block.',
      rarity: 'COMMON',
      targetType: 'SELF',
      effects: [{ type: 'BLOCK', value: 12 }],
    },
    {
      id: 'agility_serum',
      name: 'Agility Serum',
      description: 'Gain 2 Agility this combat.',
      rarity: 'COMMON',
      targetType: 'SELF',
      effects: [{ type: 'APPLY_DEXTERITY', value: 2 }],
    },
    {
      id: 'swift_draught',
      name: 'Swift Draught',
      description: 'Draw 2 cards.',
      rarity: 'COMMON',
      targetType: 'SELF',
      effects: [{ type: 'DRAW', value: 2 }],
    },
    {
      id: 'corrosive_vial',
      name: 'Corrosive Vial',
      description: 'Apply 6 Corroded to an enemy.',
      rarity: 'COMMON',
      targetType: 'SINGLE_ENEMY',
      effects: [{ type: 'APPLY_POISON', value: 6 }],
    },
    {
      id: 'weakening_tonic',
      name: 'Weakening Tonic',
      description: 'Apply 3 Weakened to an enemy.',
      rarity: 'COMMON',
      targetType: 'SINGLE_ENEMY',
      effects: [{ type: 'APPLY_WEAK', value: 3 }],
    },
    
    // Uncommon Potions
    {
      id: 'echo_tonic',
      name: 'Echo Tonic',
      description: 'Draw 4 cards.',
      rarity: 'UNCOMMON',
      targetType: 'SELF',
      effects: [{ type: 'DRAW', value: 4 }],
    },
    {
      id: 'explosive_flask',
      name: 'Explosive Flask',
      description: 'Deal 20 damage to ALL enemies.',
      rarity: 'UNCOMMON',
      targetType: 'ALL_ENEMIES',
      effects: [{ type: 'DAMAGE', value: 20 }],
    },
    {
      id: 'energy_core',
      name: 'Energy Core',
      description: 'Gain 2 Energy.',
      rarity: 'UNCOMMON',
      targetType: 'SELF',
      effects: [{ type: 'GAIN_ENERGY', value: 2 }],
    },
    {
      id: 'ore_plating_compound',
      name: 'Ore Plating Compound',
      description: 'Gain 5 Ore Plating.',
      rarity: 'UNCOMMON',
      targetType: 'SELF',
      effects: [{ type: 'APPLY_PLATED_ARMOR', value: 5 }],
    },
    {
      id: 'exposure_serum',
      name: 'Exposure Serum',
      description: 'Apply 3 Exposed to an enemy.',
      rarity: 'UNCOMMON',
      targetType: 'SINGLE_ENEMY',
      effects: [{ type: 'APPLY_VULNERABLE', value: 3 }],
    },
    {
      id: 'ancient_brew',
      name: 'Ancient Brew',
      description: 'Gain 3 Might and 3 Agility.',
      rarity: 'UNCOMMON',
      targetType: 'SELF',
      effects: [
        { type: 'APPLY_STRENGTH', value: 3 },
        { type: 'APPLY_DEXTERITY', value: 3 },
      ],
    },
    {
      id: 'duplication_elixir',
      name: 'Duplication Elixir',
      description: 'Your next card is played twice.',
      rarity: 'UNCOMMON',
      targetType: 'SELF',
      effects: [{ type: 'NEXT_CARD_TWICE', value: 1 }],
    },
    
    // Rare Potions
    {
      id: 'regeneration_potion',
      name: 'Regeneration Potion',
      description: 'Heal 5 HP at the end of each turn for 5 turns.',
      rarity: 'RARE',
      targetType: 'SELF',
      effects: [{ type: 'REGEN', value: 5 }],
    },
    {
      id: 'warding_elixir',
      name: 'Warding Elixir',
      description: 'Gain 3 Warding.',
      rarity: 'RARE',
      targetType: 'SELF',
      effects: [{ type: 'APPLY_ARTIFACT', value: 3 }],
    },
    {
      id: 'primordial_essence',
      name: 'Primordial Essence',
      description: 'Heal 30 HP. Gain 30 Block.',
      rarity: 'RARE',
      targetType: 'SELF',
      effects: [
        { type: 'HEAL', value: 30 },
        { type: 'BLOCK', value: 30 },
      ],
    },
    {
      id: 'ghost_in_a_bottle',
      name: 'Ghost in a Bottle',
      description: 'Gain 1 Phased.',
      rarity: 'RARE',
      targetType: 'SELF',
      effects: [{ type: 'APPLY_INTANGIBLE', value: 1 }],
    },
    {
      id: 'depths_blessing_potion',
      name: "Depth's Blessing",
      description: 'Gain 5 Might. Gain 5 Agility. Draw 5 cards.',
      rarity: 'RARE',
      targetType: 'SELF',
      effects: [
        { type: 'APPLY_STRENGTH', value: 5 },
        { type: 'APPLY_DEXTERITY', value: 5 },
        { type: 'DRAW', value: 5 },
      ],
    },
  ];
  
  // Weight by rarity - Common appears more often
  const weightedPotions: Potion[] = [];
  potions.forEach(p => {
    const weight = p.rarity === 'COMMON' ? 3 : p.rarity === 'UNCOMMON' ? 2 : 1;
    for (let i = 0; i < weight; i++) {
      weightedPotions.push(p);
    }
  });
  
  return weightedPotions[Math.floor(Math.random() * weightedPotions.length)];
}
