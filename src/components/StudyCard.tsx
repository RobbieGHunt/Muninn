import React, { useState, useEffect, useCallback } from 'react';
import { Card, Rating, CEFRLevel } from '../types';

interface StudyCardProps {
  card: Card;
  onRate: (rating: Rating) => void;
  intervalPreviews?: Record<Rating, string>;
  totalInQueue: number;
  currentIndex: number;
}

export const StudyCard: React.FC<StudyCardProps> = ({
  card,
  onRate,
  intervalPreviews = {
    1: '< 10m',
    2: '1.2d',
    3: '3.5d',
    4: '9.0d'
  },
  totalInQueue,
  currentIndex
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Derive card frequency rank and CEFR level with robust fallbacks
  const frequencyRank = card.frequencyRank ?? (parseInt(card.id.replace(/\D/g, ''), 10) || currentIndex + 1);
  const cefrLevel: CEFRLevel = card.cefrLevel || 'A1';

  // Audio Playback Handler with Web Speech Synthesis (sv-SE)
  const playAudio = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    
    window.speechSynthesis.cancel(); // Stop any ongoing speech
    const utterance = new SpeechSynthesisUtterance(card.front);
    utterance.lang = 'sv-SE';
    utterance.rate = 0.88; // Natural speaking pace for learning

    // Pick Swedish voice if available
    const voices = window.speechSynthesis.getVoices();
    const svVoice = voices.find(v => v.lang.startsWith('sv'));
    if (svVoice) {
      utterance.voice = svVoice;
    }

    utterance.onstart = () => setIsPlayingAudio(true);
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    window.speechSynthesis.speak(utterance);
  }, [card.front]);

  // Reset state when card changes
  useEffect(() => {
    setIsFlipped(false);
    // Auto-play audio on new card front presentation
    const timer = setTimeout(() => {
      playAudio();
    }, 250);
    return () => clearTimeout(timer);
  }, [card.id, playAudio]);

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
        <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-[#00D2FF]/20 border border-[#00D2FF]/40 text-[#00D2FF] shadow-sm">
          en-ord
        </span>
      );
    }
    if (card.gender === 'ett') {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-[#F59E0B]/20 border border-[#F59E0B]/40 text-[#F59E0B] shadow-sm">
          ett-ord
        </span>
      );
    }
    if (card.wordClass === 'verb') {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-[#10B981]/20 border border-[#10B981]/40 text-[#10B981] shadow-sm">
          verb
        </span>
      );
    }
    if (card.wordClass === 'adjektiv' || card.wordClass === 'adjective') {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-[#A855F7]/20 border border-[#A855F7]/40 text-[#A855F7] shadow-sm">
          adjektiv
        </span>
      );
    }
    return (
      <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-[#263554]/60 border border-[#263554] text-[#94A3B8] shadow-sm">
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
        className={`px-2.5 py-1 rounded-full text-xs font-black tracking-wider uppercase border shadow-sm ${colors[level]}`}
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
        className="px-3 py-1 rounded-full text-xs font-extrabold bg-gradient-to-r from-[#00D2FF]/20 to-[#3A7BD5]/20 border border-[#00D2FF]/40 text-[#00D2FF] flex items-center gap-1.5 shadow-sm shadow-[#00D2FF]/10"
        title={`Frekvensrangordning i svenska: #${rank}`}
        aria-label={`Frekvensrangordning nummer ${rank}`}
      >
        <svg className="w-3.5 h-3.5 text-[#00D2FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
        <span>Frekvens #{rank}</span>
      </span>
    );
  };

  // Format example sentence with highlighted target word
  const renderHighlightedExample = (exampleSv?: string, targetWord?: string) => {
    if (!exampleSv) return null;
    if (!targetWord) return exampleSv;

    // Simple case-insensitive match for word stem/exact word
    const regex = new RegExp(`(${targetWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = exampleSv.split(regex);

    return (
      <span className="text-[#F8FAFC]">
        {parts.map((part, i) =>
          part.toLowerCase() === targetWord.toLowerCase() ? (
            <span key={i} className="text-[#00D2FF] font-bold bg-[#00D2FF]/10 px-1 py-0.5 rounded border border-[#00D2FF]/30">
              {part}
            </span>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  return (
    <div className="w-full max-w-2xl mx-auto my-6 px-4">
      
      {/* Top Card Queue Progress Indicator */}
      <div className="flex items-center justify-between text-xs font-semibold text-[#94A3B8] mb-3 px-1">
        <span aria-live="polite">Kort {currentIndex + 1} av {totalInQueue}</span>
        <span className="bg-[#161F33] px-3 py-1 rounded-full border border-[#263554] font-medium text-white flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#00D2FF]"></span>
          {card.state === 0 ? '🆕 Nytt kort' : card.state === 1 ? '🔄 Lär sig' : '⭐ Repetition'}
        </span>
      </div>

      {/* 3D Flip Card Container */}
      <div className="perspective-1000 w-full min-h-[480px]">
        <div className={`flip-card-inner transition-transform duration-500 transform-style-3d ${isFlipped ? 'is-flipped' : ''}`}>
          
          {/* ================= FRONT SIDE ================= */}
          <div className="flip-card-front bg-[#161F33]/90 border border-[#263554] rounded-2xl p-6 flex flex-col justify-between shadow-2xl backdrop-blur-md relative overflow-hidden">
            
            {/* Top Bar: Grammar Gender Badge, CEFR Badge, Frequency Pill & Audio Button */}
            <div className="flex flex-wrap items-center justify-between w-full gap-2 mb-4">
              <div className="flex flex-wrap items-center gap-2">
                {renderGenderPill()}
                {renderCefrBadge(cefrLevel)}
                {renderFrequencyPill(frequencyRank)}
              </div>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  playAudio();
                }}
                className={`w-12 h-12 rounded-full bg-[#0F172A] border border-[#263554] hover:border-[#00D2FF] text-[#00D2FF] flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-[#00D2FF] active:scale-95 ${
                  isPlayingAudio ? 'ring-2 ring-[#00D2FF] animate-pulse bg-[#00D2FF]/20' : ''
                }`}
                title="Lyssna på uttal (Tangentswitch: R)"
                aria-label="Spela uttal för ordet"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              </button>
            </div>

            {/* Center Focal Point: Swedish Target Word */}
            <div className="my-auto py-8 flex flex-col items-center justify-center text-center">
              <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight select-none">
                {card.front}
              </h1>
              {card.ipa && (
                <p className="mt-3 text-lg font-mono text-[#00D2FF]/90 tracking-wide font-medium">
                  {card.ipa}
                </p>
              )}
            </div>

            {/* Bottom Action: Reveal Answer */}
            <div className="w-full pt-4 border-t border-[#263554]/60 flex flex-col items-center gap-2">
              <button
                onClick={() => setIsFlipped(true)}
                className="w-full min-h-[48px] py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#00D2FF] to-[#3A7BD5] text-[#0F172A] font-extrabold text-base shadow-lg shadow-[#00D2FF]/20 hover:brightness-110 active:scale-98 transition-all focus:outline-none focus:ring-2 focus:ring-[#00D2FF]"
                aria-label="Visa svar på kortet (Mellanslag)"
              >
                Visa Svar <span className="text-xs font-normal opacity-80 ml-2">(Mellanslag)</span>
              </button>
            </div>
          </div>

          {/* ================= BACK SIDE ================= */}
          <div className="flip-card-back bg-[#161F33]/90 border border-[#263554] rounded-2xl p-6 flex flex-col justify-between shadow-2xl backdrop-blur-md relative overflow-hidden">
            
            {/* Top Header: Word + Badges + Audio */}
            <div className="flex flex-wrap items-center justify-between w-full mb-3 pb-3 border-b border-[#263554]/60 gap-2">
              <div className="text-left">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl font-extrabold text-white">{card.front}</h2>
                  {renderGenderPill()}
                  {renderCefrBadge(cefrLevel)}
                  {renderFrequencyPill(frequencyRank)}
                </div>
                {card.ipa && (
                  <p className="text-sm font-mono text-[#00D2FF]/90 mt-1">{card.ipa}</p>
                )}
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  playAudio();
                }}
                className={`w-11 h-11 rounded-full bg-[#0F172A] border border-[#263554] hover:border-[#00D2FF] text-[#00D2FF] flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-[#00D2FF] active:scale-95 ${
                  isPlayingAudio ? 'ring-2 ring-[#00D2FF] animate-pulse bg-[#00D2FF]/20' : ''
                }`}
                title="Spela uttal (R)"
                aria-label="Spela uttal"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              </button>
            </div>

            {/* Translation & Details */}
            <div className="text-left my-auto space-y-4">
              
              {/* Primary English Meaning */}
              <div>
                <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-1">
                  Översättning
                </span>
                <p className="text-2xl font-bold text-[#00D2FF]">
                  {card.back}
                </p>
              </div>

              {/* Context Example Sentence */}
              {card.exampleSv && (
                <div className="p-3.5 rounded-xl bg-[#0F172A]/70 border border-[#263554]/80">
                  <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider block mb-1">
                    Exempelmening
                  </span>
                  <p className="text-base font-medium leading-snug">
                    {renderHighlightedExample(card.exampleSv, card.front.replace(/^(en|ett)\s+/i, ''))}
                  </p>
                  {card.exampleEn && (
                    <p className="text-xs text-[#94A3B8] italic mt-1">
                      "{card.exampleEn}"
                    </p>
                  )}
                </div>
              )}

              {/* Inflections Breakdown (if provided) */}
              {card.inflections && Array.isArray(card.inflections) && card.inflections.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-1">
                    Böjningsformer
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {card.inflections.map((form, i) => (
                      <span key={i} className="text-xs font-semibold px-2.5 py-1 rounded-md bg-[#1E293B] text-[#94A3B8] border border-[#263554]">
                        {form}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Bottom: 4 FSRS Rating Buttons (48px+ touch targets) */}
            <div className="w-full pt-3 border-t border-[#263554]/60">
              <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest block mb-2 text-center">
                Hur väl kom du ihåg ordet?
              </span>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {/* 1 - AGAIN */}
                <button
                  onClick={() => onRate(1)}
                  className="min-h-[48px] py-2.5 px-2 rounded-xl bg-rose-500/10 border border-rose-500/30 hover:border-rose-500 text-rose-300 font-bold flex flex-col items-center justify-center transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  aria-label="Igen, tangentswitch 1"
                >
                  <span className="text-xs font-extrabold uppercase">Igen (1)</span>
                  <span className="text-[11px] opacity-80 font-medium">{intervalPreviews[1]}</span>
                </button>

                {/* 2 - HARD */}
                <button
                  onClick={() => onRate(2)}
                  className="min-h-[48px] py-2.5 px-2 rounded-xl bg-amber-500/10 border border-amber-500/30 hover:border-amber-500 text-amber-300 font-bold flex flex-col items-center justify-center transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  aria-label="Svårt, tangentswitch 2"
                >
                  <span className="text-xs font-extrabold uppercase">Svårt (2)</span>
                  <span className="text-[11px] opacity-80 font-medium">{intervalPreviews[2]}</span>
                </button>

                {/* 3 - GOOD */}
                <button
                  onClick={() => onRate(3)}
                  className="min-h-[48px] py-2.5 px-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 hover:border-emerald-500 text-emerald-300 font-bold flex flex-col items-center justify-center transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  aria-label="Bra, tangentswitch 3"
                >
                  <span className="text-xs font-extrabold uppercase">Bra (3)</span>
                  <span className="text-[11px] opacity-80 font-medium">{intervalPreviews[3]}</span>
                </button>

                {/* 4 - EASY */}
                <button
                  onClick={() => onRate(4)}
                  className="min-h-[48px] py-2.5 px-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 hover:border-cyan-500 text-cyan-300 font-bold flex flex-col items-center justify-center transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  aria-label="Lätt, tangentswitch 4"
                >
                  <span className="text-xs font-extrabold uppercase">Lätt (4)</span>
                  <span className="text-[11px] opacity-80 font-medium">{intervalPreviews[4]}</span>
                </button>
              </div>
            </div>

          </div>

        </div>
      </div>

    </div>
  );
};

