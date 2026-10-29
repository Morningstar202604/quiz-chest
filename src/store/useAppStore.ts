import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SessionMode } from '../lib/quiz'
import type { QuestionSeed } from '../data/types'

export interface ImportedBank {
  id: string
  title: string
  subtitle: string
  description: string
  exam: string
  icon: string
  accent: string
  level: '入门' | '进阶' | '挑战'
  durationMin: number
  tags: string[]
  importedAt: number
  questions: QuestionSeed[]
}

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
  showSampleBanks: boolean
}

interface AppState {
  settings: AppSettings
  favorites: string[]
  wrongBook: Record<string, WrongEntry>
  history: HistoryEntry[]
  daily: Record<string, DailyStat>
  lastCollectionId: string | null
  banks: ImportedBank[]
  banksVersion: number
  setTheme: (theme: AppSettings['theme']) => void
  toggleTheme: () => void
  setFontScale: (scale: AppSettings['fontScale']) => void
  setAutoNext: (value: boolean) => void
  setShowSampleBanks: (value: boolean) => void
  toggleFavorite: (questionId: string) => void
  clearFavorites: () => void
  recordWrong: (entry: Omit<WrongEntry, 'wrongCount' | 'lastWrongAt'>) => void
  removeWrong: (questionId: string) => void
  clearWrongBook: () => void
  addHistory: (entry: HistoryEntry) => void
  clearHistory: () => void
  setLastCollection: (collectionId: string) => void
  addBank: (bank: ImportedBank) => void
  removeBank: (bankId: string) => void
  resetProgress: () => void
}

const initialSettings: AppSettings = {
  theme: 'light',
  fontScale: 'normal',
  autoNext: false,
  showSampleBanks: true,
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
      banks: [],
      banksVersion: 0,

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

      setShowSampleBanks: (showSampleBanks) =>
        set((state) => ({ settings: { ...state.settings, showSampleBanks } })),

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

      addBank: (bank) =>
        set((state) => ({
          banks: [
            ...state.banks.filter((item) => item.id !== bank.id),
            bank,
          ],
          banksVersion: state.banksVersion + 1,
        })),

      removeBank: (bankId) =>
        set((state) => ({
          banks: state.banks.filter((item) => item.id !== bankId),
          banksVersion: state.banksVersion + 1,
        })),

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
      version: 2,
      migrate: (persisted, version) => {
        const fallback = {
          settings: initialSettings,
          favorites: [] as string[],
          wrongBook: {} as AppState['wrongBook'],
          history: [] as HistoryEntry[],
          daily: {} as AppState['daily'],
          lastCollectionId: null as string | null,
          banks: [] as ImportedBank[],
          banksVersion: 0,
        }
        if (version < 1 || typeof persisted !== 'object' || persisted === null) {
          return fallback
        }
        const data = persisted as Partial<AppState> & { settings?: Partial<AppSettings> }
        return {
          ...fallback,
          settings: { ...initialSettings, ...(data.settings ?? {}) },
          favorites: data.favorites ?? fallback.favorites,
          wrongBook: data.wrongBook ?? fallback.wrongBook,
          history: data.history ?? fallback.history,
          daily: data.daily ?? fallback.daily,
          lastCollectionId: data.lastCollectionId ?? null,
          banks: data.banks ?? fallback.banks,
          banksVersion: data.banksVersion ?? 0,
        }
      },
      partialize: (state) => ({
        settings: state.settings,
        favorites: state.favorites,
        wrongBook: state.wrongBook,
        history: state.history,
        daily: state.daily,
        lastCollectionId: state.lastCollectionId,
        banks: state.banks,
        banksVersion: state.banksVersion,
      }),
    },
  ),
)
