import type { WeeklyMenuPlan } from './menu';

export interface HistoryArchive {
  id?: number;
  weekId: string;          // 如 "2024-W41"
  weekStart: string;       // 周一日期
  weekEnd: string;         // 周五日期
  planData: WeeklyMenuPlan;
  archivedAt: string;
}
