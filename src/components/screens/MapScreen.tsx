import { useCallback, useEffect, useMemo, useState } from 'react';
import { clsx } from 'clsx';
import { Button } from '@/components/ui/Button';
import { Panel } from '@/components/ui/Panel';
import { HpBar } from '@/components/ui/ProgressBar';
import { RelicBar, GoldDisplay } from '@/components/game/Inventory';
import { useGameStore } from '@/stores/gameStore';
import type { Room, RoomType, Enemy, StatusEffects } from '@/types';

// Room type configuration
const roomConfig: Record<RoomType, { icon: string; color: string; name: string }> = {
  COMBAT: { icon: '⚔️', color: 'bg-red-900 border-red-600 hover:border-red-400', name: 'Combat' },
  ELITE: { icon: '💀', color: 'bg-purple-900 border-purple-600 hover:border-purple-400', name: 'Elite' },
  BOSS: { icon: '👹', color: 'bg-red-950 border-red-700 hover:border-red-500', name: 'Boss' },
  REST: { icon: '🔥', color: 'bg-orange-900 border-orange-600 hover:border-orange-400', name: 'Rest' },
  MERCHANT: { icon: '💰', color: 'bg-yellow-900 border-yellow-600 hover:border-yellow-400', name: 'Shop' },
  TREASURE: { icon: '📦', color: 'bg-amber-900 border-amber-600 hover:border-amber-400', name: 'Treasure' },
  EVENT: { icon: '❓', color: 'bg-blue-900 border-blue-600 hover:border-blue-400', name: 'Event' },
};

// Create default status effects for enemies
function createDefaultStatusEffects(): StatusEffects {
  return {
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
  };
}

