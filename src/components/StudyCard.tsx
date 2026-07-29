import React, { useState, useEffect, useCallback } from 'react';
import { Card, Rating } from '../types';

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

  // Helper to render Gender Pill
  const renderGenderPill = () => {
    if (card.gender === 'en') {
      return <span className="glass-pill pill-en">en-ord</span>;
    }
    if (card.gender === 'ett') {
      return <span className="glass-pill pill-ett">ett-ord</span>;
    }
    if (card.wordClass === 'verb') {
      return <span className="glass-pill pill-verb">verb</span>;
    }
    return <span className="glass-pill pill-default">{card.wordClass}</span>;
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
            <span key={i} className="highlight-sv">
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
        <span>Kort {currentIndex + 1} av {totalInQueue}</span>
        <span className="bg-[#161F33] px-2.5 py-1 rounded-full border border-[#263554]">
          {card.state === 0 ? '🆕 Nytt kort' : card.state === 1 ? '🔄 Lär sig' : '⭐ Repetition'}
        </span>
      </div>

      {/* 3D Flip Card Container */}
      <div className="perspective-1000 w-full min-h-[460px]">
        <div className={`flip-card-inner ${isFlipped ? 'is-flipped' : ''}`}>
          
          {/* ================= FRONT SIDE ================= */}
          <div className="flip-card-front">
            {/* Top Bar: Gender Badge & Audio Button */}
            <div className="flex items-center justify-between w-full mb-4">
              {renderGenderPill()}
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  playAudio();
                }}
                className={`audio-btn ${isPlayingAudio ? 'is-playing' : ''}`}
                title="Lyssna på uttal (Tangentswitch: R)"
                aria-label="Spela ljud"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              </button>
            </div>

            {/* Center Focal Point: Swedish Target Word */}
            <div className="my-auto py-8 flex flex-col items-center justify-center">
              <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight select-none">
                {card.front}
              </h1>
              {card.ipa && (
                <p className="mt-3 text-lg font-mono text-[#00D2FF]/80 tracking-wide font-medium">
                  {card.ipa}
                </p>
              )}
            </div>

            {/* Bottom Action: Reveal Answer */}
            <div className="w-full pt-4 border-t border-[#263554]/60 flex flex-col items-center gap-2">
              <button
                onClick={() => setIsFlipped(true)}
                className="w-full btn-touch btn-aurora text-base font-bold shadow-lg py-3.5"
              >
                Visa Svar <span className="text-xs font-normal opacity-80 ml-2">(Mellanslag)</span>
              </button>
            </div>
          </div>

          {/* ================= BACK SIDE ================= */}
          <div className="flip-card-back">
            {/* Top Header: Word + Audio */}
            <div className="flex items-center justify-between w-full mb-3 pb-3 border-b border-[#263554]/60">
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-extrabold text-white">{card.front}</h2>
                  {renderGenderPill()}
                </div>
                {card.ipa && (
                  <p className="text-sm font-mono text-[#00D2FF]/90 mt-0.5">{card.ipa}</p>
                )}
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  playAudio();
                }}
                className={`audio-btn !w-10 !h-10 ${isPlayingAudio ? 'is-playing' : ''}`}
                title="Spela uttal (R)"
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

            {/* Bottom: 4 FSRS Rating Buttons */}
            <div className="w-full pt-3 border-t border-[#263554]/60">
              <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest block mb-2 text-center">
                Hur väl kom du ihåg ordet?
              </span>
              
              <div className="grid grid-cols-4 gap-2">
                {/* 1 - AGAIN */}
                <button
                  onClick={() => onRate(1)}
                  className="btn-touch rating-btn-again flex-col py-2 px-1"
                >
                  <span className="text-xs font-extrabold uppercase">Igen (1)</span>
                  <span className="text-[11px] opacity-80 font-medium">{intervalPreviews[1]}</span>
                </button>

                {/* 2 - HARD */}
                <button
                  onClick={() => onRate(2)}
                  className="btn-touch rating-btn-hard flex-col py-2 px-1"
                >
                  <span className="text-xs font-extrabold uppercase">Svårt (2)</span>
                  <span className="text-[11px] opacity-80 font-medium">{intervalPreviews[2]}</span>
                </button>

                {/* 3 - GOOD */}
                <button
                  onClick={() => onRate(3)}
                  className="btn-touch rating-btn-good flex-col py-2 px-1"
                >
                  <span className="text-xs font-extrabold uppercase">Bra (3)</span>
                  <span className="text-[11px] opacity-80 font-medium">{intervalPreviews[3]}</span>
                </button>

                {/* 4 - EASY */}
                <button
                  onClick={() => onRate(4)}
                  className="btn-touch rating-btn-easy flex-col py-2 px-1"
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
