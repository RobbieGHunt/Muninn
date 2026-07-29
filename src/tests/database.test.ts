import { describe, it, expect, beforeEach } from 'vitest';
import { db, seedDatabase, getNewCards, clearDatabase } from '../db/database';
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
    expect(db.decks.name).toBe('decks');
    expect(db.cards.name).toBe('cards');
    expect(db.reviewLogs.name).toBe('reviewLogs');

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
});