// Generate enemies based on room type and floor
function generateEnemies(roomType: RoomType, floor: number): Enemy[] {
  const baseHp = 20 + floor * 5;
  
  if (roomType === 'BOSS') {
    // Different bosses based on which "act" you're in (floors 1-5, 6-10, 11-15)
    const bossIndex = Math.floor(floor / 5);
    const bosses = [
      { 
        id: 'hollow_guardian', 
        name: 'Hollow Guardian', 
        hp: 140, 
        moves: [
          { name: 'Guardian Strike', intent: { type: 'ATTACK' as const, value: 22 }, weight: 2, actions: [{ type: 'DAMAGE', value: 22 }] },
          { name: 'Fortify', intent: { type: 'DEFEND' as const, value: 20 }, weight: 1, actions: [{ type: 'BLOCK', value: 20 }] },
          { name: 'Activate', intent: { type: 'BUFF' as const }, weight: 1, actions: [{ type: 'STRENGTH', value: 2 }] },
          { name: 'Crushing Slam', intent: { type: 'ATTACK' as const, value: 32 }, weight: 1, actions: [{ type: 'DAMAGE', value: 32 }, { type: 'VULNERABLE', value: 2 }] },
        ]
      },
      { 
        id: 'crystal_wyrm', 
        name: 'Crystal Wyrm', 
        hp: 180, 
        moves: [
          { name: 'Crystal Fang', intent: { type: 'ATTACK' as const, value: 18 }, weight: 2, actions: [{ type: 'DAMAGE', value: 18 }] },
          { name: 'Shed Scales', intent: { type: 'DEFEND' as const, value: 15 }, weight: 1, actions: [{ type: 'BLOCK', value: 15 }, { type: 'PLATED_ARMOR', value: 5 }] },
          { name: 'Hypnotic Gaze', intent: { type: 'DEBUFF' as const }, weight: 1, actions: [{ type: 'WEAK', value: 2 }, { type: 'FRAIL', value: 2 }] },
          { name: 'Crystal Breath', intent: { type: 'ATTACK' as const, value: 28 }, weight: 1, actions: [{ type: 'DAMAGE', value: 28 }] },
        ]
      },
      { 
        id: 'the_forgotten', 
        name: 'The Forgotten', 
        hp: 220, 
        moves: [
          { name: 'Echoing Strike', intent: { type: 'ATTACK' as const, value: 15 }, weight: 2, actions: [{ type: 'DAMAGE', value: 15 }, { type: 'DAMAGE', value: 15 }] },
          { name: 'Memory Drain', intent: { type: 'DEBUFF' as const }, weight: 1, actions: [{ type: 'REMOVE_STRENGTH', value: 2 }, { type: 'STRENGTH', value: 2 }] },
          { name: 'Void Shield', intent: { type: 'DEFEND' as const, value: 30 }, weight: 1, actions: [{ type: 'BLOCK', value: 30 }] },
          { name: 'Oblivion', intent: { type: 'ATTACK' as const, value: 45 }, weight: 1, actions: [{ type: 'DAMAGE', value: 45 }] },
        ]
      },
    ];
    const boss = bosses[Math.min(bossIndex, bosses.length - 1)];
    
    return [{
      id: boss.id,
      name: boss.name,
      maxHp: boss.hp + floor * 8,
      currentHp: boss.hp + floor * 8,
      type: 'boss',
      block: 0,
      statusEffects: createDefaultStatusEffects(),
      currentIntent: boss.moves[0].intent,
      moves: boss.moves,
    }];
  }
  
  if (roomType === 'ELITE') {
    const elites = [
      { id: 'tunnel_brute', name: 'Tunnel Brute', hp: 85,
        moves: [
          { name: 'War Cry', intent: { type: 'BUFF' as const }, weight: 1, actions: [{ type: 'STRENGTH', value: 2 }] },
          { name: 'Charge', intent: { type: 'ATTACK' as const, value: 14 }, weight: 2, actions: [{ type: 'DAMAGE', value: 14 }] },
          { name: 'Ground Pound', intent: { type: 'ATTACK' as const, value: 8 }, weight: 1, actions: [{ type: 'DAMAGE', value: 8 }, { type: 'VULNERABLE', value: 2 }] },
        ]
      },
      { id: 'ore_golem', name: 'Ore Golem', hp: 100,
        moves: [
          { name: 'Reinforce', intent: { type: 'DEFEND' as const, value: 15 }, weight: 1, actions: [{ type: 'BLOCK', value: 15 }] },
          { name: 'Boulder Toss', intent: { type: 'ATTACK' as const, value: 11 }, weight: 2, actions: [{ type: 'DAMAGE', value: 11 }] },
          { name: 'Quake', intent: { type: 'ATTACK' as const, value: 7 }, weight: 1, actions: [{ type: 'DAMAGE', value: 7 }, { type: 'WEAK', value: 2 }] },
        ]
      },
      { id: 'echo_wraith', name: 'Echo Wraith', hp: 70,
        moves: [
          { name: 'Phase', intent: { type: 'BUFF' as const }, weight: 1, actions: [{ type: 'INTANGIBLE', value: 1 }] },
          { name: 'Soul Rend', intent: { type: 'ATTACK' as const, value: 18 }, weight: 2, actions: [{ type: 'DAMAGE', value: 18 }] },
          { name: 'Drain', intent: { type: 'ATTACK' as const, value: 10 }, weight: 1, actions: [{ type: 'DAMAGE', value: 10 }, { type: 'HEAL', value: 5 }] },
        ]
      },
      { id: 'crystal_sentinel', name: 'Crystal Sentinel', hp: 90,
        moves: [
          { name: 'Crystal Barrage', intent: { type: 'ATTACK' as const, value: 6 }, weight: 2, actions: [{ type: 'DAMAGE', value: 6 }, { type: 'DAMAGE', value: 6 }, { type: 'DAMAGE', value: 6 }] },
          { name: 'Resonance Shield', intent: { type: 'DEFEND' as const, value: 12 }, weight: 1, actions: [{ type: 'BLOCK', value: 12 }, { type: 'PLATED_ARMOR', value: 3 }] },
          { name: 'Shatter', intent: { type: 'ATTACK' as const, value: 16 }, weight: 1, actions: [{ type: 'DAMAGE', value: 16 }, { type: 'VULNERABLE', value: 1 }] },
        ]
      },
      { id: 'corrupted_miner', name: 'Corrupted Miner', hp: 75,
        moves: [
          { name: 'Wild Swing', intent: { type: 'ATTACK' as const, value: 12 }, weight: 2, actions: [{ type: 'DAMAGE', value: 12 }] },
          { name: 'Toxic Gas', intent: { type: 'DEBUFF' as const }, weight: 1, actions: [{ type: 'POISON', value: 6 }] },
          { name: 'Desperate Strike', intent: { type: 'ATTACK' as const, value: 20 }, weight: 1, actions: [{ type: 'DAMAGE', value: 20 }] },
        ]
      },
      { id: 'ancient_automaton', name: 'Ancient Automaton', hp: 110,
        moves: [
          { name: 'Laser Beam', intent: { type: 'ATTACK' as const, value: 15 }, weight: 2, actions: [{ type: 'DAMAGE', value: 15 }] },
          { name: 'Energy Shield', intent: { type: 'DEFEND' as const, value: 20 }, weight: 1, actions: [{ type: 'BLOCK', value: 20 }] },
          { name: 'Overcharge', intent: { type: 'BUFF' as const }, weight: 1, actions: [{ type: 'STRENGTH', value: 3 }] },
        ]
      },
    ];
    
    const elite = elites[Math.floor(Math.random() * elites.length)];
    return [{
      id: elite.id,
      name: elite.name,
      maxHp: elite.hp + floor * 5,
      currentHp: elite.hp + floor * 5,
      type: 'elite',
      block: 0,
      statusEffects: createDefaultStatusEffects(),
      currentIntent: elite.moves[1].intent,
      moves: elite.moves,
    }];
  }
  
  // Normal combat - 1-3 enemies
  const numEnemies = 1 + Math.floor(Math.random() * 2);
  const enemies: Enemy[] = [];
  
  const enemyTypes = [
    // Weak enemies (swarm types)
    { id: 'cave_crawler', name: 'Cave Crawler', hp: baseHp - 5, damage: 6, 
      moves: [
        { name: 'Bite', intent: { type: 'ATTACK' as const, value: 6 }, weight: 2, actions: [{ type: 'DAMAGE', value: 6 }] },
        { name: 'Web', intent: { type: 'DEBUFF' as const }, weight: 1, actions: [{ type: 'WEAK', value: 1 }] },
      ]
    },
    { id: 'mine_rat', name: 'Mine Rat', hp: baseHp - 10, damage: 4, 
      moves: [
        { name: 'Gnaw', intent: { type: 'ATTACK' as const, value: 4 }, weight: 3, actions: [{ type: 'DAMAGE', value: 4 }] },
        { name: 'Scurry', intent: { type: 'DEFEND' as const, value: 4 }, weight: 1, actions: [{ type: 'BLOCK', value: 4 }] },
      ]
    },
    { id: 'crystal_bat', name: 'Crystal Bat', hp: baseHp - 8, damage: 7, 
      moves: [
        { name: 'Sonic Screech', intent: { type: 'ATTACK' as const, value: 7 }, weight: 2, actions: [{ type: 'DAMAGE', value: 7 }] },
        { name: 'Echolocation', intent: { type: 'BUFF' as const }, weight: 1, actions: [{ type: 'STRENGTH', value: 1 }] },
      ]
    },
    
    // Medium enemies
    { id: 'depth_lurker', name: 'Depth Lurker', hp: baseHp + 5, damage: 8, 
      moves: [
        { name: 'Ambush', intent: { type: 'ATTACK' as const, value: 8 }, weight: 2, actions: [{ type: 'DAMAGE', value: 8 }] },
        { name: 'Hide', intent: { type: 'DEFEND' as const, value: 8 }, weight: 1, actions: [{ type: 'BLOCK', value: 8 }] },
      ]
    },
    { id: 'fungal_host', name: 'Fungal Host', hp: baseHp, damage: 5, 
      moves: [
        { name: 'Spore Cloud', intent: { type: 'ATTACK' as const, value: 5 }, weight: 2, actions: [{ type: 'DAMAGE', value: 5 }, { type: 'POISON', value: 2 }] },
        { name: 'Regenerate', intent: { type: 'BUFF' as const }, weight: 1, actions: [{ type: 'HEAL', value: 5 }] },
      ]
    },
    { id: 'shadow_wisp', name: 'Shadow Wisp', hp: baseHp - 3, damage: 9, 
      moves: [
        { name: 'Shadow Bolt', intent: { type: 'ATTACK' as const, value: 9 }, weight: 2, actions: [{ type: 'DAMAGE', value: 9 }] },
        { name: 'Fade', intent: { type: 'BUFF' as const }, weight: 1, actions: [{ type: 'INTANGIBLE', value: 1 }] },
      ]
    },
    { id: 'ore_beetle', name: 'Ore Beetle', hp: baseHp + 2, damage: 6, 
      moves: [
        { name: 'Ram', intent: { type: 'ATTACK' as const, value: 6 }, weight: 2, actions: [{ type: 'DAMAGE', value: 6 }] },
        { name: 'Burrow', intent: { type: 'DEFEND' as const, value: 10 }, weight: 1, actions: [{ type: 'BLOCK', value: 10 }] },
      ]
    },
    { id: 'tunnel_snake', name: 'Tunnel Snake', hp: baseHp - 2, damage: 7, 
      moves: [
        { name: 'Venomous Bite', intent: { type: 'ATTACK' as const, value: 7 }, weight: 2, actions: [{ type: 'DAMAGE', value: 7 }, { type: 'POISON', value: 3 }] },
        { name: 'Coil', intent: { type: 'DEFEND' as const, value: 5 }, weight: 1, actions: [{ type: 'BLOCK', value: 5 }] },
      ]
    },
    
    // Strong enemies
    { id: 'rock_elemental', name: 'Rock Elemental', hp: baseHp + 10, damage: 10, 
      moves: [
        { name: 'Stone Fist', intent: { type: 'ATTACK' as const, value: 10 }, weight: 2, actions: [{ type: 'DAMAGE', value: 10 }] },
        { name: 'Harden', intent: { type: 'DEFEND' as const, value: 12 }, weight: 1, actions: [{ type: 'BLOCK', value: 12 }] },
      ]
    },
    { id: 'corrupted_crystal', name: 'Corrupted Crystal', hp: baseHp + 8, damage: 12, 
      moves: [
        { name: 'Refract', intent: { type: 'ATTACK' as const, value: 6 }, weight: 2, actions: [{ type: 'DAMAGE', value: 6 }, { type: 'DAMAGE', value: 6 }] },
        { name: 'Pulse', intent: { type: 'DEBUFF' as const }, weight: 1, actions: [{ type: 'VULNERABLE', value: 2 }] },
      ]
    },
    { id: 'ancient_sentinel', name: 'Ancient Sentinel', hp: baseHp + 12, damage: 9, 
      moves: [
        { name: 'Cleave', intent: { type: 'ATTACK' as const, value: 9 }, weight: 2, actions: [{ type: 'DAMAGE', value: 9 }] },
        { name: 'Guard Protocol', intent: { type: 'DEFEND' as const, value: 15 }, weight: 1, actions: [{ type: 'BLOCK', value: 15 }] },
      ]
    },
    { id: 'void_touched', name: 'Void Touched', hp: baseHp, damage: 11, 
      moves: [
        { name: 'Void Strike', intent: { type: 'ATTACK' as const, value: 11 }, weight: 2, actions: [{ type: 'DAMAGE', value: 11 }] },
        { name: 'Entropy', intent: { type: 'DEBUFF' as const }, weight: 1, actions: [{ type: 'WEAK', value: 1 }, { type: 'FRAIL', value: 1 }] },
      ]
    },
  ];
  
  for (let i = 0; i < numEnemies; i++) {
    const template = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
    enemies.push({
      id: `${template.id}_${i}`,
      name: template.name,
      maxHp: template.hp,
      currentHp: template.hp,
      type: 'normal',
      block: 0,
      statusEffects: createDefaultStatusEffects(),
      currentIntent: template.moves[0].intent,
      moves: template.moves,
    });
  }
  
  return enemies;
}

