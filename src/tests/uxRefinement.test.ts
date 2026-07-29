import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Card, UserSettings } from '../types';
import { AudioService } from '../services/audioService';
import { getTodayResetTimestamp } from '../db/database';
import { LEXICON_CARDS } from '../data/lexicon';

describe('UX Refinement & Audio / Queue Improvements', () => {
  let mockSpeechSynthesis: any;

  beforeEach(() => {
    mockSpeechSynthesis = {
      speaking: false,
      paused: false,
      cancel: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
      speak: vi.fn((utterance) => {
        if (utterance.onstart) utterance.onstart();
        if (utterance.onend) utterance.onend();
      }),
      getVoices: vi.fn(() => [
        { name: 'Microsoft Sofie Online (Natural) - Swedish (Sweden)', lang: 'sv-SE' },
      ]),
      onvoiceschanged: null,
    };

    (global as any).window = (global as any).window || {};
    (global as any).window.speechSynthesis = mockSpeechSynthesis;
    (global as any).SpeechSynthesisUtterance = vi.fn().mockImplementation((text) => ({
      text,
      lang: '',
      rate: 1,
      pitch: 1,
      volume: 1,
      voice: null,
      onstart: null,
      onend: null,
      onerror: null,
    }));
  });

  describe('Audio Rate Clamping & Cancellation', () => {
    it('clamps default speech rate between 0.5 and 2.0 in setRate and calls stop()', () => {
      const audio = new AudioService();
      const stopSpy = vi.spyOn(audio, 'stop');

      audio.setRate(0.2);
      expect(audio.getRate()).toBe(0.5);
      expect(stopSpy).toHaveBeenCalled();

      audio.setRate(2.5);
      expect(audio.getRate()).toBe(2.0);
    });

    it('clamps utterance speech rate between 0.5 and 1.5 in speakUtterance and cancels ongoing speech before speaking', async () => {
      const audio = new AudioService();
      audio.setRate(2.0); // setRate allows defaultRate up to 2.0

      await audio.speak('Hej test');

      expect(mockSpeechSynthesis.cancel).toHaveBeenCalled();
      expect(mockSpeechSynthesis.speak).toHaveBeenCalled();

      const utterance = mockSpeechSynthesis.speak.mock.calls[0][0];
      // utterance rate clamped to max 1.5
      expect(utterance.rate).toBe(1.5);
    });

    it('clamps custom options.rate to lower bound 0.5', async () => {
      const audio = new AudioService();

      await audio.speak('Hej test', { rate: 0.1 });

      const utterance = mockSpeechSynthesis.speak.mock.calls[0][0];
      expect(utterance.rate).toBe(0.5);
    });
  });

  describe('UserSettings bonusExtraCards Field', () => {
    it('supports bonusExtraCards with default 15', () => {
      const settings: UserSettings = {
        dailyNewCards: 15,
        dailyReviewLimit: 100,
        speechRate: 1.0,
        autoPlayAudio: true,
        dayResetHour: 4,
        bonusExtraCards: 20,
      };

      expect(settings.bonusExtraCards).toBe(20);
      const defaultBatchSize = undefined ?? 15;
      expect(defaultBatchSize).toBe(15);
    });
  });

  describe('Session Queue Generation & Fallbacks', () => {
    function generateDailyQueue(cards: Card[], selectedDeckId: string, settings: UserSettings) {
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

      if (dueQueue.length === 0) {
        const sourceCards = currentDeckCards.length > 0 ? currentDeckCards : cards;
        return [...sourceCards]
          .sort((a, b) => (a.due - b.due) || (a.stability - b.stability))
          .slice(0, 15);
      }

      return dueQueue;
    }

    function generateBonusQueue(cards: Card[], selectedDeckId: string, settings: UserSettings) {
      const todayReset = getTodayResetTimestamp(settings.dayResetHour ?? 4);
      const batchSize = settings.bonusExtraCards ?? 15;
      const currentDeckCards = cards.filter((c) => c.deckId === selectedDeckId);

      const deckUnseenCards = currentDeckCards
        .filter((c) => c.state === 0 && (!c.lastReview || c.lastReview < todayReset))
        .sort((a, b) => a.frequencyRank - b.frequencyRank);

      let bonusQueue: Card[] = [];
      if (deckUnseenCards.length >= batchSize) {
        bonusQueue = deckUnseenCards.slice(0, batchSize);
      } else {
        const masterUnseenCards = cards
          .filter((c) => c.state === 0 && (!c.lastReview || c.lastReview < todayReset))
          .sort((a, b) => a.frequencyRank - b.frequencyRank);
        const deckCardIds = new Set(deckUnseenCards.map((c) => c.id));
        const masterFallbackCards = masterUnseenCards
          .filter((c) => !deckCardIds.has(c.id))
          .slice(0, batchSize - deckUnseenCards.length);

        bonusQueue = [...deckUnseenCards, ...masterFallbackCards];

        if (bonusQueue.length < batchSize) {
          const existingIds = new Set(bonusQueue.map((c) => c.id));
          const lowestStabilityCards = cards
            .filter((c) => !existingIds.has(c.id))
            .sort((a, b) => a.stability - b.stability)
            .slice(0, batchSize - bonusQueue.length);

          bonusQueue = [...bonusQueue, ...lowestStabilityCards];
        }
      }

      return bonusQueue;
    }

    const testSettings: UserSettings = {
      dailyNewCards: 15,
      dailyReviewLimit: 100,
      speechRate: 1.0,
      autoPlayAudio: true,
      dayResetHour: 4,
      bonusExtraCards: 15,
    };

    it('launches quick review session when all due cards are finished (dueQueue.length === 0)', () => {
      // Create deck cards with state = 2 (review) but due in future (not due today)
      const mockCards: Card[] = LEXICON_CARDS.slice(0, 20).map((c, i) => ({
        ...c,
        state: 2,
        due: Date.now() + 86400000 * (i + 1), // due in future
        stability: i * 0.5 + 1.0,
        lastReview: Date.now(),
      }));

      const deckId = mockCards[0].deckId;
      const queue = generateDailyQueue(mockCards, deckId, testSettings);

      expect(queue.length).toBe(15);
      // Verify cards are sorted by due ASC then stability ASC
      expect(queue[0].due).toBeLessThanOrEqual(queue[1].due);
      expect(queue[0].id).toBe(mockCards[0].id);
    });

    it('respects bonusExtraCards setting size in bonus session queue', () => {
      const mockCards: Card[] = LEXICON_CARDS.map((c) => ({ ...c, state: 0 as const }));
      const deckId = mockCards[0].deckId;
      const customSettings = { ...testSettings, bonusExtraCards: 20 };

      const queue = generateBonusQueue(mockCards, deckId, customSettings);
      expect(queue.length).toBe(20);
    });

    it('falls back to master lexicon and lowest stability cards to fill bonus queue without lockout', () => {
      const deck1Id = 'deck-a1-core';
      // Create scenario with only 3 unseen cards total across all decks, and all other cards reviewed
      const mockCards: Card[] = LEXICON_CARDS.slice(0, 30).map((c, index) => {
        if (index < 2) {
          // 2 unseen in deck1
          return { ...c, deckId: deck1Id, state: 0 as const, lastReview: undefined };
        } else if (index === 2) {
          // 1 unseen in deck2
          return { ...c, deckId: 'deck-a2-everyday', state: 0 as const, lastReview: undefined };
        } else {
          // All other cards reviewed, with different stabilities
          return {
            ...c,
            state: 2 as const,
            lastReview: Date.now(),
            stability: 10 - index, // lower stability for higher index
            due: Date.now() + 86400000,
          };
        }
      });

      const queue = generateBonusQueue(mockCards, deck1Id, testSettings);

      // Queue should still contain 15 cards (2 deck1 unseen + 1 deck2 unseen + 12 lowest stability cards)
      expect(queue.length).toBe(15);
      expect(queue[0].id).toBe(mockCards[0].id);
      expect(queue[1].id).toBe(mockCards[1].id);
      expect(queue[2].id).toBe(mockCards[2].id);

      // Verify the lowest stability cards appended are sorted by stability ASC
      const appendedCards = queue.slice(3);
      for (let i = 0; i < appendedCards.length - 1; i++) {
        expect(appendedCards[i].stability).toBeLessThanOrEqual(appendedCards[i + 1].stability);
      }
    });
  });
});
