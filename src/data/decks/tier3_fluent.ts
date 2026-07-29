import { LexiconEntry } from '../../types';

/**
 * TIER 3 FLUENT (Frequency Ranks 1501 – 3000 | CEFR B2/C1 Advanced Fluency)
 * SLA Pedagogy Expert: Nils
 * 
 * Features:
 * - Nuanced vocabulary, abstract concepts, professional, societal, and media terms.
 * - Explicit noun gender tags ('en' | 'ett').
 * - Standard Rikssvenska IPA phonetics.
 * - Advanced i+1 example sentences with complex clause structures.
 * - Complete morphological inflections.
 */
export const TIER3_FLUENT: LexiconEntry[] = [
  // ==========================================
  // ABSTRACT & PROFESSIONAL NOUNS (Ranks 1501 – 1520)
  // ==========================================
  {
    id: 't3-1501',
    front: 'en möjlighet',
    back: 'an opportunity / possibility',
    frequencyRank: 1501,
    cefrLevel: 'B2',
    gender: 'en',
    wordClass: 'noun',
    ipa: '/eːn ˈmœjːlɪɡˌheːt/',
    exampleSv: 'Projektet ger oss en fantastisk möjlighet att utvecklas.',
    exampleEn: 'The project gives us a fantastic opportunity to develop.',
    inflections: ['en möjlighet', 'möjligheten', 'möjligheter', 'möjligheterna'],
  },
  {
    id: 't3-1502',
    front: 'ett samhälle',
    back: 'a society / community',
    frequencyRank: 1502,
    cefrLevel: 'B2',
    gender: 'ett',
    wordClass: 'noun',
    ipa: '/ɛtː ˈsamːhɛlːɛ/',
    exampleSv: 'Demokrati och jämlikhet är fundamentala i ett öppet samhälle.',
    exampleEn: 'Democracy and equality are fundamental in an open society.',
    inflections: ['ett samhälle', 'samhället', 'samhällen', 'samhällena'],
  },
  {
    id: 't3-1503',
    front: 'en erfarenhet',
    back: 'an experience (knowledge gained)',
    frequencyRank: 1503,
    cefrLevel: 'B2',
    gender: 'en',
    wordClass: 'noun',
    ipa: '/eːn ˈæːrˌfɑːrɛnˌheːt/',
    exampleSv: 'Hon har mångårig erfarenhet inom mjukvaruutveckling.',
    exampleEn: 'She has many years of experience in software development.',
    inflections: ['en erfarenhet', 'erfarenheten', 'erfarenheter', 'erfarenheterna'],
  },
  {
    id: 't3-1504',
    front: 'ett beslut',
    back: 'a decision',
    frequencyRank: 1504,
    cefrLevel: 'B2',
    gender: 'ett',
    wordClass: 'noun',
    ipa: '/ɛtː bɛˈslʉːt/',
    exampleSv: 'Styrelsen fattade ett avgörande beslut igår.',
    exampleEn: 'The board made a decisive decision yesterday.',
    inflections: ['ett beslut', 'beslutet', 'beslut', 'besluten'],
  },
  {
    id: 't3-1505',
    front: 'en utveckling',
    back: 'a development / evolution / growth',
    frequencyRank: 1505,
    cefrLevel: 'B2',
    gender: 'en',
    wordClass: 'noun',
    ipa: '/eːn ˈʉːtˌvɪkːlɪŋ/',
    exampleSv: 'Teknologisk utveckling förändrar vårt arbetsliv snabbt.',
    exampleEn: 'Technological development is rapidly changing our working life.',
    inflections: ['en utveckling', 'utvecklingen', 'utvecklingar', 'utvecklingarna'],
  },
  {
    id: 't3-1506',
    front: 'ett förhållande',
    back: 'a relationship / condition / ratio',
    frequencyRank: 1506,
    cefrLevel: 'B2',
    gender: 'ett',
    wordClass: 'noun',
    ipa: '/ɛtː fœrˈhɔlːanˌdɛ/',
    exampleSv: 'De har ett gott förhållande till sina samarbetspartners.',
    exampleEn: 'They have a good relationship with their partners.',
    inflections: ['ett förhållande', 'förhållandet', 'förhållanden', 'förhållandena'],
  },

  // ==========================================
  // ADVANCED & NUANCED VERBS (Ranks 1507 – 1515)
  // ==========================================
  {
    id: 't3-1507',
    front: 'att påverka',
    back: 'to influence / affect / impact',
    frequencyRank: 1507,
    cefrLevel: 'B2',
    wordClass: 'verb',
    ipa: '/atː ˈpoːˌvɛrkːa/',
    exampleSv: 'Klimatförändringarna påverkar miljön i hela världen.',
    exampleEn: 'Climate change affects the environment across the whole world.',
    inflections: ['att påverka', 'påverkar', 'påverkade', 'påverkat'],
  },
  {
    id: 't3-1508',
    front: 'att anse',
    back: 'to consider / deem / hold the view',
    frequencyRank: 1508,
    cefrLevel: 'C1',
    wordClass: 'verb',
    ipa: '/atː ˈanːseː/',
    exampleSv: 'Forskarna anser att åtgärderna måste införas omedelbart.',
    exampleEn: 'Researchers consider that the measures must be implemented immediately.',
    inflections: ['att anse', 'anser', 'ansåg', 'ansett'],
  },
  {
    id: 't3-1509',
    front: 'att innebära',
    back: 'to mean / imply / entail',
    frequencyRank: 1509,
    cefrLevel: 'B2',
    wordClass: 'verb',
    ipa: '/atː ˈɪnːɛˌbɛːra/',
    exampleSv: 'Det nya avtalet innebär stora fördelar för båda parter.',
    exampleEn: 'The new agreement entails great benefits for both parties.',
    inflections: ['att innebära', 'innebär', 'innebar', 'inneburit'],
  },
  {
    id: 't3-1510',
    front: 'att jämföra',
    back: 'to compare',
    frequencyRank: 1510,
    cefrLevel: 'B2',
    wordClass: 'verb',
    ipa: '/atː ˈjɛmːfœːra/',
    exampleSv: 'Det är intressant att jämföra resultaten från de två studierna.',
    exampleEn: 'It is interesting to compare the results from the two studies.',
    inflections: ['att jämföra', 'jämför', 'jämförde', 'jämfört'],
  },

  // ==========================================
  // ADVANCED ADJECTIVES (Ranks 1511 – 1520)
  // ==========================================
  {
    id: 't3-1511',
    front: 'nödvändig / nödvändigt / nödvändiga',
    back: 'necessary / essential',
    frequencyRank: 1511,
    cefrLevel: 'B2',
    wordClass: 'adjective',
    ipa: '/ˈnøːdˌvɛnːdɪɡ / ˈnøːdˌvɛnːdɪɡt / ˈnøːdˌvɛnːdɪɡa/',
    exampleSv: 'Det är nödvändigt att ha giltigt pass vid gränskontrollen.',
    exampleEn: 'It is necessary to have a valid passport at the border control.',
    inflections: ['nödvändig (en)', 'nödvändigt (ett)', 'nödvändiga (plural/def)'],
  },
  {
    id: 't3-1512',
    front: 'tydlig / tydligt / tydliga',
    back: 'clear / distinct / explicit',
    frequencyRank: 1512,
    cefrLevel: 'B2',
    wordClass: 'adjective',
    ipa: '/ˈtyːdlɪɡ / ˈtyːdlɪɡt / ˈtyːdlɪɡa/',
    exampleSv: 'Läraren gav mycket tydliga instruktioner.',
    exampleEn: 'The teacher gave very clear instructions.',
    inflections: ['tydlig (en)', 'tydligt (ett)', 'tydliga (plural/def)', 'tydligare', 'tydligast'],
  },
];
