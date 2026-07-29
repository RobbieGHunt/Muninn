import React, { useState, useEffect, useMemo } from 'react';
import { Card, Deck, QueueStats, Rating, UserStats } from './types';
import { dbStorage, DEFAULT_DECKS, INITIAL_CARDS, INITIAL_USER_STATS } from './db';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { StudyCard } from './components/StudyCard';

export const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState<Card[]>(INITIAL_CARDS);
  const [decks] = useState<Deck[]>(DEFAULT_DECKS);
  const [selectedDeckId, setSelectedDeckId] = useState<string>('deck-a1-grund');
  const [userStats, setUserStats] = useState<UserStats>(INITIAL_USER_STATS);
  const [currentView, setCurrentView] = useState<'dashboard' | 'study' | 'summary'>('dashboard');
  
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
    return cards.filter(c => c.deckId === selectedDeckId);
  }, [cards, selectedDeckId]);

  // Compute Queue Stats for Navbar & Dashboard
  const queueStats: QueueStats = useMemo(() => {
    let newCount = 0;
    let learningCount = 0;
    let reviewCount = 0;

    currentDeckCards.forEach(c => {
      if (c.state === 0) newCount++;
      else if (c.state === 1 || c.state === 3) learningCount++;
      else if (c.state === 2) reviewCount++;
    });

    return { newCount, learningCount, reviewCount };
  }, [currentDeckCards]);

  // Start Study Session
  const handleStartStudy = () => {
    // Filter due cards or cards in learning/new state
    const dueQueue = currentDeckCards.filter(c => {
      if (c.state === 0) return true; // New
      if (c.state === 1 || c.state === 3) return true; // Learning / Relearning
      if (c.state === 2 && c.due <= Date.now() + 86400000) return true; // Review due within 24h
      return false;
    });

    // If queue empty, fall back to all cards for demo review
    const finalQueue = dueQueue.length > 0 ? dueQueue : currentDeckCards;

    setStudyQueue(finalQueue);
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

    if (rating === 1) { // Again
      nextState = 1; // Learning
      nextStability = Math.max(0.5, nextStability * 0.8);
      nextDifficulty = Math.min(10, nextDifficulty + 0.4);
      nextDue = Date.now() + 10 * 60 * 1000; // 10 minutes
    } else if (rating === 2) { // Hard
      nextState = currentCard.state === 0 ? 1 : currentCard.state;
      nextStability = nextStability * 1.2;
      nextDue = Date.now() + 1.2 * 86400 * 1000; // 1.2 days
    } else if (rating === 3) { // Good
      nextState = 2; // Review
      nextStability = currentCard.state === 0 ? 2.5 : nextStability * 2.2;
      nextDue = Date.now() + 3.5 * 86400 * 1000; // 3.5 days
    } else if (rating === 4) { // Easy
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
      lastReview: Date.now()
    };

    // Update in state
    setCards(prev => prev.map(c => c.id === updatedCard.id ? updatedCard : c));
    
    // Save to IndexedDB
    await dbStorage.saveCard(updatedCard);

    // Update User Stats
    const todayStr = new Date().toISOString().split('T')[0];
    const newStats: UserStats = {
      ...userStats,
      totalReviews: userStats.totalReviews + 1,
      lastStudyDate: todayStr,
      history: {
        ...userStats.history,
        [todayStr]: (userStats.history[todayStr] || 0) + 1
      }
    };
    setUserStats(newStats);
    await dbStorage.saveUserStats(newStats);

    const nextIndex = studyIndex + 1;
    setSessionCompletedCount(prev => prev + 1);

    if (nextIndex < studyQueue.length) {
      setStudyIndex(nextIndex);
    } else {
      // Session Completed!
      setCurrentView('summary');
    }
  };

  const currentDeckTitle = decks.find(d => d.id === selectedDeckId)?.title || 'Svenska';

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
          />
        )}

        {currentView === 'study' && studyQueue.length > 0 && (
          <StudyCard
            card={studyQueue[studyIndex]}
            onRate={handleRateCard}
            totalInQueue={studyQueue.length}
            currentIndex={studyIndex}
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
                  className="btn-touch btn-aurora px-6 py-3 text-sm font-bold w-full sm:w-auto"
                >
                  Tillbaka till Instrumentbrädan
                </button>
                <button
                  onClick={handleStartStudy}
                  className="btn-touch px-6 py-3 bg-[#161F33] hover:bg-[#263554] border border-[#263554] text-white text-sm font-bold w-full sm:w-auto"
                >
                  Studera Igen 🔄
                </button>
              </div>

            </div>
          </div>
        )}
      </main>

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
