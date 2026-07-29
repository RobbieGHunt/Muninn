import { Card, Deck, UserStats } from './types';
import { LEXICON_CARDS, LEXICON_DECKS } from './data/lexicon';

const DB_NAME = 'MuninnDB';
const DB_VERSION = 1;

export const DEFAULT_DECKS: Deck[] = LEXICON_DECKS;
export const INITIAL_CARDS: Card[] = LEXICON_CARDS;

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

  public async getNewCards(deckId?: string): Promise<Card[]> {
    const cards = await this.getCards();
    const newCards = cards.filter((c) => c.state === 0);
    if (deckId) {
      return newCards.filter((c) => c.deckId === deckId).sort((a, b) => a.frequencyRank - b.frequencyRank);
    }
    return newCards.sort((a, b) => a.frequencyRank - b.frequencyRank);
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

  private async seedData(): Promise<void> {
    try {
      const db = await this.dbPromise;
      const tx = db.transaction(['cards', 'decks', 'user_stats'], 'readwrite');
      const cardStore = tx.objectStore('cards');
      const deckStore = tx.objectStore('decks');
      const statsStore = tx.objectStore('user_stats');

      INITIAL_CARDS.forEach((c) => cardStore.put(c));
      DEFAULT_DECKS.forEach((d) => deckStore.put(d));
      statsStore.put({ id: 'main', stats: INITIAL_USER_STATS });
    } catch (e) {
      console.warn('Error seeding data:', e);
    }
  }
}

export const dbStorage = new IndexedDBStorage();
