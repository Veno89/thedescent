import { EnemyIntent, EnemyMove } from '@/types';

/**
 * Enemy entity - manages enemy state and AI
 */
export class Enemy {
  public id: string;
  public name: string;
  public type: string; // 'normal', 'elite', or 'boss'
  public maxHp: number;
  public currentHp: number;
  public block: number = 0;

  // AI
  public intent: EnemyIntent;
  public moves: EnemyMove[];
  private moveHistory: string[] = [];
  private currentMove: EnemyMove | null = null;

  // Status effects
  public strength: number = 0;
  public weak: number = 0;
  public vulnerable: number = 0;
  public poison: number = 0;

  constructor(
    id: string,
    name: string,
    type: string,
    maxHp: number,
    moves: EnemyMove[]
  ) {
    this.id = id;
    this.name = name;
    this.type = type;
    this.maxHp = maxHp;
    this.currentHp = maxHp;
    this.moves = moves;
    this.intent = { type: 'UNKNOWN' };

    console.log(`Enemy created: ${name} (${type}) with ${maxHp} HP, isDead=${this.currentHp <= 0}`);

    // Determine first move
    this.rollMove();
  }

  /**
   * Take damage (after accounting for block and vulnerable)
   */
  takeDamage(amount: number): number {
    // Apply vulnerable (50% more damage)
    if (this.vulnerable > 0) {
      amount = Math.floor(amount * 1.5);
    }

    // Block absorbs damage
    const damageAfterBlock = Math.max(0, amount - this.block);
    this.block = Math.max(0, this.block - amount);
    this.currentHp = Math.max(0, this.currentHp - damageAfterBlock);

    return damageAfterBlock;
  }

  /**
   * Add block
   */
  addBlock(amount: number): void {
    this.block += Math.max(0, amount);
  }

  /**
   * Apply poison damage at start of turn
   */
  applyPoisonDamage(): number {
    if (this.poison > 0) {
      const damage = this.poison;
      this.currentHp = Math.max(0, this.currentHp - damage);
      this.poison = Math.max(0, this.poison - 1);
      return damage;
    }
    return 0;
  }

  /**
   * Roll next move based on move patterns
   */
  rollMove(): void {
    if (this.moves.length === 0) {
      console.warn(`Enemy ${this.name} has no moves!`);
      return;
    }

    // Calculate total weight
    const totalWeight = this.moves.reduce((sum, move) => sum + move.weight, 0);

    // Roll a random move
    let roll = Math.random() * totalWeight;
    let selectedMove = this.moves[0];

    for (const move of this.moves) {
      roll -= move.weight;
      if (roll <= 0) {
        selectedMove = move;
        break;
      }
    }

    // Prevent repeating the same move twice (if possible)
    if (
      this.moves.length > 1 &&
      this.moveHistory.length > 0 &&
      selectedMove.name === this.moveHistory[this.moveHistory.length - 1]
    ) {
      // Try to pick a different move
      const otherMoves = this.moves.filter(m => m.name !== selectedMove.name);
      if (otherMoves.length > 0) {
        const otherWeight = otherMoves.reduce((sum, m) => sum + m.weight, 0);
        roll = Math.random() * otherWeight;
        for (const move of otherMoves) {
          roll -= move.weight;
          if (roll <= 0) {
            selectedMove = move;
            break;
          }
        }
      }
    }

    this.currentMove = selectedMove;
    this.intent = selectedMove.intent;
    this.moveHistory.push(selectedMove.name);

    // Keep only last 3 moves in history
    if (this.moveHistory.length > 3) {
      this.moveHistory.shift();
    }
  }

  /**
   * Execute current move
   */
  executeMove(): EnemyMove | null {
    const move = this.currentMove;
    if (!move) return null;

    // Roll next move for the following turn
    this.rollMove();

    return move;
  }

  /**
   * Start of turn
   */
  startTurn(): void {
    this.block = 0; // Block doesn't carry over
    this.applyPoisonDamage();
  }

  /**
   * End of turn - tick down status effects
   */
  endTurn(): void {
    if (this.weak > 0) this.weak--;
    if (this.vulnerable > 0) this.vulnerable--;
  }

  /**
   * Check if enemy is dead
   */
  isDead(): boolean {
    return this.currentHp <= 0;
  }

  /**
   * Get current intent
   */
  getIntent(): EnemyIntent {
    return this.intent;
  }

  /**
   * Get intent display value (for damage numbers)
   */
  getIntentValue(): number {
    if (!this.intent.value) return 0;

    let value = this.intent.value;

    // Apply strength to attack intents
    if (this.intent.type === 'ATTACK') {
      value += this.strength;

      // Apply weak (25% less damage)
      if (this.weak > 0) {
        value = Math.floor(value * 0.75);
      }
    }

    return Math.max(0, value);
  }

  /**
   * Apply status effect
   */
  applyVulnerable(stacks: number): void {
    this.vulnerable = Math.max(this.vulnerable, stacks);
  }

  applyWeak(stacks: number): void {
    this.weak = Math.max(this.weak, stacks);
  }

  applyPoison(stacks: number): void {
    this.poison += stacks;
  }

  applyStrength(stacks: number): void {
    this.strength += stacks;
  }
}
