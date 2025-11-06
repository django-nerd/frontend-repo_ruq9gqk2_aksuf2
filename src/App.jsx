import React, { useEffect, useMemo, useRef, useState } from 'react';
import FlipCard from './components/FlipCard';
import AutoplayControls from './components/AutoplayControls';
import Quiz from './components/Quiz';
import Uploader from './components/Uploader';

// Local persistence helpers
const STORAGE_KEY = 'kanji_app_data_v1';

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

const DEFAULT_CHAPTERS = Array.from({ length: 13 }, (_, i) => i + 1).reduce((acc, n) => {
  acc[n] = `Chapter ${n}`;
  return acc;
}, {});

export default function App() {
  const [cardsByChapter, setCardsByChapter] = useState(() => loadData()?.cardsByChapter || {});
  const [chapters] = useState(DEFAULT_CHAPTERS);
  const [currentChapter, setCurrentChapter] = useState(1);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);
  const [speed, setSpeed] = useState(1600);
  const [autoSignal, setAutoSignal] = useState(0);
  const [mode, setMode] = useState('flash'); // 'flash' | 'quiz'

  useEffect(() => {
    saveData({ cardsByChapter });
  }, [cardsByChapter]);

  const currentCards = cardsByChapter[currentChapter] || [];
  const currentCard = currentCards[currentIndex];

  // Autoplay: flip then advance
  useEffect(() => {
    if (!autoPlay || currentCards.length === 0) return;
    setAutoSignal(s => s + 1);
    let isFront = true;
    let idx = currentIndex;

    const flipTimer = setInterval(() => {
      if (isFront) {
        // flip to back (handled via a ref state on the card by triggering click through a flag)
        // We'll simulate by toggling a dummy state to ask card to flip itself via click by user; instead
        // we can just move index every other tick and rely on card to auto-speak when flipped
        // Approach: emit custom event to request flip
        document.dispatchEvent(new CustomEvent('kanji-flip-now'));
        isFront = false;
      } else {
        // move next
        setCurrentIndex(prev => {
          const next = (prev + 1) % currentCards.length;
          return next;
        });
        setAutoSignal(s => s + 1);
        isFront = true;
      }
    }, speed);

    return () => clearInterval(flipTimer);
  }, [autoPlay, speed, currentCards.length]);

  // Listen flip signals to toggle a CSS variable on the flip card? Simpler: FlipCard flips on click only, so we adjust logic:
  // We'll render FlipCard with a key changing every half-step to trigger flip via internal effect.

  const [flipTick, setFlipTick] = useState(0);
  useEffect(() => {
    const handler = () => setFlipTick(t => t + 1);
    document.addEventListener('kanji-flip-now', handler);
    return () => document.removeEventListener('kanji-flip-now', handler);
  }, []);

  const handleAddCards = (items) => {
    if (!items || items.length === 0) return;
    // flatten current to get total count and compute chapter slots of ~50
    const all = [];
    for (let i = 1; i <= 13; i++) {
      (cardsByChapter[i] || []).forEach(c => all.push(c));
    }
    items.forEach(it => all.push(it));

    const perChapter = Math.ceil(613 / 13) || 50; // ~50
    const chunk = (arr, size) => arr.reduce((acc, _, i) => (i % size ? acc : [...acc, arr.slice(i, i + size)]), []);
    const chunks = chunk(all, perChapter);
    const next = {};
    for (let i = 1; i <= 13; i++) {
      next[i] = chunks[i - 1] || [];
    }
    setCardsByChapter(next);
    setCurrentChapter(1);
    setCurrentIndex(0);
  };

  const updateImage = (chapter, index, imageData) => {
    setCardsByChapter(prev => {
      const copy = { ...prev };
      const arr = [...(copy[chapter] || [])];
      arr[index] = { ...(arr[index] || {}), image: imageData };
      copy[chapter] = arr;
      return copy;
    });
  };

  const hasData = Object.values(cardsByChapter).some(a => (a || []).length > 0);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Kanji Flashcards & Quiz</h1>
            <p className="text-sm text-zinc-500">Upload data, study with flip cards, and test yourself with quizzes.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setMode('flash')} className={`px-3 py-2 rounded-md text-sm ${mode==='flash'?'bg-rose-600 text-white':'bg-zinc-200 dark:bg-zinc-800'}`}>Flashcards</button>
            <button onClick={() => setMode('quiz')} className={`px-3 py-2 rounded-md text-sm ${mode==='quiz'?'bg-rose-600 text-white':'bg-zinc-200 dark:bg-zinc-800'}`}>Quiz</button>
          </div>
        </header>

        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Upload Kanji Data</h2>
          <Uploader onAddCards={handleAddCards} />
        </section>

        {mode === 'flash' && (
          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 overflow-x-auto">
                {Object.entries(chapters).map(([id, name]) => (
                  <button key={id} onClick={() => { setCurrentChapter(Number(id)); setCurrentIndex(0); }} className={`px-3 py-1 rounded-md text-sm border whitespace-nowrap ${Number(id)===currentChapter? 'bg-rose-50 border-rose-300 text-rose-700':'bg-white dark:bg-zinc-900'}`}>{name}</button>
                ))}
              </div>
              <AutoplayControls
                isPlaying={autoPlay}
                speed={speed}
                onToggle={() => setAutoPlay(p => !p)}
                onSpeedChange={setSpeed}
              />
            </div>

            {hasData ? (
              <div className="space-y-3">
                <div className="text-sm text-zinc-500">Card {currentCards.length ? currentIndex + 1 : 0} / {currentCards.length}</div>
                {currentCard ? (
                  <FlipCard
                    key={`${currentChapter}-${currentIndex}-${flipTick}-${autoSignal}`}
                    card={currentCard}
                    onUpdateImage={(img) => updateImage(currentChapter, currentIndex, img)}
                    autoFlipSignal={autoSignal}
                  />
                ) : (
                  <div className="rounded-xl border p-6 bg-white dark:bg-zinc-900 text-sm text-zinc-500">No cards in this chapter yet.</div>
                )}
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
                    className="px-3 py-2 rounded-md bg-zinc-200 dark:bg-zinc-800"
                  >Prev</button>
                  <button
                    onClick={() => setCurrentIndex(i => currentCards.length ? (i + 1) % currentCards.length : 0)}
                    className="px-3 py-2 rounded-md bg-zinc-200 dark:bg-zinc-800"
                  >Next</button>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border p-6 bg-white dark:bg-zinc-900 text-sm text-zinc-500">No data yet. Upload some Kanji to begin.</div>
            )}
          </section>
        )}

        {mode === 'quiz' && (
          <section>
            <Quiz chapters={chapters} cardsByChapter={cardsByChapter} />
          </section>
        )}

        <footer className="mt-10 text-xs text-zinc-500">Autosaves locally in your browser. Responsive for mobile.</footer>
      </div>
    </div>
  );
}