// Simple map generator
function generateMap(): Room[] {
  const newMap: Room[] = [];
  
  // Create 15 floors with 3-4 rooms each
  for (let y = 0; y < 15; y++) {
    const roomsOnFloor = y === 14 ? 1 : (3 + Math.floor(Math.random() * 2)); // Boss floor has 1 room
    
    for (let x = 0; x < roomsOnFloor; x++) {
      let type: RoomType;
      if (y === 14) type = 'BOSS';
      else if (y === 0) type = 'COMBAT';
      else if (y === 7 || y === 13) type = 'REST';
      else {
        const roll = Math.random();
        if (roll < 0.45) type = 'COMBAT';
        else if (roll < 0.60) type = 'EVENT';
        else if (roll < 0.70) type = 'ELITE';
        else if (roll < 0.80) type = 'REST';
        else if (roll < 0.90) type = 'MERCHANT';
        else type = 'TREASURE';
      }

      newMap.push({
        type,
        x: roomsOnFloor === 1 ? 0.5 : x / (roomsOnFloor - 1), // Normalize to 0-1
        y,
        connections: [],
        visited: false,
      });
    }
  }

  // Create connections
  for (let y = 0; y < 14; y++) {
    const currentFloorRooms = newMap.filter(r => r.y === y);
    const nextFloorRooms = newMap.filter(r => r.y === y + 1);
    
    currentFloorRooms.forEach((room) => {
      const roomIndex = newMap.indexOf(room);
      const connections: number[] = [];
      
      if (nextFloorRooms.length === 1) {
        connections.push(newMap.indexOf(nextFloorRooms[0]));
      } else {
        // Connect to nearby rooms based on x position
        const nearbyRooms = nextFloorRooms
          .map((r) => ({ room: r, dist: Math.abs(r.x - room.x) }))
          .sort((a, b) => a.dist - b.dist)
          .slice(0, 2); // Connect to 2 closest rooms
        
        nearbyRooms.forEach(nr => {
          const targetIdx = newMap.indexOf(nr.room);
          if (!connections.includes(targetIdx)) {
            connections.push(targetIdx);
          }
        });
      }
      
      newMap[roomIndex].connections = connections;
    });
  }

  return newMap;
}

