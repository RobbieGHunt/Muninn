import { describe, it, expect } from 'vitest';
import { Card } from '../types';
import { LEXICON_CARDS } from '../data/lexicon';

describe('Sequential New Words Queue Logic', () => {
  // Helper to simulate fetching the next batch of unseen cards
  function getNextUnseenBatch(allCards: Card[], userCards: Card[], batchSize: number = 10, todayReset: number = 0): Card[] {
    const userCardMap = new Map<string, Card>();
    userCards.forEach((c) => userCardMap.set(c.id, c));

    // Combine master catalog with user state overrides
    const combinedCards = allCards.map((c) => {
      const override = userCardMap.get(c.id);
      return override ? { ...c, ...override } : c;
    });

    // Strictly filter for unseen cards (state === 0 AND not reviewed today)
    const unseenCards = combinedCards
      .filter((c) => c.state === 0 && (!c.lastReview || c.lastReview < todayReset))
      .sort((a, b) => a.frequencyRank - b.frequencyRank);

    return unseenCards.slice(0, batchSize);
  }

  it('returns the first 10 unseen cards sorted by frequency rank on initial session', () => {
    const userCards: Card[] = [];
    const batch1 = getNextUnseenBatch(LEXICON_CARDS, userCards, 10, 1000);

    expect(batch1.length).toBe(10);
    expect(batch1[0].frequencyRank).toBe(1);
    expect(batch1[9].frequencyRank).toBe(10);
  });

  it('returns the next 10 unseen cards (Ranks 11-20) after rating the first 10 cards', () => {
    const now = 2000;
    const todayReset = 1000;

    // Simulate user having studied the first 10 cards today
    const userCards: Card[] = LEXICON_CARDS.slice(0, 10).map((c) => ({
      ...c,
      state: 2, // Marked as learned/review
      lastReview: now,
      reps: 1,
    }));

    const batch2 = getNextUnseenBatch(LEXICON_CARDS, userCards, 10, todayReset);

    expect(batch2.length).toBe(10);
    // Should NOT contain any card from batch 1
    const batch1Ids = new Set(userCards.map((c) => c.id));
    batch2.forEach((card) => {
      expect(batch1Ids.has(card.id)).toBe(false);
    });

    // Should be Ranks 11 through 20
    expect(batch2[0].frequencyRank).toBe(11);
    expect(batch2[9].frequencyRank).toBe(20);
  });

  it('returns Ranks 21-30 on third consecutive session without overlap', () => {
    const now = 2000;
    const todayReset = 1000;

    // Simulate user having studied the first 20 cards today
    const userCards: Card[] = LEXICON_CARDS.slice(0, 20).map((c) => ({
      ...c,
      state: 2,
      lastReview: now,
      reps: 1,
    }));

    const batch3 = getNextUnseenBatch(LEXICON_CARDS, userCards, 10, todayReset);

    expect(batch3.length).toBe(10);
    const studiedIds = new Set(userCards.map((c) => c.id));
    batch3.forEach((card) => {
      expect(studiedIds.has(card.id)).toBe(false);
    });

    expect(batch3[0].frequencyRank).toBe(21);
    expect(batch3[9].frequencyRank).toBe(30);
  });
});
