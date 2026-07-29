import React, { useState, useEffect, useCallback } from 'react';
import { Card, Rating, CEFRLevel } from '../types';
import { audioService } from '../services/audioService';

interface StudyCardProps {
  card: Card;
  onRate: (rating: Rating) => void;
  intervalPreviews?: Record<Rating, string>;
  totalInQueue: number;
  currentIndex: number;
  speechRate?: number;
  autoPlayAudio?: boolean;
}

export const StudyCard: React.FC<StudyCardProps> = ({
  card,
  onRate,
  intervalPreviews = {
    1: '< 10m',
    2: '1.2d',
    3: '3.5d',
    4: '9.0d',
  },
  totalInQueue,
  currentIndex,
  speechRate = 0.9,
  autoPlayAudio = true,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Derive card frequency rank and CEFR level with robust fallbacks
  const frequencyRank =
    card.frequencyRank ?? (parseInt(card.id.replace(/\D/g, ''), 10) || currentIndex + 1);
  const cefrLevel: CEFRLevel = card.cefrLevel || 'A1';

  // Audio Playback Handler with Web Speech Synthesis & Sanitized Neural AI Voices
  const playAudio = useCallback(() => {
    setIsPlayingAudio(true);
    audioService
      .speak(card.front, {
        rate: speechRate,
        onStart: () => setIsPlayingAudio(true),
        onEnd: () => setIsPlayingAudio(false),
        onError: () => setIsPlayingAudio(false),
      })
      .catch(() => setIsPlayingAudio(false));
  }, [card.front, speechRate]);

  // Reset state when card changes
  useEffect(() => {
    setIsFlipped(false);
    if (autoPlayAudio) {
      const timer = setTimeout(() => {
        playAudio();
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [card.id, autoPlayAudio, playAudio]);

  // Keyboard navigation handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore key events when user is typing in input fields
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (!isFlipped) {
          setIsFlipped(true);
        }
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        playAudio();
      } else if (isFlipped) {
        if (e.key === '1') {
          e.preventDefault();
          onRate(1);
        } else if (e.key === '2') {
          e.preventDefault();
          onRate(2);
        } else if (e.key === '3') {
          e.preventDefault();
          onRate(3);
        } else if (e.key === '4') {
          e.preventDefault();
          onRate(4);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, onRate, playAudio]);

  // Helper to render Gender / WordClass Pill
  const renderGenderPill = () => {
    if (card.gender === 'en') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#00D2FF]/15 border border-[#00D2FF]/40 text-[#00D2FF] shadow-sm">
          en-ord
        </span>
      );
    }
    if (card.gender === 'ett') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#F59E0B]/15 border border-[#F59E0B]/40 text-[#F59E0B] shadow-sm">
          ett-ord
        </span>
      );
    }
    if (card.wordClass === 'verb') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#10B981]/15 border border-[#10B981]/40 text-[#10B981] shadow-sm">
          verb
        </span>
      );
    }
    if (card.wordClass === 'adjektiv' || card.wordClass === 'adjective') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#A855F7]/15 border border-[#A855F7]/40 text-[#A855F7] shadow-sm">
          adjektiv
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#263554]/60 border border-[#263554] text-[#94A3B8] shadow-sm">
        {card.wordClass}
      </span>
    );
  };

  // Helper to render CEFR Badge
  const renderCefrBadge = (level: CEFRLevel) => {
    const colors: Record<CEFRLevel, string> = {
      A1: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300',
      A2: 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300',
      B1: 'bg-amber-500/15 border-amber-500/40 text-amber-300',
      B2: 'bg-orange-500/15 border-orange-500/40 text-orange-300',
      C1: 'bg-purple-500/15 border-purple-500/40 text-purple-300',
      C2: 'bg-pink-500/15 border-pink-500/40 text-pink-300',
    };
    return (
      <span
        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase border shadow-sm ${colors[level] || colors.A1}`}
        title={`CEFR Nivå ${level}`}
        aria-label={`CEFR nivå ${level}`}
      >
        CEFR {level}
      </span>
    );
  };

  // Helper to render Frequency Rank Pill
  const renderFrequencyPill = (rank: number) => {
    return (
      <span
        className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-gradient-to-r from-[#00D2FF]/20 to-[#3A7BD5]/20 border border-[#00D2FF]/40 text-[#00D2FF] flex items-center gap-1 shadow-sm shadow-[#00D2FF]/10"
        title={`Frekvensrangordning i svenska: #${rank}`}
        aria-label={`Frekvensrangordning nummer ${rank}`}
      >
        <svg className="w-3 h-3 text-[#00D2FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
        <span>#{rank}</span>
      </span>
    );
  };

  // Format example sentence with glowing target word
  const renderHighlightedExample = (exampleSv?: string, targetWord?: string) => {
    if (!exampleSv) return null;
    if (!targetWord) return exampleSv;

    const cleanWord = targetWord.replace(/^(en|ett)\s+/i, '').trim();
    if (!cleanWord) return exampleSv;

    const regex = new RegExp(`(${cleanWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = exampleSv.split(regex);

    return (
      <span className="text-[#F8FAFC]">
        {parts.map((part, i) =>
          part.toLowerCase() === cleanWord.toLowerCase() ? (
            <span key={i} className="text-[#00D2FF] font-bold bg-[#00D2FF]/15 px-1 py-0.5 rounded border border-[#00D2FF]/40 shadow-sm shadow-[#00D2FF]/20">
              {part}
            </span>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  // Safe helper to render Inflection Breakdown pills
  const renderInflectionPills = () => {
    if (!card.inflections) return null;

    let items: string[] = [];
    if (Array.isArray(card.inflections)) {
      items = card.inflections;
    } else if (typeof card.inflections === 'object') {
      items = Object.entries(card.inflections)
        .filter(([_, val]) => Boolean(val))
        .map(([key, val]) => `${val} (${key.replace(/([A-Z])/g, ' $1').toLowerCase()})`);
    }

    if (items.length === 0) return null;

    return (
      <div className="pt-1">
        <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-1">
          Böjningsformer
        </span>
        <div className="flex flex-wrap gap-1">
          {items.map((form, i) => (
            <span key={i} className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[#1E293B] text-[#94A3B8] border border-[#263554] shadow-sm">
              {form}
            </span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 h-[calc(100vh-140px)] min-h-[460px] max-h-[640px] flex flex-col justify-between overflow-hidden my-auto">
      
      {/* Top Card Queue Progress Indicator */}
      <div className="flex items-center justify-between text-xs font-semibold text-[#94A3B8] pb-2 flex-shrink-0 px-1">
        <span aria-live="polite" className="flex items-center gap-1.5">
          <span className="text-[#00D2FF] font-bold">Kort {currentIndex + 1}</span> av {totalInQueue}
        </span>
        <span className="bg-[#161F33] px-3 py-1 rounded-full border border-[#263554] font-medium text-white flex items-center gap-1.5 shadow-sm text-xs">
          <span className="w-2 h-2 rounded-full bg-[#00D2FF] animate-pulse"></span>
          {card.state === 0 ? '🆕 Nytt kort' : card.state === 1 ? '🔄 Lär sig' : '⭐ Repetition'}
        </span>
      </div>

      {/* 3D Flip Card Container - Flex 1 to fill available vertical space */}
      <div className="perspective-1000 w-full flex-1 flex flex-col min-h-0">
        <div className={`flip-card-inner w-full flex-1 flex flex-col transition-transform duration-500 transform-style-3d ${isFlipped ? 'is-flipped' : ''}`}>
          
          {/* ================= FRONT SIDE ================= */}
          <div className="flip-card-front bg-[#161F33]/90 border border-[#263554] rounded-2xl p-4 sm:p-6 flex flex-col justify-between h-full shadow-2xl backdrop-blur-md relative overflow-hidden">
            
            {/* Top Bar: Grammar Gender Badge, CEFR Badge, Frequency Pill & Audio Button */}
            <div className="flex items-center justify-between w-full gap-2 flex-shrink-0">
              <div className="flex flex-wrap items-center gap-1.5">
                {renderGenderPill()}
                {renderCefrBadge(cefrLevel)}
                {renderFrequencyPill(frequencyRank)}
              </div>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  playAudio();
                }}
                className={`w-11 h-11 rounded-full bg-[#0F172A] border border-[#263554] hover:border-[#00D2FF] text-[#00D2FF] flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-[#00D2FF] active:scale-95 shadow-md flex-shrink-0 ${
                  isPlayingAudio ? 'ring-2 ring-[#00D2FF] animate-pulse bg-[#00D2FF]/20' : ''
                }`}
                title="Lyssna på uttal (Tangentswitch: R)"
                aria-label="Spela uttal för ordet"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              </button>
            </div>

            {/* Center Focal Point: Swedish Target Word (Scales text-3xl sm:text-4xl for NO-SCROLL fit) */}
            <div className="my-auto py-4 flex flex-col items-center justify-center text-center flex-1 min-h-0 overflow-y-auto">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight select-none drop-shadow-md">
                {card.front}
              </h1>
              {card.ipa && (
                <p className="mt-2 text-base sm:text-lg font-mono text-[#00D2FF]/90 tracking-wide font-medium">
                  {card.ipa}
                </p>
              )}
            </div>

            {/* Bottom Action: Reveal Answer */}
            <div className="w-full pt-3 border-t border-[#263554]/60 flex flex-col items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setIsFlipped(true)}
                className="w-full min-h-[48px] py-3 px-6 rounded-xl bg-gradient-to-r from-[#00D2FF] to-[#3A7BD5] text-[#0F172A] font-extrabold text-sm sm:text-base shadow-lg shadow-[#00D2FF]/20 hover:brightness-110 active:scale-98 transition-all focus:outline-none focus:ring-2 focus:ring-[#00D2FF] flex items-center justify-center gap-2"
                aria-label="Visa svar på kortet (Mellanslag)"
              >
                <span>Visa Svar</span>
                <kbd className="bg-[#0F172A]/30 text-[#0F172A] border-[#0F172A]/20 text-xs px-2 py-0.5 rounded">Mellanslag</kbd>
              </button>

              <div className="text-[11px] text-[#94A3B8] flex items-center gap-2">
                <span><kbd className="px-1.5 py-0.5 rounded bg-[#0F172A] text-white">Space</kbd> Visa svar</span>
                <span>•</span>
                <span><kbd className="px-1.5 py-0.5 rounded bg-[#0F172A] text-white">R</kbd> Uttal</span>
              </div>
            </div>
          </div>

          {/* ================= BACK SIDE ================= */}
          <div className="flip-card-back bg-[#161F33]/90 border border-[#263554] rounded-2xl p-4 sm:p-6 flex flex-col justify-between h-full shadow-2xl backdrop-blur-md relative overflow-hidden">
            
            {/* Top Header Bar */}
            <div className="flex items-center justify-between w-full pb-2 border-b border-[#263554]/60 gap-2 flex-shrink-0">
              <div className="text-left flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <h2 className="text-xl sm:text-2xl font-extrabold text-white truncate">{card.front}</h2>
                  {renderGenderPill()}
                  {renderCefrBadge(cefrLevel)}
                  {renderFrequencyPill(frequencyRank)}
                </div>
                {card.ipa && (
                  <p className="text-xs font-mono text-[#00D2FF]/90 mt-0.5">{card.ipa}</p>
                )}
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  playAudio();
                }}
                className={`w-10 h-10 rounded-full bg-[#0F172A] border border-[#263554] hover:border-[#00D2FF] text-[#00D2FF] flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-[#00D2FF] active:scale-95 shadow-md flex-shrink-0 ${
                  isPlayingAudio ? 'ring-2 ring-[#00D2FF] animate-pulse bg-[#00D2FF]/20' : ''
                }`}
                title="Spela uttal (R)"
                aria-label="Spela uttal"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              </button>
            </div>

            {/* Translation & Content Details (Scales answer text-lg sm:text-xl for NO-SCROLL ergonomics) */}
            <div className="text-left my-auto space-y-2.5 flex-1 min-h-0 overflow-y-auto py-2">
              
              {/* Primary English Meaning */}
              <div>
                <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">
                  Engelsk Översättning
                </span>
                <p className="text-lg sm:text-xl font-extrabold text-[#00D2FF] tracking-tight">
                  {card.back}
                </p>
              </div>

              {/* Context Example Sentence */}
              {card.exampleSv && (
                <div className="p-3 rounded-xl bg-[#0F172A]/80 border border-[#263554]">
                  <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider block mb-0.5">
                    Exempelmening
                  </span>
                  <p className="text-sm sm:text-base font-medium leading-normal">
                    {renderHighlightedExample(card.exampleSv, card.front)}
                  </p>
                  {card.exampleEn && (
                    <p className="text-xs text-[#94A3B8] italic mt-1">
                      "{card.exampleEn}"
                    </p>
                  )}
                </div>
              )}

              {/* Inflections Breakdown */}
              {renderInflectionPills()}

            </div>

            {/* Bottom: 4 FSRS Rating Buttons (48px+ touch targets) */}
            <div className="w-full pt-2.5 border-t border-[#263554]/60 space-y-1.5 flex-shrink-0">
              <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest block text-center">
                Hur väl kom du ihåg ordet?
              </span>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {/* 1 - AGAIN (Coral Red) */}
                <button
                  onClick={() => onRate(1)}
                  className="min-h-[48px] py-2 px-2 rounded-xl bg-rose-500/10 border border-rose-500/30 hover:border-rose-500 hover:bg-rose-500/20 text-rose-300 font-bold flex flex-col items-center justify-center transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-md"
                  aria-label="Igen, tangentswitch 1"
                >
                  <span className="text-xs font-extrabold uppercase flex items-center gap-1">
                    <kbd className="bg-rose-950/80 text-rose-300 border-rose-800 text-[10px] px-1 rounded">1</kbd> Igen
                  </span>
                  <span className="text-[10px] opacity-80 font-medium">{intervalPreviews[1]}</span>
                </button>

                {/* 2 - HARD (Amber Yellow) */}
                <button
                  onClick={() => onRate(2)}
                  className="min-h-[48px] py-2 px-2 rounded-xl bg-amber-500/10 border border-amber-500/30 hover:border-amber-500 hover:bg-amber-500/20 text-amber-300 font-bold flex flex-col items-center justify-center transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-md"
                  aria-label="Svårt, tangentswitch 2"
                >
                  <span className="text-xs font-extrabold uppercase flex items-center gap-1">
                    <kbd className="bg-amber-950/80 text-amber-300 border-amber-800 text-[10px] px-1 rounded">2</kbd> Svårt
                  </span>
                  <span className="text-[10px] opacity-80 font-medium">{intervalPreviews[2]}</span>
                </button>

                {/* 3 - GOOD (Emerald Green) */}
                <button
                  onClick={() => onRate(3)}
                  className="min-h-[48px] py-2 px-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 hover:border-emerald-500 hover:bg-emerald-500/20 text-emerald-300 font-bold flex flex-col items-center justify-center transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-md"
                  aria-label="Bra, tangentswitch 3"
                >
                  <span className="text-xs font-extrabold uppercase flex items-center gap-1">
                    <kbd className="bg-emerald-950/80 text-emerald-300 border-emerald-800 text-[10px] px-1 rounded">3</kbd> Bra
                  </span>
                  <span className="text-[10px] opacity-80 font-medium">{intervalPreviews[3]}</span>
                </button>

                {/* 4 - EASY (Cyan Blue) */}
                <button
                  onClick={() => onRate(4)}
                  className="min-h-[48px] py-2 px-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 hover:border-cyan-500 hover:bg-cyan-500/20 text-cyan-300 font-bold flex flex-col items-center justify-center transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-cyan-500 shadow-md"
                  aria-label="Lätt, tangentswitch 4"
                >
                  <span className="text-xs font-extrabold uppercase flex items-center gap-1">
                    <kbd className="bg-cyan-950/80 text-cyan-300 border-cyan-800 text-[10px] px-1 rounded">4</kbd> Lätt
                  </span>
                  <span className="text-[10px] opacity-80 font-medium">{intervalPreviews[4]}</span>
                </button>
              </div>

              {/* Keyboard Hints Legend */}
              <div className="text-[10px] text-[#94A3B8] pt-0.5 flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5">
                <span><kbd className="px-1 rounded bg-[#0F172A]">1</kbd> Igen</span>
                <span><kbd className="px-1 rounded bg-[#0F172A]">2</kbd> Svårt</span>
                <span><kbd className="px-1 rounded bg-[#0F172A]">3</kbd> Bra</span>
                <span><kbd className="px-1 rounded bg-[#0F172A]">4</kbd> Lätt</span>
                <span><kbd className="px-1 rounded bg-[#0F172A]">R</kbd> Uttal</span>
              </div>
            </div>

          </div>

        </div>
      </div>

    </div>
  );
};

export default StudyCard;
