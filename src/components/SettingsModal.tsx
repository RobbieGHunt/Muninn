import React, { useState } from 'react';
import { UserSettings } from '../types';
import { audioService } from '../services/audioService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  wordsLearnedCount: number;
  totalCardsCount: number;
  onResetProgress: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  wordsLearnedCount,
  totalCardsCount,
  onResetProgress,
}) => {
  // State for Double Confirmation Dialog
  const [confirmationStep, setConfirmationStep] = useState<0 | 1 | 2>(0);
  const [confirmInputText, setConfirmInputText] = useState('');
  const [isPlayingTestAudio, setIsPlayingTestAudio] = useState(false);

  if (!isOpen) return null;

  const presetDailyCards = [5, 10, 15, 20, 30, 50];

  const handleTestAudio = async () => {
    setIsPlayingTestAudio(true);
    try {
      await audioService.speak('Hej! Välkommen till Muninn.', {
        rate: settings.speechRate,
        onEnd: () => setIsPlayingTestAudio(false),
        onError: () => setIsPlayingTestAudio(false),
      });
    } catch {
      setIsPlayingTestAudio(false);
    }
  };

  const handleResetStep1 = () => {
    setConfirmationStep(1);
    setConfirmInputText('');
  };

  const handleResetStep2 = () => {
    setConfirmationStep(2);
  };

  const handleFinalReset = () => {
    onResetProgress();
    setConfirmationStep(0);
    setConfirmInputText('');
    onClose();
  };

  const handleCancelReset = () => {
    setConfirmationStep(0);
    setConfirmInputText('');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
    >
      {/* Click outside to close (if not in reset dialog) */}
      <div
        className="absolute inset-0"
        onClick={() => {
          if (confirmationStep === 0) onClose();
        }}
      />

      <div className="relative z-10 w-full max-w-xl bg-[#161F33] border border-[#263554] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#263554] bg-[#0F172A]/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00D2FF] to-[#3A7BD5] flex items-center justify-center shadow-md shadow-[#00D2FF]/20">
              <svg className="w-5 h-5 text-[#0F172A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h2 id="settings-modal-title" className="text-lg font-extrabold text-white tracking-tight">
                Inställningar
              </h2>
              <p className="text-xs text-[#94A3B8]">Anpassa inlärning, uttal och framsteg</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="min-h-[48px] min-w-[48px] rounded-xl bg-[#0F172A] border border-[#263554] text-[#94A3B8] hover:text-white hover:border-[#00D2FF] flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-[#00D2FF]"
            aria-label="Stäng inställningar"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-left">
          
          {/* ================= WORDS LEARNED METRIC CARD ================= */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-[#0F172A] to-[#162035] border border-[#263554] flex items-center justify-between shadow-lg">
            <div className="space-y-1">
              <span className="text-xs font-bold text-[#00D2FF] uppercase tracking-wider block">
                Statistik & Inlärning
              </span>
              <h3 className="text-xl font-extrabold text-white">Ord inlärda</h3>
              <p className="text-xs text-[#94A3B8]">
                Kort som du har behärskat och repeterar framgångsrikt
              </p>
            </div>
            <div className="text-right pl-4">
              <div className="text-3xl font-black text-[#00D2FF] drop-shadow-md">
                {wordsLearnedCount}
              </div>
              <div className="text-[10px] font-semibold text-[#64748B] uppercase">
                av {totalCardsCount} totalt
              </div>
            </div>
          </div>

          {/* ================= DAILY NEW CARDS SELECTOR ================= */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="daily-cards-slider" className="text-sm font-bold text-white block">
                  Dagliga Nya Kort
                </label>
                <p className="text-xs text-[#94A3B8]">
                  Antal nya ord som introduceras i din dagliga studie-kö
                </p>
              </div>
              <span className="text-sm font-extrabold text-[#00D2FF] bg-[#00D2FF]/10 px-3 py-1 rounded-lg border border-[#00D2FF]/30">
                {settings.dailyNewCards} ord/dag
              </span>
            </div>

            {/* Slider */}
            <input
              id="daily-cards-slider"
              type="range"
              min="5"
              max="50"
              step="5"
              value={settings.dailyNewCards}
              onChange={(e) => onUpdateSettings({ dailyNewCards: parseInt(e.target.value, 10) })}
              className="w-full h-2 bg-[#0F172A] rounded-lg appearance-none cursor-pointer accent-[#00D2FF] border border-[#263554]"
            />

            {/* Preset Buttons */}
            <div className="grid grid-cols-6 gap-2 pt-1">
              {presetDailyCards.map((count) => (
                <button
                  key={count}
                  onClick={() => onUpdateSettings({ dailyNewCards: count })}
                  className={`min-h-[44px] py-2 rounded-xl text-xs font-bold transition-all border focus:outline-none focus:ring-2 focus:ring-[#00D2FF] ${
                    settings.dailyNewCards === count
                      ? 'bg-[#00D2FF] text-[#0F172A] border-[#00D2FF] shadow-md shadow-[#00D2FF]/20 font-extrabold'
                      : 'bg-[#0F172A] text-[#94A3B8] border-[#263554] hover:border-[#00D2FF]/50 hover:text-white'
                  }`}
                  aria-label={`Ställ in ${count} nya kort per dag`}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          <hr className="border-[#263554]/60" />

          {/* ================= DAY RESET TIME SELECTOR ================= */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="day-reset-select" className="text-sm font-bold text-white block">
                  Dagsåterställningstid (SRS-dygn)
                </label>
                <p className="text-xs text-[#94A3B8]">
                  Tidpunkten då nya ord och repetitioner förnyas varje dag
                </p>
              </div>
              <span className="text-sm font-extrabold text-[#F59E0B] bg-[#F59E0B]/10 px-3 py-1 rounded-lg border border-[#F59E0B]/30">
                kl. {String(settings.dayResetHour ?? 4).padStart(2, '0')}:00
              </span>
            </div>

            <select
              id="day-reset-select"
              value={settings.dayResetHour ?? 4}
              onChange={(e) => onUpdateSettings({ dayResetHour: parseInt(e.target.value, 10) })}
              className="w-full min-h-[44px] px-3 py-2 bg-[#0F172A] border border-[#263554] rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-[#00D2FF]"
              aria-label="Välj dagsåterställningstid"
            >
              <option value={0}>00:00 (Midnatt)</option>
              <option value={2}>02:00 (Tidig natt)</option>
              <option value={4}>04:00 (Standard natt - rekommenderat)</option>
              <option value={5}>05:00 (Morgon)</option>
              <option value={6}>06:00 (Morgon)</option>
            </select>
          </div>

          <hr className="border-[#263554]/60" />

          {/* ================= SPEECH RATE SLIDER ================= */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="speech-rate-slider" className="text-sm font-bold text-white block">
                  Talhastighet (Uttal)
                </label>
                <p className="text-xs text-[#94A3B8]">
                  Justera hastigheten för syntetiskt svenskt uttal
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-[#10B981] bg-[#10B981]/10 px-3 py-1 rounded-lg border border-[#10B981]/30">
                  {settings.speechRate.toFixed(2)}x
                </span>
                <button
                  onClick={handleTestAudio}
                  disabled={isPlayingTestAudio}
                  className="min-h-[36px] px-3 py-1 bg-[#161F33] hover:bg-[#263554] border border-[#263554] text-xs font-bold text-[#00D2FF] rounded-lg transition-all flex items-center gap-1 active:scale-95 disabled:opacity-50"
                  title="Testa uttal med aktuell hastighet"
                >
                  <svg className={`w-3.5 h-3.5 ${isPlayingTestAudio ? 'animate-pulse' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                  <span>Testa 🔊</span>
                </button>
              </div>
            </div>

            <input
              id="speech-rate-slider"
              type="range"
              min="0.5"
              max="1.5"
              step="0.05"
              value={settings.speechRate}
              onChange={(e) => onUpdateSettings({ speechRate: parseFloat(e.target.value) })}
              className="w-full h-2 bg-[#0F172A] rounded-lg appearance-none cursor-pointer accent-[#10B981] border border-[#263554]"
            />

            <div className="flex items-center justify-between text-[10px] text-[#94A3B8] font-semibold">
              <span>0.5x (Mycket långsam)</span>
              <span>1.0x (Normal)</span>
              <span>1.5x (Snabb)</span>
            </div>
          </div>

          <hr className="border-[#263554]/60" />

          {/* ================= AUDIO AUTO-PLAY TOGGLE ================= */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#0F172A]/70 border border-[#263554]">
            <div className="space-y-0.5 max-w-[80%]">
              <span className="text-sm font-bold text-white block">
                Automatisk Ljuduppspelning
              </span>
              <p className="text-xs text-[#94A3B8]">
                Spela upp svenskt uttal automatiskt så fort ett nytt kort visas
              </p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={settings.autoPlayAudio}
              onClick={() => onUpdateSettings({ autoPlayAudio: !settings.autoPlayAudio })}
              className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-[#00D2FF] ${
                settings.autoPlayAudio ? 'bg-[#00D2FF]' : 'bg-[#263554]'
              }`}
              aria-label="Växla automatisk ljuduppspelning"
            >
              <div
                className={`bg-[#0F172A] w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 flex items-center justify-center text-[10px] ${
                  settings.autoPlayAudio ? 'translate-x-6' : 'translate-x-0'
                }`}
              >
                {settings.autoPlayAudio ? '🔊' : '🔇'}
              </div>
            </button>
          </div>

          <hr className="border-[#263554]/60" />

          {/* ================= DANGER ZONE: RESET PROGRESS ================= */}
          <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-3">
            <div className="flex items-center gap-2 text-rose-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3 className="text-sm font-extrabold tracking-tight">Farlig Zon: Återställ Framsteg</h3>
            </div>

            <p className="text-xs text-[#94A3B8]">
              Nollställ din minneshistorik, alla inlärda ord och repetitioner för att börja om från början.
            </p>

            {confirmationStep === 0 && (
              <button
                onClick={handleResetStep1}
                className="min-h-[48px] w-full py-2.5 px-4 rounded-xl bg-rose-600/20 border border-rose-500/40 text-rose-300 hover:bg-rose-600 hover:text-white font-bold text-xs transition-all active:scale-98 focus:outline-none focus:ring-2 focus:ring-rose-500 flex items-center justify-center gap-2"
              >
                <span>Återställ alla framsteg</span>
              </button>
            )}

            {/* Step 1 Dialog */}
            {confirmationStep === 1 && (
              <div className="p-3 rounded-lg bg-[#0F172A] border border-rose-500/50 space-y-3 animate-fade-in">
                <p className="text-xs text-rose-300 font-bold">
                  ⚠️ Bekräftelse Steg 1 av 2: Är du helt säker?
                </p>
                <p className="text-[11px] text-[#94A3B8]">
                  Detta kommer permanent att nollställa alla {totalCardsCount} kort till status "Nytt kort" och radera alla repetitioner.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleCancelReset}
                    className="min-h-[40px] flex-1 py-1.5 px-3 rounded-lg bg-[#161F33] text-[#94A3B8] border border-[#263554] text-xs font-bold hover:text-white"
                  >
                    Avbryt
                  </button>
                  <button
                    onClick={handleResetStep2}
                    className="min-h-[40px] flex-1 py-1.5 px-3 rounded-lg bg-rose-600 text-white text-xs font-extrabold hover:bg-rose-500"
                  >
                    Fortsätt →
                  </button>
                </div>
              </div>
            )}

            {/* Step 2 Dialog */}
            {confirmationStep === 2 && (
              <div className="p-3.5 rounded-lg bg-[#0F172A] border border-rose-500 space-y-3 animate-fade-in">
                <p className="text-xs text-rose-400 font-extrabold">
                  🚨 Slutgiltig Varning: Skriv "ÅTERSTÄLL" nedan för att bekräfta
                </p>
                <input
                  type="text"
                  placeholder="Skriv ÅTERSTÄLL här"
                  value={confirmInputText}
                  onChange={(e) => setConfirmInputText(e.target.value)}
                  className="w-full min-h-[44px] px-3 py-2 bg-[#161F33] border border-[#263554] rounded-lg text-xs font-mono text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleCancelReset}
                    className="min-h-[40px] flex-1 py-1.5 px-3 rounded-lg bg-[#161F33] text-[#94A3B8] border border-[#263554] text-xs font-bold hover:text-white"
                  >
                    Avbryt
                  </button>
                  <button
                    disabled={confirmInputText.trim() !== 'ÅTERSTÄLL'}
                    onClick={handleFinalReset}
                    className="min-h-[40px] flex-1 py-1.5 px-3 rounded-lg bg-rose-600 text-white text-xs font-black hover:bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-rose-600/30"
                  >
                    Ja, radera allt permanent
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-[#263554] bg-[#0F172A]/90 flex justify-end">
          <button
            onClick={onClose}
            className="min-h-[48px] px-6 py-2.5 bg-gradient-to-r from-[#00D2FF] to-[#3A7BD5] text-[#0F172A] text-xs font-extrabold rounded-xl shadow-md hover:brightness-110 active:scale-98 transition-all focus:outline-none focus:ring-2 focus:ring-[#00D2FF]"
          >
            Spara & Stäng
          </button>
        </div>

      </div>
    </div>
  );
};

export default SettingsModal;
