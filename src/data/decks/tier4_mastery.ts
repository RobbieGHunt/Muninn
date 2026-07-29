import { LexiconEntry } from '../../types';

/**
 * TIER 4 MASTERY (Frequency Ranks 3001+ | CEFR C2 Mastery)
 * SLA Pedagogy Expert: Nils
 * 
 * Features:
 * - Sophisticated idioms, specialized terminology, academic/literary register.
 * - Explicit noun gender tags ('en' | 'ett').
 * - Standard Rikssvenska IPA phonetics.
 * - Complex i+1 example sentences with native nuance and formal register.
 * - Complete morphological inflections.
 */
export const TIER4_MASTERY: LexiconEntry[] = [
  // ==========================================
  // SOPHISTICATED NOUNS & IDIOMS (Ranks 3001+)
  // ==========================================
  {
    id: 't4-3001',
    front: 'en mångfald',
    back: 'diversity / multiplicity / variety',
    frequencyRank: 3001,
    cefrLevel: 'C2',
    gender: 'en',
    wordClass: 'noun',
    ipa: '/eːn ˈmɔŋːˌfalːd/',
    exampleSv: 'Biologisk mångfald är avgörande för ekosystemens överlevnad.',
    exampleEn: 'Biological diversity is essential for the survival of ecosystems.',
    inflections: ['en mångfald', 'mångfalden'],
  },
  {
    id: 't4-3002',
    front: 'ett förebud',
    back: 'a harbinger / omen / precursor',
    frequencyRank: 3002,
    cefrLevel: 'C2',
    gender: 'ett',
    wordClass: 'noun',
    ipa: '/ɛtː ˈfœːrɛˌbʉːd/',
    exampleSv: 'De mörka molnen sågs som ett förebud om en stormig vinter.',
    exampleEn: 'The dark clouds were seen as a harbinger of a stormy winter.',
    inflections: ['ett förebud', 'förebudet', 'förebud', 'förebuden'],
  },
  {
    id: 't4-3003',
    front: 'en vedergällning',
    back: 'retaliation / retribution / reprisal',
    frequencyRank: 3003,
    cefrLevel: 'C2',
    gender: 'en',
    wordClass: 'noun',
    ipa: '/eːn ˈveːdɛrˌjɛlːnɪŋ/',
    exampleSv: 'Diplomaterna varnade för fientlig vedergällning.',
    exampleEn: 'The diplomats warned of hostile retaliation.',
    inflections: ['en vedergällning', 'vedergällningen', 'vedergällningar', 'vedergällningarna'],
  },
  {
    id: 't4-3004',
    front: 'ett förbehåll',
    back: 'a reservation / proviso / qualification',
    frequencyRank: 3004,
    cefrLevel: 'C2',
    gender: 'ett',
    wordClass: 'noun',
    ipa: '/ɛtː fœrˈbɛˌhɔlː/',
    exampleSv: 'De accepterade villkoren utan några förbehåll.',
    exampleEn: 'They accepted the conditions without any reservations.',
    inflections: ['ett förbehåll', 'förbehållet', 'förbehåll', 'förbehållen'],
  },

  // ==========================================
  // SOPHISTICATED VERBS & IDIOMATIC PHRASES (Ranks 3005+)
  // ==========================================
  {
    id: 't4-3005',
    front: 'att åskådliggöra',
    back: 'to illustrate / exemplify / demonstrate clearly',
    frequencyRank: 3005,
    cefrLevel: 'C2',
    wordClass: 'verb',
    ipa: '/atː ˈoːˌskoːdlɪɡˌjœːra/',
    exampleSv: 'Forskaren använde diagram för att åskådliggöra de komplicerade dataserierna.',
    exampleEn: 'The researcher used diagrams to illustrate the complex data series.',
    inflections: ['att åskådliggöra', 'åskådliggör', 'åskådliggjorde', 'åskådliggjort'],
  },
  {
    id: 't4-3006',
    front: 'att vederlägga',
    back: 'to refute / rebut / disprove',
    frequencyRank: 3006,
    cefrLevel: 'C2',
    wordClass: 'verb',
    ipa: '/atː ˈveːdɛrˌlɛɡːa/',
    exampleSv: 'Det nya empiriska bevismaterialet vederlade den gamla teorin.',
    exampleEn: 'The new empirical evidence disproved the old theory.',
    inflections: ['att vederlägga', 'vederlägger', 'vederla', 'vederlagt'],
  },
  {
    id: 't4-3007',
    front: 'att slå två flugor i en smäll',
    back: 'to kill two birds with one stone',
    frequencyRank: 3007,
    cefrLevel: 'C2',
    wordClass: 'idiom',
    ipa: '/sloː tvoː ˈflʉːɡɔr iː eːn smɛlː/',
    exampleSv: 'Genom att samåka till konferensen slår vi två flugor i en smäll.',
    exampleEn: 'By carpooling to the conference we kill two birds with one stone.',
    inflections: ['slår två flugor i en smäll', 'slog två flugor i en smäll'],
  },
  {
    id: 't4-3008',
    front: 'att ha alla hästar i hagen',
    back: 'to be smart / sharp / have all one’s marbles',
    frequencyRank: 3008,
    cefrLevel: 'C2',
    wordClass: 'idiom',
    ipa: '/hɑː ˈalːa ˈhɛsːtar iː ˈhɑːɡɛn/',
    exampleSv: 'Han må vara tystlåten, men han har definitivt alla hästar i hagen.',
    exampleEn: 'He may be quiet, but he definitely has all his marbles.',
    inflections: ['har alla hästar i hagen', 'hade alla hästar i hagen'],
  },
];
