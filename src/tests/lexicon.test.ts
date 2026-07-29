import { describe, it, expect } from 'vitest';
import { MASTER_LEXICON, getEntriesByCEFR, getEntriesByFrequencyRange, searchLexicon } from '../data/lexicon';
import { TIER1_FOUNDATION } from '../data/decks/tier1_foundation';
import { TIER2_EVERYDAY } from '../data/decks/tier2_everyday';
import { TIER3_FLUENT } from '../data/decks/tier3_fluent';
import { TIER4_MASTERY } from '../data/decks/tier4_mastery';

describe('Muninn Lexicon Dataset & Tier Architecture', () => {
  it('exports non-empty modular tier datasets', () => {
    expect(TIER1_FOUNDATION.length).toBeGreaterThan(0);
    expect(TIER2_EVERYDAY.length).toBeGreaterThan(0);
    expect(TIER3_FLUENT.length).toBeGreaterThan(0);
    expect(TIER4_MASTERY.length).toBeGreaterThan(0);
  });

  it('combines all tier datasets into MASTER_LEXICON', () => {
    const totalTierEntries =
      TIER1_FOUNDATION.length +
      TIER2_EVERYDAY.length +
      TIER3_FLUENT.length +
      TIER4_MASTERY.length;
    expect(MASTER_LEXICON.length).toBe(totalTierEntries);
  });

  it('verifies paired pronoun cards in Tier 1 Foundation', () => {
    const pairedPronouns = TIER1_FOUNDATION.filter(e => e.wordClass === 'pronoun');
    expect(pairedPronouns.length).toBeGreaterThanOrEqual(8);
    
    // Check specific paired pronouns
    const jagMig = pairedPronouns.find(e => e.front === 'jag / mig');
    const duDig = pairedPronouns.find(e => e.front === 'du / dig');
    const hanHonom = pairedPronouns.find(e => e.front === 'han / honom');
    const honHenne = pairedPronouns.find(e => e.front === 'hon / henne');

    expect(jagMig).toBeDefined();
    expect(duDig).toBeDefined();
    expect(hanHonom).toBeDefined();
    expect(honHenne).toBeDefined();
  });

  it('ensures every lexicon entry contains mandatory SLA metadata', () => {
    MASTER_LEXICON.forEach(entry => {
      expect(entry.id).toBeDefined();
      expect(entry.front).toBeTruthy();
      expect(entry.back).toBeTruthy();
      expect(typeof entry.frequencyRank).toBe('number');
      expect(entry.frequencyRank).toBeGreaterThan(0);
      expect(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']).toContain(entry.cefrLevel);
      expect(entry.ipa).toMatch(/^\/.*\/$/); // IPA surrounded by slashes
      expect(entry.exampleSv).toBeTruthy();
      expect(entry.exampleEn).toBeTruthy();
      expect(Array.isArray(entry.inflections)).toBe(true);
      expect(entry.inflections.length).toBeGreaterThan(0);

      // If noun, gender must be 'en' or 'ett'
      if (entry.wordClass === 'noun') {
        expect(['en', 'ett']).toContain(entry.gender);
      }
    });
  });

  it('filters lexicon entries by CEFR level correctly', () => {
    const a1Entries = getEntriesByCEFR('A1');
    expect(a1Entries.length).toBeGreaterThan(0);
    a1Entries.forEach(entry => {
      expect(entry.cefrLevel).toBe('A1');
    });

    const c2Entries = getEntriesByCEFR('C2');
    expect(c2Entries.length).toBeGreaterThan(0);
    c2Entries.forEach(entry => {
      expect(entry.cefrLevel).toBe('C2');
    });
  });

  it('filters lexicon entries by frequency rank range', () => {
    const top50 = getEntriesByFrequencyRange(1, 50);
    expect(top50.length).toBeGreaterThan(0);
    top50.forEach(entry => {
      expect(entry.frequencyRank).toBeGreaterThanOrEqual(1);
      expect(entry.frequencyRank).toBeLessThanOrEqual(50);
    });
  });

  it('searches lexicon by Swedish and English keywords', () => {
    const searchResSv = searchLexicon('hund');
    expect(searchResSv.length).toBeGreaterThan(0);

    const searchResEn = searchLexicon('house');
    expect(searchResEn.length).toBeGreaterThan(0);
  });
});
