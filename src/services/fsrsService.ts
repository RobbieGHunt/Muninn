import {
  Card,
  CardSchedulingResult,
  CardState,
  FSRSParameters,
  Rating,
  RatingPreview,
  ReviewLog,
  UserSettings,
} from '../types';
import { getTodayResetTimestamp } from '../db/database';
import { LEXICON_CARDS } from '../data/lexicon';

export const DEFAULT_FSRS_PARAMETERS: FSRSParameters = {
  requestRetention: 0.9,
  maximumInterval: 36500,
  w: [
    0.4025, 1.1838, 3.173, 15.691, // w0..w3: Initial stabilities S_0(1..4)
    7.1949,                        // w4: Initial difficulty base D_0(3) offset
    0.5345,                        // w5: Initial difficulty scale exponent
    1.4604,                        // w6: Difficulty change scale multiplier
    0.0046,                        // w7: Mean reversion weight for difficulty
    1.5457,                        // w8: Recall stability increase base factor
    0.1192,                        // w9: Recall stability decay w.r.t difficulty
    1.0192,                        // w10: Recall stability decay w.r.t stability
    1.9395,                        // w11: Recall stability exponent w.r.t (1-R)
    0.11,                          // w12: Forget stability base factor
    0.296,                         // w13: Forget stability power w.r.t difficulty
    2.2698,                        // w14: Forget stability power w.r.t (S+1)
    0.2315,                        // w15: Forget stability exponent w.r.t (1-R)
    1.9395,                        // w16: Hard penalty factor
    0.51,                          // w17: Easy bonus factor
    0.653,                         // w18: Post-lapse stability exponent factor
  ],
};

/**
 * Calculates retrievability R(t, S) using the FSRS-4.5 formula:
 * R(t, S) = (1 + t / (9 * S))^-1
 */
export function calculateRetrievability(elapsedDays: number, stability: number): number {
  if (stability <= 0) return 0;
  if (elapsedDays <= 0) return 1.0;
  return Math.pow(1 + elapsedDays / (9 * stability), -1);
}

/**
 * Calculates scheduled interval I in days for a target retrievability R_des:
 * I(R_des, S) = 9 * S * (R_des^-1 - 1)
 */
export function calculateNextInterval(
  stability: number,
  requestRetention: number = DEFAULT_FSRS_PARAMETERS.requestRetention,
  maximumInterval: number = DEFAULT_FSRS_PARAMETERS.maximumInterval
): number {
  if (stability <= 0) return 1;
  const interval = 9 * stability * (Math.pow(requestRetention, -1) - 1);
  const rounded = Math.round(interval);
  return Math.min(maximumInterval, Math.max(1, rounded));
}

/**
 * Calculates initial difficulty D_0(G) where G in {1,2,3,4}
 */
export function calculateInitialDifficulty(rating: Rating, w: number[] = DEFAULT_FSRS_PARAMETERS.w): number {
  const d0 = w[4] - Math.exp(w[5] * (rating - 1)) + 1;
  return Math.min(10, Math.max(1, d0));
}

/**
 * Calculates initial stability S_0(G) where G in {1,2,3,4}
 */
export function calculateInitialStability(rating: Rating, w: number[] = DEFAULT_FSRS_PARAMETERS.w): number {
  return Math.max(0.1, w[rating - 1]);
}

/**
 * Updates difficulty D'(D, G) with mean reversion toward D_0(3)
 */
export function calculateNextDifficulty(
  currentDifficulty: number,
  rating: Rating,
  w: number[] = DEFAULT_FSRS_PARAMETERS.w
): number {
  const d0Good = w[4] - Math.exp(w[5] * 2) + 1;
  const rawDifficulty = currentDifficulty - w[6] * (rating - 3);
  const newDifficulty = w[7] * d0Good + (1 - w[7]) * rawDifficulty;
  return Math.min(10, Math.max(1, newDifficulty));
}

/**
 * Calculates next stability after successful recall (Hard, Good, Easy)
 */
