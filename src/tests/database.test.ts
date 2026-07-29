import { describe, it, expect, beforeEach } from 'vitest';
import {
  db,
  seedDatabase,
  getNewCards,
  getUnseenCards,
  getLearningCards,
  getReviewCards,
  clearDatabase,
  getUserSettings,
  saveUserSettings,
  resetProgress,
  getWordsLearned,
  DEFAULT_USER_SETTINGS,
} from '../db/database';
import { LEXICON_CARDS } from '../data/lexicon';

describe('Muninn Database Schema & Lexicon Queue Selection', () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  it('instantiates Dexie database with correct name', () => {
    expect(db.name).toBe('MuninnDatabase');
  });

  it('defines required tables and frequencyRank index on cards', () => {
    expect(db.decks).toBeDefined();
    expect(db.cards).toBeDefined();
    expect(db.reviewLogs).toBeDefined();
    expect(db.settings).toBeDefined();
    expect(db.decks.name).toBe('decks');
    expect(db.cards.name).toBe('cards');
    expect(db.reviewLogs.name).toBe('reviewLogs');
    expect(db.settings.name).toBe('settings');

    const frequencyRankIndex = db.cards.schema.indexes.find((idx) => idx.name === 'frequencyRank');
    expect(frequencyRankIndex).toBeDefined();
  });

  it('seeds database with multi-tier lexicon from src/data/lexicon.ts', async () => {
    await seedDatabase();
    const count = await db.cards.count();
    expect(count).toBe(LEXICON_CARDS.length);
    expect(count).toBeGreaterThan(0);
  });

  it('fetches new cards strictly in order of frequencyRank ASC', async () => {
    await seedDatabase();
    const newCards = await getNewCards();
    expect(newCards.length).toBeGreaterThan(0);

    for (let i = 0; i < newCards.length - 1; i++) {
      expect(newCards[i].frequencyRank).toBeLessThanOrEqual(newCards[i + 1].frequencyRank);
    }
  });

  it('verifies all seed cards have valid frequencyRank and cefrLevel', async () => {
    await seedDatabase();
    const cards = await db.cards.toArray();
    const validLevels = new Set(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']);

    cards.forEach((card) => {
      expect(typeof card.frequencyRank).toBe('number');
      expect(card.frequencyRank).toBeGreaterThan(0);
      expect(validLevels.has(card.cefrLevel)).toBe(true);
    });
  });

  it('manages user settings correctly (getUserSettings & saveUserSettings)', async () => {
    const defaults = await getUserSettings();
    expect(defaults).toEqual(DEFAULT_USER_SETTINGS);

    const customSettings = {
      dailyNewCards: 15,
      dailyReviewLimit: 50,
      speechRate: 0.85,
      autoPlayAudio: false,
    };

    await saveUserSettings(customSettings);
    const retrieved = await getUserSettings();
    expect(retrieved).toEqual(customSettings);
  });

  it('tracks words learned (getWordsLearned returning count where state > 0)', async () => {
    await seedDatabase();
    expect(await getWordsLearned()).toBe(0);

    // Update 2 cards to learning/review state
    const cards = await db.cards.limit(2).toArray();
    cards[0].state = 1; // Learning
    cards[1].state = 2; // Review
    await db.cards.bulkPut(cards);

    expect(await getWordsLearned()).toBe(2);
  });

  it('resets progress back to state 0 (New) and clears review logs', async () => {
    await seedDatabase();

    // Mark cards as studied and add review log
    const cards = await db.cards.limit(3).toArray();
    cards.forEach((c) => {
      c.state = 2;
      c.reps = 5;
      c.stability = 4.5;
    });
    await db.cards.bulkPut(cards);

    await db.reviewLogs.add({
      id: 'log-1',
      cardId: cards[0].id,
      rating: 3,
      state: 2,
      due: Date.now(),
      stability: 4.5,
      difficulty: 3.2,
      elapsedDays: 1,
      lastElapsedDays: 0,
      scheduledDays: 4,
      reviewTimestamp: Date.now(),
    });

    expect(await getWordsLearned()).toBe(3);
    expect(await db.reviewLogs.count()).toBe(1);

    await resetProgress();

    expect(await getWordsLearned()).toBe(0);
    expect(await db.reviewLogs.count()).toBe(0);

    const resetCardsList = await db.cards.toArray();
    resetCardsList.forEach((card) => {
      expect(card.state).toBe(0);
      expect(card.reps).toBe(0);
      expect(card.stability).toBe(0);
    });
  });

  it('supports daily queue limits capped at dailyNewCards and bonusSession extra queue', async () => {
    await seedDatabase();
    await saveUserSettings({
      dailyNewCards: 5,
      dailyReviewLimit: 100,
      speechRate: 1.0,
      autoPlayAudio: true,
    });

    // Standard session caps at dailyNewCards = 5
    const standardQueue = await getNewCards();
    expect(standardQueue).toHaveLength(5);

    // Bonus session allows extra words beyond the daily cap
    const bonusQueue = await getNewCards(undefined, undefined, true);
    expect(bonusQueue.length).toBeGreaterThan(5);
    expect(bonusQueue.length).toBe(LEXICON_CARDS.length);
  });

  it('classifies cards correctly into unseen, learning, and review pools', async () => {
    await seedDatabase();
    const unseen = await getUnseenCards();
    expect(unseen.length).toBe(LEXICON_CARDS.length);

    // Transition 1 card to learning state (1) and 1 card to review state (2)
    const cards = await db.cards.limit(2).toArray();
    cards[0].state = 1;
    cards[1].state = 2;
    await db.cards.bulkPut(cards);

    const unseenAfter = await getUnseenCards();
    const learning = await getLearningCards();
    const review = await getReviewCards();

    expect(unseenAfter.length).toBe(LEXICON_CARDS.length - 2);
    expect(learning.length).toBe(1);
    expect(learning[0].id).toBe(cards[0].id);
    expect(review.length).toBe(1);
    expect(review[0].id).toBe(cards[1].id);
  });

  it('pulls fresh unseen cards from master pool when selected deck has 0 unseen cards', async () => {
    await seedDatabase();
    const deckA1Id = 'deck-a1-core';

    // Mark all cards in deck-a1-core as learned (state === 2)
    const deckA1Cards = await db.cards.where('deckId').equals(deckA1Id).toArray();
    deckA1Cards.forEach((c) => {
      c.state = 2;
    });
    await db.cards.bulkPut(deckA1Cards);

    // Verify deckA1 has 0 unseen cards
    const deckA1Unseen = await getUnseenCards(deckA1Id);
    expect(deckA1Unseen.length).toBe(0);

    // Call getNewCards for deck-a1-core in bonus session mode
    const bonusNewCards = await getNewCards(deckA1Id, 15, true);
    expect(bonusNewCards.length).toBe(15);
    bonusNewCards.forEach((card) => {
      expect(card.state).toBe(0);
    });

    // Ensure all returned bonus cards are ordered by frequencyRank ASC
    for (let i = 0; i < bonusNewCards.length - 1; i++) {
      expect(bonusNewCards[i].frequencyRank).toBeLessThanOrEqual(bonusNewCards[i + 1].frequencyRank);
    }
  });
});

