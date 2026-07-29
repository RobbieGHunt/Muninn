import React from 'react';
import { QueueStats } from '../types';

interface NavbarProps {
  queueStats: QueueStats;
  streak: number;
  currentView: 'dashboard' | 'study';
  onNavigate: (view: 'dashboard' | 'study') => void;
  deckTitle?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  queueStats,
  streak,
  currentView,
  onNavigate,
  deckTitle = 'Svenska A1/A2 Grundord'
}) => {
  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-[#0B0F19]/80 border-b border-[#263554] transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        
        {/* Brand Logo & Name */}
        <div 
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-3 cursor-pointer group select-none"
          title="Gå till Instrumentbrädan"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00D2FF] to-[#3A7BD5] flex items-center justify-center shadow-lg shadow-[#00D2FF]/20 group-hover:scale-105 transition-transform">
            <svg className="w-6 h-6 text-[#0F172A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {/* Stylized Nordic Raven / Wings */}
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 3v18m0-18l7 5-7 5 7 5-7 5M12 3L5 8l7 5-7 5 7 5" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight text-white group-hover:text-[#00D2FF] transition-colors">
                MUNINN
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#06B6D4]/20 text-[#06B6D4] border border-[#06B6D4]/30 uppercase">
                SRS v4.5
              </span>
            </div>
            <p className="text-xs text-[#94A3B8] font-medium hidden sm:block">
              Svensk Spaced Repetition
            </p>
          </div>
        </div>

        {/* Center: Current Deck Info (when studying) or Quick Status */}
        {currentView === 'study' && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#161F33] border border-[#263554]">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
            <span className="text-xs font-semibold text-[#94A3B8]">Studerar:</span>
            <span className="text-xs font-bold text-white max-w-[160px] truncate">{deckTitle}</span>
          </div>
        )}

        {/* Right Stats & Navigation */}
        <div className="flex items-center gap-3">
          
          {/* Daily Streak Counter */}
          <div 
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#161F33] border border-[#263554] shadow-sm"
            title="Dagar i rad med studier"
          >
            <span className="text-lg leading-none" role="img" aria-label="Fire streak">🔥</span>
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-amber-400 leading-tight">{streak}</span>
              <span className="text-[9px] font-semibold text-[#64748B] uppercase tracking-wider hidden sm:block">dagar</span>
            </div>
          </div>

          {/* Queue Count Badges */}
          <div className="flex items-center gap-1.5 bg-[#161F33]/90 p-1 rounded-xl border border-[#263554]">
            {/* New Cards */}
            <div 
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#06B6D4]/15 border border-[#06B6D4]/30 text-[#06B6D4]"
              title="Nya kort att lära sig"
            >
              <span className="text-[10px] font-bold uppercase">Ny</span>
              <span className="text-xs font-extrabold">{queueStats.newCount}</span>
            </div>

            {/* Learning Cards */}
            <div 
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#F59E0B]/15 border border-[#F59E0B]/30 text-[#F59E0B]"
              title="Kort under inlärning"
            >
              <span className="text-[10px] font-bold uppercase">Lär</span>
              <span className="text-xs font-extrabold">{queueStats.learningCount}</span>
            </div>

            {/* Review Cards */}
            <div 
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981]"
              title="Kort redo för repetition"
            >
              <span className="text-[10px] font-bold uppercase">Rep</span>
              <span className="text-xs font-extrabold">{queueStats.reviewCount}</span>
            </div>
          </div>

          {/* View Switcher Button */}
          {currentView === 'study' ? (
            <button
              onClick={() => onNavigate('dashboard')}
              className="btn-touch px-3.5 py-1.5 bg-[#161F33] hover:bg-[#263554] text-white border border-[#263554] text-xs font-bold transition-colors"
            >
              ← Översikt
            </button>
          ) : (
            <button
              onClick={() => onNavigate('study')}
              className="btn-touch px-3.5 py-1.5 btn-aurora text-xs font-bold"
            >
              Starta →
            </button>
          )}

        </div>

      </div>
    </header>
  );
};
