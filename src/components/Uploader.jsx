import React, { useEffect, useMemo, useRef, useState } from 'react';

function parseLine(line) {
  // Examples:
  // "魚（さかな）＝ Fish"
  // "1. 魚（さかな）＝ Fish"
  const trimmed = line.trim();
  if (!trimmed) return null;

  // Extract leading numbering like "1." or "12)"
  const numMatch = trimmed.match(/^(\d+)[\.|\)]\s*/);
  let number = undefined;
  let s = trimmed;
  if (numMatch) {
    number = Number(numMatch[1]);
    s = trimmed.replace(numMatch[0], '');
  }
  // Extract: Kanji（hiragana）＝ meaning
  const m = s.match(/^(.*?)\（(.*?)\）\s*[=＝]\s*(.*)$/);
  if (!m) return null;
  const kanji = m[1].trim();
  const hiragana = m[2].trim();
  const meaning = m[3].trim();
  return { kanji, hiragana, meaning, number, image: null };
}

export default function Uploader({ onAddCards }) {
  const [text, setText] = useState('');
  const [preview, setPreview] = useState([]);

  useEffect(() => {
    const parsed = text.split(/\n+/).map(parseLine).filter(Boolean);
    setPreview(parsed);
  }, [text]);

  const total = preview.length;

  return (
    <div className="space-y-3">
      <textarea
        className="w-full h-40 px-3 py-2 rounded-md border bg-white dark:bg-zinc-900"
        placeholder="Paste Kanji lines here (e.g. 魚（さかな）＝ Fish)"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="flex items-center justify-between">
        <div className="text-sm text-zinc-500">Parsed: {total} items</div>
        <button
          onClick={() => { onAddCards(preview); setText(''); }}
          className="px-4 py-2 rounded-md bg-emerald-600 text-white disabled:opacity-50"
          disabled={total === 0}
        >
          Add to Chapters
        </button>
      </div>
      {preview.length > 0 && (
        <div className="text-xs text-zinc-500">Numbers will be shown small on flashcards. Items are auto-split into 13 chapters (~50 each).</div>
      )}
    </div>
  );
}
