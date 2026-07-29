import { describe, it, expect, beforeEach } from 'vitest';
import { Card, UserSettings } from '../types';
import { getTodayResetTimestamp, getNewCards, clearDatabase, seedDatabase, db } from '../db/database';
import { LEXICON_CARDS } from '../data/lexicon';

describe('SRS Queue Logic & Daily Limits', () => {
  const defaultSettings: UserSettings = {
    dailyNewCards: 15,
    dailyReviewLimit: 100,
    speechRate: 1.0,
    autoPlayAudio: true,
    dayResetHour: 4,
  };

  beforeEach(async () => {
    await clearDatabase();
  });

  function calculateDailyQueue(cards: Card[], selectedDeckId: string, settings: UserSettings) {
    const todayReset = getTodayResetTimestamp(settings.dayResetHour ?? 4);
    const currentDeckCards = cards.filter((c) => c.deckId === selectedDeckId);

    const newCardsStudiedToday = cards.filter(
      (c) => c.state > 0 && c.lastReview !== undefined && c.lastReview >= todayReset
    ).length;
    const remainingNewToday = Math.max(0, settings.dailyNewCards - newCardsStudiedToday);

    const dueNewCards = currentDeckCards
      .filter((c) => c.state === 0 && (!c.lastReview || c.lastReview < todayReset))
      .sort((a, b) => a.frequencyRank - b.frequencyRank)
      .slice(0, remainingNewToday);

    const dueReviews = currentDeckCards.filter((c) => c.state === 2 && c.due <= Date.now());
    const dueLearning = currentDeckCards.filter((c) => c.state === 1 || c.state === 3);

    const dueQueue = [...dueLearning, ...dueReviews, ...dueNewCards];
    const totalDueToday = dueNewCards.length + dueLearning.length + dueReviews.length;

    return {
      dueQueue,
      totalDueToday,
      newCardsStudiedToday,
      remainingNewToday,
      dueNewCards,
      dueReviews,
      dueLearning,
    };
  }

  function calculateBonusQueue(cards: Card[], selectedDeckId: string, settings: UserSettings) {
    const todayReset = getTodayResetTimestamp(settings.dayResetHour ?? 4);
    const currentDeckCards = cards.filter((c) => c.deckId === selectedDeckId);

    const deckUnseenCards = currentDeckCards
      .filter((c) => c.state === 0 && (!c.lastReview || c.lastReview < todayReset))
      .sort((a, b) => a.frequencyRank - b.frequencyRank);

    let bonusQueue: Card[] = [];
    if (deckUnseenCards.length >= 15) {
      bonusQueue = deckUnseenCards.slice(0, 15);
    } else {
      const masterUnseenCards = cards
        .filter((c) => c.state === 0 && (!c.lastReview || c.lastReview < todayReset))
        .sort((a, b) => a.frequencyRank - b.frequencyRank);
      const deckCardIds = new Set(deckUnseenCards.map((c) => c.id));
      const masterFallbackCards = masterUnseenCards
        .filter((c) => !deckCardIds.has(c.id))
        .slice(0, 15 - deckUnseenCards.length);
      bonusQueue = [...deckUnseenCards, ...masterFallbackCards];
    }

    return bonusQueue;
  }

  it('calculates daily study queue correctly and locks out when totalDueToday === 0', () => {
    const mockCards: Card[] = LEXICON_CARDS.map((c) => ({ ...c }));
    const deckId = mockCards[0].deckId;

    // Initial state: 0 cards studied today, 15 due new cards
    const session1 = calculateDailyQueue(mockCards, deckId, defaultSettings);
    expect(session1.newCardsStudiedToday).toBe(0);
    expect(session1.remainingNewToday).toBe(15);
    expect(session1.dueQueue.length).toBe(15);
    expect(session1.totalDueToday).toBe(15);

    // Simulate studying all 15 new cards today
    const now = Date.now();
    session1.dueQueue.forEach((card) => {
      const target = mockCards.find((c) => c.id === card.id);
      if (target) {
        target.state = 2; // Review
        target.lastReview = now;
        target.due = now + 86400000 * 3; // Due in 3 days
      }
    });

    // Subsequent session calculation on the same day
    const session2 = calculateDailyQueue(mockCards, deckId, defaultSettings);
    expect(session2.newCardsStudiedToday).toBe(15);
    expect(session2.remainingNewToday).toBe(0);
    expect(session2.dueNewCards.length).toBe(0);
    expect(session2.dueReviews.length).toBe(0);
    expect(session2.dueLearning.length).toBe(0);
    expect(session2.dueQueue.length).toBe(0);
    expect(session2.totalDueToday).toBe(0);
  });

  it('generates distinct, non-overlapping batches of 15 fresh unseen cards for bonus study sessions', () => {
    const mockCards: Card[] = LEXICON_CARDS.map((c) => ({ ...c }));
    const deckId = mockCards[0].deckId;
    const now = Date.now();

    // Bonus session 1
    const batch1 = calculateBonusQueue(mockCards, deckId, defaultSettings);
    expect(batch1.length).toBe(15);

    // Mark batch 1 cards as reviewed today
    batch1.forEach((card) => {
      const target = mockCards.find((c) => c.id === card.id);
      if (target) {
        target.state = 2;
        target.lastReview = now;
      }
    });

    // Bonus session 2
    const batch2 = calculateBonusQueue(mockCards, deckId, defaultSettings);
    expect(batch2.length).toBe(15);

    // Verify batch 1 and batch 2 are completely non-overlapping
    const batch1Ids = new Set(batch1.map((c) => c.id));
    const batch2Overlap = batch2.filter((c) => batch1Ids.has(c.id));
    expect(batch2Overlap.length).toBe(0);

    // Mark batch 2 cards as reviewed today
    batch2.forEach((card) => {
      const target = mockCards.find((c) => c.id === card.id);
      if (target) {
        target.state = 2;
        target.lastReview = now;
      }
    });

    // Bonus session 3
    const batch3 = calculateBonusQueue(mockCards, deckId, defaultSettings);
    expect(batch3.length).toBe(15);

    // Verify batch 3 has no overlap with batch 1 or batch 2
    const batch2Ids = new Set(batch2.map((c) => c.id));
    const batch3Overlap1 = batch3.filter((c) => batch1Ids.has(c.id));
    const batch3Overlap2 = batch3.filter((c) => batch2Ids.has(c.id));
    expect(batch3Overlap1.length).toBe(0);
    expect(batch3Overlap2.length).toBe(0);
  });

  it('updates state transitions and lastReview to exclude cards reviewed today from getNewCards', async () => {
    await seedDatabase();

    const initialNewCards = await getNewCards({ bonusSession: true, limit: 15 });
    expect(initialNewCards.length).toBe(15);

    const now = Date.now();
    // Update cards in db to reviewed today
    for (const card of initialNewCards) {
      await db.cards.update(card.id, {
        state: 2,
        lastReview: now,
        due: now + 86400000,
      });
    }

    const nextNewCards = await getNewCards({ bonusSession: true, limit: 15 });
    expect(nextNewCards.length).toBe(15);

    const initialIds = new Set(initialNewCards.map((c) => c.id));
    const intersection = nextNewCards.filter((c) => initialIds.has(c.id));
    expect(intersection.length).toBe(0);
  });

  it('falls back to master lexicon when selected deck has fewer than 15 unseen cards', () => {
    const deck1Id = 'deck-a1-core';
    // Create scenario where deck1 has only 5 unseen cards
    const mockCards: Card[] = LEXICON_CARDS.map((c, index) => {
      if (c.deckId === deck1Id && index >= 5) {
        return { ...c, state: 2, lastReview: Date.now() };
      }
      return { ...c };
    });

    const bonusQueue = calculateBonusQueue(mockCards, deck1Id, defaultSettings);
    expect(bonusQueue.length).toBe(15);

    const deck1CardsInQueue = bonusQueue.filter((c) => c.deckId === deck1Id);
    expect(deck1CardsInQueue.length).toBe(5);

    const fallbackCardsInQueue = bonusQueue.filter((c) => c.deckId !== deck1Id);
    expect(fallbackCardsInQueue.length).toBe(10);
  });
});
