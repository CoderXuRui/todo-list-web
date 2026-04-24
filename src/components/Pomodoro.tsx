import { useState, useEffect } from 'react';
import { usePomodoroStore } from '../stores/pomodoroStore';

interface PomodoroProps {
  onClose: () => void;
}

export function Pomodoro({ onClose }: PomodoroProps) {
  const [showSettings, setShowSettings] = useState(false);

  const {
    mode,
    timeLeft,
    isRunning,
    completedSessions,
    settings,
    start,
    pause,
    reset,
    switchMode,
    updateSettings,
  } = usePomodoroStore();

  // 实时刷新显示（每 250ms 更新一次，让 UI 更流畅）
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => forceUpdate((v) => v + 1), 250);
    return () => clearInterval(id);
  }, [isRunning]);

  const totalSeconds = (mode === 'work' ? settings.workMinutes : settings.breakMinutes) * 60;
  const progress = ((totalSeconds - timeLeft) / totalSeconds) * 100;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const radius = 100;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-bubble p-8 w-full max-w-sm animate-bounce-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl font-bold text-gray-700 dark:text-gray-200">
            🍅 番茄钟
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 transition-colors"
              title="设置时间"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl animate-slide-up">
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-3">
              ⏱️ 时间设置
            </h3>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-xs text-gray-400 mb-1">专注时间（分钟）</label>
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={settings.workMinutes}
                  onChange={(e) => updateSettings({ workMinutes: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-center font-semibold outline-none focus:border-lavender transition-colors"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-400 mb-1">休息时间（分钟）</label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={settings.breakMinutes}
                  onChange={(e) => updateSettings({ breakMinutes: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-center font-semibold outline-none focus:border-lavender transition-colors"
                />
              </div>
            </div>
          </div>
        )}

        {/* Mode tabs */}
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => switchMode('work')}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
              mode === 'work'
                ? 'bg-coral text-white shadow-soft'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
            }`}
          >
            专注 ({settings.workMinutes}分)
          </button>
          <button
            onClick={() => switchMode('break')}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
              mode === 'break'
                ? 'bg-mint text-white shadow-soft'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
            }`}
          >
            休息 ({settings.breakMinutes}分)
          </button>
        </div>

        {/* Timer circle */}
        <div className="relative w-64 h-64 mx-auto mb-8">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 220 220">
            <circle
              cx="110"
              cy="110"
              r={radius}
              fill="none"
              stroke="#f0f0f0"
              strokeWidth="8"
              className="dark:stroke-gray-700"
            />
            <circle
              cx="110"
              cy="110"
              r={radius}
              fill="none"
              stroke={mode === 'work' ? '#FF8A8A' : '#A8E6CF'}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className={`text-5xl font-display font-bold ${
              mode === 'work' ? 'text-coral' : 'text-mint'
            }`}>
              {formatTime(timeLeft)}
            </div>
            <div className="text-sm text-gray-400 mt-2">
              {isRunning ? '进行中...' : '已暂停'}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <button
            onClick={reset}
            className="p-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            title="重置"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          <button
            onClick={isRunning ? pause : start}
            className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl shadow-lift hover:scale-110 transition-all duration-300 ${
              mode === 'work'
                ? 'bg-gradient-to-br from-blush to-coral'
                : 'bg-gradient-to-br from-mint to-sky'
            }`}
          >
            {isRunning ? (
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
        </div>

        {/* Stats */}
        <div className="text-center">
          <p className="text-sm text-gray-400 dark:text-gray-500">
            今日完成 <span className="font-bold text-coral">{completedSessions}</span> 个番茄钟
          </p>
        </div>
      </div>
    </div>
  );
}
