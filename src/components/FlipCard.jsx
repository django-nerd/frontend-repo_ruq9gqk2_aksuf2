import React, { useEffect, useRef, useState } from 'react';

function speakJapanese(text) {
  if (!text) return;
  const utter = new SpeechSynthesisUtterance(text);
  const voices = window.speechSynthesis.getVoices();
  const jaVoice = voices.find(v => v.lang && v.lang.toLowerCase().startsWith('ja'));
  if (jaVoice) utter.voice = jaVoice;
  utter.lang = 'ja-JP';
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
}

export default function FlipCard({ card, onUpdateImage, autoFlipSignal }) {
  const [flipped, setFlipped] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (flipped) {
      speakJapanese(card.hiragana);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flipped, card.hiragana]);

  // Reset to front when autoplay advances
  useEffect(() => {
    if (autoFlipSignal > 0) setFlipped(false);
  }, [autoFlipSignal]);

  // Listen for global flip event from autoplay
  useEffect(() => {
    const handler = () => setFlipped(f => !f);
    document.addEventListener('kanji-flip-now', handler);
    return () => document.removeEventListener('kanji-flip-now', handler);
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onUpdateImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <div
        className="relative aspect-[3/4] w-full cursor-pointer"
        style={{ perspective: '1000px' }}
        onClick={() => setFlipped(f => !f)}
      >
        <div
          className="relative w-full h-full transition-transform duration-500"
          style={{ transformStyle: 'preserve-3d', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 rounded-2xl bg-white dark:bg-zinc-900 shadow-lg border border-zinc-200 dark:border-zinc-800 flex items-center justify-center p-6"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <div className="absolute top-2 left-3 text-xs text-zinc-500 select-none">{card.number ?? ''}</div>
            <div className="text-7xl sm:text-8xl font-bold tracking-tight">{card.kanji}</div>
            {card.image && (
              <img src={card.image} alt="related" className="absolute bottom-3 right-3 w-16 h-16 object-cover rounded-md opacity-70" />
            )}
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 rounded-2xl bg-zinc-50 dark:bg-zinc-950 shadow-lg border border-zinc-200 dark:border-zinc-800 p-6 flex flex-col"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <div className="flex items-start justify-between">
              <div className="text-xs text-zinc-500 select-none">{card.number ?? ''}</div>
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                  className="px-3 py-1 text-xs rounded-md bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700"
                >
                  Edit Image
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
              <div className="text-4xl sm:text-5xl font-semibold text-rose-600 dark:text-rose-400">{card.hiragana}</div>
              <div className="text-xl sm:text-2xl text-zinc-800 dark:text-zinc-200">{card.meaning}</div>
              {card.image && (
                <img src={card.image} alt="related" className="mt-4 w-40 h-40 object-cover rounded-lg shadow" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
