import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { notifyPomodoroComplete } from '../utils/notifications';

type TimerMode = 'work' | 'break';

interface PomodoroSettings {
  workMinutes: number;
  breakMinutes: number;
}

interface PomodoroState {
  mode: TimerMode;
  timeLeft: number;
  isRunning: boolean;
  completedSessions: number;
  completedAt: string[]; // ISO timestamps of each completed work session
  settings: PomodoroSettings;
  endAt: number | null;
}

interface PomodoroActions {
  start: () => void;
  pause: () => void;
  reset: () => void;
  switchMode: (mode: TimerMode) => void;
  tick: () => void;
  complete: () => void;
  updateSettings: (partial: Partial<PomodoroSettings>) => void;
}

type PomodoroStore = PomodoroState & PomodoroActions;

const DEFAULT_SETTINGS: PomodoroSettings = {
  workMinutes: 25,
  breakMinutes: 5,
};

const getTotalSeconds = (mode: TimerMode, settings: PomodoroSettings) => {
  return (mode === 'work' ? settings.workMinutes : settings.breakMinutes) * 60;
};

// 全局定时器，即使组件卸载也继续运行
let timerInterval: ReturnType<typeof setInterval> | null = null;

function ensureTimer() {
  if (timerInterval) return;
  timerInterval = setInterval(() => {
    const state = usePomodoroStore.getState();
    if (!state.isRunning) return;
    state.tick();
  }, 1000);
}

export function stopPomodoroTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

export const usePomodoroStore = create<PomodoroStore>()(
  persist(
    (set, get) => ({
      mode: 'work',
      timeLeft: DEFAULT_SETTINGS.workMinutes * 60,
      isRunning: false,
      completedSessions: 0,
      completedAt: [],
      settings: { ...DEFAULT_SETTINGS },
      endAt: null,

      start: () => {
        const state = get();
        if (state.isRunning) return;
        const endAt = Date.now() + state.timeLeft * 1000;
        set({ isRunning: true, endAt });
        ensureTimer();
      },

      pause: () => {
        const state = get();
        if (!state.isRunning) return;
        // 计算当前剩余时间
        const remaining = state.endAt
          ? Math.max(0, Math.ceil((state.endAt - Date.now()) / 1000))
          : state.timeLeft;
        set({ isRunning: false, timeLeft: remaining, endAt: null });
      },

      reset: () => {
        const state = get();
        set({
          isRunning: false,
          timeLeft: getTotalSeconds(state.mode, state.settings),
          endAt: null,
        });
      },

      switchMode: (mode) => {
        const state = get();
        set({
          mode,
          isRunning: false,
          timeLeft: getTotalSeconds(mode, state.settings),
          endAt: null,
        });
      },

      tick: () => {
        const state = get();
        if (!state.isRunning || !state.endAt) return;

        const remaining = Math.max(0, Math.ceil((state.endAt - Date.now()) / 1000));

        if (remaining === 0) {
          // 时间到
          get().complete();
        } else {
          set({ timeLeft: remaining });
        }
      },

      complete: () => {
        const state = get();
        const newMode = state.mode === 'work' ? 'break' : 'work';
        const newTimeLeft = getTotalSeconds(newMode, state.settings);
        const now = new Date().toISOString();

        set({
          mode: newMode,
          isRunning: false,
          timeLeft: newTimeLeft,
          endAt: null,
          completedSessions:
            state.mode === 'work'
              ? state.completedSessions + 1
              : state.completedSessions,
          completedAt:
            state.mode === 'work'
              ? [...state.completedAt, now]
              : state.completedAt,
        });

        // 播放提示音
        playCompleteSound();
        // 发送桌面通知
        notifyPomodoroComplete(state.mode === 'work');
      },

      updateSettings: (partial) => {
        const state = get();
        const newSettings = { ...state.settings, ...partial };
        const clampedSettings = {
          workMinutes: Math.max(1, Math.min(120, newSettings.workMinutes)),
          breakMinutes: Math.max(1, Math.min(60, newSettings.breakMinutes)),
        };

        const shouldUpdateTime =
          !state.isRunning &&
          ((state.mode === 'work' && 'workMinutes' in partial) ||
            (state.mode === 'break' && 'breakMinutes' in partial));

        set({
          settings: clampedSettings,
          ...(shouldUpdateTime
            ? { timeLeft: getTotalSeconds(state.mode, clampedSettings) }
            : {}),
        });
      },
    }),
    {
      name: 'pomodoro-storage',
      version: 1,
      partialize: (state) => ({
        mode: state.mode,
        timeLeft: state.timeLeft,
        isRunning: state.isRunning,
        completedSessions: state.completedSessions,
        completedAt: state.completedAt,
        settings: state.settings,
        endAt: state.endAt,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.completedAt = state.completedAt || [];
        }
        if (state && state.isRunning && state.endAt) {
          // 恢复时重新计算剩余时间
          const remaining = Math.max(0, Math.ceil((state.endAt - Date.now()) / 1000));
          if (remaining === 0) {
            // 已经超时了，自动完成
            state.isRunning = false;
            if (state.mode === 'work') {
              state.completedSessions += 1;
              state.mode = 'break';
            } else {
              state.mode = 'work';
            }
            state.timeLeft = getTotalSeconds(state.mode, state.settings);
            state.endAt = null;
          } else {
            state.timeLeft = remaining;
            // 重新启动定时器
            setTimeout(() => ensureTimer(), 0);
          }
        }
      },
    }
  )
);

function playCompleteSound() {
  try {
    const audioContext =
      typeof window !== 'undefined'
        ? new (window.AudioContext || (window as any).webkitAudioContext)()
        : null;
    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.15);
    oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.3);
    oscillator.frequency.setValueAtTime(1046.5, audioContext.currentTime + 0.45);

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.8);
  } catch {
    // ignore
  }
}
