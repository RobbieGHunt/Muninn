export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export interface Deck {
  id: string;
  title: string;
  description: string;
  cefrLevel: CEFRLevel;
  icon?: string;
  createdAt: number;
}

export interface Card {
  id: string;
  deckId: string;
  front: string;             // Swedish word/phrase
  back: string;              // English translation
  ipa?: string;              // Phonetic representation (IPA Rikssvenska)
  gender?: 'en' | 'ett';     // Noun gender
  wordClass: string;         // noun, verb, adjective, phrase, pronoun, question, preposition, conjunction, adverb, numeral
  exampleSv?: string;        // Swedish example sentence
  exampleEn?: string;        // English translation of sentence
  inflections?: string[];    // Conjugation / declension forms
  audioUrl?: string;         // Audio override path if available
  frequencyRank: number;     // Word frequency ranking (1 = most common)
  cefrLevel: CEFRLevel;

  // FSRS 4.5 State Fields
  state: 0 | 1 | 2 | 3;      // 0: New, 1: Learning, 2: Review, 3: Relearning
  due: number;               // Timestamp (ms)
  stability: number;
  difficulty: number;
  elapsedDays: number;
  scheduledDays: number;
  reps: number;
  lapses: number;
  lastReview?: number;       // Timestamp (ms)
}

export interface ReviewLog {
  id: string;
  cardId: string;
  rating: 1 | 2 | 3 | 4;     // 1: Again, 2: Hard, 3: Good, 4: Easy
  state: 0 | 1 | 2 | 3;
  due: number;
  stability: number;
  difficulty: number;
  elapsedDays: number;
  lastElapsedDays: number;
  scheduledDays: number;
  reviewTimestamp: number;
}
