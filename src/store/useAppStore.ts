import { create } from 'zustand';
import type { SeasonMode } from '@/types/menu';

export type TabKey = 'menu' | 'shopping' | 'recipes' | 'history';

interface AppState {
  activeTab: TabKey;
  season: SeasonMode;
  isInitialized: boolean;

  // Actions
  setActiveTab: (tab: TabKey) => void;
  setSeason: (season: SeasonMode) => void;
  setInitialized: (v: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeTab: 'menu',
  season: 'default',
  isInitialized: false,

  setActiveTab: (tab) => set({ activeTab: tab }),
  setSeason: (season) => set({ season }),
  setInitialized: (v) => set({ isInitialized: v }),
}));
