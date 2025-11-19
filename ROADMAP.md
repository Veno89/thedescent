# The Descent - Development Roadmap

## Project Overview
A deck-building roguelike card game inspired by Slay the Spire, built with TypeScript + Phaser 3, designed for eventual Windows desktop release via Tauri.

## Tech Stack
- **Language**: TypeScript
- **Game Engine**: Phaser 3
- **Build Tool**: Vite
- **Desktop Bundler**: Tauri (future)
- **Target Platform**: Windows (browser prototype first)

## Development Phases

### Phase 0: Foundation ✓
**Status**: Complete
- [x] Project setup (TypeScript, Phaser 3, Vite)
- [x] Basic scene structure (Boot, MainMenu, Combat)
- [x] Type definitions
- [x] Development environment

### Phase 1: Core Combat System
**Goal**: Playable combat encounter with basic card mechanics

#### 1.1 Card System
- [ ] Card class implementation
- [ ] Card rendering (placeholder graphics)
- [ ] Card data loader (JSON)
- [ ] Basic card pool (10-15 starter cards)
- [ ] Card hover/selection mechanics
- [ ] Drag-and-drop card playing

#### 1.2 Basic Combat Loop
- [ ] Turn system (player turn → enemy turn)
- [ ] Energy system (3 energy per turn)
- [ ] Draw pile mechanics
- [ ] Discard pile mechanics
- [ ] Hand management (draw 5 cards at turn start)
- [ ] End turn button

#### 1.3 Player & Enemy Entities
- [ ] Player character class
- [ ] Enemy class
- [ ] HP/Block system
- [ ] Damage calculation
- [ ] Death/victory conditions
- [ ] Basic UI (HP bars, energy counter)

#### 1.4 Enemy AI
- [ ] Intent system (show what enemy will do)
- [ ] Simple enemy move patterns
- [ ] 3-5 basic enemy types
- [ ] Enemy data loader (JSON)

**Milestone**: Win a combat encounter by playing cards

---

### Phase 2: Card Effects & Mechanics
**Goal**: Rich card interactions and strategic depth

#### 2.1 Effect System
- [ ] Event-driven effect architecture
- [ ] Effect types (damage, block, draw, energy, etc.)
- [ ] Effect targeting system
- [ ] Multi-effect cards
- [ ] Card upgrade system

#### 2.2 Status Effects (Buffs/Debuffs)
- [ ] Status effect framework
- [ ] Strength/Weak
- [ ] Vulnerable/Frail
- [ ] Poison
- [ ] Status effect UI indicators

#### 2.3 Advanced Card Mechanics
- [ ] Exhaust mechanic
- [ ] Card retention (keep in hand)
- [ ] Innate cards (start in hand)
- [ ] Ethereal cards (disappear if not played)
- [ ] X-cost cards

#### 2.4 Card Pool Expansion
- [ ] 50+ unique cards
- [ ] Attack/Skill/Power card types
- [ ] Card rarity system
- [ ] Balanced mana costs

**Milestone**: Complex multi-turn combat strategies

---

### Phase 3: Progression & Map System
**Goal**: Multiple combats with meaningful choices

#### 3.1 Map Generation
- [ ] Procedural map generator
- [ ] Room types (Combat, Elite, Rest, Merchant, Event, Treasure, Boss)
- [ ] Path selection
- [ ] Map UI visualization
- [ ] Room node connections

#### 3.2 Rewards System
- [ ] Card rewards (choose 1 of 3)
- [ ] Gold rewards
- [ ] Potion rewards
- [ ] Card removal option
- [ ] Card upgrade option

#### 3.3 Rest Sites
- [ ] Heal option (30% max HP)
- [ ] Upgrade card option
- [ ] Rest site UI

#### 3.4 Basic Run Structure
- [ ] 3 Acts with 15-17 floors each
- [ ] Boss encounters (1 per act)
- [ ] Elite encounters (harder enemies, better rewards)
- [ ] Run win/loss conditions

**Milestone**: Complete a full run from start to boss

---

### Phase 4: Relics & Potions
**Goal**: Meta-progression and strategic diversity

#### 4.1 Relic System
- [ ] Relic class implementation
- [ ] Relic effect triggers (on combat start, turn end, card played, etc.)
- [ ] 30+ unique relics
- [ ] Relic rarity system
- [ ] Starting relics per character
- [ ] Relic UI display

#### 4.2 Potion System
- [ ] Potion class implementation
- [ ] Potion slots (3 max)
- [ ] Potion effects
- [ ] 10+ potion types
- [ ] Potion usage UI
- [ ] Potion drops from combat

#### 4.3 Treasure Rooms
- [ ] Guaranteed relic reward
- [ ] Treasure room variations

**Milestone**: Strategic relic synergies affect gameplay

---

### Phase 5: Events & Merchant
**Goal**: Narrative elements and economy

#### 5.1 Event System
- [ ] Event framework
- [ ] 20+ unique events
- [ ] Choice-based outcomes
- [ ] Risk/reward mechanics
- [ ] Event UI

#### 5.2 Merchant
- [ ] Shop UI
- [ ] Card shop (5 cards)
- [ ] Relic shop (2-3 relics)
- [ ] Potion shop
- [ ] Card removal service
- [ ] Dynamic pricing

