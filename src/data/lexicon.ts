import { Card, Deck, CEFRLevel, LexiconEntry } from '../types';
import { EXPANDED_LEXICON } from './expandedLexicon';

export { TIER1_FOUNDATION } from './decks/tier1_foundation';
export { TIER2_EVERYDAY } from './decks/tier2_everyday';
export { TIER3_FLUENT } from './decks/tier3_fluent';
export { TIER4_MASTERY } from './decks/tier4_mastery';

/**
 * MASTER LEXICON
 * Complete 6,000 high-frequency Swedish words database ordered by frequency rank.
 */
export const MASTER_LEXICON: LexiconEntry[] = EXPANDED_LEXICON;

/**
 * Retrieves lexicon entries filtered by CEFR level.
 */
export function getEntriesByCEFR(cefr: CEFRLevel): LexiconEntry[] {
  return MASTER_LEXICON.filter(entry => entry.cefrLevel === cefr);
}

/**
 * Retrieves lexicon entries filtered by frequency rank range [minRank, maxRank].
 */
export function getEntriesByFrequencyRange(minRank: number, maxRank: number): LexiconEntry[] {
  return MASTER_LEXICON.filter(
    entry => entry.frequencyRank >= minRank && entry.frequencyRank <= maxRank
  );
}

/**
 * Searches lexicon entries by Swedish front word or English back translation.
 */
export function searchLexicon(query: string): LexiconEntry[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return MASTER_LEXICON.filter(
    entry =>
      entry.front.toLowerCase().includes(q) ||
      entry.back.toLowerCase().includes(q) ||
      (entry.exampleSv && entry.exampleSv.toLowerCase().includes(q)) ||
      (entry.exampleEn && entry.exampleEn.toLowerCase().includes(q))
  );
}

/**
 * Helper to map CEFR level to Deck ID.
 */
function getDeckIdForCEFR(cefrLevel: CEFRLevel): string {
  switch (cefrLevel) {
    case 'A1':
      return 'deck-a1-core';
    case 'A2':
      return 'deck-a2-vardag';
    case 'B1':
      return 'deck-b1-mellanniva';
    case 'B2':
      return 'deck-b2-avancerad';
    case 'C1':
    case 'C2':
      return 'deck-c1-c2-expert';
    default:
      return 'deck-a1-core';
  }
}

/**
 * LEXICON DECKS DEFINITION
 */
export const LEXICON_DECKS: Deck[] = [
  {
    id: 'deck-a1-core',
    title: 'Svenska A1 Nybörjare',
    description: 'De mest frekventa grundläggande orden och fraserna för A1 (Ranks 1–500).',
    cefrLevel: 'A1',
    icon: '🇸🇪',
    createdAt: Date.now(),
    totalCards: MASTER_LEXICON.filter(e => e.cefrLevel === 'A1').length,
  },
  {
    id: 'deck-a2-vardag',
    title: 'Svenska A2 Vardagsspråk',
    description: 'Vardagliga konversationer, resor och grundläggande kommunikation (Ranks 501–1500).',
    cefrLevel: 'A2',
    icon: '☕',
    createdAt: Date.now(),
    totalCards: MASTER_LEXICON.filter(e => e.cefrLevel === 'A2').length,
  },
  {
    id: 'deck-b1-mellanniva',
    title: 'Svenska B1 Mellannivå',
    description: 'Utökat ordförråd för arbete, nyheter och samhällsliv (Ranks 1501–2500).',
    cefrLevel: 'B1',
    icon: '📚',
    createdAt: Date.now(),
    totalCards: MASTER_LEXICON.filter(e => e.cefrLevel === 'B1').length,
  },
  {
    id: 'deck-b2-avancerad',
    title: 'Svenska B2 Avancerad',
    description: 'Nyanserade uttryck och akademiskt/professionellt språk (Ranks 2501–6000).',
    cefrLevel: 'B2',
    icon: '🎓',
    createdAt: Date.now(),
    totalCards: MASTER_LEXICON.filter(e => e.cefrLevel === 'B2').length,
  },
  {
    id: 'deck-c1-c2-expert',
    title: 'Svenska C1/C2 Expert',
    description: 'Idiotiska uttryck, litterära ord och avancerad vokabulär (Ranks 6001+).',
    cefrLevel: 'C1',
    icon: '👑',
    createdAt: Date.now(),
    totalCards: MASTER_LEXICON.filter(e => e.cefrLevel === 'C1' || e.cefrLevel === 'C2').length,
  },
];

/**
 * LEXICON CARDS
 * Converted from MASTER_LEXICON into full FSRS-ready Card objects for Dexie database seeding.
 */
export const LEXICON_CARDS: Card[] = MASTER_LEXICON.map((entry, index) => ({
  id: `lex-${String(index + 1).padStart(3, '0')}`,
  deckId: getDeckIdForCEFR(entry.cefrLevel),
  front: entry.front,
  back: entry.back,
  ipa: entry.ipa,
  gender: entry.gender,
  wordClass: entry.wordClass as any,
  exampleSv: entry.exampleSv,
  exampleEn: entry.exampleEn,
  inflections: entry.inflections,
  frequencyRank: entry.frequencyRank,
  cefrLevel: entry.cefrLevel,
  audioUrl: entry.audioUrl,

  // FSRS default initial state
  state: 0,
  due: Date.now(),
  stability: 0,
  difficulty: 0,
  elapsedDays: 0,
  scheduledDays: 0,
  reps: 0,
  lapses: 0,
}));
