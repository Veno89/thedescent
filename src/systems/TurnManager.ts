/**
 * Turn Manager
 * 
 * Manages turn flow, phases, and turn-based state.
 * Coordinates player and enemy turns.
 */

import { Player } from '@/entities/Player';
import { Enemy } from '@/entities/Enemy';

/**
 * Turn phases within a single turn.
 */
export enum TurnPhase {
  TURN_START = 'TURN_START',
  PLAYER_ACTION = 'PLAYER_ACTION',
  TURN_END = 'TURN_END',
  ENEMY_TURN = 'ENEMY_TURN',
}

/**
 * Callbacks for turn events.
 */
export interface TurnCallbacks {
  onTurnStart?: (turn: number) => void;
  onPlayerTurnStart?: (turn: number) => void;
  onPlayerTurnEnd?: () => void;
  onEnemyTurnStart?: () => void;
  onEnemyAction?: (enemy: Enemy, action: any) => void;
  onEnemyTurnEnd?: () => void;
  onTurnEnd?: (turn: number) => void;
}

/**
 * Turn state snapshot.
 */
export interface TurnState {
  turn: number;
  phase: TurnPhase;
  isPlayerTurn: boolean;
  cardsPlayedThisTurn: number;
  attacksPlayedThisTurn: number;
  skillsPlayedThisTurn: number;
}

/**
 * TurnManager handles turn flow and phases.
 */
export class TurnManager {
  // Turn state
  private turn: number = 0;
  private phase: TurnPhase = TurnPhase.TURN_START;
  private isPlayerTurn: boolean = true;

  // Per-turn tracking
  private cardsPlayedThisTurn: number = 0;
  private attacksPlayedThisTurn: number = 0;
  private skillsPlayedThisTurn: number = 0;

  // Per-combat tracking
  private cardsPlayedThisCombat: number = 0;
  private powersPlayedThisCombat: number = 0;
  private firstAttackThisCombat: boolean = true;

  // Callbacks
  private callbacks: TurnCallbacks = {};

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  /**
   * Reset for new combat.
   */
  reset(): void {
    this.turn = 0;
    this.phase = TurnPhase.TURN_START;
    this.isPlayerTurn = true;
    this.cardsPlayedThisTurn = 0;
    this.attacksPlayedThisTurn = 0;
    this.skillsPlayedThisTurn = 0;
    this.cardsPlayedThisCombat = 0;
    this.powersPlayedThisCombat = 0;
    this.firstAttackThisCombat = true;
  }

  /**
   * Set callbacks for turn events.
   */
  setCallbacks(callbacks: TurnCallbacks): void {
    this.callbacks = callbacks;
  }

  // ============================================================================
  // TURN FLOW
  // ============================================================================

  /**
   * Start a new turn.
   */
  startTurn(): void {
    this.turn++;
    this.phase = TurnPhase.TURN_START;
    this.isPlayerTurn = true;

    // Reset per-turn counters
    this.cardsPlayedThisTurn = 0;
    this.attacksPlayedThisTurn = 0;
    this.skillsPlayedThisTurn = 0;

    this.callbacks.onTurnStart?.(this.turn);
    
    // Move to player action phase
    this.phase = TurnPhase.PLAYER_ACTION;
    this.callbacks.onPlayerTurnStart?.(this.turn);
  }

  /**
   * End the player's turn.
   */
  endPlayerTurn(): void {
    if (!this.isPlayerTurn) return;

    this.phase = TurnPhase.TURN_END;
    this.callbacks.onPlayerTurnEnd?.();

    // Switch to enemy turn
    this.isPlayerTurn = false;
    this.phase = TurnPhase.ENEMY_TURN;
    this.callbacks.onEnemyTurnStart?.();
  }

  /**
   * End the enemy turn and start next player turn.
   */
  endEnemyTurn(): void {
    this.callbacks.onEnemyTurnEnd?.();
    this.callbacks.onTurnEnd?.(this.turn);

    // Start next turn
    this.startTurn();
  }

  /**
   * Execute enemy turn logic.
   * Returns the actions to execute (caller handles actual execution).
   */
  getEnemyActions(enemies: Enemy[]): Array<{ enemy: Enemy; move: any }> {
    const actions: Array<{ enemy: Enemy; move: any }> = [];

    enemies.forEach((enemy) => {
      if (enemy.isDead()) return;

      enemy.startTurn();
      const move = enemy.executeMove();

      if (move) {
        actions.push({ enemy, move });
        this.callbacks.onEnemyAction?.(enemy, move);
      }

      enemy.endTurn();
    });

    return actions;
  }

  // ============================================================================
  // CARD TRACKING
  // ============================================================================

  /**
   * Record that a card was played.
   * 
   * @param cardType - Type of card played (ATTACK, SKILL, POWER)
   * @returns Object with trigger flags
   */
  recordCardPlayed(cardType: string): {
    isFirstAttack: boolean;
    cardsPlayedThisTurn: number;
    cardsPlayedThisCombat: number;
  } {
    this.cardsPlayedThisTurn++;
    this.cardsPlayedThisCombat++;

    let isFirstAttack = false;

    switch (cardType) {
      case 'ATTACK':
        this.attacksPlayedThisTurn++;
        if (this.firstAttackThisCombat) {
          isFirstAttack = true;
          this.firstAttackThisCombat = false;
        }
        break;
      case 'SKILL':
        this.skillsPlayedThisTurn++;
        break;
      case 'POWER':
        this.powersPlayedThisCombat++;
        break;
    }

    return {
      isFirstAttack,
      cardsPlayedThisTurn: this.cardsPlayedThisTurn,
      cardsPlayedThisCombat: this.cardsPlayedThisCombat,
    };
  }

  // ============================================================================
  // GETTERS
  // ============================================================================

  /**
   * Get current turn number.
   */
  getTurn(): number {
    return this.turn;
  }

  /**
   * Get current phase.
   */
  getPhase(): TurnPhase {
    return this.phase;
  }

  /**
   * Check if it's the player's turn.
   */
  getIsPlayerTurn(): boolean {
    return this.isPlayerTurn;
  }

  /**
   * Check if this is the first turn.
   */
  isFirstTurn(): boolean {
    return this.turn === 1;
  }

  /**
   * Get current turn state snapshot.
   */
  getState(): TurnState {
    return {
      turn: this.turn,
      phase: this.phase,
      isPlayerTurn: this.isPlayerTurn,
      cardsPlayedThisTurn: this.cardsPlayedThisTurn,
      attacksPlayedThisTurn: this.attacksPlayedThisTurn,
      skillsPlayedThisTurn: this.skillsPlayedThisTurn,
    };
  }

  /**
   * Get cards played this turn.
   */
  getCardsPlayedThisTurn(): number {
    return this.cardsPlayedThisTurn;
  }

  /**
   * Get attacks played this turn.
   */
  getAttacksPlayedThisTurn(): number {
    return this.attacksPlayedThisTurn;
  }

  /**
   * Get skills played this turn.
   */
  getSkillsPlayedThisTurn(): number {
    return this.skillsPlayedThisTurn;
  }

  /**
   * Get cards played this combat.
   */
  getCardsPlayedThisCombat(): number {
    return this.cardsPlayedThisCombat;
  }

  /**
   * Get powers played this combat.
   */
  getPowersPlayedThisCombat(): number {
    return this.powersPlayedThisCombat;
  }

  /**
   * Check if first attack has been played.
   */
  hasFirstAttackBeenPlayed(): boolean {
    return !this.firstAttackThisCombat;
  }
}