#### 5.3 Economy Balance
- [ ] Gold gain tuning
- [ ] Shop price balancing
- [ ] Opportunity cost design

**Milestone**: Meaningful non-combat decisions

---

### Phase 6: Multiple Characters
**Goal**: Replayability through character diversity

#### 6.1 Character System
- [ ] Character selection screen
- [ ] Character-specific starting decks
- [ ] Character-specific card pools
- [ ] Character-specific relics

#### 6.2 Character #1: The Warrior
- [ ] Strength-based archetype
- [ ] 75+ unique cards
- [ ] Starting relic
- [ ] Character art (placeholder)

#### 6.3 Character #2: The Rogue
- [ ] Poison/shiv archetype
- [ ] 75+ unique cards
- [ ] Starting relic
- [ ] Character art (placeholder)

#### 6.4 Character #3: The Mage
- [ ] Elemental/spell archetype
- [ ] 75+ unique cards
- [ ] Starting relic
- [ ] Character art (placeholder)

**Milestone**: 3 playable characters with distinct playstyles

---

### Phase 7: Save System & Persistence
**Goal**: Players can save/continue runs

#### 7.1 Save/Load System
- [ ] Game state serialization
- [ ] LocalStorage integration
- [ ] Auto-save on floor transition
- [ ] Continue run option
- [ ] Multiple save slots

#### 7.2 Run History
- [ ] Track completed runs
- [ ] Win/loss statistics
- [ ] Unlocks tracking

#### 7.3 Settings
- [ ] Volume controls
- [ ] Fullscreen toggle
- [ ] Settings persistence

**Milestone**: Seamless save/load experience

---

### Phase 8: Polish & Balance
**Goal**: Refined gameplay experience

#### 8.1 Visual Polish
- [ ] Card animations (play, discard, draw)
- [ ] Hit effects
- [ ] Status effect particles
- [ ] UI animations
- [ ] Screen shake for impacts

#### 8.2 Audio
- [ ] Background music (3-5 tracks)
- [ ] SFX (card play, hits, UI clicks)
- [ ] Audio manager

#### 8.3 Balance Pass
- [ ] Card balance tuning
- [ ] Enemy difficulty curve
- [ ] Relic power levels
- [ ] Gold economy
- [ ] Playtesting feedback integration

#### 8.4 QoL Features
- [ ] Card tooltips with keyword explanations
- [ ] Combat speed options
- [ ] Undo button (limited)
- [ ] Colorblind mode

**Milestone**: Polished, balanced game loop

---

### Phase 9: Advanced Features
**Goal**: Depth and replayability

#### 9.1 Ascension Mode
- [ ] 20 ascension levels
- [ ] Progressive difficulty modifiers
- [ ] Ascension UI

#### 9.2 Daily Run
- [ ] Seeded daily challenge
- [ ] Leaderboard (local)

#### 9.3 Additional Content
- [ ] More enemies (50+ total)
- [ ] More cards per character (100+ each)
- [ ] More relics (100+ total)
- [ ] More events (40+ total)

#### 9.4 Boss Variations
- [ ] 2-3 bosses per act
- [ ] Boss attack patterns
- [ ] Boss rewards

**Milestone**: High replayability

---

### Phase 10: Desktop Release Preparation
**Goal**: Windows native application

#### 10.1 Tauri Integration
- [ ] Set up Tauri project
- [ ] Bundle Phaser game in Tauri
- [ ] Window configuration
- [ ] App icon

#### 10.2 Platform-Specific Features
- [ ] File-based saves (vs localStorage)
- [ ] Native menus
- [ ] Auto-updater setup

#### 10.3 Performance Optimization
- [ ] Asset optimization
- [ ] Load time improvements
- [ ] Memory management

#### 10.4 Testing & Distribution
- [ ] Windows build testing
- [ ] Installer creation
- [ ] Steam integration prep (achievements, cloud saves)

**Milestone**: Windows .exe ready for distribution

---

## Current Status
**Phase**: 0 (Foundation) - Complete
**Next Up**: Phase 1.1 - Card System Implementation

## File Structure
```
thedescent/
├── src/
│   ├── scenes/          # Phaser scenes
│   │   ├── BootScene.ts
│   │   ├── MainMenuScene.ts
│   │   └── CombatScene.ts
│   ├── systems/         # Game systems (combat, cards, etc.)
│   ├── entities/        # Game entities (Player, Enemy, Card)
│   ├── data/            # JSON data files (cards, relics, enemies)
│   ├── ui/              # UI components
│   ├── utils/           # Utility functions
│   ├── types/           # TypeScript type definitions
│   └── main.ts          # Entry point
├── public/              # Static assets (images, audio)
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── ROADMAP.md
```

## Development Principles
1. **Data-Driven**: Cards, relics, enemies defined in JSON
2. **Modular**: Systems are independent and reusable
3. **Type-Safe**: Strict TypeScript for fewer bugs
4. **Prototype First**: Get it working, then make it pretty
5. **Incremental**: Each phase builds on the last
6. **Testable**: Playtest early and often

## Testing Strategy
- Manual playtesting after each phase
- Balance testing with spreadsheets
- User feedback integration
- Performance profiling before desktop release

---

**Last Updated**: 2025-11-19
**Version**: 0.1.0
