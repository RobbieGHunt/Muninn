import Dexie, { Table } from 'dexie';
import { Card, Deck, ReviewLog, UserSettings } from '../types';
import { LEXICON_CARDS, LEXICON_DECKS } from '../data/lexicon';

export const DEFAULT_USER_SETTINGS: UserSettings = {
  dailyNewCards: 20,
  dailyReviewLimit: 100,
  speechRate: 1.0,
  autoPlayAudio: true,
};

export class MuninnDatabase extends Dexie {
  decks!: Table<Deck, string>;
  cards!: Table<Card, string>;
  reviewLogs!: Table<ReviewLog, string>;
  settings!: Table<UserSettings & { id: string }, string>;

  constructor() {
    super('MuninnDatabase');
    this.version(1).stores({
      decks: 'id, title, createdAt',
      cards: 'id, deckId, state, due, createdAt, frequencyRank',
      reviewLogs: 'id, cardId, rating, reviewTimestamp',
      settings: 'id',
    });

    this.on('populate', async () => {
      await this.cards.bulkAdd(LEXICON_CARDS);
      if (LEXICON_DECKS && LEXICON_DECKS.length > 0) {
        await this.decks.bulkAdd(LEXICON_DECKS);
      }
    });
  }

  async resetProgress(): Promise<void> {
    await this.transaction('rw', [this.cards, this.reviewLogs], async () => {
      await this.reviewLogs.clear();
      const allCards = await this.cards.toArray();
      const resetCards = allCards.map((card) => ({
        ...card,
        state: 0 as const,
        due: Date.now(),
        stability: 0,
        difficulty: 0,
        elapsedDays: 0,
        scheduledDays: 0,
        reps: 0,
        lapses: 0,
        lastReview: undefined,
      }));
      await this.cards.bulkPut(resetCards);
    });
  }

  async getWordsLearned(): Promise<number> {
    return this.cards.where('state').above(0).count();
  }

  async getUserSettings(): Promise<UserSettings> {
    const record = await this.settings.get('main');
    if (!record) return { ...DEFAULT_USER_SETTINGS };
    return {
      dailyNewCards: record.dailyNewCards ?? DEFAULT_USER_SETTINGS.dailyNewCards,
      dailyReviewLimit: record.dailyReviewLimit ?? DEFAULT_USER_SETTINGS.dailyReviewLimit,
      speechRate: record.speechRate ?? DEFAULT_USER_SETTINGS.speechRate,
      autoPlayAudio: record.autoPlayAudio ?? DEFAULT_USER_SETTINGS.autoPlayAudio,
    };
  }

  async saveUserSettings(userSettings: UserSettings): Promise<void> {
    await this.settings.put({ id: 'main', ...userSettings });
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
 * Resets all card states back to state 0 (New) and clears review logs.
 */
export async function resetProgress(): Promise<void> {
  await seedDatabase();
  await db.resetProgress();
}

/**
 * Returns total count of cards where state > 0 (words learned/in learning).
 */
export async function getWordsLearned(): Promise<number> {
  await seedDatabase();
  return db.getWordsLearned();
}

/**
 * Gets saved user settings or default settings if none saved yet.
 */
export async function getUserSettings(): Promise<UserSettings> {
  return db.getUserSettings();
}

/**
 * Saves user settings.
 */
export async function saveUserSettings(settings: UserSettings): Promise<void> {
  return db.saveUserSettings(settings);
}

/**
 * Fetches unseen cards (state === 0) drawn strictly in order of frequencyRank ASC (most common words first).
 * Capped at dailyNewCards limit unless bonusSession is true.
 * When bonusSession is true and a deckId is specified, draws up to 15 fresh unseen cards from the specified deck,
 * falling back to the master lexicon pool across all decks/tiers (ordered by frequencyRank ASC)
 * if the selected deck has fewer than 15 unseen cards.
 */
export async function getNewCards(
  deckIdOrOptions?: string | { deckId?: string; limit?: number; bonusSession?: boolean },
  limitParam?: number,
  bonusSessionParam?: boolean
): Promise<Card[]> {
  await seedDatabase();

  let deckId: string | undefined;
  let limit: number | undefined;
  let bonusSession: boolean | undefined;

  if (typeof deckIdOrOptions === 'object' && deckIdOrOptions !== null) {
    deckId = deckIdOrOptions.deckId;
    limit = deckIdOrOptions.limit;
    bonusSession = deckIdOrOptions.bonusSession;
  } else {
    deckId = deckIdOrOptions;
    limit = limitParam;
    bonusSession = bonusSessionParam;
  }

  let collection = db.cards.where('state').equals(0);
  let allUnseenCards = await collection.sortBy('frequencyRank');

  if (deckId) {
    const deckUnseenCards = allUnseenCards.filter((c) => c.deckId === deckId);
    if (bonusSession) {
      const targetLimit = limit ?? 15;
      if (deckUnseenCards.length >= targetLimit) {
        return deckUnseenCards.slice(0, targetLimit);
      } else {
        const remainingCount = targetLimit - deckUnseenCards.length;
        const deckCardIds = new Set(deckUnseenCards.map((c) => c.id));
        const masterFallbackCards = allUnseenCards
          .filter((c) => !deckCardIds.has(c.id))
          .slice(0, remainingCount);
        return [...deckUnseenCards, ...masterFallbackCards];
      }
    } else {
      let cards = deckUnseenCards;
      if (limit !== undefined && limit > 0) {
        return cards.slice(0, limit);
      }
      const settings = await getUserSettings();
      const cap = settings.dailyNewCards;
      return cards.slice(0, cap);
    }
  }

  if (limit !== undefined && limit > 0) {
    return allUnseenCards.slice(0, limit);
  }

  if (bonusSession) {
    return allUnseenCards;
  }

  const settings = await getUserSettings();
  const cap = settings.dailyNewCards;
  return allUnseenCards.slice(0, cap);
}

/**
 * Fetches Unseen Pool cards (state === 0), ordered strictly by frequencyRank ASC.
 */
export async function getUnseenCards(deckId?: string): Promise<Card[]> {
  await seedDatabase();
  let collection = db.cards.where('state').equals(0);
  let cards = await collection.sortBy('frequencyRank');
  if (deckId) {
    cards = cards.filter((c) => c.deckId === deckId);
  }
  return cards;
}

/**
 * Fetches Learning / Relearning Pool cards (state === 1 | 3).
 */
export async function getLearningCards(deckId?: string): Promise<Card[]> {
  await seedDatabase();
  let cards = await db.cards.filter((c) => c.state === 1 || c.state === 3).toArray();
  if (deckId) {
    cards = cards.filter((c) => c.deckId === deckId);
  }
  return cards;
}

/**
 * Fetches Review Pool cards (state === 2).
 */
export async function getReviewCards(deckId?: string): Promise<Card[]> {
  await seedDatabase();
  let cards = await db.cards.where('state').equals(2).toArray();
  if (deckId) {
    cards = cards.filter((c) => c.deckId === deckId);
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
  await db.transaction('rw', [db.decks, db.cards, db.reviewLogs, db.settings], async () => {
    await db.decks.clear();
    await db.cards.clear();
    await db.reviewLogs.clear();
    await db.settings.clear();
  });
}

