import Dexie, { Table } from 'dexie';
import { Card, Deck, ReviewLog } from '../types';
import { LEXICON_CARDS, LEXICON_DECKS } from '../data/lexicon';

export class MuninnDatabase extends Dexie {
  decks!: Table<Deck, string>;
  cards!: Table<Card, string>;
  reviewLogs!: Table<ReviewLog, string>;

  constructor() {
    super('MuninnDatabase');
    this.version(1).stores({
      decks: 'id, title, createdAt',
      cards: 'id, deckId, state, due, createdAt, frequencyRank',
      reviewLogs: 'id, cardId, rating, reviewTimestamp',
    });

    this.on('populate', async () => {
      await this.cards.bulkAdd(LEXICON_CARDS);
      if (LEXICON_DECKS && LEXICON_DECKS.length > 0) {
        await this.decks.bulkAdd(LEXICON_DECKS);
      }
    });
  }
}

export const db = new MuninnDatabase();

/**
 * Ensures initial database seed loads the multi-tier lexicon from src/data/lexicon.ts
 */
export async function seedDatabase(): Promise<void> {
  const count = await db.cards.count();
  if (count === 0) {
    await db.transaction('rw', [db.cards, db.decks], async () => {
      await db.cards.bulkPut(LEXICON_CARDS);
      if (LEXICON_DECKS && LEXICON_DECKS.length > 0) {
        await db.decks.bulkPut(LEXICON_DECKS);
      }
    });
  }
}

/**
 * Fetches new cards drawn strictly in order of frequencyRank ASC (most common words first).
 */
export async function getNewCards(deckId?: string, limit?: number): Promise<Card[]> {
  await seedDatabase();
  let collection = db.cards.where('state').equals(0);
  let cards = await collection.sortBy('frequencyRank');
  if (deckId) {
    cards = cards.filter((c) => c.deckId === deckId);
  }
  if (limit !== undefined && limit > 0) {
    cards = cards.slice(0, limit);
  }
  return cards;
}

/**
 * Fetches all cards ordered strictly by frequencyRank ASC.
 */
export async function getAllCardsOrdered(): Promise<Card[]> {
  await seedDatabase();
  return db.cards.orderBy('frequencyRank').toArray();
}

/**
 * Resets the database (for testing or debugging).
 */
export async function clearDatabase(): Promise<void> {
  await db.transaction('rw', [db.decks, db.cards, db.reviewLogs], async () => {
    await db.decks.clear();
    await db.cards.clear();
    await db.reviewLogs.clear();
  });
}
