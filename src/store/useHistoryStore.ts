import { create } from 'zustand';
import { db } from '@/db';
import type { HistoryArchive } from '@/types/history';
import type { WeeklyMenuPlan } from '@/types/menu';

interface HistoryState {
  archives: HistoryArchive[];
  selectedArchive: HistoryArchive | null;

  // Actions
  loadArchives: () => Promise<void>;
  selectArchive: (archive: HistoryArchive | null) => void;
  deleteArchive: (id: number) => Promise<void>;
  getLastWeekPlan: () => Promise<WeeklyMenuPlan | null>;
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  archives: [],
  selectedArchive: null,

  loadArchives: async () => {
    const archives = await db.historyArchives.toArray();
    // 按 weekStart 倒序: 最近的在前
    archives.sort((a, b) => (a.weekStart < b.weekStart ? 1 : -1));
    set({ archives });
  },

  selectArchive: (archive) => set({ selectedArchive: archive }),

  deleteArchive: async (id) => {
    await db.historyArchives.delete(id);
    const current = get().selectedArchive;
    if (current && current.id === id) {
      set({ selectedArchive: null });
    }
    await get().loadArchives();
  },

  getLastWeekPlan: async () => {
    const archives = await db.historyArchives.toArray();
    if (archives.length === 0) return null;
    const latest = archives.reduce((a, b) => (a.weekStart >= b.weekStart ? a : b));
    return latest.planData;
  },
}));
