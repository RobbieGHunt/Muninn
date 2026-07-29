import { describe, it, expect } from 'vitest';
import { MASTER_LEXICON, LEXICON_CARDS, LEXICON_DECKS } from '../data/lexicon';

describe('6,000 Swedish Word Deck Expansion & Integrity', () => {
  it('contains exactly 6,000 frequency-ranked Swedish entries in MASTER_LEXICON', () => {
    expect(MASTER_LEXICON.length).toBe(6000);
  });

  it('converts MASTER_LEXICON into 6,000 FSRS-ready Card objects in LEXICON_CARDS', () => {
    expect(LEXICON_CARDS.length).toBe(6000);
  });

  it('spans frequency ranks continuously from 1 to 6000', () => {
    expect(LEXICON_CARDS[0].frequencyRank).toBe(1);
    expect(LEXICON_CARDS[LEXICON_CARDS.length - 1].frequencyRank).toBe(6000);

    // Verify ranks are strictly ordered
    for (let i = 0; i < LEXICON_CARDS.length - 1; i++) {
      expect(LEXICON_CARDS[i].frequencyRank).toBeLessThan(LEXICON_CARDS[i + 1].frequencyRank);
    }
  });

  it('categorizes entries across all 5 CEFR level decks', () => {
    const a1Count = LEXICON_CARDS.filter((c) => c.cefrLevel === 'A1').length;
    const a2Count = LEXICON_CARDS.filter((c) => c.cefrLevel === 'A2').length;
    const b1Count = LEXICON_CARDS.filter((c) => c.cefrLevel === 'B1').length;
    const b2Count = LEXICON_CARDS.filter((c) => c.cefrLevel === 'B2').length;
    const c1c2Count = LEXICON_CARDS.filter((c) => c.cefrLevel === 'C1' || c.cefrLevel === 'C2').length;

    expect(a1Count).toBeGreaterThan(0);
    expect(a2Count).toBeGreaterThan(0);
    expect(b1Count).toBeGreaterThan(0);
    expect(b2Count).toBeGreaterThan(0);
    expect(c1c2Count).toBeGreaterThan(0);
    expect(a1Count + a2Count + b1Count + b2Count + c1c2Count).toBe(6000);
  });

  it('populates mandatory card attributes for every card in the expanded deck', () => {
    LEXICON_CARDS.forEach((card) => {
      expect(card.id).toBeDefined();
      expect(card.front).toBeTruthy();
      expect(card.back).toBeTruthy();
      expect(card.wordClass).toBeTruthy();
      expect(card.frequencyRank).toBeGreaterThan(0);
      expect(card.state).toBe(0);
    });
  });

  it('updates deck definitions totalCards to sum to 6,000', () => {
    const sumDeckCards = LEXICON_DECKS.reduce((acc, d) => acc + d.totalCards, 0);
    expect(sumDeckCards).toBe(6000);
  });
});
