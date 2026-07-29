import React from 'react';
import { QueueStats, UserStats, Deck } from '../types';

interface DashboardProps {
  queueStats: QueueStats;
  userStats: UserStats;
  decks: Deck[];
  selectedDeckId: string;
  onSelectDeck: (deckId: string) => void;
  onStartStudy: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  queueStats,
  userStats,
  decks,
  selectedDeckId,
  onSelectDeck,
  onStartStudy
}) => {
  const totalDueToday = queueStats.newCount + queueStats.learningCount + queueStats.reviewCount;

  // Generate mock GitHub-style heatmap data for 12 weeks (84 days)
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

  // Helper for heatmap cell intensity color
  const getHeatmapColor = (count: number) => {
    if (count === 0) return 'bg-[#161F33] border-[#263554]';
    if (count < 5) return 'bg-[#06B6D4]/30 border-[#06B6D4]/50 text-[#06B6D4]';
    if (count < 15) return 'bg-[#06B6D4]/60 border-[#06B6D4] text-white';
    return 'bg-[#00D2FF] border-[#00D2FF] text-[#0F172A] shadow-sm shadow-[#00D2FF]/40';
  };

  return (
    <div className="nordic-container space-y-8 py-4">
      
      {/* ================= HERO & START STUDY CALLOUT ================= */}
      <div className="glass-card p-6 sm:p-8 relative overflow-hidden">
        {/* Glow backdrop behind hero */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[#00D2FF]/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="glass-pill pill-en">A1 - Nybörjare</span>
              <span className="text-xs text-[#94A3B8] font-semibold">CEFR Nivå</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Välkommen tillbaka, Eleve!
            </h1>
            <p className="text-sm sm:text-base text-[#94A3B8] max-w-lg">
              Du har <span className="text-[#00D2FF] font-bold">{totalDueToday} kort</span> som väntar på repetition idag. Behåll din studieflyt!
            </p>
          </div>

          <div className="w-full md:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={onStartStudy}
              disabled={totalDueToday === 0}
              className="btn-touch btn-aurora px-8 py-4 text-base font-extrabold rounded-xl flex items-center justify-center gap-3 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 text-[#0F172A]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              <span>Starta Dagens Repetition</span>
              <span className="text-xs bg-[#0F172A]/20 px-2 py-0.5 rounded-full font-bold">
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

      {/* ================= PROGRESS METRICS & HEATMAP ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Memory Heatmap & Stats */}
        <div className="lg:col-span-2 glass-card p-6 space-y-6">
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
        <div className="glass-card p-6 flex flex-col justify-between space-y-4">
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
            return (
              <div
                key={deck.id}
                onClick={() => onSelectDeck(deck.id)}
                className={`glass-card p-5 cursor-pointer transition-all ${
                  isSelected 
                    ? 'border-[#00D2FF] bg-[#161F33] ring-1 ring-[#00D2FF]/50 shadow-lg shadow-[#00D2FF]/10' 
                    : 'hover:border-[#263554] opacity-90 hover:opacity-100'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[#0F172A] border border-[#263554] flex items-center justify-center text-2xl">
                      {deck.icon || '🇸🇪'}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">{deck.title}</h3>
                      <p className="text-xs text-[#94A3B8] mt-0.5">{deck.description}</p>
                    </div>
                  </div>
                  <span className="glass-pill pill-en">{deck.cefrLevel}</span>
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#263554]/60 text-xs text-[#94A3B8]">
                  <span>{deck.totalCards} kort totalt</span>
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
