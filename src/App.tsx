import React, { useState, useEffect, useMemo } from 'react';
import { Card, Deck, QueueStats, Rating, UserStats, UserSettings } from './types';
import { dbStorage, DEFAULT_DECKS, INITIAL_CARDS, INITIAL_USER_STATS } from './db';
import { getTodayResetTimestamp } from './db/database';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { StudyCard } from './components/StudyCard';
import { SettingsModal } from './components/SettingsModal';

export const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState<Card[]>(INITIAL_CARDS);
  const [decks] = useState<Deck[]>(DEFAULT_DECKS);
  const [selectedDeckId, setSelectedDeckId] = useState<string>('deck-a1-core');
  const [userStats, setUserStats] = useState<UserStats>(INITIAL_USER_STATS);
  const [currentView, setCurrentView] = useState<'dashboard' | 'study' | 'summary'>('dashboard');

  // User Settings State (Persisted in localStorage)
  const [settings, setSettings] = useState<UserSettings>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = localStorage.getItem('muninn_settings');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.warn('Failed to parse saved settings', e);
        }
      }
    }
    return {
      dailyNewCards: 15,
      dailyReviewLimit: 100,
      speechRate: 0.9,
      autoPlayAudio: true,
    };
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Study Queue State
  const [studyQueue, setStudyQueue] = useState<Card[]>([]);
  const [studyIndex, setStudyIndex] = useState<number>(0);
  const [sessionCompletedCount, setSessionCompletedCount] = useState<number>(0);

  // Load Initial Data from IndexedDB
  useEffect(() => {
    async function loadData() {
      try {
        const loadedCards = await dbStorage.getCards();
        const loadedStats = await dbStorage.getUserStats();
        setCards(loadedCards);
        setUserStats(loadedStats);
      } catch (err) {
        console.warn('Failed to load IndexedDB data, fallback to defaults:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Filter cards by selected deck
  const currentDeckCards = useMemo(() => {
    return cards.filter((c) => c.deckId === selectedDeckId);
  }, [cards, selectedDeckId]);

  // Total Words Learned Metric (Cards in Review state, state === 2)
  const wordsLearnedCount = useMemo(() => {
    return cards.filter((c) => c.state === 2).length;
  }, [cards]);

  // Compute Queue Stats for Navbar & Dashboard
  const queueStats: QueueStats = useMemo(() => {
    const todayReset = getTodayResetTimestamp(settings.dayResetHour ?? 4);

    const newCardsStudiedToday = cards.filter(
      (c) => c.state > 0 && c.lastReview !== undefined && c.lastReview >= todayReset
    ).length;
    const remainingNewToday = Math.max(0, settings.dailyNewCards - newCardsStudiedToday);

    const dueNewCards = currentDeckCards
      .filter((c) => c.state === 0 && (!c.lastReview || c.lastReview < todayReset))
      .sort((a, b) => a.frequencyRank - b.frequencyRank)
      .slice(0, remainingNewToday);

    const dueReviews = currentDeckCards.filter((c) => c.state === 2 && c.due <= Date.now());
    const dueLearning = currentDeckCards.filter((c) => c.state === 1 || c.state === 3);

    return {
      newCount: dueNewCards.length,
      learningCount: dueLearning.length,
      reviewCount: dueReviews.length,
    };
  }, [cards, currentDeckCards, settings.dailyNewCards, settings.dayResetHour]);

  // Update Settings Handler
  const handleUpdateSettings = (newSettings: Partial<UserSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('muninn_settings', JSON.stringify(updated));
      }
      return updated;
    });
  };

  // Reset All Progress Handler
  const handleResetProgress = async () => {
    const resetCards: Card[] = cards.map((c) => ({
      ...c,
      state: 0,
      stability: 0,
      difficulty: 0,
      elapsedDays: 0,
      scheduledDays: 0,
      reps: 0,
      lapses: 0,
      due: Date.now(),
      lastReview: undefined,
    }));

    const resetStats: UserStats = {
      streak: 0,
      lastStudyDate: new Date().toISOString().split('T')[0],
      totalReviews: 0,
      retentionRate: 100,
      history: {},
    };

    setCards(resetCards);
    setUserStats(resetStats);

    // Save to IndexedDB
    try {
      for (const card of resetCards) {
        await dbStorage.saveCard(card);
      }
      await dbStorage.saveUserStats(resetStats);
    } catch (e) {
      console.warn('Failed to save reset progress to IndexedDB:', e);
    }
  };

  // Start Standard Daily Study Session
  const handleStartStudy = () => {
    const todayReset = getTodayResetTimestamp(settings.dayResetHour ?? 4);

    const newCardsStudiedToday = cards.filter(
      (c) => c.state > 0 && c.lastReview !== undefined && c.lastReview >= todayReset
    ).length;
    const remainingNewToday = Math.max(0, settings.dailyNewCards - newCardsStudiedToday);

    const dueNewCards = currentDeckCards
      .filter((c) => c.state === 0 && (!c.lastReview || c.lastReview < todayReset))
      .sort((a, b) => a.frequencyRank - b.frequencyRank)
      .slice(0, remainingNewToday);

    const dueReviews = currentDeckCards.filter((c) => c.state === 2 && c.due <= Date.now());
    const dueLearning = currentDeckCards.filter((c) => c.state === 1 || c.state === 3);

    const dueQueue = [...dueLearning, ...dueReviews, ...dueNewCards];

    if (dueQueue.length === 0) {
      return;
    }

    setStudyQueue(dueQueue);
    setStudyIndex(0);
    setSessionCompletedCount(0);
    setCurrentView('study');
  };

  // Start Bonus Study Session (Studera extra ord 🚀)
  // Allows studying new words an arbitrary number of times per day without repeating today's shown cards
  const handleStartBonusStudy = () => {
    const todayReset = getTodayResetTimestamp(settings.dayResetHour ?? 4);

    // Draw next 15 fresh unseen cards (state === 0) that have NOT been presented today
    const deckUnseenCards = currentDeckCards
      .filter((c) => c.state === 0 && (!c.lastReview || c.lastReview < todayReset))
      .sort((a, b) => a.frequencyRank - b.frequencyRank);

    let bonusQueue: Card[] = [];
    if (deckUnseenCards.length >= 15) {
      bonusQueue = deckUnseenCards.slice(0, 15);
    } else {
      const masterUnseenCards = cards
        .filter((c) => c.state === 0 && (!c.lastReview || c.lastReview < todayReset))
        .sort((a, b) => a.frequencyRank - b.frequencyRank);
      const deckCardIds = new Set(deckUnseenCards.map((c) => c.id));
      const masterFallbackCards = masterUnseenCards
        .filter((c) => !deckCardIds.has(c.id))
        .slice(0, 15 - deckUnseenCards.length);
      bonusQueue = [...deckUnseenCards, ...masterFallbackCards];
    }

    if (bonusQueue.length === 0) {
      return;
    }

    setStudyQueue(bonusQueue);
    setStudyIndex(0);
    setSessionCompletedCount(0);
    setCurrentView('study');
  };

  // FSRS Rating Handler
  const handleRateCard = async (rating: Rating) => {
    if (studyIndex >= studyQueue.length) return;

    const currentCard = studyQueue[studyIndex];

    // Compute updated FSRS card metrics
    let nextState: Card['state'] = currentCard.state;
    let nextStability = currentCard.stability || 1.0;
    let nextDifficulty = currentCard.difficulty || 5.0;
    let nextDue = Date.now();

    if (rating === 1) {
      // Again
      nextState = 1; // Learning
      nextStability = Math.max(0.5, nextStability * 0.8);
      nextDifficulty = Math.min(10, nextDifficulty + 0.4);
      nextDue = Date.now() + 10 * 60 * 1000; // 10 minutes
    } else if (rating === 2) {
      // Hard
      nextState = currentCard.state === 0 ? 1 : currentCard.state;
      nextStability = nextStability * 1.2;
      nextDue = Date.now() + 1.2 * 86400 * 1000; // 1.2 days
    } else if (rating === 3) {
      // Good
      nextState = 2; // Review
      nextStability = currentCard.state === 0 ? 2.5 : nextStability * 2.2;
      nextDue = Date.now() + 3.5 * 86400 * 1000; // 3.5 days
    } else if (rating === 4) {
      // Easy
      nextState = 2; // Review
      nextStability = currentCard.state === 0 ? 4.0 : nextStability * 3.5;
      nextDifficulty = Math.max(1, nextDifficulty - 0.2);
      nextDue = Date.now() + 9.0 * 86400 * 1000; // 9.0 days
    }

    const updatedCard: Card = {
      ...currentCard,
      state: nextState,
      stability: parseFloat(nextStability.toFixed(2)),
      difficulty: parseFloat(nextDifficulty.toFixed(2)),
      due: nextDue,
      reps: currentCard.reps + 1,
      lapses: rating === 1 ? currentCard.lapses + 1 : currentCard.lapses,
      lastReview: Date.now(),
    };

    // Calculate scheduled interval in days
    const intervalInDays = (nextDue - Date.now()) / (86400 * 1000);
    const isSubDayInterval = intervalInDays < 1.0 || rating === 1;

    let updatedQueue = [...studyQueue];

    if (isSubDayInterval) {
      // Re-queue card to be shown again before the session finishes:
      // Insert card 4 slots ahead or at the end of the current session queue
      const reinsertOffset = 4;
      const targetPosition = Math.min(studyIndex + reinsertOffset, updatedQueue.length);
      updatedQueue.splice(targetPosition, 0, updatedCard);
    }

    setStudyQueue(updatedQueue);

    // Save updated card & user stats
    setCards((prev) => prev.map((c) => (c.id === updatedCard.id ? updatedCard : c)));
    await dbStorage.saveCard(updatedCard);

    // Update User Stats
    const todayStr = new Date().toISOString().split('T')[0];
    const newStats: UserStats = {
      ...userStats,
      streak: userStats.streak === 0 ? 1 : userStats.streak,
      totalReviews: userStats.totalReviews + 1,
      lastStudyDate: todayStr,
      history: {
        ...userStats.history,
        [todayStr]: (userStats.history[todayStr] || 0) + 1,
      },
    };
    setUserStats(newStats);
    await dbStorage.saveUserStats(newStats);

    const nextIndex = studyIndex + 1;
    setSessionCompletedCount((prev) => prev + 1);

    if (nextIndex < updatedQueue.length) {
      setStudyIndex(nextIndex);
    } else {
      // All cards in session have been successfully rated with interval >= 1 day!
      setCurrentView('summary');
    }
  };

  const currentDeck = decks.find((d) => d.id === selectedDeckId);
  const currentDeckTitle = currentDeck?.title || 'Svenska';
  const currentDeckCefr = currentDeck?.cefrLevel || 'A1';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-[#00D2FF] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold tracking-wider text-[#94A3B8] uppercase">Laddar Muninn SRS...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] text-[#F8FAFC] flex flex-col font-sans selection:bg-[#00D2FF]/30 selection:text-[#00D2FF]">
      
      {/* Top Sticky Navbar */}
      <Navbar
        queueStats={queueStats}
        streak={userStats.streak}
        currentView={currentView === 'summary' ? 'dashboard' : currentView}
        onNavigate={(view) => setCurrentView(view)}
        deckTitle={currentDeckTitle}
        cefrLevel={currentDeckCefr}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main View Area */}
      <main className="flex-1 pb-12">
        {currentView === 'dashboard' && (
          <Dashboard
            queueStats={queueStats}
            userStats={userStats}
            decks={decks}
            selectedDeckId={selectedDeckId}
            onSelectDeck={(id) => setSelectedDeckId(id)}
            onStartStudy={handleStartStudy}
            onStartBonusStudy={handleStartBonusStudy}
            cards={cards}
            wordsLearnedCount={wordsLearnedCount}
          />
        )}

        {currentView === 'study' && studyQueue.length > 0 && (
          <StudyCard
            card={studyQueue[studyIndex]}
            onRate={handleRateCard}
            totalInQueue={studyQueue.length}
            currentIndex={studyIndex}
            speechRate={settings.speechRate}
            autoPlayAudio={settings.autoPlayAudio}
          />
        )}

        {currentView === 'summary' && (
          <div className="nordic-container py-12 text-center max-w-xl mx-auto">
            <div className="glass-card p-8 sm:p-10 space-y-6">
              
              {/* Animated Celebration Rune */}
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-[#10B981] to-[#06B6D4] flex items-center justify-center shadow-xl shadow-[#10B981]/20 animate-bounce">
                <span className="text-4xl">🎉</span>
              </div>

              <div>
                <h1 className="text-3xl font-extrabold text-white">Utmärkt Jobbat!</h1>
                <p className="text-sm text-[#94A3B8] mt-2">
                  Du har slutfört din repetitionssession för <span className="text-[#00D2FF] font-bold">{currentDeckTitle}</span>.
                </p>
              </div>

              {/* Session Stats Summary Card */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-[#0F172A] border border-[#263554]">
                <div>
                  <p className="text-[10px] font-bold text-[#64748B] uppercase">Repeterade Kort</p>
                  <p className="text-2xl font-extrabold text-[#00D2FF]">{sessionCompletedCount}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#64748B] uppercase">Dagar I Rad</p>
                  <p className="text-2xl font-extrabold text-amber-400">{userStats.streak} 🔥</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className="min-h-[48px] px-6 py-3 bg-gradient-to-r from-[#00D2FF] to-[#3A7BD5] text-[#0F172A] font-extrabold text-sm rounded-xl shadow-lg shadow-[#00D2FF]/20 hover:brightness-110 active:scale-98 transition-all focus:outline-none focus:ring-2 focus:ring-[#00D2FF] w-full sm:w-auto"
                >
                  Tillbaka till Instrumentbrädan
                </button>
                <button
                  onClick={handleStartStudy}
                  className="min-h-[48px] px-6 py-3 bg-[#161F33] hover:bg-[#263554] border border-[#263554] text-white text-sm font-bold rounded-xl transition-all active:scale-98 focus:outline-none focus:ring-2 focus:ring-[#00D2FF] w-full sm:w-auto"
                >
                  Studera Igen 🔄
                </button>
              </div>

            </div>
          </div>
        )}
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        wordsLearnedCount={wordsLearnedCount}
        totalCardsCount={cards.length}
        onResetProgress={handleResetProgress}
      />

      {/* Footer */}
      <footer className="w-full border-t border-[#263554]/60 py-4 text-center text-xs text-[#64748B]">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} Muninn — Svensk Spaced Repetition Design System</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-[#94A3B8] transition-colors cursor-pointer">Nordic Dusk Theme</span>
            <span>•</span>
            <span className="hover:text-[#94A3B8] transition-colors cursor-pointer">WCAG 2.1 AA Compliant</span>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default App;
