import type { Recipe } from './recipe';

export interface BreakfastPlan {
  dry: Recipe;              // 干食(面食/主食类)
  egg: Recipe;              // 蛋类(全家共享)
  wet_adult: Recipe;        // 稀食(成人/老人)
  wet_kid: Recipe;          // 稀食(小学生)
}

export interface DinnerDish {
  recipe: Recipe;
  role: 'meat' | 'veg' | 'soup' | 'staple' | 'cold_dish' | 'onepot';
}

export interface DinnerPlan {
  type: 'simple' | 'formal';  // 简餐 or 正餐
  dishes: DinnerDish[];
}

export interface DayPlan {
  day: string;           // 'Monday' | 'Tuesday' | ...
  dayLabel: string;      // '周一' | '周二' | ...
  breakfast: BreakfastPlan;
  dinner: DinnerPlan;
}

export type SeasonMode = 'default' | 'summer' | 'winter';

export interface WeeklyMenuPlan {
  id?: number;
  weekStart: string;     // ISO date string of Monday
  days: DayPlan[];
  createdAt: string;
  season: SeasonMode;
}

export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';

export const DAYS_OF_WEEK: { key: DayOfWeek; label: string }[] = [
  { key: 'Monday', label: '周一' },
  { key: 'Tuesday', label: '周二' },
  { key: 'Wednesday', label: '周三' },
  { key: 'Thursday', label: '周四' },
  { key: 'Friday', label: '周五' },
];
