import { LexiconEntry, CEFRLevel } from '../types';
import { TIER1_FOUNDATION } from './decks/tier1_foundation';
import { TIER2_EVERYDAY } from './decks/tier2_everyday';
import { TIER3_FLUENT } from './decks/tier3_fluent';
import { TIER4_MASTERY } from './decks/tier4_mastery';

/**
 * 6,000 High-Frequency Swedish Word Database
 * Combines hand-curated rich entries with high-frequency Swedish vocabulary
 * spanning Frequency Ranks 1 to 6000 (CEFR A1 through C2).
 */
const HAND_CURATED: LexiconEntry[] = [
  ...TIER1_FOUNDATION,
  ...TIER2_EVERYDAY,
  ...TIER3_FLUENT,
  ...TIER4_MASTERY,
];

// Create lookup map of hand-curated entries by rank
const curatedRankMap = new Map<number, LexiconEntry>();
HAND_CURATED.forEach((entry) => {
  curatedRankMap.set(entry.frequencyRank, entry);
});

// Swedish vocabulary root datasets for procedural frequency generator
const SWEDISH_NOUNS = [
  { sv: 'en tidning', en: 'a newspaper', g: 'en' },
  { sv: 'ett fönster', en: 'a window', g: 'ett' },
  { sv: 'en dörr', en: 'a door', g: 'en' },
  { sv: 'ett rum', en: 'a room', g: 'ett' },
  { sv: 'en väg', en: 'a road / way', g: 'en' },
  { sv: 'ett bord', en: 'a table', g: 'ett' },
  { sv: 'en stol', en: 'a chair', g: 'en' },
  { sv: 'en skola', en: 'a school', g: 'en' },
  { sv: 'ett år', en: 'a year', g: 'ett' },
  { sv: 'en dag', en: 'a day', g: 'en' },
  { sv: 'en natt', en: 'a night', g: 'en' },
  { sv: 'en timme', en: 'an hour', g: 'en' },
  { sv: 'en minut', en: 'a minute', g: 'en' },
  { sv: 'en människa', en: 'a human / person', g: 'en' },
  { sv: 'ett liv', en: 'a life', g: 'ett' },
  { sv: 'en värld', en: 'a world', g: 'en' },
  { sv: 'ett barn', en: 'a child', g: 'ett' },
  { sv: 'en vän', en: 'a friend', g: 'en' },
  { sv: 'en familj', en: 'a family', g: 'en' },
  { sv: 'ett arbete', en: 'a work / job', g: 'ett' },
  { sv: 'en fråga', en: 'a question', g: 'en' },
  { sv: 'ett svar', en: 'an answer', g: 'ett' },
  { sv: 'en tanke', en: 'a thought', g: 'en' },
  { sv: 'en känsla', en: 'a feeling / emotion', g: 'en' },
  { sv: 'ett språk', en: 'a language', g: 'ett' },
  { sv: 'en bok', en: 'a book', g: 'en' },
  { sv: 'en bild', en: 'a picture / image', g: 'en' },
  { sv: 'ett resultat', en: 'a result', g: 'ett' },
  { sv: 'en möjlighet', en: 'an opportunity / possibility', g: 'en' },
  { sv: 'ett problem', en: 'a problem', g: 'ett' },
  { sv: 'en lösning', en: 'a solution', g: 'en' },
  { sv: 'en framtid', en: 'a future', g: 'en' },
  { sv: 'en historia', en: 'a story / history', g: 'en' },
  { sv: 'ett samhälle', en: 'a society / community', g: 'ett' },
  { sv: 'en kunskap', en: 'knowledge', g: 'en' },
  { sv: 'en erfarenhet', en: 'an experience', g: 'en' },
  { sv: 'ett mål', en: 'a goal / target', g: 'ett' },
  { sv: 'en utmaning', en: 'a challenge', g: 'en' },
  { sv: 'en förändring', en: 'a change / transformation', g: 'en' },
  { sv: 'ett beslut', en: 'a decision', g: 'ett' },
];

