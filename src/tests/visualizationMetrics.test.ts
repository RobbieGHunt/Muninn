import { describe, it, expect } from 'vitest';
import {
  getGlacierTier,
  getGlacierTierKey,
  calculateGlacierDistribution,
  calculateHighestLearnedRank,
  calculateComprehensionPercentage,
  calculateCardsComprehensionPercentage,
  GLACIER_TIERS,
} from '../services/visualizationMetrics';
import { Card } from '../types';
import { LEXICON_CARDS } from '../data/lexicon';

describe('Visualization & Motivational Metrics', () => {
  describe('1. FSRS Memory Stability Glacier Tier Classification', () => {
    it('classifies Transient (Färsk) tier when stability S < 3 days', () => {
      expect(getGlacierTierKey(0)).toBe('transient');
      expect(getGlacierTierKey(0.5)).toBe('transient');
      expect(getGlacierTierKey(2.99)).toBe('transient');

      const tierInfo = getGlacierTier(1.5);
      expect(tierInfo.nameSv).toBe('Färsk');
      expect(tierInfo.nameEn).toBe('Transient');
    });

    it('classifies Anchored (Förankrad) tier when 3 <= S < 21 days', () => {
      expect(getGlacierTierKey(3.0)).toBe('anchored');
      expect(getGlacierTierKey(10.5)).toBe('anchored');
      expect(getGlacierTierKey(20.99)).toBe('anchored');

      const tierInfo = getGlacierTier(14.0);
      expect(tierInfo.nameSv).toBe('Förankrad');
      expect(tierInfo.nameEn).toBe('Anchored');
    });

    it('classifies Deep Memory (Djupminne) tier when 21 <= S < 90 days', () => {
      expect(getGlacierTierKey(21.0)).toBe('deepMemory');
      expect(getGlacierTierKey(50.0)).toBe('deepMemory');
      expect(getGlacierTierKey(89.99)).toBe('deepMemory');

      const tierInfo = getGlacierTier(60.0);
      expect(tierInfo.nameSv).toBe('Djupminne');
      expect(tierInfo.nameEn).toBe('Deep Memory');
    });

    it('classifies Unshakeable (Orubblig) tier when S >= 90 days', () => {
      expect(getGlacierTierKey(90.0)).toBe('unshakeable');
      expect(getGlacierTierKey(180.0)).toBe('unshakeable');
      expect(getGlacierTierKey(365.0)).toBe('unshakeable');

      const tierInfo = getGlacierTier(100.0);
      expect(tierInfo.nameSv).toBe('Orubblig');
      expect(tierInfo.nameEn).toBe('Unshakeable');
    });

    it('correctly calculates Glacier tier distribution across cards', () => {
      const mockCards: Card[] = [
        // New card (state = 0) -> should be ignored in distribution
        { id: 'c1', deckId: 'd1', front: 'a', back: 'a', wordClass: 'substantiv', frequencyRank: 1, cefrLevel: 'A1', state: 0, due: 0, stability: 0.5, difficulty: 1, elapsedDays: 0, scheduledDays: 0, reps: 0, lapses: 0 },
        // Learned cards (state > 0)
        { id: 'c2', deckId: 'd1', front: 'b', back: 'b', wordClass: 'substantiv', frequencyRank: 2, cefrLevel: 'A1', state: 1, due: 0, stability: 1.2, difficulty: 1, elapsedDays: 0, scheduledDays: 0, reps: 1, lapses: 0 }, // transient (S=1.2)
        { id: 'c3', deckId: 'd1', front: 'c', back: 'c', wordClass: 'substantiv', frequencyRank: 3, cefrLevel: 'A1', state: 2, due: 0, stability: 5.0, difficulty: 1, elapsedDays: 0, scheduledDays: 0, reps: 2, lapses: 0 }, // anchored (S=5.0)
        { id: 'c4', deckId: 'd1', front: 'd', back: 'd', wordClass: 'substantiv', frequencyRank: 4, cefrLevel: 'A1', state: 2, due: 0, stability: 30.0, difficulty: 1, elapsedDays: 0, scheduledDays: 0, reps: 3, lapses: 0 }, // deepMemory (S=30.0)
        { id: 'c5', deckId: 'd1', front: 'e', back: 'e', wordClass: 'substantiv', frequencyRank: 5, cefrLevel: 'A1', state: 2, due: 0, stability: 120.0, difficulty: 1, elapsedDays: 0, scheduledDays: 0, reps: 4, lapses: 0 }, // unshakeable (S=120.0)
        { id: 'c6', deckId: 'd1', front: 'f', back: 'f', wordClass: 'substantiv', frequencyRank: 6, cefrLevel: 'A1', state: 3, due: 0, stability: 2.5, difficulty: 1, elapsedDays: 0, scheduledDays: 0, reps: 2, lapses: 1 }, // transient (S=2.5)
      ];

      const dist = calculateGlacierDistribution(mockCards);
      expect(dist.totalLearned).toBe(5);
      expect(dist.transient).toBe(2);
      expect(dist.anchored).toBe(1);
      expect(dist.deepMemory).toBe(1);
      expect(dist.unshakeable).toBe(1);
    });
  });

  describe('2. Highest Frequency Rank ("You Are Here") Calculation', () => {
    it('returns 0 when cards array is empty', () => {
      expect(calculateHighestLearnedRank([])).toBe(0);
    });

    it('returns 0 when all cards are in New state (state === 0)', () => {
      const newCards: Card[] = [
        { id: 'c1', deckId: 'd1', front: 'a', back: 'a', wordClass: 'substantiv', frequencyRank: 10, cefrLevel: 'A1', state: 0, due: 0, stability: 0, difficulty: 0, elapsedDays: 0, scheduledDays: 0, reps: 0, lapses: 0 },
        { id: 'c2', deckId: 'd1', front: 'b', back: 'b', wordClass: 'substantiv', frequencyRank: 500, cefrLevel: 'A2', state: 0, due: 0, stability: 0, difficulty: 0, elapsedDays: 0, scheduledDays: 0, reps: 0, lapses: 0 },
      ];
      expect(calculateHighestLearnedRank(newCards)).toBe(0);
    });

    it('calculates the maximum frequency rank strictly among learned cards (state > 0)', () => {
      const cards: Card[] = [
        // New card with rank 1000 -> should be ignored because state is 0
        { id: 'c1', deckId: 'd1', front: 'a', back: 'a', wordClass: 'substantiv', frequencyRank: 1000, cefrLevel: 'B2', state: 0, due: 0, stability: 0, difficulty: 0, elapsedDays: 0, scheduledDays: 0, reps: 0, lapses: 0 },
        // Learned card (state 1 - Learning) with rank 45
        { id: 'c2', deckId: 'd1', front: 'b', back: 'b', wordClass: 'substantiv', frequencyRank: 45, cefrLevel: 'A1', state: 1, due: 0, stability: 1, difficulty: 1, elapsedDays: 0, scheduledDays: 0, reps: 1, lapses: 0 },
        // Learned card (state 2 - Review) with rank 250
        { id: 'c3', deckId: 'd1', front: 'c', back: 'c', wordClass: 'substantiv', frequencyRank: 250, cefrLevel: 'A2', state: 2, due: 0, stability: 5, difficulty: 1, elapsedDays: 0, scheduledDays: 0, reps: 2, lapses: 0 },
        // Learned card (state 3 - Relearning) with rank 120
        { id: 'c4', deckId: 'd1', front: 'd', back: 'd', wordClass: 'substantiv', frequencyRank: 120, cefrLevel: 'A1', state: 3, due: 0, stability: 2, difficulty: 1, elapsedDays: 0, scheduledDays: 0, reps: 2, lapses: 1 },
      ];

      expect(calculateHighestLearnedRank(cards)).toBe(250);
    });
  });

  describe('3. Real-World Comprehension Percentage Calculations', () => {
    it('calculates comprehension percentage correctly with explicit parameters', () => {
      expect(calculateComprehensionPercentage(0, 1000)).toBe(0);
      expect(calculateComprehensionPercentage(500, 1000)).toBe(50);
      expect(calculateComprehensionPercentage(1000, 1000)).toBe(100);
      expect(calculateComprehensionPercentage(250, 800)).toBe(31.25);
    });

    it('handles edge case when master total is zero or negative without throwing or producing NaN', () => {
      expect(calculateComprehensionPercentage(10, 0)).toBe(0);
      expect(calculateComprehensionPercentage(10, -5)).toBe(0);
    });

    it('defaults master total to full master lexicon length (LEXICON_CARDS.length)', () => {
      const learnedCount = 50;
      const expectedPercentage = Number(((50 / LEXICON_CARDS.length) * 100).toFixed(2));
      expect(calculateComprehensionPercentage(learnedCount)).toBe(expectedPercentage);
    });

    it('calculates comprehension percentage directly from card array', () => {
      const masterTotal = 200;
      const cards: Card[] = Array.from({ length: 50 }, (_, i) => ({
        id: `card-${i}`,
        deckId: 'd1',
        front: `word-${i}`,
        back: `trans-${i}`,
        wordClass: 'substantiv',
        frequencyRank: i + 1,
        cefrLevel: 'A1',
        // First 30 cards are learned (state > 0), remaining 20 are New (state = 0)
        state: i < 30 ? (2 as const) : (0 as const),
        due: 0,
        stability: i < 30 ? 5 : 0,
        difficulty: i < 30 ? 2 : 0,
        elapsedDays: 0,
        scheduledDays: 0,
        reps: i < 30 ? 1 : 0,
        lapses: 0,
      }));

      // 30 learned cards out of 200 master total = 15.0%
      const percentage = calculateCardsComprehensionPercentage(cards, masterTotal);
      expect(percentage).toBe(15);
    });
  });
});
