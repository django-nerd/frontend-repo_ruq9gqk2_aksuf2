import React, { useMemo, useState } from 'react';

const QUIZ_TYPES = [
  { key: 'k2m', label: 'Kanji → Meaning', q: c => c.kanji, a: c => c.meaning },
  { key: 'm2k', label: 'Meaning → Kanji', q: c => c.meaning, a: c => c.kanji },
  { key: 'k2h', label: 'Kanji → Hiragana', q: c => c.kanji, a: c => c.hiragana },
  { key: 'k2hm', label: 'Kanji → Hiragana + Meaning', q: c => c.kanji, a: c => `${c.hiragana} — ${c.meaning}` },
];

export default function Quiz({ chapters, cardsByChapter }) {
  const [selectedChapters, setSelectedChapters] = useState(Object.keys(chapters));
  const [numQuestions, setNumQuestions] = useState(10);
  const [typeKey, setTypeKey] = useState('k2m');
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState([]);

  const allSelectedCards = useMemo(() => {
    const arr = [];
    selectedChapters.forEach((id) => {
      const idx = Number(id);
      (cardsByChapter[idx] || []).forEach(c => arr.push({ ...c, chapter: idx }));
    });
    // randomize
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.slice(0, numQuestions);
  }, [selectedChapters, numQuestions, cardsByChapter]);

  const quizType = QUIZ_TYPES.find(q => q.key === typeKey) || QUIZ_TYPES[0];

  const startQuiz = () => {
    setStarted(true);
    setIndex(0);
    setAnswers([]);
  };

  const submit = (value) => {
    const current = allSelectedCards[index];
    const correct = quizType.a(current);
    setAnswers(prev => [...prev, { value, correct, card: current }]);
    if (index + 1 < allSelectedCards.length) setIndex(i => i + 1);
    else setStarted(false);
  };

  const score = answers.filter(a => a.value.trim() === a.correct).length;

  return (
    <div className="space-y-4">
      {!started && answers.length === 0 && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {Object.entries(chapters).map(([id, name]) => (
              <label key={id} className={`px-3 py-1 rounded-md text-sm border cursor-pointer ${selectedChapters.includes(id) ? 'bg-rose-50 border-rose-300 text-rose-700' : 'bg-zinc-50 border-zinc-300'}`}>
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={selectedChapters.includes(id)}
                  onChange={(e) => {
                    setSelectedChapters(prev => e.target.checked ? [...prev, id] : prev.filter(x => x !== id));
                  }}
                />
                {name}
              </label>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select value={typeKey} onChange={e => setTypeKey(e.target.value)} className="px-3 py-2 rounded-md border bg-white dark:bg-zinc-900">
              {QUIZ_TYPES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
            </select>
            <div className="flex items-center gap-2">
              <label className="text-sm">Questions</label>
              <input type="number" min={10} max={100} step={5} value={numQuestions} onChange={e => setNumQuestions(Number(e.target.value))} className="w-24 px-3 py-2 rounded-md border bg-white dark:bg-zinc-900" />
            </div>
            <button onClick={startQuiz} className="px-4 py-2 rounded-md bg-rose-600 text-white">Start Quiz</button>
          </div>
        </div>
      )}

      {started && (
        <QuestionCard
          index={index}
          total={allSelectedCards.length}
          prompt={quizType.q(allSelectedCards[index])}
          onSubmit={submit}
        />
      )}

      {!started && answers.length > 0 && (
        <Results answers={answers} score={score} total={allSelectedCards.length} />
      )}
    </div>
  );
}

function QuestionCard({ index, total, prompt, onSubmit }) {
  const [value, setValue] = useState('');
  return (
    <div className="rounded-xl border p-6 bg-white dark:bg-zinc-900">
      <div className="text-sm text-zinc-500 mb-2">Question {index + 1} / {total}</div>
      <div className="text-4xl font-semibold mb-6">{prompt}</div>
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(value); setValue(''); }} className="flex items-center gap-3">
        <input value={value} onChange={e => setValue(e.target.value)} className="flex-1 px-4 py-2 rounded-md border bg-white dark:bg-zinc-900" placeholder="Type your answer" />
        <button className="px-4 py-2 rounded-md bg-rose-600 text-white">Submit</button>
      </form>
    </div>
  );
}

function Results({ answers, score, total }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border p-6 bg-white dark:bg-zinc-900">
        <div className="text-2xl font-semibold">Your Score: {score} / {total}</div>
        <div className="text-sm text-zinc-500">Review the explanations below.</div>
      </div>
      <div className="grid gap-3">
        {answers.map((a, i) => (
          <div key={i} className={`rounded-lg border p-4 ${a.value.trim() === a.correct ? 'border-emerald-300 bg-emerald-50' : 'border-rose-300 bg-rose-50'}`}>
            <div className="text-sm text-zinc-600 mb-1">{a.card.kanji} — {a.card.hiragana} — {a.card.meaning}</div>
            <div className="text-sm"><span className="font-medium">Your answer:</span> {a.value || '(blank)'} </div>
            <div className="text-sm"><span className="font-medium">Correct:</span> {a.correct}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
