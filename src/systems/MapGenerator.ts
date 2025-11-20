import { Room, RoomType } from '@/types';

/**
 * MapGenerator creates procedural maps for each act
 */
export class MapGenerator {
  private readonly FLOORS_PER_ACT = 15;

  /**
   * Generate a complete map for an act
   */
  generateMap(_act: number): Room[] {
    const rooms: Room[] = [];
    const floors = this.FLOORS_PER_ACT;

    // Generate rooms floor by floor
    for (let floor = 0; floor < floors; floor++) {
      const roomsOnFloor = this.getRoomsForFloor(floor, floors);

      roomsOnFloor.forEach((room, index) => {
        rooms.push({
          type: room.type,
          x: index,
          y: floor,
          connections: [],
          visited: false,
        });
      });
    }

    // Create connections between floors
    this.createConnections(rooms, floors);

    return rooms;
  }

  /**
   * Get rooms for a specific floor
   */
  private getRoomsForFloor(floor: number, totalFloors: number): { type: RoomType }[] {
    // First floor: 1-2 starting rooms
    if (floor === 0) {
      return [
        { type: RoomType.COMBAT },
      ];
    }

    // Last floor: Boss
    if (floor === totalFloors - 1) {
      return [
        { type: RoomType.BOSS },
      ];
    }

    // Rest sites appear every 5-6 floors
    if (floor % 6 === 4 && floor < totalFloors - 2) {
      return this.generateFloorRooms(2, true);
    }

    // Elite floors (roughly 3 per act)
    if (this.isEliteFloor(floor, totalFloors)) {
      return this.generateFloorRooms(3, false, 0.4);
    }

    // Treasure floors (1-2 per act)
    if (floor === 7 || floor === 11) {
      return this.generateFloorRooms(2, false, 0, 0.3);
    }

    // Normal floors with variety
    return this.generateFloorRooms(3, false);
  }

  /**
   * Generate rooms for a normal floor
   */
  private generateFloorRooms(
    count: number,
    forceRest = false,
    eliteChance = 0,
    treasureChance = 0
  ): { type: RoomType }[] {
    const rooms: { type: RoomType }[] = [];

    for (let i = 0; i < count; i++) {
      if (forceRest && i === 0) {
        rooms.push({ type: RoomType.REST });
      } else {
        rooms.push({ type: this.randomRoomType(eliteChance, treasureChance) });
      }
    }

    return rooms;
  }

  /**
   * Determine if floor should have elite enemies
   */
  private isEliteFloor(floor: number, totalFloors: number): boolean {
    // Elites appear at floors 5, 10, and occasionally scattered
    const fixedEliteFloors = [5, 10];
    if (fixedEliteFloors.includes(floor)) return true;

    // Random elite chance on other floors
    return Math.random() < 0.15 && floor > 2 && floor < totalFloors - 3;
  }

  /**
   * Get a random room type based on weights
   */
  private randomRoomType(
    eliteChance = 0,
    treasureChance = 0
  ): RoomType {
    const roll = Math.random();

    if (roll < eliteChance) return RoomType.ELITE;
    if (roll < eliteChance + treasureChance) return RoomType.TREASURE;

    // Normal room distribution
    const normalRoll = Math.random();

    if (normalRoll < 0.55) return RoomType.COMBAT;
    if (normalRoll < 0.75) return RoomType.MERCHANT;
    if (normalRoll < 0.90) return RoomType.EVENT;
    return RoomType.COMBAT;
  }

  /**
   * Create connections between rooms on adjacent floors
   */
  private createConnections(rooms: Room[], totalFloors: number): void {
    for (let floor = 0; floor < totalFloors - 1; floor++) {
      const currentFloorRooms = rooms.filter(r => r.y === floor);
      const nextFloorRooms = rooms.filter(r => r.y === floor + 1);

      currentFloorRooms.forEach((currentRoom, currentIndex) => {
        // Each room connects to 1-3 rooms on the next floor
        const numConnections = this.getConnectionCount(floor, totalFloors);
        const connections = this.selectConnections(
          currentIndex,
          currentFloorRooms.length,
          nextFloorRooms.length,
          numConnections
        );

        connections.forEach(targetX => {
          const targetRoom = nextFloorRooms.find(r => r.x === targetX);
          if (targetRoom) {
            const targetIndex = rooms.indexOf(targetRoom);
            if (targetIndex !== -1 && !currentRoom.connections.includes(targetIndex)) {
              currentRoom.connections.push(targetIndex);
            }
          }
        });
      });

      // Ensure all next floor rooms are reachable
      this.ensureAllReachable(currentFloorRooms, nextFloorRooms, rooms);
    }
  }

  /**
   * Determine how many connections a room should have
   */
  private getConnectionCount(floor: number, totalFloors: number): number {
    // First floor: always 2+ paths
    if (floor === 0) return 2;

    // Near boss: funnel to single path
    if (floor === totalFloors - 2) return 1;

    // Normal floors: 1-2 connections
    return Math.random() < 0.6 ? 2 : 1;
  }

  /**
   * Select which rooms on next floor to connect to
   */
  private selectConnections(
    currentX: number,
    currentFloorSize: number,
    nextFloorSize: number,
    count: number
  ): number[] {
    const connections: number[] = [];

    // Prefer connecting to nearby rooms
    const nearbyRooms: number[] = [];

    // Calculate which rooms are "nearby" based on relative position
    const relativePos = currentFloorSize > 1 ? currentX / (currentFloorSize - 1) : 0.5;
    const targetPos = Math.floor(relativePos * (nextFloorSize - 1));

    // Add target and adjacent rooms as candidates
    for (let i = Math.max(0, targetPos - 1); i <= Math.min(nextFloorSize - 1, targetPos + 1); i++) {
      nearbyRooms.push(i);
    }

    // Shuffle and pick
    const shuffled = this.shuffleArray([...nearbyRooms]);
    for (let i = 0; i < Math.min(count, shuffled.length); i++) {
      connections.push(shuffled[i]);
    }

    // If we need more connections, add random ones
    while (connections.length < count && connections.length < nextFloorSize) {
      const random = Math.floor(Math.random() * nextFloorSize);
      if (!connections.includes(random)) {
        connections.push(random);
      }
    }

    return connections;
  }

  /**
   * Ensure all rooms on next floor are reachable
   */
  private ensureAllReachable(
    currentFloorRooms: Room[],
    nextFloorRooms: Room[],
    allRooms: Room[]
  ): void {
    nextFloorRooms.forEach(nextRoom => {
      const nextRoomIndex = allRooms.indexOf(nextRoom);

      // Check if this room is connected from any current floor room
      const isConnected = currentFloorRooms.some(currentRoom =>
        currentRoom.connections.includes(nextRoomIndex)
      );

      // If not connected, connect from a random current floor room
      if (!isConnected && currentFloorRooms.length > 0) {
        const randomCurrentRoom = currentFloorRooms[
          Math.floor(Math.random() * currentFloorRooms.length)
        ];
        randomCurrentRoom.connections.push(nextRoomIndex);
      }
    });
  }

  /**
   * Shuffle array (Fisher-Yates)
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}
