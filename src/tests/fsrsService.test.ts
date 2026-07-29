import { describe, it, expect } from 'vitest';
import {
  calculateRetrievability,
  calculateNextInterval,
  calculateInitialDifficulty,
  calculateInitialStability,
  calculateNextDifficulty,
  calculateRecallStability,
  calculateForgetStability,
  createDefaultCard,
  scheduleCard,
  previewRatings,
  DEFAULT_FSRS_PARAMETERS,
} from '../services/fsrsService';
import { CardState, Rating } from '../types';

describe('FSRS-4.5 Scheduler Service', () => {
  it('calculates retrievability correctly', () => {
    expect(calculateRetrievability(0, 5)).toBe(1.0);
    expect(calculateRetrievability(0, 0)).toBe(0);
    // At t = 9 * S, R = (1 + 9S/9S)^-1 = 2^-1 = 0.5
    const rAt9S = calculateRetrievability(45, 5);
    expect(rAt9S).toBeCloseTo(0.5, 4);
  });

  it('calculates next interval for target retention', () => {
    // For 0.9 retention, I = 9 * S * (1/0.9 - 1) = 9 * S * (0.1111) = S
    const interval = calculateNextInterval(10, 0.9);
    expect(interval).toBe(10);
  });

  it('calculates initial difficulty and stability for ratings', () => {
    const dAgain = calculateInitialDifficulty(Rating.Again);
    const dHard = calculateInitialDifficulty(Rating.Hard);
    const dGood = calculateInitialDifficulty(Rating.Good);
    const dEasy = calculateInitialDifficulty(Rating.Easy);

    expect(dAgain).toBeGreaterThanOrEqual(1);
    expect(dEasy).toBeLessThan(dAgain); // Easy card has lower difficulty score

    const sAgain = calculateInitialStability(Rating.Again);
    const sEasy = calculateInitialStability(Rating.Easy);
    expect(sEasy).toBeGreaterThan(sAgain);
  });

  it('schedules a new card correctly', () => {
    const card = createDefaultCard(1, 'Ett hus', 'A house');
    expect(card.state).toBe(CardState.New);

    const now = new Date('2026-01-01T10:00:00Z');

    // Rating Good on New card
    const resultGood = scheduleCard(card, Rating.Good, now);
    expect(resultGood.card.state).toBe(CardState.Review);
    expect(resultGood.card.reps).toBe(1);
    expect(resultGood.card.stability).toBeGreaterThan(0);
    expect(resultGood.card.difficulty).toBeGreaterThan(0);
    expect(resultGood.reviewLog.rating).toBe(Rating.Good);

    // Rating Again on New card
    const resultAgain = scheduleCard(card, Rating.Again, now);
    expect(resultAgain.card.state).toBe(CardState.Learning);
    expect(resultAgain.card.lapses).toBe(1);
  });

  it('handles review card state transitions and stability updates', () => {
    const initialCard = createDefaultCard(1, 'En hund', 'A dog');
    const now = new Date('2026-01-01T10:00:00Z');
    const review1 = scheduleCard(initialCard, Rating.Good, now);

    const reviewDate = new Date('2026-01-05T10:00:00Z'); // 4 days later
    const review2Good = scheduleCard(review1.card, Rating.Good, reviewDate);

    expect(review2Good.card.state).toBe(CardState.Review);
    expect(review2Good.card.reps).toBe(2);
    expect(review2Good.card.stability).toBeGreaterThan(review1.card.stability);

    // Test lapse (Again rating on Review card)
    const review2Again = scheduleCard(review1.card, Rating.Again, reviewDate);
    expect(review2Again.card.state).toBe(CardState.Relearning);
    expect(review2Again.card.lapses).toBe(1);
    expect(review2Again.card.stability).toBeLessThanOrEqual(review1.card.stability);
  });

  it('previews rating options for all 4 ratings', () => {
    const card = createDefaultCard(1, 'Katt', 'Cat');
    const previews = previewRatings(card);

    expect(previews).toHaveLength(4);
    expect(previews[0].rating).toBe(Rating.Again);
    expect(previews[1].rating).toBe(Rating.Hard);
    expect(previews[2].rating).toBe(Rating.Good);
    expect(previews[3].rating).toBe(Rating.Easy);

    // Easy interval should be greater than Again interval
    expect(previews[3].intervalDays).toBeGreaterThan(previews[0].intervalDays);
  });
});