export function calculateRecallStability(
  stability: number,
  difficulty: number,
  retrievability: number,
  rating: Rating,
  w: number[] = DEFAULT_FSRS_PARAMETERS.w
): number {
  const hardPenalty = rating === Rating.Hard ? w[16] : 1.0;
  const easyBonus = rating === Rating.Easy ? w[17] : 1.0;

  const inc =
    Math.exp(w[8]) *
    (11 - difficulty) *
    Math.pow(stability, -w[9]) *
    (Math.exp(w[10] * (1 - retrievability)) - 1) *
    hardPenalty *
    easyBonus;

  const newStability = stability * (1 + inc);
  return Math.max(0.1, newStability);
}

/**
 * Calculates next stability after lapse / failure (Again)
 */
export function calculateForgetStability(
  stability: number,
  difficulty: number,
  retrievability: number,
  w: number[] = DEFAULT_FSRS_PARAMETERS.w
): number {
  const newStability =
    w[12] *
    Math.pow(difficulty, -w[13]) *
    (Math.pow(stability + 1, w[14]) - 1) *
    Math.exp(w[15] * (1 - retrievability));

  // Forgetting stability should be capped by current stability and at least 0.1
  return Math.max(0.1, Math.min(stability, newStability));
}

/**
 * Creates a brand new Card object ready to be added to IndexedDB.
 */
