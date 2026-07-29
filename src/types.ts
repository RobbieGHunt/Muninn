export type CardState = 0 | 1 | 2 | 3; // 0: New, 1: Learning, 2: Review, 3: Relearning
export type Rating = 1 | 2 | 3 | 4; // 1: Again, 2: Hard, 3: Good, 4: Easy
export type WordGender = 'en' | 'ett' | 'none';
export type WordClass = 'substantiv' | 'verb' | 'adjektiv' | 'adverb' | 'fras' | 'uttryck' | 'pronoun' | 'noun' | 'adjective' | 'phrase' | 'question' | 'preposition' | 'conjunction' | 'numeral';
export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export interface InflectionTable {
  indefiniteSingular?: string;
  definiteSingular?: string;
  indefinitePlural?: string;
  definitePlural?: string;
  present?: string;
  past?: string;
  supine?: string;
  imperative?: string;
}

export interface Card {
  id: string;
  deckId: string;
  front: string;             // Swedish word/phrase
  back: string;              // English translation
  ipa?: string;              // Phonetic representation
  gender?: WordGender;       // Noun gender: 'en' | 'ett'
  wordClass: WordClass;      // noun, verb, adjective, phrase, etc.
  exampleSv?: string;        // Swedish example sentence
  exampleEn?: string;        // English translation of sentence
  inflections?: string[] | InflectionTable; // Inflection forms
  audioUrl?: string;         // Audio override path if available
  frequencyRank: number;     // Word frequency ranking (1 = most common)
  cefrLevel: CEFRLevel;

  // FSRS State Fields
  state: CardState;
  due: number;               // Timestamp (ms)
  stability: number;
  difficulty: number;
  elapsedDays: number;
  scheduledDays: number;
  reps: number;
  lapses: number;
  lastReview?: number;       // Timestamp (ms)
}

export interface Deck {
  id: string;
  title: string;
  description: string;
  cefrLevel: CEFRLevel;
  icon?: string;
  createdAt: number;
  totalCards: number;
}

export interface QueueStats {
  newCount: number;
  learningCount: number;
  reviewCount: number;
}

export interface UserStats {
  streak: number;
  lastStudyDate: string; // YYYY-MM-DD
  totalReviews: number;
  retentionRate: number; // e.g. 91.5
  history: Record<string, number>; // YYYY-MM-DD -> review count
}
