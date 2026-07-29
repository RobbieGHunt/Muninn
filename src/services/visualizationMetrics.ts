import { Card } from '../types';
import { LEXICON_CARDS } from '../data/lexicon';

export type GlacierTierKey = 'transient' | 'anchored' | 'deepMemory' | 'unshakeable';

export interface GlacierTierInfo {
  key: GlacierTierKey;
  nameSv: string;
  nameEn: string;
  minDays: number;
  maxDays: number; // Infinity for unshakeable
}

export const GLACIER_TIERS: Record<GlacierTierKey, GlacierTierInfo> = {
  transient: {
    key: 'transient',
    nameSv: 'Färsk',
    nameEn: 'Transient',
    minDays: 0,
    maxDays: 3,
  },
  anchored: {
    key: 'anchored',
    nameSv: 'Förankrad',
    nameEn: 'Anchored',
    minDays: 3,
    maxDays: 21,
  },
  deepMemory: {
    key: 'deepMemory',
    nameSv: 'Djupminne',
    nameEn: 'Deep Memory',
    minDays: 21,
    maxDays: 90,
  },
  unshakeable: {
    key: 'unshakeable',
    nameSv: 'Orubblig',
    nameEn: 'Unshakeable',
    minDays: 90,
    maxDays: Infinity,
  },
};

/**
 * Classifies an FSRS Memory Stability value (S in days) into a Glacier Tier.
 * - Transient (Färsk): S < 3 days
 * - Anchored (Förankrad): 3 <= S < 21 days
 * - Deep Memory (Djupminne): 21 <= S < 90 days
 * - Unshakeable (Orubblig): S >= 90 days
 */
export function getGlacierTier(stability: number): GlacierTierInfo {
  if (stability < 3) {
    return GLACIER_TIERS.transient;
  }
  if (stability < 21) {
    return GLACIER_TIERS.anchored;
  }
  if (stability < 90) {
    return GLACIER_TIERS.deepMemory;
  }
  return GLACIER_TIERS.unshakeable;
}

/**
 * Returns helper tier key name string for simple comparisons.
 */
export function getGlacierTierKey(stability: number): GlacierTierKey {
  return getGlacierTier(stability).key;
}

export interface GlacierDistribution {
  transient: number;
  anchored: number;
  deepMemory: number;
  unshakeable: number;
  totalLearned: number;
}

/**
 * Calculates distribution of learned cards (state > 0) across Glacier tiers.
 */
export function calculateGlacierDistribution(cards: Card[]): GlacierDistribution {
  const learnedCards = cards.filter((c) => c.state > 0);
  const dist: GlacierDistribution = {
    transient: 0,
    anchored: 0,
    deepMemory: 0,
    unshakeable: 0,
    totalLearned: learnedCards.length,
  };

  for (const card of learnedCards) {
    const tierKey = getGlacierTierKey(card.stability);
    dist[tierKey]++;
  }

  return dist;
}

/**
 * Calculates the highest frequency rank ("You Are Here") among learned cards (state > 0).
 * Returns 0 if no cards have been learned.
 */
export function calculateHighestLearnedRank(cards: Card[]): number {
  const learnedCards = cards.filter((c) => c.state > 0);
  if (learnedCards.length === 0) {
    return 0;
  }

  let maxRank = 0;
  for (const card of learnedCards) {
    const rank = card.frequencyRank ?? 0;
    if (rank > maxRank) {
      maxRank = rank;
    }
  }

  return maxRank;
}

/**
 * Calculates real-world comprehension percentage relative to master lexicon total.
 * @param learnedCount Number of learned cards/words (state > 0 or state === 2)
 * @param masterTotal Total cards in master lexicon (defaults to LEXICON_CARDS.length)
 * @param decimals Number of decimal places to format/round to (default: 2)
 */
export function calculateComprehensionPercentage(
  learnedCount: number,
  masterTotal: number = LEXICON_CARDS.length,
  decimals: number = 2
): number {
  if (!masterTotal || masterTotal <= 0) {
    return 0;
  }
  const rawPercentage = (learnedCount / masterTotal) * 100;
  const factor = Math.pow(10, decimals);
  return Math.round(rawPercentage * factor) / factor;
}

/**
 * Calculates real-world comprehension percentage directly from user cards array relative to master lexicon.
 * @param cards User cards array
 * @param masterTotal Total cards in master lexicon (defaults to LEXICON_CARDS.length)
 * @param learnedOnlyStates Filter function or array of learned states (default: state > 0)
 */
export function calculateCardsComprehensionPercentage(
  cards: Card[],
  masterTotal: number = LEXICON_CARDS.length,
  decimals: number = 2
): number {
  const learnedCount = cards.filter((c) => c.state > 0).length;
  return calculateComprehensionPercentage(learnedCount, masterTotal, decimals);
}