export function createDefaultCard(
  deckId: number | string,
  front: string,
  back: string,
  phonetic?: string,
  example?: string,
  tags?: string[],
  frequencyRank: number = 1,
  cefrLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' = 'A1'
): Card {
  const now = new Date();
  return {
    id: `card-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    deckId: String(deckId),
    front,
    back,
    ipa: phonetic,
    exampleSv: example,
    wordClass: 'substantiv',
    frequencyRank,
    cefrLevel,
    state: CardState.New,
    stability: 0,
    difficulty: 0,
    elapsedDays: 0,
    scheduledDays: 0,
    reps: 0,
    lapses: 0,
    due: now.getTime(),
  };
}

/**
 * Schedules a card review given a rating (Again, Hard, Good, Easy).
 * Returns the updated card state and a ReviewLog record.
 */
export function scheduleCard(
  card: Card,
  rating: Rating,
  now: Date = new Date(),
  params: FSRSParameters = DEFAULT_FSRS_PARAMETERS
): CardSchedulingResult {
  const { w, requestRetention, maximumInterval } = params;
  const lastReview = card.lastReview ? new Date(card.lastReview) : new Date(card.createdAt);
  const elapsedDays = Math.max(0, (now.getTime() - lastReview.getTime()) / (1000 * 60 * 60 * 24));

  let nextState: CardState = card.state;
  let nextStability = card.stability;
  let nextDifficulty = card.difficulty;
  let lapses = card.lapses;
  let reps = card.reps + 1;

  if (card.state === CardState.New) {
    nextDifficulty = calculateInitialDifficulty(rating, w);
    nextStability = calculateInitialStability(rating, w);

    if (rating === Rating.Again) {
      nextState = CardState.Learning;
      lapses += 1;
    } else if (rating === Rating.Hard) {
      nextState = CardState.Learning;
    } else {
      nextState = CardState.Review;
    }
  } else {
    // Learning, Review, or Relearning
    const retrievability = calculateRetrievability(elapsedDays, card.stability);
    nextDifficulty = calculateNextDifficulty(card.difficulty, rating, w);

    if (rating === Rating.Again) {
      nextStability = calculateForgetStability(card.stability, nextDifficulty, retrievability, w);
      nextState = CardState.Relearning;
      lapses += 1;
    } else {
      nextStability = calculateRecallStability(
        card.stability,
        nextDifficulty,
        retrievability,
        rating,
        w
      );
      nextState = CardState.Review;
    }
  }

  const intervalDays = calculateNextInterval(nextStability, requestRetention, maximumInterval);
  const nextDue = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);

  const updatedCard: Card = {
    ...card,
    state: nextState,
    stability: Number(nextStability.toFixed(4)),
    difficulty: Number(nextDifficulty.toFixed(4)),
    elapsedDays: Math.round(elapsedDays),
    scheduledDays: intervalDays,
    reps,
    lapses,
    due: nextDue.getTime(),
    lastReview: now.getTime(),
  };

  const reviewLog: ReviewLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    cardId: String(card.id || ''),
    rating,
    state: card.state,
    due: typeof card.due === 'number' ? card.due : new Date(card.due).getTime(),
    stability: updatedCard.stability,
    difficulty: updatedCard.difficulty,
    elapsedDays: Math.round(elapsedDays),
    lastElapsedDays: card.elapsedDays,
    scheduledDays: intervalDays,
    reviewTimestamp: now.getTime(),
  };

  return {
    card: updatedCard,
    reviewLog,
  };
}

/**
 * Previews the next intervals and state changes for all 4 ratings.
 */
export function previewRatings(
  card: Card,
  now: Date = new Date(),
  params: FSRSParameters = DEFAULT_FSRS_PARAMETERS
): RatingPreview[] {
  const ratings: Rating[] = [Rating.Again, Rating.Hard, Rating.Good, Rating.Easy];
  return ratings.map((rating) => {
    const { card: scheduledCard } = scheduleCard(card, rating, now, params);
    const elapsedDays = card.lastReview
      ? Math.max(0, (now.getTime() - new Date(card.lastReview).getTime()) / (1000 * 60 * 60 * 24))
      : 0;
    const retrievability = calculateRetrievability(elapsedDays, card.stability);

    return {
      rating,
      nextState: scheduledCard.state,
      nextDue: scheduledCard.due,
      intervalDays: scheduledCard.scheduledDays,
      stability: scheduledCard.stability,
      difficulty: scheduledCard.difficulty,
      retrievability,
    };
  });
}

/**
 * Generates a bonus study queue for extra practice session ("Studera extra ord 🚀" / "Nästa N nya ord 🚀").
 * 1. Filters unseen cards (state === 0) from selected deck, sorted strictly by frequencyRank ASC.
 * 2. If fewer than batchSize cards, fills remaining slots with unseen cards from all other decks in LEXICON_CARDS, sorted by frequencyRank ASC.
 * 3. If all cards in master catalog have been studied/seen (state > 0), falls back to cards with lowest stability (stability ASC).
 */
export function generateBonusQueue(
  cards: Card[],
  selectedDeckId: string,
  settings: Partial<UserSettings> = {}
): Card[] {
  const batchSize = settings.bonusExtraCards ?? settings.dailyNewCards ?? 15;

  const cardMap = new Map(cards.map((c) => [c.id, c]));

  // Ensure master catalog is complete by combining LEXICON_CARDS with active cards
  const lexiconIds = new Set(LEXICON_CARDS.map((c) => c.id));
  const masterCatalog: Card[] = [
    ...LEXICON_CARDS.map((lc) => cardMap.get(lc.id) || lc),
    ...cards.filter((c) => !lexiconIds.has(c.id)),
  ];

  // A card is unseen if its state === 0 (New)
  const isUnseen = (c: Card) => c.state === 0;

  // 1. Unseen cards in selected deck sorted by frequencyRank ASC
  const deckUnseenCards = masterCatalog
    .filter((c) => (c.deckId === selectedDeckId || !c.deckId) && isUnseen(c))
    .sort((a, b) => a.frequencyRank - b.frequencyRank);

  let bonusQueue: Card[] = [];

  if (deckUnseenCards.length >= batchSize) {
    bonusQueue = deckUnseenCards.slice(0, batchSize);
  } else {
    bonusQueue = [...deckUnseenCards];

    // 2. Fill remaining slots with unseen cards from all other decks sorted by frequencyRank ASC
    const otherUnseenCards = masterCatalog
      .filter((c) => isUnseen(c) && !bonusQueue.some((b) => b.id === c.id))
      .sort((a, b) => a.frequencyRank - b.frequencyRank);

    const remainingNeeded = batchSize - bonusQueue.length;
    bonusQueue.push(...otherUnseenCards.slice(0, remainingNeeded));

    // 3. Fallback: If all cards in master catalog have been studied/seen, pick cards with lowest stability (stability ASC)
    if (bonusQueue.length < batchSize) {
      const existingIds = new Set(bonusQueue.map((c) => c.id));
      const lowestStabilityCards = [...masterCatalog]
        .filter((c) => !existingIds.has(c.id))
        .sort((a, b) => (a.stability ?? 0) - (b.stability ?? 0) || (a.due ?? 0) - (b.due ?? 0))
        .slice(0, batchSize - bonusQueue.length);

      bonusQueue.push(...lowestStabilityCards);
    }
  }

  return bonusQueue;
}


