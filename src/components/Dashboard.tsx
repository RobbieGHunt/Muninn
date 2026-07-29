import React, { useState, useEffect } from 'react';
import { QueueStats, UserStats, Deck, Card, CEFRLevel, UserSettings } from '../types';
import { LEXICON_CARDS } from '../data/lexicon';

interface DashboardProps {
  queueStats: QueueStats;
  userStats: UserStats;
  decks: Deck[];
  selectedDeckId: string;
  onSelectDeck: (deckId: string) => void;
  onStartStudy: () => void;
  onStartBonusStudy: () => void;
  cards?: Card[];
  wordsLearnedCount?: number;
  settings?: UserSettings;
}

export type VisMode = 'horisonten' | 'lasforstaelse' | 'minnesberget';

export const Dashboard: React.FC<DashboardProps> = ({
  queueStats,
  userStats,
  decks,
  selectedDeckId,
  onSelectDeck,
  onStartStudy,
  onStartBonusStudy,
  cards = [],
  wordsLearnedCount,
  settings,
}) => {
  // Visualization mode state with localStorage persistence
  const [visMode, setVisMode] = useState<VisMode>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = localStorage.getItem('muninn_vis_mode');
      if (saved === 'horisonten' || saved === 'lasforstaelse' || saved === 'minnesberget') {
        return saved as VisMode;
      }
    }
    return 'horisonten';
  });

  const handleSelectVisMode = (mode: VisMode) => {
    setVisMode(mode);
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('muninn_vis_mode', mode);
    }
  };

  const totalDueToday = queueStats.newCount + queueStats.learningCount + queueStats.reviewCount;
  const bonusExtraCount = settings?.bonusExtraCards ?? 15;

  // Selected deck cards
  const selectedDeckCards = cards.filter((c) => c.deckId === selectedDeckId);
  const displayCards = selectedDeckCards.length > 0 ? selectedDeckCards : cards;

  // Unseen cards counts in global master catalog (LEXICON_CARDS)
  const learnedCardIds = new Set(cards.filter((c) => c.state > 0).map((c) => c.id));
  const totalUnseenLexicon = LEXICON_CARDS.filter((c) => !learnedCardIds.has(c.id)).length;
  const selectedDeckUnseenCount = LEXICON_CARDS.filter(
    (c) => c.deckId === selectedDeckId && !learnedCardIds.has(c.id)
  ).length;

  // Calculate total learned words if not passed as explicit prop
  const totalLearned =
    wordsLearnedCount !== undefined
      ? wordsLearnedCount
      : cards.filter((c) => c.state === 2).length;

  // Mastered / Reviewed cards (state === 2)
  const reviewedCards = cards.filter((c) => c.state === 2);

  // Generate GitHub-style heatmap data for 12 weeks (84 days)
  const generateHeatmapDays = () => {
    const days = [];
    const today = new Date();
    for (let i = 83; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const count = userStats.history[dateStr] || 0;
      days.push({ date: dateStr, count });
    }
    return days;
  };

  const heatmapDays = generateHeatmapDays();

  // Heatmap cell color helper
  const getHeatmapColor = (count: number) => {
    if (count === 0) return 'bg-[#161F33] border-[#263554]';
    if (count < 5) return 'bg-[#06B6D4]/30 border-[#06B6D4]/50 text-[#06B6D4]';
    if (count < 15) return 'bg-[#06B6D4]/60 border-[#06B6D4] text-white';
    return 'bg-[#00D2FF] border-[#00D2FF] text-[#0F172A] shadow-sm shadow-[#00D2FF]/40';
  };

  // CEFR Badge Color Helper
  const renderCefrBadge = (level: CEFRLevel | string) => {
    const l = (level || 'A1').toUpperCase() as CEFRLevel;
    const colors: Record<string, string> = {
      A1: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300',
      A2: 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300',
      B1: 'bg-amber-500/15 border-amber-500/40 text-amber-300',
      B2: 'bg-orange-500/15 border-orange-500/40 text-orange-300',
      C1: 'bg-purple-500/15 border-purple-500/40 text-purple-300',
      C2: 'bg-pink-500/15 border-pink-500/40 text-pink-300',
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-black tracking-wider uppercase border shadow-sm ${colors[l] || colors.A1}`}>
        CEFR {l}
      </span>
    );
  };

  // Calculate Frequency Tier Distribution for master lexicon
  const frequencyTiers = [
    {
      id: 'tier-core',
      name: 'Kärnord (Top 1–50)',
      rangeMin: 1,
      rangeMax: 50,
      description: 'Mest frekventa grundorden i svenska',
      color: '#00D2FF',
      bgColor: 'bg-[#00D2FF]/10',
      borderColor: 'border-[#00D2FF]/30',
      progressColor: 'from-[#00D2FF] to-[#3A7BD5]',
    },
    {
      id: 'tier-everyday',
      name: 'Vardagsord (Top 51–200)',
      rangeMin: 51,
      rangeMax: 200,
      description: 'Vanliga samtal och vardagliga uttryck',
      color: '#10B981',
      bgColor: 'bg-[#10B981]/10',
      borderColor: 'border-[#10B981]/30',
      progressColor: 'from-[#10B981] to-[#06B6D4]',
    },
    {
      id: 'tier-extended',
      name: 'Utökad Vokabulär (Top 201–500)',
      rangeMin: 201,
      rangeMax: 500,
      description: 'Mellannivå och nyanserade begrepp',
      color: '#F59E0B',
      bgColor: 'bg-[#F59E0B]/10',
      borderColor: 'border-[#F59E0B]/30',
      progressColor: 'from-[#F59E0B] to-[#F97316]',
    },
    {
      id: 'tier-advanced',
      name: 'Fördjupad (Top 501+)',
      rangeMin: 501,
      rangeMax: 9999,
      description: 'Avancerad vokabulär och fackuttryck',
      color: '#A855F7',
      bgColor: 'bg-[#A855F7]/10',
      borderColor: 'border-[#A855F7]/30',
      progressColor: 'from-[#A855F7] to-[#EC4899]',
    },
  ];

  // Helper to compute stats for each tier relative to LEXICON_CARDS (global master catalog)
  const tierStats = frequencyTiers.map((tier) => {
    const globalTierCards = LEXICON_CARDS.filter((c) => {
      const rank = c.frequencyRank ?? (parseInt(c.id.replace(/\D/g, ''), 10) || 1);
      return rank >= tier.rangeMin && rank <= tier.rangeMax;
    });
    const total = globalTierCards.length;

    const userTierCards = cards.filter((c) => {
      const rank = c.frequencyRank ?? (parseInt(c.id.replace(/\D/g, ''), 10) || 1);
      return rank >= tier.rangeMin && rank <= tier.rangeMax;
    });
    const reviewed = userTierCards.filter((c) => c.state === 2).length;
    const learning = userTierCards.filter((c) => c.state === 1 || c.state === 3).length;
    const newCount = Math.max(0, total - reviewed - learning);
    const percent = total > 0 ? Math.round((reviewed / total) * 100) : 0;

    return {
      ...tier,
      total,
      reviewed,
      learning,
      newCount,
      percent,
    };
  });

  // MODE 1: HORISONTEN MATH
  // Highest & median frequency ranks among mastered words
  const maxMasteredRank = reviewedCards.length > 0
    ? Math.max(...reviewedCards.map((c) => c.frequencyRank || 1))
    : 1;

  const currentRankPointer = maxMasteredRank > 1 ? maxMasteredRank : 1;
  const maxLexiconRank = 6000;
  // Position percentage on log scale (Rank 1 = 0%, Rank 6000 = 100%)
  const rankPointerPercent = Math.min(
    100,
    Math.max(3, Math.round((Math.log(currentRankPointer) / Math.log(maxLexiconRank)) * 100))
  );

  // MODE 2: LÄSFÖRSTÅELSE MATH
  const cefrLevels: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  const cefrStats = cefrLevels
    .map((lvl) => {
      const globalLvlCards = LEXICON_CARDS.filter((c) => (c.cefrLevel || 'A1').toUpperCase() === lvl);
      const total = globalLvlCards.length;
      const userLvlCards = cards.filter((c) => (c.cefrLevel || 'A1').toUpperCase() === lvl);
      const reviewed = userLvlCards.filter((c) => c.state === 2).length;
      const learned = userLvlCards.filter((c) => c.state > 0).length;
      const percent = total > 0 ? Math.round((reviewed / total) * 100) : 0;
      return { level: lvl, total, reviewed, learned, percent };
    })
    .filter((s) => s.total > 0);

  const mediaCutoffs = [
    {
      id: 'a1-cutoff',
      level: 'A1',
      title: 'Barnböcker & Skyltar',
      cutoffTarget: 80,
      color: 'emerald',
      strokeColor: '#10B981',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      icon: '🟢',
      description: 'Enkla barnböcker, gatu- och butiksskyltar samt korta grundläggande meddelanden.',
      stat: cefrStats.find((s) => s.level === 'A1')?.percent || 0,
    },
    {
      id: 'a2-cutoff',
      level: 'A2',
      title: '8 Sidor & Vardagsprat',
      cutoffTarget: 85,
      color: 'cyan',
      strokeColor: '#06B6D4',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      icon: '🔵',
      description: 'Lättläst nyhetsrapportering (8 Sidor), enkla mejl och informella vardagssamtal.',
      stat: cefrStats.find((s) => s.level === 'A2')?.percent || 0,
    },
    {
      id: 'b1b2-cutoff',
      level: 'B1/B2',
      title: 'SVT Nyheter & Poddar',
      cutoffTarget: 90,
      color: 'purple',
      strokeColor: '#A855F7',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      icon: '🟣',
      description: 'SVT Nyheter, riksradio, populära poddar och offentliga artiklar.',
      stat: Math.round(
        (((cefrStats.find((s) => s.level === 'B1')?.percent || 0) +
          (cefrStats.find((s) => s.level === 'B2')?.percent || 0)) /
          2)
      ),
    },
    {
      id: 'c1c2-cutoff',
      level: 'C1/C2',
      title: 'Svensk Litteratur & Tidningar',
      cutoffTarget: 95,
      color: 'pink',
      strokeColor: '#EC4899',
      badgeColor: 'bg-pink-500/20 text-pink-300 border-pink-500/40',
      icon: '🌟',
      description: 'Skönlitteratur, Dagens Nyheter, Svenska Dagbladet och akademiska vetenskapsartiklar.',
      stat: Math.round(
        (((cefrStats.find((s) => s.level === 'C1')?.percent || 0) +
          (cefrStats.find((s) => s.level === 'C2')?.percent || 0)) /
          2)
      ),
    },
  ];

  // MODE 3: MINNESBERGET MATH (FSRS Memory Stability Tiers)
  // 1. Färsk (< 3d stability or state 0/1/3)
  // 2. Förankrad (3d - 14d stability)
  // 3. Djupminne (15d - 60d stability)
  // 4. Orubblig (> 60d stability)
  const countFarsk = cards.filter(
    (c) => c.state === 0 || c.state === 1 || c.state === 3 || (c.state === 2 && (c.stability ?? 0) < 3)
  ).length;

  const countForankrad = cards.filter(
    (c) => c.state === 2 && (c.stability ?? 0) >= 3 && (c.stability ?? 0) < 15
  ).length;

  const countDjupminne = cards.filter(
    (c) => c.state === 2 && (c.stability ?? 0) >= 15 && (c.stability ?? 0) < 60
  ).length;

  const countOrubblig = cards.filter(
    (c) => c.state === 2 && (c.stability ?? 0) >= 60
  ).length;

  const totalUserCardsCount = Math.max(1, cards.length);

  // Weekly promotion velocity count: cards reaching Djupminne/Orubblig (stability >= 15) reviewed within last 7 days
  const oneWeekAgo = Date.now() - 7 * 86400 * 1000;
  const weeklyPromotedCount = cards.filter(
    (c) => c.state === 2 && (c.stability ?? 0) >= 15 && c.lastReview !== undefined && c.lastReview >= oneWeekAgo
  ).length;

  return (
    <div className="nordic-container space-y-8 py-6 px-4 sm:px-6 max-w-6xl mx-auto">
      
      {/* ================= HERO & START STUDY CALLOUT ================= */}
      <div className="glass-card bg-[#161F33]/90 border border-[#263554] rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-2xl backdrop-blur-md">
        {/* Glow backdrop behind hero */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[#00D2FF]/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {renderCefrBadge(decks.find((d) => d.id === selectedDeckId)?.cefrLevel || 'A1')}
              <span className="text-xs text-[#94A3B8] font-semibold">Vald Kortlek & CEFR</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Välkommen tillbaka!
            </h1>
            <p className="text-sm sm:text-base text-[#94A3B8] max-w-lg">
              {totalDueToday > 0 ? (
                <>
                  Du har <span className="text-[#00D2FF] font-bold">{totalDueToday} kort</span> som väntar på repetition idag. Stärk din ordkunskap i svenska!
                </>
              ) : (
                <>
                  Du har slutfört alla dagens repetitioner! 🎉 Fortsätt hålla din svit levande eller ta en snabb-repetition.
                </>
              )}
            </p>
          </div>

          {/* Action Buttons: Main Daily Study + Bonus Extra Session */}
          <div className="w-full md:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={onStartStudy}
              className={`min-h-[52px] px-6 py-3.5 text-sm sm:text-base font-extrabold rounded-xl flex items-center justify-center gap-2.5 shadow-xl transition-all focus:outline-none focus:ring-2 focus:ring-[#00D2FF] active:scale-98 cursor-pointer ${
                totalDueToday > 0
                  ? 'bg-gradient-to-r from-[#00D2FF] to-[#3A7BD5] text-[#0F172A] shadow-[#00D2FF]/20 hover:brightness-110'
                  : 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-[#0F172A] shadow-emerald-500/20 hover:brightness-110'
              }`}
              aria-label={totalDueToday > 0 ? 'Starta dagens repetitionssession' : 'Starta snabb-repetition'}
            >
              {totalDueToday > 0 ? (
                <>
                  <svg className="w-5 h-5 text-[#0F172A]" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  <span>Starta Dagens Repetition</span>
                  <span className="text-xs bg-[#0F172A]/20 px-2.5 py-1 rounded-full font-bold">
                    {totalDueToday}
                  </span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 text-[#0F172A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Snabb-repetition ⚡</span>
                </>
              )}
            </button>

            <div className="flex flex-col items-center gap-1 w-full sm:w-auto">
              <button
                onClick={onStartBonusStudy}
                className="w-full sm:w-auto min-h-[52px] px-5 py-3.5 text-sm font-extrabold rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-[#00D2FF] bg-[#1E293B] hover:bg-[#263554] border border-[#00D2FF]/40 hover:border-[#00D2FF] text-white hover:shadow-[#00D2FF]/10 active:scale-98 cursor-pointer"
                title="Studera extra nya ord utöver den dagliga gränsen"
                aria-label="Studera extra ord utöver dagliga gränsen"
              >
                <span>Studera extra ord 🚀</span>
                <span className="text-xs bg-[#00D2FF]/20 text-[#00D2FF] px-2 py-0.5 rounded-full font-bold">
                  +{bonusExtraCount} Nya
                </span>
              </button>
              <span className="text-[10px] text-[#94A3B8]">
                {selectedDeckUnseenCount > 0
                  ? `${selectedDeckUnseenCount} oinledda i kortleken`
                  : totalUnseenLexicon > 0
                  ? `${totalUnseenLexicon} oinledda i lexikonet`
                  : '0 oinledda ord'}
              </span>
            </div>
          </div>
        </div>

        {/* QUEUE METRICS GRID (4 Columns including Total Words Learned) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-8 pt-6 border-t border-[#263554]/60">
          
          {/* Words Learned Metric Card */}
          <div className="p-4 rounded-xl bg-[#0F172A]/80 border border-[#00D2FF]/30 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-[#00D2FF] uppercase tracking-wider">Ord Inlärda</p>
              <p className="text-2xl sm:text-3xl font-black text-white mt-0.5">{totalLearned}</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-[#00D2FF]/15 border border-[#00D2FF]/30 flex items-center justify-center text-[#00D2FF] text-base">
              🎓
            </div>
          </div>

          {/* New Cards (Unseen Pool) */}
          <div className="p-4 rounded-xl bg-[#083344]/40 border border-[#06B6D4]/30 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-[#06B6D4] uppercase tracking-wider">Nya Kort (Oinledda)</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-white mt-0.5">{queueStats.newCount}</p>
              <p className="text-[10px] text-[#94A3B8] mt-0.5">
                {totalUnseenLexicon} totalt i lexikonet
              </p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-[#06B6D4]/20 border border-[#06B6D4]/40 flex items-center justify-center text-[#06B6D4] text-base">
              ✨
            </div>
          </div>

          {/* Learning Cards */}
          <div className="p-4 rounded-xl bg-[#451A03]/40 border border-[#F59E0B]/30 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-[#F59E0B] uppercase tracking-wider">Under Inlärning</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-white mt-0.5">{queueStats.learningCount}</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-[#F59E0B]/20 border border-[#F59E0B]/40 flex items-center justify-center text-[#F59E0B] text-base">
              🔄
            </div>
          </div>

          {/* Review Cards */}
          <div className="p-4 rounded-xl bg-[#064E3B]/40 border border-[#10B981]/30 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-[#10B981] uppercase tracking-wider">För Repetition</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-white mt-0.5">{queueStats.reviewCount}</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-[#10B981]/20 border border-[#10B981]/40 flex items-center justify-center text-[#10B981] text-base">
              🧠
            </div>
          </div>

        </div>
      </div>

      {/* ================= PERMANENT HEATMAP ("NORDISK RYTM") ================= */}
      <div className="bg-[#161F33]/90 border border-[#263554] rounded-2xl p-6 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-[#263554]/60">
          <div>
            <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <span className="text-2xl">⚡</span>
              <span>Nordisk Rytm</span>
              <span className="text-xs text-[#00D2FF] font-semibold bg-[#00D2FF]/10 px-2.5 py-0.5 rounded-full border border-[#00D2FF]/30">
                12-veckors Aktivitet
              </span>
            </h2>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              Permanenta repetitionstrender och daglig studiekontinuitet
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
            <span>Mindre</span>
            <div className="w-3.5 h-3.5 rounded bg-[#161F33] border border-[#263554]" title="0 repetitioner" />
            <div className="w-3.5 h-3.5 rounded bg-[#06B6D4]/40" title="1-4 repetitioner" />
            <div className="w-3.5 h-3.5 rounded bg-[#06B6D4]/70" title="5-14 repetitioner" />
            <div className="w-3.5 h-3.5 rounded bg-[#00D2FF] shadow-sm shadow-[#00D2FF]/40" title="15+ repetitioner" />
            <span>Mer</span>
          </div>
        </div>

        {/* Heatmap Grid (7 rows x 12 columns) */}
        <div className="overflow-x-auto pb-2">
          <div className="inline-grid grid-rows-7 grid-flow-col gap-1.5 min-w-[500px]">
            {heatmapDays.map((d, idx) => (
              <div
                key={idx}
                title={`${d.date}: ${d.count} repetitioner`}
                className={`w-3.5 h-3.5 rounded-[3px] border transition-all hover:scale-125 ${getHeatmapColor(d.count)}`}
              />
            ))}
          </div>
        </div>

        {/* Stat Badges Row */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[#263554]/60 text-center">
          <div className="p-3.5 rounded-xl bg-[#0F172A]/70 border border-[#263554]">
            <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Dagar I Rad</p>
            <p className="text-xl font-extrabold text-amber-400 mt-0.5">{userStats.streak} 🔥</p>
          </div>
          <div className="p-3.5 rounded-xl bg-[#0F172A]/70 border border-[#263554]">
            <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Retentionsgrad</p>
            <p className="text-xl font-extrabold text-[#10B981] mt-0.5">{userStats.retentionRate}%</p>
          </div>
          <div className="p-3.5 rounded-xl bg-[#0F172A]/70 border border-[#263554]">
            <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Totalt Repeterat</p>
            <p className="text-xl font-extrabold text-[#00D2FF] mt-0.5">{userStats.totalReviews}</p>
          </div>
        </div>
      </div>

      {/* ================= VISUALIZATION MODE SELECTOR (GLASS TAB BAR) ================= */}
      <div className="space-y-6">
        
        {/* Glass Tab Selector */}
        <div
          className="glass-card bg-[#161F33]/80 border border-[#263554] p-1.5 rounded-2xl shadow-xl backdrop-blur-md flex flex-col sm:flex-row items-stretch justify-between gap-1.5"
          role="tablist"
          aria-label="Visualiseringslägen för minnes- och vokabulärframsteg"
        >
          <button
            role="tab"
            aria-selected={visMode === 'horisonten'}
            aria-controls="vis-mode-panel"
            onClick={() => handleSelectVisMode('horisonten')}
            className={`flex-1 min-h-[48px] px-4 py-2.5 rounded-xl text-sm font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#00D2FF] ${
              visMode === 'horisonten'
                ? 'bg-gradient-to-r from-[#00D2FF] to-[#3A7BD5] text-[#0F172A] shadow-lg shadow-[#00D2FF]/20'
                : 'text-[#94A3B8] hover:text-white hover:bg-[#1E293B]/60'
            }`}
          >
            <span>📍 Horisonten</span>
          </button>

          <button
            role="tab"
            aria-selected={visMode === 'lasforstaelse'}
            aria-controls="vis-mode-panel"
            onClick={() => handleSelectVisMode('lasforstaelse')}
            className={`flex-1 min-h-[48px] px-4 py-2.5 rounded-xl text-sm font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#00D2FF] ${
              visMode === 'lasforstaelse'
                ? 'bg-gradient-to-r from-[#00D2FF] to-[#3A7BD5] text-[#0F172A] shadow-lg shadow-[#00D2FF]/20'
                : 'text-[#94A3B8] hover:text-white hover:bg-[#1E293B]/60'
            }`}
          >
            <span>📰 Läsförståelse</span>
          </button>

          <button
            role="tab"
            aria-selected={visMode === 'minnesberget'}
            aria-controls="vis-mode-panel"
            onClick={() => handleSelectVisMode('minnesberget')}
            className={`flex-1 min-h-[48px] px-4 py-2.5 rounded-xl text-sm font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#00D2FF] ${
              visMode === 'minnesberget'
                ? 'bg-gradient-to-r from-[#00D2FF] to-[#3A7BD5] text-[#0F172A] shadow-lg shadow-[#00D2FF]/20'
                : 'text-[#94A3B8] hover:text-white hover:bg-[#1E293B]/60'
            }`}
          >
            <span>🧊 Minnesberget</span>
          </button>
        </div>

        {/* TAB CONTENT PANELS */}
        <div id="vis-mode-panel" role="tabpanel" tabIndex={0}>
          
          {/* ================= MODE 1: HORISONTEN (VOCABULARY HORIZON SPECTRUM) ================= */}
          {visMode === 'horisonten' && (
            <div className="bg-[#161F33]/90 border border-[#263554] rounded-2xl p-6 shadow-2xl space-y-6 animate-fadeIn">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#263554]/60">
                <div>
                  <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                    <span className="text-2xl">📍</span>
                    <span>Vokabulärhorisont (Frequency Spectrum)</span>
                  </h2>
                  <p className="text-xs text-[#94A3B8] mt-0.5">
                    Kontinuerligt frekvensspektrum från Rank 1 till 6,000+ med din aktuella position
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-[#00D2FF] bg-[#00D2FF]/10 px-3 py-1 rounded-full border border-[#00D2FF]/30">
                    Max Frekvens-Rank: #{currentRankPointer}
                  </span>
                </div>
              </div>

              {/* Continuous Frequency Spectrum Bar with "You Are Here" Pointer */}
              <div className="space-y-4 pt-2">
                
                {/* Pointer Tag */}
                <div className="relative h-9">
                  <div
                    className="absolute transform -translate-x-1/2 flex flex-col items-center transition-all duration-700"
                    style={{ left: `${rankPointerPercent}%` }}
                  >
                    <div className="bg-[#00D2FF] text-[#0F172A] text-xs font-black px-2.5 py-1 rounded-md shadow-lg shadow-[#00D2FF]/30 whitespace-nowrap flex items-center gap-1">
                      <span>📍 Du är här</span>
                      <span className="text-[10px] bg-[#0F172A]/20 px-1 rounded">#{currentRankPointer}</span>
                    </div>
                    <div className="w-0 h-0 border-l-4 border-r-4 border-t-6 border-l-transparent border-r-transparent border-t-[#00D2FF]" />
                  </div>
                </div>

                {/* Multi-colored Spectrum Bar with Tier Density Shading */}
                <div className="relative w-full h-8 rounded-xl overflow-hidden p-1 bg-[#0F172A] border border-[#263554] flex">
                  
                  {/* Core Tier 1-50 */}
                  <div
                    className="h-full bg-[#00D2FF] relative transition-all"
                    style={{ width: '15%' }}
                    title="Kärnord (Rank 1-50)"
                  >
                    <div
                      className="absolute inset-0 bg-[#0F172A] opacity-30"
                      style={{ width: `${100 - (tierStats[0]?.percent || 0)}%`, right: 0, left: 'auto' }}
                    />
                  </div>

                  {/* Everyday Tier 51-200 */}
                  <div
                    className="h-full bg-[#10B981] relative transition-all"
                    style={{ width: '25%' }}
                    title="Vardagsord (Rank 51-200)"
                  >
                    <div
                      className="absolute inset-0 bg-[#0F172A] opacity-30"
                      style={{ width: `${100 - (tierStats[1]?.percent || 0)}%`, right: 0, left: 'auto' }}
                    />
                  </div>

                  {/* Extended Tier 201-500 */}
                  <div
                    className="h-full bg-[#F59E0B] relative transition-all"
                    style={{ width: '30%' }}
                    title="Utökad Vokabulär (Rank 201-500)"
                  >
                    <div
                      className="absolute inset-0 bg-[#0F172A] opacity-30"
                      style={{ width: `${100 - (tierStats[2]?.percent || 0)}%`, right: 0, left: 'auto' }}
                    />
                  </div>

                  {/* Advanced Tier 501+ */}
                  <div
                    className="h-full bg-[#A855F7] relative transition-all"
                    style={{ width: '30%' }}
                    title="Fördjupad (Rank 501+)"
                  >
                    <div
                      className="absolute inset-0 bg-[#0F172A] opacity-30"
                      style={{ width: `${100 - (tierStats[3]?.percent || 0)}%`, right: 0, left: 'auto' }}
                    />
                  </div>
                </div>

                {/* Rank Markers Below Bar */}
                <div className="flex items-center justify-between text-[11px] text-[#94A3B8] font-bold px-1">
                  <span className="text-[#00D2FF]">Rank 1</span>
                  <span className="text-[#10B981]">Rank 50</span>
                  <span className="text-[#F59E0B]">Rank 200</span>
                  <span className="text-[#A855F7]">Rank 500</span>
                  <span>Rank 6000+</span>
                </div>
              </div>

              {/* Tier Progress Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {tierStats.map((tier) => (
                  <div
                    key={tier.id}
                    className={`p-4 rounded-xl ${tier.bgColor} border ${tier.borderColor} space-y-3 transition-all hover:brightness-105`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: tier.color }} />
                          {tier.name}
                        </h3>
                        <p className="text-[11px] text-[#94A3B8] mt-0.5">{tier.description}</p>
                      </div>
                      <span className="text-sm font-black text-white px-2.5 py-1 rounded-lg bg-[#0F172A] border border-[#263554]">
                        {tier.percent}%
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div
                        className="w-full bg-[#0F172A] h-3 rounded-full overflow-hidden p-0.5 border border-[#263554]"
                        role="progressbar"
                        aria-valuenow={tier.percent}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${tier.name} framsteg ${tier.percent}%`}
                      >
                        <div
                          className={`bg-gradient-to-r ${tier.progressColor} h-full rounded-full transition-all duration-700`}
                          style={{ width: `${tier.percent}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-[#94A3B8] font-medium pt-0.5">
                        <span>{tier.reviewed} av {tier.total} ord behärskade ({tier.percent}%)</span>
                        <span>{tier.total - tier.reviewed} återstår</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* ================= MODE 2: LÄSFÖRSTÅELSE (SWEDISH MEDIA COMPREHENSION CUTOFFS) ================= */}
          {visMode === 'lasforstaelse' && (
            <div className="bg-[#161F33]/90 border border-[#263554] rounded-2xl p-6 shadow-2xl space-y-6 animate-fadeIn">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#263554]/60">
                <div>
                  <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                    <span className="text-2xl">📰</span>
                    <span>Läsförståelse i Verklig Svensk Media</span>
                  </h2>
                  <p className="text-xs text-[#94A3B8] mt-0.5">
                    Uppskattad texttäckning och förståelsetrösklar i riktiga svenska källor
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-[#10B981] bg-[#10B981]/10 px-3 py-1 rounded-full border border-[#10B981]/30">
                    Totalt Inlärda: {totalLearned} Ord
                  </span>
                </div>
              </div>

              {/* Grid of 4 Media Cutoff Progress Cards with SVG Radial Arcs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {mediaCutoffs.map((item) => {
                  const isUnlocked = item.stat >= item.cutoffTarget || (item.stat > 0 && totalLearned >= 500 && item.level === 'A1');
                  const radius = 32;
                  const circumference = 2 * Math.PI * radius;
                  const progressValue = Math.min(100, Math.max(0, item.stat));
                  const strokeDashoffset = circumference - (progressValue / 100) * circumference;

                  return (
                    <div
                      key={item.id}
                      className="p-5 rounded-xl bg-[#0F172A]/90 border border-[#263554] flex flex-col justify-between space-y-4 shadow-lg hover:border-[#00D2FF]/40 transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{item.icon}</span>
                            <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${item.badgeColor}`}>
                              {item.cutoffTarget}% {item.level} Tröskel
                            </span>
                            {isUnlocked ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                🔓 Upplåst
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#161F33] text-[#94A3B8] border border-[#263554]">
                                🔒 Pågår
                              </span>
                            )}
                          </div>
                          <h3 className="text-base font-extrabold text-white pt-1">{item.title}</h3>
                          <p className="text-xs text-[#94A3B8] leading-relaxed">{item.description}</p>
                        </div>

                        {/* Radial Arc SVG Gauge */}
                        <div className="relative w-20 h-20 flex-shrink-0 flex items-center justify-center">
                          <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 80 80">
                            <circle
                              cx="40"
                              cy="40"
                              r={radius}
                              stroke="#161F33"
                              strokeWidth="8"
                              fill="transparent"
                            />
                            <circle
                              cx="40"
                              cy="40"
                              r={radius}
                              stroke={item.strokeColor}
                              strokeWidth="8"
                              strokeDasharray={circumference}
                              strokeDashoffset={strokeDashoffset}
                              strokeLinecap="round"
                              fill="transparent"
                              className="transition-all duration-1000 ease-out"
                            />
                          </svg>
                          <div className="absolute flex flex-col items-center justify-center text-center">
                            <span className="text-xs font-black text-white">{progressValue}%</span>
                            <span className="text-[9px] text-[#94A3B8]">Täckning</span>
                          </div>
                        </div>
                      </div>

                      {/* Coverage Progress Bar */}
                      <div className="space-y-1 pt-2 border-t border-[#263554]/60">
                        <div className="flex items-center justify-between text-[11px] font-semibold">
                          <span className="text-[#94A3B8]">Textförståelse</span>
                          <span className="text-white font-bold">{progressValue} / {item.cutoffTarget}%</span>
                        </div>
                        <div className="w-full bg-[#161F33] h-2 rounded-full overflow-hidden p-0.5 border border-[#263554]">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${Math.min(100, (progressValue / item.cutoffTarget) * 100)}%`,
                              backgroundColor: item.strokeColor,
                            }}
                          />
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* ================= MODE 3: MINNESBERGET (FSRS MEMORY STABILITY GLACIER) ================= */}
          {visMode === 'minnesberget' && (
            <div className="bg-[#161F33]/90 border border-[#263554] rounded-2xl p-6 shadow-2xl space-y-6 animate-fadeIn">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#263554]/60">
                <div>
                  <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                    <span className="text-2xl">🧊</span>
                    <span>Minnesberget (FSRS Stabilitetsglaciär)</span>
                  </h2>
                  <p className="text-xs text-[#94A3B8] mt-0.5">
                    Kortfördelning baserad på FSRS-4.5 minnesstabilitet (S-värde i dagar)
                  </p>
                </div>

                {/* Weekly Promotion Velocity Badge */}
                <div className="bg-[#00D2FF]/10 border border-[#00D2FF]/40 text-[#00D2FF] px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm">
                  <span>⚡</span>
                  <span>+{weeklyPromotedCount} ord befordrade till Djupminne denna vecka!</span>
                </div>
              </div>

              {/* 4 FSRS Memory Stability Glacier Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* 1. Färsk */}
                <div className="p-4 rounded-xl bg-[#0F172A]/90 border border-emerald-500/30 space-y-3 shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">🌱 Färsk</span>
                    <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-extrabold">
                      &lt; 3 dagar
                    </span>
                  </div>
                  <div>
                    <p className="text-3xl font-black text-white">{countFarsk}</p>
                    <p className="text-[11px] text-[#94A3B8] mt-0.5">
                      {Math.round((countFarsk / totalUserCardsCount) * 100)}% av dina ord
                    </p>
                  </div>
                  <p className="text-[11px] text-[#94A3B8] pt-2 border-t border-[#263554]">
                    Nya ord och kort under inlärning. Kräver täta repetitioner.
                  </p>
                </div>

                {/* 2. Förankrad */}
                <div className="p-4 rounded-xl bg-[#0F172A]/90 border border-cyan-500/30 space-y-3 shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">⚓ Förankrad</span>
                    <span className="text-xs bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full font-extrabold">
                      3–14 dagar
                    </span>
                  </div>
                  <div>
                    <p className="text-3xl font-black text-white">{countForankrad}</p>
                    <p className="text-[11px] text-[#94A3B8] mt-0.5">
                      {Math.round((countForankrad / totalUserCardsCount) * 100)}% av dina ord
                    </p>
                  </div>
                  <p className="text-[11px] text-[#94A3B8] pt-2 border-t border-[#263554]">
                    Etablerat korttidsminne med stabila repetitionsintervall.
                  </p>
                </div>

                {/* 3. Djupminne */}
                <div className="p-4 rounded-xl bg-[#0F172A]/90 border border-purple-500/30 space-y-3 shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">🔮 Djupminne</span>
                    <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full font-extrabold">
                      15–60 dagar
                    </span>
                  </div>
                  <div>
                    <p className="text-3xl font-black text-white">{countDjupminne}</p>
                    <p className="text-[11px] text-[#94A3B8] mt-0.5">
                      {Math.round((countDjupminne / totalUserCardsCount) * 100)}% av dina ord
                    </p>
                  </div>
                  <p className="text-[11px] text-[#94A3B8] pt-2 border-t border-[#263554]">
                    Långtidsminne med stark retentionsgrad och glesa repetitioner.
                  </p>
                </div>

                {/* 4. Orubblig */}
                <div className="p-4 rounded-xl bg-[#0F172A]/90 border border-amber-500/30 space-y-3 shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">💎 Orubblig</span>
                    <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-extrabold">
                      &gt; 60 dagar
                    </span>
                  </div>
                  <div>
                    <p className="text-3xl font-black text-white">{countOrubblig}</p>
                    <p className="text-[11px] text-[#94A3B8] mt-0.5">
                      {Math.round((countOrubblig / totalUserCardsCount) * 100)}% av dina ord
                    </p>
                  </div>
                  <p className="text-[11px] text-[#94A3B8] pt-2 border-t border-[#263554]">
                    Permanent grundad kunskap med maximal minnesbevaring.
                  </p>
                </div>

              </div>

              {/* FSRS Motor Info Card */}
              <div className="p-4 rounded-xl bg-[#0F172A]/70 border border-[#263554] space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-[#94A3B8] flex items-center gap-1.5">
                    <span>⚡</span> FSRS-4.5 Spacing Engine Parameters
                  </span>
                  <span className="text-[#10B981] font-bold">Målretention: 90%</span>
                </div>
                <div className="w-full bg-[#161F33] h-2.5 rounded-full overflow-hidden p-0.5 border border-[#263554]">
                  <div className="bg-gradient-to-r from-[#06B6D4] to-[#10B981] h-full w-[90%] rounded-full" />
                </div>
                <p className="text-[11px] text-[#64748B] italic pt-1">
                  FSRS beräknar din individuella glömskekurva för varje ord och anpassar intervallen dynamiskt.
                </p>
              </div>

            </div>
          )}

        </div>
      </div>

      {/* ================= CEFR CATEGORY PROGRESS CARDS ================= */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-white tracking-tight">CEFR-Nivåer & Inlärningsframsteg</h2>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              Samlad svensk vokabulär uppdelad efter Europarådets nivåskala (A1–C2)
            </p>
          </div>
          <span className="text-xs font-bold text-[#00D2FF] bg-[#00D2FF]/10 px-3 py-1 rounded-full border border-[#00D2FF]/30">
            Global Master Katalog ({LEXICON_CARDS.length} ord)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cefrLevels.map((lvl) => {
            const globalLvlCards = LEXICON_CARDS.filter((c) => (c.cefrLevel || 'A1').toUpperCase() === lvl);
            const total = globalLvlCards.length;
            const userLvlCards = cards.filter((c) => (c.cefrLevel || 'A1').toUpperCase() === lvl);
            const learned = userLvlCards.filter((c) => c.state > 0).length;
            const reviewed = userLvlCards.filter((c) => c.state === 2).length;
            const unseen = Math.max(0, total - learned);
            const percent = total > 0 ? Math.round((learned / total) * 100) : 0;

            const lvlDescriptions: Record<string, string> = {
              A1: 'Nybörjare — Kärnord & vardagsfraser',
              A2: 'Grundläggande — Vanliga samtal & uttryck',
              B1: 'Självständig — Praktisk vardagsnytta',
              B2: 'Fördjupad — Nyanserad samtalston',
              C1: 'Kompetent — Akademisk & professionell',
              C2: 'Flytande — Idiom & infödd precision',
            };

            const statusBadge =
              percent === 100
                ? { label: 'Behärskad 🎉', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' }
                : learned > 0
                ? { label: 'Pågår 🔄', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' }
                : { label: 'Kommande ⏳', color: 'bg-[#161F33] text-[#94A3B8] border-[#263554]' };

            return (
              <div
                key={lvl}
                className="p-5 rounded-2xl bg-[#161F33]/90 border border-[#263554] space-y-4 shadow-xl hover:border-[#00D2FF]/60 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {renderCefrBadge(lvl)}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusBadge.color}`}>
                        {statusBadge.label}
                      </span>
                    </div>
                    <p className="text-xs text-[#94A3B8] font-medium pt-1">
                      {lvlDescriptions[lvl]}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-white">{percent}%</span>
                  </div>
                </div>

                {/* CEFR Progress Bar */}
                <div className="space-y-1">
                  <div className="w-full bg-[#0F172A] h-2.5 rounded-full overflow-hidden p-0.5 border border-[#263554]">
                    <div
                      className="bg-gradient-to-r from-[#00D2FF] to-[#10B981] h-full rounded-full transition-all duration-700"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-[#94A3B8] font-semibold pt-1">
                    <span>{learned} av {total} ord ({percent}%)</span>
                    <span className="text-[#06B6D4]">{unseen} oinledda</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};

export default Dashboard;

