import { Card, Deck, UserSettings, UserStats } from './types';
import { LEXICON_CARDS, LEXICON_DECKS } from './data/lexicon';
import { getTodayResetTimestamp } from './db/database';

const DB_NAME = 'MuninnDB';
const DB_VERSION = 1;

export const DEFAULT_DECKS: Deck[] = LEXICON_DECKS;
export const INITIAL_CARDS: Card[] = LEXICON_CARDS;

export const DEFAULT_USER_SETTINGS: UserSettings = {
  dailyNewCards: 20,
  dailyReviewLimit: 100,
  speechRate: 1.0,
  autoPlayAudio: true,
  dayResetHour: 4, // Default 04:00 AM reset
  bonusExtraCards: 15,
};

export const INITIAL_USER_STATS: UserStats = {
  streak: 7,
  lastStudyDate: new Date().toISOString().split('T')[0],
  totalReviews: 142,
  retentionRate: 92.4,
  history: {
    [new Date(Date.now() - 86400000 * 1).toISOString().split('T')[0]]: 12,
    [new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0]]: 18,
    [new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0]]: 15,
    [new Date(Date.now() - 86400000 * 4).toISOString().split('T')[0]]: 22,
    [new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0]]: 9,
    [new Date(Date.now() - 86400000 * 6).toISOString().split('T')[0]]: 14,
    [new Date(Date.now() - 86400000 * 7).toISOString().split('T')[0]]: 20,
  },
};

class IndexedDBStorage {
  private dbPromise: Promise<IDBDatabase>;

