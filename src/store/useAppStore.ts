import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SessionMode } from '../lib/quiz'

export interface WrongEntry {
  questionId: string
  collectionId: string
  wrongCount: number
  lastWrongAt: number
  lastSelection: number[]
}

export interface HistoryEntry {
  id: string
  mode: SessionMode
  collectionId: string
  collectionTitle: string
  domainId?: string
  answered: number
  correct: number
  wrong: number
  skipped: number
  total: number
  accuracy: number
  durationSec: number
  finishedAt: number
  dateKey: string
}

export interface DailyStat {
  date: string
  answered: number
  correct: number
}

export interface AppSettings {
  theme: 'light' | 'dark'
  fontScale: 'normal' | 'large'
  autoNext: boolean
}

interface AppState {
  settings: AppSettings
  favorites: string[]
  wrongBook: Record<string, WrongEntry>
  history: HistoryEntry[]
  daily: Record<string, DailyStat>
  lastCollectionId: string | null
  setTheme: (theme: AppSettings['theme']) => void
  toggleTheme: () => void
  setFontScale: (scale: AppSettings['fontScale']) => void
  setAutoNext: (value: boolean) => void
  toggleFavorite: (questionId: string) => void
  clearFavorites: () => void
  recordWrong: (entry: Omit<WrongEntry, 'wrongCount' | 'lastWrongAt'>) => void
  removeWrong: (questionId: string) => void
  clearWrongBook: () => void
  addHistory: (entry: HistoryEntry) => void
  clearHistory: () => void
  setLastCollection: (collectionId: string) => void
  resetProgress: () => void
}

const initialSettings: AppSettings = {
  theme: 'light',
  fontScale: 'normal',
  autoNext: false,
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      settings: initialSettings,
      favorites: [],
      wrongBook: {},
      history: [],
      daily: {},
      lastCollectionId: null,

      setTheme: (theme) => set((state) => ({ settings: { ...state.settings, theme } })),
      toggleTheme: () =>
        set((state) => ({
          settings: {
            ...state.settings,
            theme: state.settings.theme === 'light' ? 'dark' : 'light',
          },
        })),
      setFontScale: (fontScale) =>
        set((state) => ({ settings: { ...state.settings, fontScale } })),
      setAutoNext: (autoNext) =>
        set((state) => ({ settings: { ...state.settings, autoNext } })),

      toggleFavorite: (questionId) =>
        set((state) => ({
          favorites: state.favorites.includes(questionId)
            ? state.favorites.filter((id) => id !== questionId)
            : [...state.favorites, questionId],
        })),
      clearFavorites: () => set({ favorites: [] }),

      recordWrong: (entry) =>
        set((state) => {
          const existing = state.wrongBook[entry.questionId]
          return {
            wrongBook: {
              ...state.wrongBook,
              [entry.questionId]: {
                ...entry,
                wrongCount: (existing?.wrongCount ?? 0) + 1,
                lastWrongAt: Date.now(),
              },
            },
          }
        }),
      removeWrong: (questionId) =>
        set((state) => {
          const next = { ...state.wrongBook }
          delete next[questionId]
          return { wrongBook: next }
        }),
      clearWrongBook: () => set({ wrongBook: {} }),

      addHistory: (entry) =>
        set((state) => {
          const daily = { ...state.daily }
          const current = daily[entry.dateKey] ?? {
            date: entry.dateKey,
            answered: 0,
            correct: 0,
          }
          daily[entry.dateKey] = {
            ...current,
            answered: current.answered + entry.answered,
            correct: current.correct + entry.correct,
          }
          return {
            history: [entry, ...state.history].slice(0, 100),
            daily,
          }
        }),
      clearHistory: () => set({ history: [], daily: {} }),

      setLastCollection: (collectionId) => set({ lastCollectionId: collectionId }),

      resetProgress: () =>
        set({
          favorites: [],
          wrongBook: {},
          history: [],
          daily: {},
          lastCollectionId: null,
        }),
    }),
    {
      name: 'tiyu-store-v1',
      version: 1,
      migrate: (persisted, version) => {
        if (version !== 1 || typeof persisted !== 'object' || persisted === null) {
          return {
            settings: initialSettings,
            favorites: [],
            wrongBook: {},
            history: [],
            daily: {},
            lastCollectionId: null,
          }
        }
        const data = persisted as Partial<AppState>
        return {
          settings: data.settings ?? initialSettings,
          favorites: data.favorites ?? [],
          wrongBook: data.wrongBook ?? {},
          history: data.history ?? [],
          daily: data.daily ?? {},
          lastCollectionId: data.lastCollectionId ?? null,
        }
      },
      partialize: (state) => ({
        settings: state.settings,
        favorites: state.favorites,
        wrongBook: state.wrongBook,
        history: state.history,
        daily: state.daily,
        lastCollectionId: state.lastCollectionId,
      }),
    },
  ),
)
