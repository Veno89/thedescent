/**
 * Card Pile Manager
 * 
 * Manages the draw pile, hand, discard pile, and exhaust pile.
 * Handles drawing, discarding, exhausting, and shuffling operations.
 */

import { Card } from '@/types';
import { COMBAT } from '@/config/gameConstants';

/**
 * Callbacks for pile events.
 */
export interface CardPileCallbacks {
  onCardDrawn?: (card: Card) => void;
  onCardDiscarded?: (card: Card) => void;
  onCardExhausted?: (card: Card) => void;
  onShuffle?: () => void;
}

/**
 * CardPileManager handles all card pile operations.
 */
export class CardPileManager {
  // Card piles
  public drawPile: Card[] = [];
  public hand: Card[] = [];
  public discardPile: Card[] = [];
  public exhaustPile: Card[] = [];

  // Configuration
  private readonly handSize: number;
  private readonly maxHandSize: number;

  // Callbacks
  private callbacks: CardPileCallbacks = {};

  // Tracking
  private shuffleCount: number = 0;

  constructor(
    handSize: number = COMBAT.DEFAULT_HAND_SIZE,
    maxHandSize: number = COMBAT.MAX_HAND_SIZE
  ) {
    this.handSize = handSize;
    this.maxHandSize = maxHandSize;
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  /**
   * Initialize piles from a deck.
   * Separates innate cards and shuffles the rest.
   */
  initializeFromDeck(deck: Card[]): void {
    this.hand = [];
    this.discardPile = [];
    this.exhaustPile = [];
    this.shuffleCount = 0;

    // Separate innate cards from regular cards
    const innateCards: Card[] = [];
    const regularCards: Card[] = [];

    deck.forEach((card) => {
      if (card.innate) {
        innateCards.push({ ...card });
      } else {
        regularCards.push({ ...card });
      }
    });

    // Shuffle regular cards into draw pile
    this.drawPile = this.shuffleArray(regularCards);

    // Innate cards go directly to hand
    innateCards.forEach((card) => {
      if (this.hand.length < this.maxHandSize) {
        this.hand.push(card);
        this.callbacks.onCardDrawn?.(card);
      }
    });
  }

  /**
   * Set callbacks for pile events.
   */
  setCallbacks(callbacks: CardPileCallbacks): void {
    this.callbacks = callbacks;
  }

  /**
   * Reset all piles.
   */
  reset(): void {
    this.drawPile = [];
    this.hand = [];
    this.discardPile = [];
    this.exhaustPile = [];
    this.shuffleCount = 0;
  }

  // ============================================================================
  // DRAWING
  // ============================================================================

  /**
   * Draw cards from draw pile to hand.
   * 
   * @param count - Number of cards to draw
   * @returns Array of cards drawn
   */
  drawCards(count: number): Card[] {
    const drawnCards: Card[] = [];

    for (let i = 0; i < count; i++) {
      if (this.hand.length >= this.maxHandSize) {
        console.log('Hand is full!');
        break;
      }

      // Shuffle discard if draw pile is empty
      if (this.drawPile.length === 0) {
        if (this.discardPile.length === 0) {
          console.log('No cards left to draw!');
          break;
        }
        this.shuffleDiscardIntoDraw();
      }

      const card = this.drawPile.pop();
      if (card) {
        this.hand.push(card);
        drawnCards.push(card);
        this.callbacks.onCardDrawn?.(card);
      }
    }

    return drawnCards;
  }

  /**
   * Draw a specific card from draw pile.
   * Used for effects that draw specific cards.
   */
  drawSpecificCard(cardId: string): Card | null {
    const index = this.drawPile.findIndex((c) => c.id === cardId);
    if (index === -1) return null;

    const [card] = this.drawPile.splice(index, 1);
    
    if (this.hand.length < this.maxHandSize) {
      this.hand.push(card);
      this.callbacks.onCardDrawn?.(card);
      return card;
    }

    // Hand full, put card back
    this.drawPile.splice(index, 0, card);
    return null;
  }

  /**
   * Draw cards until hand has N cards.
   */
  drawToHandSize(targetSize: number = this.handSize): Card[] {
    const cardsToDraw = Math.max(0, targetSize - this.hand.length);
    return this.drawCards(cardsToDraw);
  }

  // ============================================================================
  // DISCARDING
  // ============================================================================

  /**
   * Discard a card from hand.
   * 
   * @param card - Card to discard (must be in hand)
   * @returns True if card was discarded
   */
  discardCard(card: Card): boolean {
    const index = this.hand.indexOf(card);
    if (index === -1) return false;

    this.hand.splice(index, 1);
    this.discardPile.push(card);
    this.callbacks.onCardDiscarded?.(card);

    return true;
  }

  /**
   * Discard a card from hand by index.
   */
  discardCardAtIndex(index: number): Card | null {
    if (index < 0 || index >= this.hand.length) return null;

    const [card] = this.hand.splice(index, 1);
    this.discardPile.push(card);
    this.callbacks.onCardDiscarded?.(card);

    return card;
  }

  /**
   * Discard a random card from hand.
   */
  discardRandomCard(): Card | null {
    if (this.hand.length === 0) return null;

    const index = Math.floor(Math.random() * this.hand.length);
    return this.discardCardAtIndex(index);
  }

  /**
   * Discard entire hand.
   */
  discardHand(): Card[] {
    const discarded = [...this.hand];
    
    discarded.forEach((card) => {
      // Check for retain keyword
      if (!card.retain) {
        this.discardPile.push(card);
        this.callbacks.onCardDiscarded?.(card);
      }
    });

    // Keep only retained cards
    this.hand = this.hand.filter((card) => card.retain);

    return discarded.filter((card) => !card.retain);
  }

  // ============================================================================
  // EXHAUSTING
  // ============================================================================

  /**
   * Exhaust a card (remove from play permanently for this combat).
   * 
   * @param card - Card to exhaust
   * @param fromHand - Whether to remove from hand first
   * @returns True if card was exhausted
   */
  exhaustCard(card: Card, fromHand: boolean = false): boolean {
    if (fromHand) {
      const index = this.hand.indexOf(card);
      if (index === -1) return false;
      this.hand.splice(index, 1);
    }

    this.exhaustPile.push(card);
    this.callbacks.onCardExhausted?.(card);

    return true;
  }

  /**
   * Exhaust a random card from hand.
   */
  exhaustRandomCard(): Card | null {
    if (this.hand.length === 0) return null;

    const index = Math.floor(Math.random() * this.hand.length);
    const [card] = this.hand.splice(index, 1);
    this.exhaustPile.push(card);
    this.callbacks.onCardExhausted?.(card);

    return card;
  }

  // ============================================================================
  // ADDING CARDS
  // ============================================================================

  /**
   * Add a card to hand.
   * 
   * @param card - Card to add
   * @returns True if card was added
   */
  addToHand(card: Card): boolean {
    if (this.hand.length >= this.maxHandSize) {
      console.log('Hand is full, cannot add card');
      return false;
    }

    this.hand.push(card);
    this.callbacks.onCardDrawn?.(card);
    return true;
  }

  /**
   * Add a card to discard pile.
   */
  addToDiscard(card: Card): void {
    this.discardPile.push(card);
  }

  /**
   * Add a card to draw pile.
   * 
   * @param card - Card to add
   * @param position - Where to add: 'top', 'bottom', or 'random'
   */
  addToDrawPile(card: Card, position: 'top' | 'bottom' | 'random' = 'random'): void {
    switch (position) {
      case 'top':
        this.drawPile.push(card);
        break;
      case 'bottom':
        this.drawPile.unshift(card);
        break;
      case 'random':
      default:
        const index = Math.floor(Math.random() * (this.drawPile.length + 1));
        this.drawPile.splice(index, 0, card);
        break;
    }
  }

  // ============================================================================
  // SHUFFLING
  // ============================================================================

  /**
   * Shuffle discard pile into draw pile.
   */
  shuffleDiscardIntoDraw(): void {
    console.log('Shuffling discard pile into draw pile');
    this.drawPile = this.shuffleArray(this.discardPile);
    this.discardPile = [];
    this.shuffleCount++;
    this.callbacks.onShuffle?.();
  }

  /**
   * Shuffle the draw pile in place.
   */
  shuffleDrawPile(): void {
    this.drawPile = this.shuffleArray(this.drawPile);
    this.shuffleCount++;
    this.callbacks.onShuffle?.();
  }

  /**
   * Fisher-Yates shuffle.
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // ============================================================================
  // SEARCHING & FILTERING
  // ============================================================================

  /**
   * Find cards in hand by type.
   */
  getCardsInHandByType(type: string): Card[] {
    return this.hand.filter((card) => card.type === type);
  }

  /**
   * Find a card in hand by ID.
   */
  getCardInHand(cardId: string): Card | undefined {
    return this.hand.find((card) => card.id === cardId);
  }

  /**
   * Check if hand contains a card.
   */
  handContains(card: Card): boolean {
    return this.hand.includes(card);
  }

  /**
   * Get index of card in hand.
   */
  getCardIndexInHand(card: Card): number {
    return this.hand.indexOf(card);
  }

  // ============================================================================
  // SCRY
  // ============================================================================

  /**
   * Look at top N cards of draw pile.
   * 
   * @param count - Number of cards to look at
   * @returns Cards at top of draw pile (last elements)
   */
  peekDrawPile(count: number): Card[] {
    const startIndex = Math.max(0, this.drawPile.length - count);
    return this.drawPile.slice(startIndex);
  }

  /**
   * Scry: Look at top N cards and choose which to discard.
   * Returns the cards that were kept on top.
   * 
   * @param count - Number of cards to scry
   * @param discardIndices - Indices (relative to scried cards) to discard
   */
  scry(count: number, discardIndices: number[]): Card[] {
    const scriedCards = this.peekDrawPile(count);
    
    // Remove scried cards from draw pile
    this.drawPile = this.drawPile.slice(0, -scriedCards.length);

    // Separate into keep and discard
    const kept: Card[] = [];
    scriedCards.forEach((card, index) => {
      if (discardIndices.includes(index)) {
        this.discardPile.push(card);
      } else {
        kept.push(card);
      }
    });

    // Put kept cards back on top
    this.drawPile.push(...kept);

    return kept;
  }

  // ============================================================================
  // GETTERS
  // ============================================================================

  /**
   * Get pile sizes.
   */
  getPileSizes(): { draw: number; hand: number; discard: number; exhaust: number } {
    return {
      draw: this.drawPile.length,
      hand: this.hand.length,
      discard: this.discardPile.length,
      exhaust: this.exhaustPile.length,
    };
  }

  /**
   * Get total cards in play (not exhausted).
   */
  getTotalCardsInPlay(): number {
    return this.drawPile.length + this.hand.length + this.discardPile.length;
  }

  /**
   * Get number of shuffles this combat.
   */
  getShuffleCount(): number {
    return this.shuffleCount;
  }

  /**
   * Check if hand is full.
   */
  isHandFull(): boolean {
    return this.hand.length >= this.maxHandSize;
  }

  /**
   * Check if hand is empty.
   */
  isHandEmpty(): boolean {
    return this.hand.length === 0;
  }

  /**
   * Get hand size limit.
   */
  getMaxHandSize(): number {
    return this.maxHandSize;
  }

  /**
   * Get default draw amount.
   */
  getDefaultHandSize(): number {
    return this.handSize;
  }
}
