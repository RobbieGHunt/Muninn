import React from 'react';
import { QueueStats, UserStats, Deck, Card, CEFRLevel } from '../types';

interface DashboardProps {
  queueStats: QueueStats;
  userStats: UserStats;
  decks: Deck[];
  selectedDeckId: string;
  onSelectDeck: (deckId: string) => void;
  onStartStudy: () => void;
  cards?: Card[];
}

export const Dashboard: React.FC<DashboardProps> = ({
  queueStats,
  userStats,
  decks,
  selectedDeckId,
  onSelectDeck,
  onStartStudy,
  cards = []
}) => {
  const totalDueToday = queueStats.newCount + queueStats.learningCount + queueStats.reviewCount;

  // Selected deck cards
  const selectedDeckCards = cards.filter(c => c.deckId === selectedDeckId);
  const displayCards = selectedDeckCards.length > 0 ? selectedDeckCards : cards;

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

  // Calculate Frequency Tier Distribution for display cards
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
      progressColor: 'from-[#00D2FF] to-[#3A7BD5]'
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
      progressColor: 'from-[#10B981] to-[#06B6D4]'
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
      progressColor: 'from-[#F59E0B] to-[#F97316]'
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
      progressColor: 'from-[#A855F7] to-[#EC4899]'
    }
  ];

  // Helper to compute stats for each tier
  const tierStats = frequencyTiers.map(tier => {
    const tierCards = displayCards.filter(c => {
      const rank = c.frequencyRank ?? (parseInt(c.id.replace(/\D/g, ''), 10) || 1);
      return rank >= tier.rangeMin && rank <= tier.rangeMax;
    });
    const total = tierCards.length;
    const reviewed = tierCards.filter(c => c.state === 2).length;
    const learning = tierCards.filter(c => c.state === 1 || c.state === 3).length;
    const newCount = tierCards.filter(c => c.state === 0).length;
    const percent = total > 0 ? Math.round((reviewed / total) * 100) : 0;

    return {
      ...tier,
      total,
      reviewed,
      learning,
      newCount,
      percent
    };
  });

  // Calculate overall CEFR level progress stats
  const cefrLevels: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  const cefrStats = cefrLevels.map(lvl => {
    const lvlCards = displayCards.filter(c => (c.cefrLevel || 'A1').toUpperCase() === lvl);
    const total = lvlCards.length;
    const reviewed = lvlCards.filter(c => c.state === 2).length;
    const percent = total > 0 ? Math.round((reviewed / total) * 100) : 0;
    return { level: lvl, total, reviewed, percent };
  }).filter(s => s.total > 0);

  return (
    <div className="nordic-container space-y-8 py-6 px-4 sm:px-6 max-w-6xl mx-auto">
      
      {/* ================= HERO & START STUDY CALLOUT ================= */}
      <div className="glass-card bg-[#161F33]/90 border border-[#263554] rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-2xl backdrop-blur-md">
        {/* Glow backdrop behind hero */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[#00D2FF]/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {renderCefrBadge(decks.find(d => d.id === selectedDeckId)?.cefrLevel || 'A1')}
              <span className="text-xs text-[#94A3B8] font-semibold">Vald Kortlek & CEFR</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Välkommen tillbaka!
            </h1>
            <p className="text-sm sm:text-base text-[#94A3B8] max-w-lg">
              Du har <span className="text-[#00D2FF] font-bold">{totalDueToday} kort</span> som väntar på repetition idag. Stärk din ordkunskap i svenska!
            </p>
          </div>

          <div className="w-full md:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={onStartStudy}
              disabled={totalDueToday === 0}
              className="min-h-[52px] px-8 py-4 bg-gradient-to-r from-[#00D2FF] to-[#3A7BD5] text-[#0F172A] text-base font-extrabold rounded-xl flex items-center justify-center gap-3 shadow-xl shadow-[#00D2FF]/20 hover:brightness-110 active:scale-98 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#00D2FF]"
              aria-label="Starta dagens repetitionssession"
            >
              <svg className="w-5 h-5 text-[#0F172A]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              <span>Starta Dagens Repetition</span>
              <span className="text-xs bg-[#0F172A]/20 px-2.5 py-1 rounded-full font-bold">
                {totalDueToday}
              </span>
            </button>
          </div>
        </div>

        {/* QUEUE METRICS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-6 border-t border-[#263554]/60">
          
          {/* New Cards */}
          <div className="p-4 rounded-xl bg-[#083344]/40 border border-[#06B6D4]/30 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#06B6D4] uppercase tracking-wider">Nya Kort</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-white mt-0.5">{queueStats.newCount}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#06B6D4]/20 border border-[#06B6D4]/40 flex items-center justify-center text-[#06B6D4]">
              ✨
            </div>
          </div>

          {/* Learning Cards */}
          <div className="p-4 rounded-xl bg-[#451A03]/40 border border-[#F59E0B]/30 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#F59E0B] uppercase tracking-wider">Under Inlärning</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-white mt-0.5">{queueStats.learningCount}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#F59E0B]/20 border border-[#F59E0B]/40 flex items-center justify-center text-[#F59E0B]">
              🔄
            </div>
          </div>

          {/* Review Cards */}
          <div className="p-4 rounded-xl bg-[#064E3B]/40 border border-[#10B981]/30 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#10B981] uppercase tracking-wider">För Repetition</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-white mt-0.5">{queueStats.reviewCount}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#10B981]/20 border border-[#10B981]/40 flex items-center justify-center text-[#10B981]">
              🧠
            </div>
          </div>

        </div>
      </div>

      {/* ================= FREQUENCY TIER DISTRIBUTION & MASTER BREAKDOWN ================= */}
      <div className="bg-[#161F33]/90 border border-[#263554] rounded-2xl p-6 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#263554]/60">
          <div>
            <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <svg className="w-5 h-5 text-[#00D2FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span>Frekvens- & Nivåfördelning</span>
            </h2>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              Framsteg och täckning uppdelat i frekvensband och CEFR-nivåer
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#94A3B8] font-semibold">Aktuell kortlek:</span>
            <span className="text-xs font-bold text-[#00D2FF] bg-[#00D2FF]/10 px-2.5 py-1 rounded-full border border-[#00D2FF]/30">
              {decks.find(d => d.id === selectedDeckId)?.title || 'Alla kort'}
            </span>
          </div>
        </div>

        {/* Tier Progress Bars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tierStats.map(tier => (
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

              {/* Progress Bar */}
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
                  <span>{tier.reviewed} av {tier.total} ord behärskade</span>
                  <span>{tier.total - tier.reviewed} återstår</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CEFR Level Breakdown Pills */}
        {cefrStats.length > 0 && (
          <div className="pt-4 border-t border-[#263554]/60">
            <h4 className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-3">
              Framsteg per CEFR-Nivå
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {cefrStats.map(s => (
                <div key={s.level} className="p-3 rounded-xl bg-[#0F172A]/70 border border-[#263554] text-center space-y-1">
                  <div className="flex items-center justify-center gap-1.5">
                    {renderCefrBadge(s.level)}
                  </div>
                  <p className="text-base font-extrabold text-white mt-1">{s.percent}%</p>
                  <p className="text-[10px] text-[#94A3B8]">{s.reviewed}/{s.total} kort</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ================= PROGRESS METRICS & HEATMAP ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Memory Heatmap & Stats */}
        <div className="lg:col-span-2 bg-[#161F33]/90 border border-[#263554] rounded-2xl p-6 shadow-2xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Studieaktivitet & Minnesvärme</span>
              </h2>
              <p className="text-xs text-[#94A3B8]">Dina repetitioner senaste 12 veckorna</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
              <span>Mindre</span>
              <div className="w-3 h-3 rounded bg-[#161F33] border border-[#263554]"></div>
              <div className="w-3 h-3 rounded bg-[#06B6D4]/40"></div>
              <div className="w-3 h-3 rounded bg-[#00D2FF]"></div>
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
            <div className="p-3 rounded-xl bg-[#0F172A]/50 border border-[#263554]">
              <p className="text-[10px] font-bold text-[#64748B] uppercase">Dagar I Rad</p>
              <p className="text-xl font-extrabold text-amber-400 mt-0.5">{userStats.streak} 🔥</p>
            </div>
            <div className="p-3 rounded-xl bg-[#0F172A]/50 border border-[#263554]">
              <p className="text-[10px] font-bold text-[#64748B] uppercase">Retentionsgrad</p>
              <p className="text-xl font-extrabold text-[#10B981] mt-0.5">{userStats.retentionRate}%</p>
            </div>
            <div className="p-3 rounded-xl bg-[#0F172A]/50 border border-[#263554]">
              <p className="text-[10px] font-bold text-[#64748B] uppercase">Totalt Repeterat</p>
              <p className="text-xl font-extrabold text-[#00D2FF] mt-0.5">{userStats.totalReviews}</p>
            </div>
          </div>
        </div>

        {/* Right Col: FSRS Info & Nordic Quote */}
        <div className="bg-[#161F33]/90 border border-[#263554] rounded-2xl p-6 flex flex-col justify-between space-y-4 shadow-2xl">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">⚡</span>
              <h2 className="text-lg font-bold text-white">FSRS-4.5 Motor</h2>
            </div>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Muninn använder modern spridningsalgoritm (Free Spaced Repetition Scheduler) som anpassar repetitionstider för maximal minnesbevaring med minimal ansträngning.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#0F172A]/70 border border-[#263554] space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-[#94A3B8]">Målretention</span>
              <span className="text-[#10B981] font-bold">90%</span>
            </div>
            <div className="w-full bg-[#161F33] h-2 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-[#06B6D4] to-[#10B981] h-full w-[90%]" />
            </div>
            <p className="text-[11px] text-[#64748B] italic">
              "Övning ger färdighet — Öva varje dag för optimal inlärningskurva."
            </p>
          </div>
        </div>

      </div>

      {/* ================= DECKS SELECTION SECTION ================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-white tracking-tight">Dina Kortlekar</h2>
          <span className="text-xs text-[#94A3B8]">{decks.length} tillgängliga kortlekar</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {decks.map((deck) => {
            const isSelected = deck.id === selectedDeckId;
            const deckCards = cards.filter(c => c.deckId === deck.id);
            const totalCount = deckCards.length || deck.totalCards || 0;
            
            // Calculate frequency rank range for deck cards
            const minRank = deckCards.length > 0 
              ? Math.min(...deckCards.map(c => c.frequencyRank ?? 1))
              : 1;
            const maxRank = deckCards.length > 0 
              ? Math.max(...deckCards.map(c => c.frequencyRank ?? 100))
              : 100;

            return (
              <div
                key={deck.id}
                onClick={() => onSelectDeck(deck.id)}
                className={`p-5 rounded-2xl cursor-pointer transition-all border ${
                  isSelected 
                    ? 'border-[#00D2FF] bg-[#161F33] ring-1 ring-[#00D2FF]/50 shadow-xl shadow-[#00D2FF]/10' 
                    : 'bg-[#161F33]/80 border-[#263554] hover:border-[#00D2FF]/60 hover:bg-[#161F33]'
                }`}
                tabIndex={0}
                role="button"
                aria-pressed={isSelected}
                aria-label={`Välj kortlek ${deck.title}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectDeck(deck.id);
                  }
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[#0F172A] border border-[#263554] flex items-center justify-center text-2xl shadow-inner">
                      {deck.icon || '🇸🇪'}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">{deck.title}</h3>
                      <p className="text-xs text-[#94A3B8] mt-0.5">{deck.description}</p>
                    </div>
                  </div>
                  {renderCefrBadge(deck.cefrLevel)}
                </div>

                <div className="flex flex-wrap items-center justify-between mt-4 pt-3 border-t border-[#263554]/60 text-xs text-[#94A3B8] gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{totalCount} kort</span>
                    <span>•</span>
                    <span className="text-[#00D2FF] font-medium">Frekvens #{minRank}–#{maxRank}</span>
                  </div>
                  {isSelected && (
                    <span className="text-[#00D2FF] font-bold flex items-center gap-1">
                      ✓ Vald kortlek
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};

