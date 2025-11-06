import React from 'react';

export default function AutoplayControls({ isPlaying, speed, onToggle, onSpeedChange }) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={onToggle}
        className={`px-4 py-2 rounded-md text-sm font-medium ${isPlaying ? 'bg-rose-600 text-white' : 'bg-zinc-200 dark:bg-zinc-800'} hover:opacity-90`}
      >
        {isPlaying ? 'Pause Auto Play' : 'Start Auto Play'}
      </button>
      <div className="flex items-center gap-2">
        <label className="text-sm text-zinc-600 dark:text-zinc-300">Speed</label>
        <input
          type="range"
          min="800"
          max="4000"
          step="200"
          value={speed}
          onChange={(e) => onSpeedChange(Number(e.target.value))}
        />
        <span className="text-xs text-zinc-500 w-12 text-right">{Math.round(speed / 100) / 10}s</span>
      </div>
    </div>
  );
}