  constructor() {
    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        return reject('IndexedDB is not supported');
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('cards')) {
          const cardStore = db.createObjectStore('cards', { keyPath: 'id' });
          cardStore.createIndex('frequencyRank', 'frequencyRank', { unique: false });
        }
        if (!db.objectStoreNames.contains('decks')) {
          db.createObjectStore('decks', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('user_stats')) {
          db.createObjectStore('user_stats', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('user_settings')) {
          db.createObjectStore('user_settings', { keyPath: 'id' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  public async getCards(): Promise<Card[]> {
    try {
      const db = await this.dbPromise;
      return new Promise((resolve) => {
        const tx = db.transaction('cards', 'readonly');
        const store = tx.objectStore('cards');
        const req = store.getAll();
        req.onsuccess = () => {
          if (req.result && req.result.length > 0) {
            const sorted = (req.result as Card[]).sort((a, b) => a.frequencyRank - b.frequencyRank);
            resolve(sorted);
          } else {
            // Seed initial cards
            this.seedData().then(() => resolve(INITIAL_CARDS));
          }
        };
        req.onerror = () => resolve(INITIAL_CARDS);
      });
    } catch {
      return INITIAL_CARDS;
    }
  }

  public async getNewCards(
    deckIdOrOptions?: string | { deckId?: string; limit?: number; bonusSession?: boolean },
    limitParam?: number,
    bonusSessionParam?: boolean
  ): Promise<Card[]> {
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

    const cards = await this.getCards();
    const settings = await this.getUserSettings();
    const todayReset = getTodayResetTimestamp(settings.dayResetHour ?? 4);

    const allUnseenCards = cards
      .filter((c) => c.state === 0 && (!c.lastReview || c.lastReview < todayReset))
      .sort((a, b) => a.frequencyRank - b.frequencyRank);

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
        let resultCards = deckUnseenCards;
        if (limit !== undefined && limit > 0) {
          return resultCards.slice(0, limit);
        }
        const cap = settings.dailyNewCards;
        return resultCards.slice(0, cap);
      }
    }

    if (limit !== undefined && limit > 0) {
      return allUnseenCards.slice(0, limit);
    }

    if (bonusSession) {
      return allUnseenCards;
    }

    const cap = settings.dailyNewCards;
    return allUnseenCards.slice(0, cap);
  }

  public async getUnseenCards(deckId?: string): Promise<Card[]> {
    const cards = await this.getCards();
    let unseen = cards.filter((c) => c.state === 0).sort((a, b) => a.frequencyRank - b.frequencyRank);
    if (deckId) {
      unseen = unseen.filter((c) => c.deckId === deckId);
    }
    return unseen;
  }

  public async getLearningCards(deckId?: string): Promise<Card[]> {
    const cards = await this.getCards();
    let learning = cards.filter((c) => c.state === 1 || c.state === 3);
    if (deckId) {
      learning = learning.filter((c) => c.deckId === deckId);
    }
    return learning;
  }

  public async getReviewCards(deckId?: string): Promise<Card[]> {
    const cards = await this.getCards();
    let review = cards.filter((c) => c.state === 2);
    if (deckId) {
      review = review.filter((c) => c.deckId === deckId);
    }
    return review;
  }

  public async saveCard(card: Card): Promise<void> {
    try {
      const db = await this.dbPromise;
      const tx = db.transaction('cards', 'readwrite');
      tx.objectStore('cards').put(card);
    } catch (e) {
      console.warn('Failed to save card to IndexedDB:', e);
    }
  }

  public async getUserStats(): Promise<UserStats> {
    try {
      const db = await this.dbPromise;
      return new Promise((resolve) => {
        const tx = db.transaction('user_stats', 'readonly');
        const req = tx.objectStore('user_stats').get('main');
        req.onsuccess = () => {
          resolve(req.result ? req.result.stats : INITIAL_USER_STATS);
        };
        req.onerror = () => resolve(INITIAL_USER_STATS);
      });
    } catch {
      return INITIAL_USER_STATS;
    }
  }

  public async saveUserStats(stats: UserStats): Promise<void> {
    try {
      const db = await this.dbPromise;
      const tx = db.transaction('user_stats', 'readwrite');
      tx.objectStore('user_stats').put({ id: 'main', stats });
    } catch (e) {
      console.warn('Failed to save user stats:', e);
    }
  }

  public async getUserSettings(): Promise<UserSettings> {
    try {
      const db = await this.dbPromise;
      return new Promise((resolve) => {
        const tx = db.transaction('user_settings', 'readonly');
        const req = tx.objectStore('user_settings').get('main');
        req.onsuccess = () => {
          resolve(req.result ? req.result.settings : DEFAULT_USER_SETTINGS);
        };
        req.onerror = () => resolve(DEFAULT_USER_SETTINGS);
      });
    } catch {
      return DEFAULT_USER_SETTINGS;
    }
  }

  public async saveUserSettings(settings: UserSettings): Promise<void> {
    try {
      const db = await this.dbPromise;
      const tx = db.transaction('user_settings', 'readwrite');
      tx.objectStore('user_settings').put({ id: 'main', settings });
    } catch (e) {
      console.warn('Failed to save user settings:', e);
    }
  }

  public async resetProgress(): Promise<void> {
    try {
      const cards = await this.getCards();
      for (const card of cards) {
        await this.saveCard({
          ...card,
          state: 0,
          due: Date.now(),
          stability: 0,
          difficulty: 0,
          elapsedDays: 0,
          scheduledDays: 0,
          reps: 0,
          lapses: 0,
          lastReview: undefined,
        });
      }
    } catch (e) {
      console.warn('Failed to reset progress in IndexedDB:', e);
    }
  }

  public async getWordsLearned(): Promise<number> {
    const cards = await this.getCards();
    return cards.filter((c) => c.state > 0).length;
  }

  private async seedData(): Promise<void> {
    try {
      const db = await this.dbPromise;
      const tx = db.transaction(['cards', 'decks', 'user_stats', 'user_settings'], 'readwrite');
      const cardStore = tx.objectStore('cards');
      const deckStore = tx.objectStore('decks');
      const statsStore = tx.objectStore('user_stats');
      const settingsStore = tx.objectStore('user_settings');

      INITIAL_CARDS.forEach((c) => cardStore.put(c));
      DEFAULT_DECKS.forEach((d) => deckStore.put(d));
      statsStore.put({ id: 'main', stats: INITIAL_USER_STATS });
      settingsStore.put({ id: 'main', settings: DEFAULT_USER_SETTINGS });
    } catch (e) {
      console.warn('Error seeding data:', e);
    }
  }
}

export const dbStorage = new IndexedDBStorage();

