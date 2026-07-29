import Dexie, { Table } from 'dexie';
import { Card, Deck, ReviewLog } from '../types';

export class MuninnDatabase extends Dexie {
  decks!: Table<Deck, number>;
  cards!: Table<Card, number>;
  reviewLogs!: Table<ReviewLog, number>;

  constructor() {
    super('MuninnDatabase');
    this.version(1).stores({
      decks: '++id, title, createdAt',
      cards: '++id, deckId, state, due, createdAt',
      reviewLogs: '++id, cardId, rating, review',
    });
  }
}

export const db = new MuninnDatabase();

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