export function MapScreen() {
  const { 
    player, 
    map, 
    currentRoomIndex, 
    currentFloor,
    currentAct,
    moveToRoom,
    setScreen,
    setShowDeckView,
    setMap,
    startCombat
  } = useGameStore();

  const [hoveredRoom, setHoveredRoom] = useState<number | null>(null);

  // Generate map on mount if empty
  useEffect(() => {
    if (map.length === 0) {
      const newMap = generateMap();
      setMap(newMap);
    }
  }, [map.length, setMap]);

  // Get available rooms to move to
  const availableRooms = useMemo((): number[] => {
    if (map.length === 0) return [];
    
    if (currentRoomIndex === -1) {
      // Starting position - can go to any room on floor 0
      return map
        .map((room, index) => ({ room, index }))
        .filter(({ room }) => room.y === 0)
        .map(({ index }) => index);
    }
    
    const currentRoom = map[currentRoomIndex];
    return currentRoom?.connections || [];
  }, [map, currentRoomIndex]);

  // Handle room click
  const handleRoomClick = useCallback((roomIndex: number) => {
    if (!availableRooms.includes(roomIndex)) return;
    
    const room = map[roomIndex];
    moveToRoom(roomIndex);
    
    // Navigate to appropriate screen
    switch (room.type) {
      case 'COMBAT':
      case 'ELITE':
      case 'BOSS':
        // Generate enemies based on room type
        const enemies = generateEnemies(room.type, currentFloor);
        startCombat(enemies);
        break;
      case 'REST':
        setScreen('REST');
        break;
      case 'MERCHANT':
        setScreen('MERCHANT');
        break;
      case 'EVENT':
      case 'TREASURE':
        setScreen('EVENT');
        break;
    }
  }, [availableRooms, map, moveToRoom, setScreen, currentFloor, startCombat]);

  // Group rooms by floor for rendering
  const roomsByFloor = useMemo(() => {
    const floors: Room[][] = [];
    for (let y = 0; y < 15; y++) {
      floors.push(map.filter(r => r.y === y));
    }
    return floors;
  }, [map]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-panel-dark to-black flex flex-col">
      {/* Top Bar */}
      <div className="bg-panel-dark/90 backdrop-blur border-b border-gray-700 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="w-48">
              <HpBar current={player.currentHp} max={player.maxHp} size="md" />
            </div>
            <GoldDisplay amount={player.gold} />
          </div>

          <div className="text-center">
            <h2 className="text-xl font-game text-yellow-500">Act {currentAct}</h2>
            <p className="text-gray-400 text-sm">Floor {currentFloor + 1} / 15</p>
          </div>

          <div className="flex items-center gap-4">
            <RelicBar relics={player.relics} />
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowDeckView(true, 'DECK')}
            >
              🎴 Deck ({player.deck.length})
            </Button>
          </div>
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-4xl mx-auto">
          {/* Render floors from top (boss) to bottom (start) */}
          {roomsByFloor.map((floorRooms, floorIndex) => (
            <div key={floorIndex} className="relative">
              {/* Floor indicator */}
              <div className="absolute -left-16 top-1/2 -translate-y-1/2 text-gray-600 text-sm">
                {15 - floorIndex}
              </div>

              {/* Rooms on this floor */}
              <div className="flex justify-center gap-16 py-8">
                {floorRooms.map((room, roomIndex) => {
                  const globalIndex = map.indexOf(room);
                  const isAvailable = availableRooms.includes(globalIndex);
                  const isCurrent = currentRoomIndex === globalIndex;
                  const config = roomConfig[room.type];

                  return (
                    <div key={roomIndex} className="relative">
                      {/* Connection lines to next floor */}
                      {room.connections.map((connIdx, i) => {
                        const targetRoom = map[connIdx];
                        if (!targetRoom) return null;
                        
                        return (
                          <svg
                            key={i}
                            className="absolute top-full left-1/2 pointer-events-none"
                            width="200"
                            height="80"
                            style={{ transform: 'translateX(-50%)' }}
                          >
                            <line
                              x1="100"
                              y1="0"
                              x2={100 + (targetRoom.x - room.x) * 200}
                              y2="80"
                              stroke={room.visited ? '#4B5563' : '#1F2937'}
                              strokeWidth="2"
                              strokeDasharray={room.visited ? 'none' : '4'}
                            />
                          </svg>
                        );
                      })}

                      {/* Room node */}
                      <button
                        onClick={() => handleRoomClick(globalIndex)}
                        onMouseEnter={() => setHoveredRoom(globalIndex)}
                        onMouseLeave={() => setHoveredRoom(null)}
                        disabled={!isAvailable && !isCurrent}
                        className={clsx(
                          'w-16 h-16 rounded-lg border-2 flex items-center justify-center',
                          'transition-all duration-200 text-2xl',
                          config.color,
                          room.visited && 'opacity-50',
                          isCurrent && 'ring-4 ring-yellow-400 scale-110',
                          isAvailable && !room.visited && 'animate-pulse cursor-pointer hover:scale-110',
                          !isAvailable && !isCurrent && 'cursor-not-allowed opacity-40'
                        )}
                      >
                        {config.icon}
                      </button>

                      {/* Tooltip */}
                      {hoveredRoom === globalIndex && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50">
                          <Panel className="px-3 py-2 whitespace-nowrap" padding="none">
                            <p className="font-semibold text-white">{config.name}</p>
                            {room.visited && <p className="text-xs text-gray-400">Visited</p>}
                          </Panel>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )).reverse()}

          {/* Starting position indicator */}
          {currentRoomIndex === -1 && (
            <div className="text-center py-8">
              <p className="text-yellow-400 animate-pulse">Choose your path</p>
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="bg-panel-dark/90 backdrop-blur border-t border-gray-700 px-6 py-3">
        <div className="flex justify-center gap-6">
          {Object.entries(roomConfig).map(([type, config]) => (
            <div key={type} className="flex items-center gap-2 text-sm text-gray-400">
              <span>{config.icon}</span>
              <span>{config.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
