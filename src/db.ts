import { Card, Deck, UserStats } from './types';

const DB_NAME = 'MuninnDB';
const DB_VERSION = 1;

export const DEFAULT_DECKS: Deck[] = [
  {
    id: 'deck-a1-grund',
    title: 'Svenska A1/A2 Grundord',
    description: 'Nödvändiga substantiv, verb och vardagliga uttryck för nybörjare.',
    cefrLevel: 'A1',
    icon: '🇸🇪',
    createdAt: Date.now(),
    totalCards: 8
  },
  {
    id: 'deck-vardagsfraser',
    title: 'Vardagsfraser & Uttryck',
    description: 'Praktiska svenska fraser för konversation och resor.',
    cefrLevel: 'A2',
    icon: '☕',
    createdAt: Date.now(),
    totalCards: 4
  }
];

export const INITIAL_CARDS: Card[] = [
  {
    id: 'card-1',
    deckId: 'deck-a1-grund',
    front: 'en hund',
    back: 'a dog',
    ipa: '/eːn ˈhɵnd/',
    gender: 'en',
    wordClass: 'substantiv',
    exampleSv: 'En hund springer glatt i parken.',
    exampleEn: 'A dog runs happily in the park.',
    inflections: ['en hund', 'hunden', 'hundar', 'hundarna'],
    state: 0,
    due: Date.now(),
    stability: 0,
    difficulty: 0,
    elapsedDays: 0,
    scheduledDays: 0,
    reps: 0,
    lapses: 0
  },
  {
    id: 'card-2',
    deckId: 'deck-a1-grund',
    front: 'ett hus',
    back: 'a house',
    ipa: '/ɛt ˈhʉːs/',
    gender: 'ett',
    wordClass: 'substantiv',
    exampleSv: 'Vi bor i ett stort rött hus i Stockholm.',
    exampleEn: 'We live in a big red house in Stockholm.',
    inflections: ['ett hus', 'huset', 'hus', 'husen'],
    state: 0,
    due: Date.now(),
    stability: 0,
    difficulty: 0,
    elapsedDays: 0,
    scheduledDays: 0,
    reps: 0,
    lapses: 0
  },
  {
    id: 'card-3',
    deckId: 'deck-a1-grund',
    front: 'att prata',
    back: 'to speak / talk',
    ipa: '/at ˈpɾɑːta/',
    gender: 'none',
    wordClass: 'verb',
    exampleSv: 'Jag tycker om att prata svenska med mina vänner.',
    exampleEn: 'I like speaking Swedish with my friends.',
    inflections: ['pratar', 'pratade', 'pratat'],
    state: 0,
    due: Date.now(),
    stability: 0,
    difficulty: 0,
    elapsedDays: 0,
    scheduledDays: 0,
    reps: 0,
    lapses: 0
  },
  {
    id: 'card-4',
    deckId: 'deck-a1-grund',
    front: 'en bok',
    back: 'a book',
    ipa: '/eːn ˈbuːk/',
    gender: 'en',
    wordClass: 'substantiv',
    exampleSv: 'Hon läser en spännande bok varje kväll.',
    exampleEn: 'She reads an exciting book every evening.',
    inflections: ['en bok', 'boken', 'böcker', 'böckerna'],
    state: 1,
    due: Date.now(),
    stability: 1.5,
    difficulty: 4.8,
    elapsedDays: 1,
    scheduledDays: 1,
    reps: 2,
    lapses: 0
  },
  {
    id: 'card-5',
    deckId: 'deck-a1-grund',
    front: 'ett äpple',
    back: 'an apple',
    ipa: '/ɛt ˈɛp.lɛ/',
    gender: 'ett',
    wordClass: 'substantiv',
    exampleSv: 'Barnet äter ett sött rött äpple.',
    exampleEn: 'The child is eating a sweet red apple.',
    inflections: ['ett äpple', 'äpplet', 'äpplen', 'äpplena'],
    state: 2,
    due: Date.now() - 3600000, // Due 1 hour ago
    stability: 4.2,
    difficulty: 3.5,
    elapsedDays: 4,
    scheduledDays: 4,
    reps: 5,
    lapses: 0
  },
  {
    id: 'card-6',
    deckId: 'deck-a1-grund',
    front: 'att läsa',
    back: 'to read',
    ipa: '/at ˈlɛːsa/',
    gender: 'none',
    wordClass: 'verb',
    exampleSv: 'Vi läser svenska tidningar varje morgon.',
    exampleEn: 'We read Swedish newspapers every morning.',
    inflections: ['läser', 'läste', 'läst'],
    state: 2,
    due: Date.now(),
    stability: 3.8,
    difficulty: 4.0,
    elapsedDays: 3,
    scheduledDays: 3,
    reps: 4,
    lapses: 0
  },
  {
    id: 'card-7',
    deckId: 'deck-a1-grund',
    front: 'en flicka',
    back: 'a girl',
    ipa: '/eːn ˈflɪk.a/',
    gender: 'en',
    wordClass: 'substantiv',
    exampleSv: 'En flicka cyklar till skolan.',
    exampleEn: 'A girl is riding a bike to school.',
    inflections: ['en flicka', 'flickan', 'flickor', 'flickorna'],
    state: 0,
    due: Date.now(),
    stability: 0,
    difficulty: 0,
    elapsedDays: 0,
    scheduledDays: 0,
    reps: 0,
    lapses: 0
  },
  {
    id: 'card-8',
    deckId: 'deck-a1-grund',
    front: 'ett barn',
    back: 'a child',
    ipa: '/ɛt ˈbɑːɳ/',
    gender: 'ett',
    wordClass: 'substantiv',
    exampleSv: 'Ett barn leker glatt i trädgården.',
    exampleEn: 'A child plays happily in the garden.',
    inflections: ['ett barn', 'barnet', 'barn', 'barnen'],
    state: 0,
    due: Date.now(),
    stability: 0,
    difficulty: 0,
    elapsedDays: 0,
    scheduledDays: 0,
    reps: 0,
    lapses: 0
  }
];

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
    [new Date(Date.now() - 86400000 * 7).toISOString().split('T')[0]]: 20
  }
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
          db.createObjectStore('cards', { keyPath: 'id' });
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
            resolve(req.result);
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