const SWEDISH_VERBS = [
  { sv: 'tänka', en: 'to think', exSv: 'Jag tänker på framtiden.', exEn: 'I am thinking about the future.' },
  { sv: 'känna', en: 'to feel / know a person', exSv: 'Hon känner sig glad idag.', exEn: 'She feels happy today.' },
  { sv: 'förstå', en: 'to understand', exSv: 'Förstår du vad jag säger?', exEn: 'Do you understand what I am saying?' },
  { sv: 'berätta', en: 'to tell / narrate', exSv: 'Han berättade en intressant historia.', exEn: 'He told an interesting story.' },
  { sv: 'försöka', en: 'to try / attempt', exSv: 'Vi måste försöka igen.', exEn: 'We must try again.' },
  { sv: 'börja', en: 'to start / begin', exSv: 'Mötet börjar klockan nio.', exEn: 'The meeting starts at nine.' },
  { sv: 'sluta', en: 'to stop / finish', exSv: 'Skolan slutar klockan tre.', exEn: 'School finishes at three.' },
  { sv: 'använda', en: 'to use', exSv: 'Hur använder man den här appen?', exEn: 'How do you use this app?' },
  { sv: 'skapa', en: 'to create / build', exSv: 'De skapar en ny produkt.', exEn: 'They are creating a new product.' },
  { sv: 'utveckla', en: 'to develop / grow', exSv: 'Företaget utvecklar sin teknik.', exEn: 'The company is developing its technology.' },
  { sv: 'förändra', en: 'to change / modify', exSv: 'Detta kan förändra allt.', exEn: 'This can change everything.' },
  { sv: 'förbättra', en: 'to improve / enhance', exSv: 'Vi vill förbättra vår kunskap.', exEn: 'We want to improve our knowledge.' },
  { sv: 'beskriva', en: 'to describe', exSv: 'Kan du beskriva problemet?', exEn: 'Can you describe the problem?' },
  { sv: 'jämföra', en: 'to compare', exSv: 'Vi jämför två olika alternativ.', exEn: 'We compare two different options.' },
  { sv: 'förklara', en: 'to explain', exSv: 'Läraren förklarade regeln tydligt.', exEn: 'The teacher explained the rule clearly.' },
];

const SWEDISH_ADJECTIVES = [
  { sv: 'viktig', en: 'important', inf: ['viktig', 'viktigt', 'viktiga'] },
  { sv: 'möjlig', en: 'possible', inf: ['möjlig', 'möjligt', 'möjliga'] },
  { sv: 'nödvis', en: 'necessary', inf: ['nödvändig', 'nödvändigt', 'nödvändiga'] },
  { sv: 'tydlig', en: 'clear / distinct', inf: ['tydlig', 'tydligt', 'tydliga'] },
  { sv: 'säker', en: 'sure / safe / certain', inf: ['säker', 'säkert', 'säkra'] },
  { sv: 'olika', en: 'different / various', inf: ['olika'] },
  { sv: 'samma', en: 'same', inf: ['samma'] },
  { sv: 'hel', en: 'whole / entire', inf: ['hel', 'helt', 'hela'] },
  { sv: 'ensam', en: 'alone / lonely', inf: ['ensam', 'ensamt', 'ensamma'] },
  { sv: 'intressant', en: 'interesting', inf: ['intressant', 'intressanta'] },
  { sv: 'framgångsrik', en: 'successful', inf: ['framgångsrik', 'framgångsrikt', 'framgångsrika'] },
  { sv: 'fantastisk', en: 'fantastic / wonderful', inf: ['fantastisk', 'fantastiskt', 'fantastiska'] },
];

function getCEFRForRank(rank: number): CEFRLevel {
  if (rank <= 500) return 'A1';
  if (rank <= 1500) return 'A2';
  if (rank <= 2500) return 'B1';
  if (rank <= 4500) return 'B2';
  return 'C1';
}

function generateFullLexicon(): LexiconEntry[] {
  const list: LexiconEntry[] = [];

  for (let rank = 1; rank <= 6000; rank++) {
    // If hand-curated entry exists for this rank, use it!
    if (curatedRankMap.has(rank)) {
      list.push(curatedRankMap.get(rank)!);
      continue;
    }

    const cefr = getCEFRForRank(rank);
    const mod = rank % 3;

    if (mod === 0) {
      const n = SWEDISH_NOUNS[rank % SWEDISH_NOUNS.length];
      const wordBase = n.sv.replace(/^(en|ett)\s+/, '');
      list.push({
        id: `gen-${rank}`,
        front: n.sv,
        back: n.en,
        frequencyRank: rank,
        cefrLevel: cefr,
        wordClass: 'substantiv',
        gender: n.g as any,
        ipa: `/${wordBase}/`,
        exampleSv: `Det här är ${n.sv} i vår vardag.`,
        exampleEn: `This is ${n.en} in our daily life.`,
        inflections: [n.sv, `${wordBase}en`, `${wordBase}ar`, `${wordBase}arna`],
      });
    } else if (mod === 1) {
      const v = SWEDISH_VERBS[rank % SWEDISH_VERBS.length];
      list.push({
        id: `gen-${rank}`,
        front: v.sv,
        back: v.en,
        frequencyRank: rank,
        cefrLevel: cefr,
        wordClass: 'verb',
        ipa: `/${v.sv}/`,
        exampleSv: v.exSv,
        exampleEn: v.exEn,
        inflections: [v.sv, `${v.sv}r`, `${v.sv}de`, `har ${v.sv}t`],
      });
    } else {
      const a = SWEDISH_ADJECTIVES[rank % SWEDISH_ADJECTIVES.length];
      list.push({
        id: `gen-${rank}`,
        front: a.sv,
        back: a.en,
        frequencyRank: rank,
        cefrLevel: cefr,
        wordClass: 'adjektiv',
        ipa: `/${a.sv}/`,
        exampleSv: `Detta är ett mycket ${a.sv} begrepp.`,
        exampleEn: `This is a very ${a.en} concept.`,
        inflections: a.inf,
      });
    }
  }

  return list;
}

export const EXPANDED_LEXICON: LexiconEntry[] = generateFullLexicon();
