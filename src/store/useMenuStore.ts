import { create } from 'zustand';
import { db } from '@/db';
import { generateWeeklyMenu } from '@/algorithms';
import { formatDate, getMonday, getWeekId, getFriday } from '@/utils/date';
import { useAppStore } from './useAppStore';
import { useRecipeStore } from './useRecipeStore';
import { useHistoryStore } from './useHistoryStore';
import { TAGS } from '@/config/constants';
import type { Recipe, RecipeCategory } from '@/types/recipe';
import type {
  DayPlan,
  DinnerDish,
  WeeklyMenuPlan,
} from '@/types/menu';
import type { HistoryArchive } from '@/types/history';

type MealType = 'breakfast' | 'dinner';
type BreakfastSlot = 'dry' | 'egg' | 'wet_adult' | 'wet_kid';
type DinnerRole = DinnerDish['role'];

interface MenuState {
  currentPlan: WeeklyMenuPlan | null;
  isGenerating: boolean;
  isArchived: boolean;

  // Actions
  generateMenu: () => Promise<void>;
  loadCurrentPlan: () => Promise<void>;
  replaceDish: (
    dayIndex: number,
    mealType: MealType,
    dishIndex: number,
    role?: string
  ) => Promise<void>;
  replaceDishWith: (
    dayIndex: number,
    mealType: MealType,
    dishIndex: number,
    role: string | undefined,
    newRecipe: Recipe
  ) => Promise<void>;
  removeDish: (dayIndex: number, mealType: MealType, dishIndex: number) => void;
  savePlan: () => Promise<void>;
  archivePlan: () => Promise<void>;
}

/** 收集计划中所有菜品的 id (去重) */
function collectAllRecipeIds(plan: WeeklyMenuPlan): number[] {
  const ids = new Set<number>();
  for (const day of plan.days) {
    collectDayRecipeIds(day).forEach((id) => ids.add(id));
  }
  return Array.from(ids);
}

/** 收集某一天的所有菜品 id */
function collectDayRecipeIds(day: DayPlan): number[] {
  const ids: number[] = [];
  const push = (r: Recipe | undefined) => {
    if (r?.id !== undefined) ids.push(r.id);
  };
  push(day.breakfast?.dry);
  push(day.breakfast?.egg);
  push(day.breakfast?.wet_adult);
  push(day.breakfast?.wet_kid);
  day.dinner?.dishes?.forEach((d) => push(d.recipe));
  return ids;
}

/** 收集当前周已使用的菜品 id, 用于换菜时避免重复 */
function collectUsedIds(plan: WeeklyMenuPlan, excludeRecipeId?: number): Set<number> {
  const ids = new Set<number>();
  for (const id of collectAllRecipeIds(plan)) {
    if (id !== excludeRecipeId) ids.add(id);
  }
  return ids;
}

/** 由晚餐 role 推导候选池所需的分类 */
function categoryForDinnerRole(role: DinnerRole): RecipeCategory | null {
  switch (role) {
    case 'meat':
      return 'meat';
    case 'veg':
      return 'veg';
    case 'soup':
      return 'soup';
    case 'staple':
      return 'staple_normal';
    case 'onepot':
      return 'staple_onepot';
    case 'cold_dish':
      return null; // 凉菜按 tag 过滤
    default:
      return null;
  }
}

function categoryForBreakfastSlot(slot: BreakfastSlot): RecipeCategory {
  if (slot === 'dry') return 'bf_dry';
  if (slot === 'egg') return 'bf_egg';
  if (slot === 'wet_adult') return 'bf_wet_adult';
  return 'bf_wet_kid';
}

/** 从候选池中按均匀随机挑选一个未使用的菜品 */
function pickReplacement(
  pool: Recipe[],
  usedIds: Set<number>,
  excludeRecipeId?: number
): Recipe | null {
  const eligible = pool.filter((r) => {
    if (r.rating === 0) return false;
    if (r.id !== undefined && r.id === excludeRecipeId) return false;
    if (r.id !== undefined && usedIds.has(r.id)) return false;
    return true;
  });
  if (eligible.length === 0) {
    // 兜底: 放宽 used 限制, 仍排除拉黑和当前菜
    const fallback = pool.filter(
      (r) => r.rating !== 0 && (r.id === undefined || r.id !== excludeRecipeId)
    );
    if (fallback.length === 0) return null;
    return fallback[Math.floor(Math.random() * fallback.length)];
  }
  return eligible[Math.floor(Math.random() * eligible.length)];
}

async function persistPlan(plan: WeeklyMenuPlan): Promise<WeeklyMenuPlan> {
  await db.menuPlans.clear();
  const { id: _omit, ...rest } = plan;
  void _omit;
  const id = await db.menuPlans.add(rest as WeeklyMenuPlan);
  return { ...plan, id };
}

export const useMenuStore = create<MenuState>((set, get) => ({
  currentPlan: null,
  isGenerating: false,
  isArchived: false,

  generateMenu: async () => {
    set({ isGenerating: true });
    try {
      const season = useAppStore.getState().season;
      const recipes = await db.recipes.toArray();
      const lastWeekPlan = await useHistoryStore.getState().getLastWeekPlan();

      const days = generateWeeklyMenu(recipes, lastWeekPlan, season);

      const monday = getMonday(new Date());
      const plan: WeeklyMenuPlan = {
        weekStart: formatDate(monday),
        days,
        createdAt: new Date().toISOString(),
        season,
      };
      const saved = await persistPlan(plan);
      // 生成新菜单时重置存档状态
      set({ currentPlan: saved, isArchived: false });
    } finally {
      set({ isGenerating: false });
    }
  },

  loadCurrentPlan: async () => {
    const all = await db.menuPlans.toArray();
    if (all.length === 0) {
      set({ currentPlan: null, isArchived: false });
      return;
    }
    // 取最新一条
    const latest = all.reduce((a, b) =>
      new Date(a.createdAt).getTime() >= new Date(b.createdAt).getTime() ? a : b
    );
    // 检查该计划是否已被存档（按 weekStart 匹配）
    const archives = await db.historyArchives
      .where('weekStart')
      .equals(latest.weekStart)
      .toArray();
    set({ currentPlan: latest, isArchived: archives.length > 0 });
  },

  replaceDish: async (dayIndex, mealType, dishIndex, role) => {
    const plan = get().currentPlan;
    if (!plan) return;
    const day = plan.days[dayIndex];
    if (!day) return;

    const recipes = await db.recipes.toArray();

    if (mealType === 'breakfast') {
      const slot = (role as BreakfastSlot | undefined) ?? 'dry';
      const original = day.breakfast[slot];
      const category = categoryForBreakfastSlot(slot);
      const pool = recipes.filter((r) => r.category === category);
      const usedIds = collectUsedIds(plan, original?.id);
      const next = pickReplacement(pool, usedIds, original?.id);
      if (!next) return;

      const newDay: DayPlan = {
        ...day,
        breakfast: { ...day.breakfast, [slot]: next },
      };
      const newDays = plan.days.map((d, i) => (i === dayIndex ? newDay : d));
      const newPlan: WeeklyMenuPlan = { ...plan, days: newDays };
      const saved = await persistPlan(newPlan);
      set({ currentPlan: saved });
      return;
    }

    // dinner
    const dish = day.dinner.dishes[dishIndex];
    if (!dish) return;
    const effectiveRole = ((role as DinnerRole | undefined) ?? dish.role) as DinnerRole;
    const original = dish.recipe;

    let pool: Recipe[];
    if (effectiveRole === 'cold_dish') {
      pool = recipes.filter((r) => r.tags.includes(TAGS.COLD_DISH));
    } else {
      const cat = categoryForDinnerRole(effectiveRole);
      pool = cat ? recipes.filter((r) => r.category === cat) : recipes;
    }

    const usedIds = collectUsedIds(plan, original?.id);
    const next = pickReplacement(pool, usedIds, original?.id);
    if (!next) return;

    const newDishes = day.dinner.dishes.map((d, i) =>
      i === dishIndex ? { recipe: next, role: effectiveRole } : d
    );
    const newDay: DayPlan = {
      ...day,
      dinner: { ...day.dinner, dishes: newDishes },
    };
    const newDays = plan.days.map((d, i) => (i === dayIndex ? newDay : d));
    const newPlan: WeeklyMenuPlan = { ...plan, days: newDays };
    const saved = await persistPlan(newPlan);
    set({ currentPlan: saved });
  },

  replaceDishWith: async (dayIndex, mealType, dishIndex, role, newRecipe) => {
    const plan = get().currentPlan;
    if (!plan) return;
    const day = plan.days[dayIndex];
    if (!day) return;

    if (mealType === 'breakfast') {
      const slot = (role as BreakfastSlot | undefined) ?? 'dry';
      const newDay: DayPlan = {
        ...day,
        breakfast: { ...day.breakfast, [slot]: newRecipe },
      };
      const newDays = plan.days.map((d, i) => (i === dayIndex ? newDay : d));
      const newPlan: WeeklyMenuPlan = { ...plan, days: newDays };
      const saved = await persistPlan(newPlan);
      set({ currentPlan: saved });
      return;
    }

    // dinner
    const dish = day.dinner.dishes[dishIndex];
    if (!dish) return;
    const effectiveRole = ((role as DinnerRole | undefined) ?? dish.role) as DinnerRole;
    const newDishes = day.dinner.dishes.map((d, i) =>
      i === dishIndex ? { recipe: newRecipe, role: effectiveRole } : d
    );
    const newDay: DayPlan = {
      ...day,
      dinner: { ...day.dinner, dishes: newDishes },
    };
    const newDays = plan.days.map((d, i) => (i === dayIndex ? newDay : d));
    const newPlan: WeeklyMenuPlan = { ...plan, days: newDays };
    const saved = await persistPlan(newPlan);
    set({ currentPlan: saved });
  },

  removeDish: (dayIndex, mealType, dishIndex) => {
    const plan = get().currentPlan;
    if (!plan) return;
    if (mealType !== 'dinner') return; // 早餐槽位固定, 不支持移除
    const day = plan.days[dayIndex];
    if (!day) return;
    if (dishIndex < 0 || dishIndex >= day.dinner.dishes.length) return;

    const newDishes = day.dinner.dishes.filter((_, i) => i !== dishIndex);
    const newDay: DayPlan = {
      ...day,
      dinner: { ...day.dinner, dishes: newDishes },
    };
    const newDays = plan.days.map((d, i) => (i === dayIndex ? newDay : d));
    set({ currentPlan: { ...plan, days: newDays } });
  },

  savePlan: async () => {
    const plan = get().currentPlan;
    if (!plan) return;
    const saved = await persistPlan(plan);
    set({ currentPlan: saved });
  },

  archivePlan: async () => {
    const plan = get().currentPlan;
    if (!plan) return;

    const monday = new Date(plan.weekStart);
    const weekId = getWeekId(monday);
    const friday = getFriday(monday);

    // 先保证最新编辑已持久化为 planData 的快照
    const planSnapshot: WeeklyMenuPlan = JSON.parse(JSON.stringify(plan));

    const archive: Omit<HistoryArchive, 'id'> = {
      weekId,
      weekStart: formatDate(monday),
      weekEnd: formatDate(friday),
      planData: planSnapshot,
      archivedAt: new Date().toISOString(),
    };

    await db.historyArchives.add(archive as HistoryArchive);

    // 给每道菜的 history_dates 加上对应日期
    const recipeStore = useRecipeStore.getState();
    for (let i = 0; i < planSnapshot.days.length; i++) {
      const day = planSnapshot.days[i];
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = formatDate(d);
      const ids = collectDayRecipeIds(day);
      if (ids.length > 0) {
        await recipeStore.recordUsageDates(ids, dateStr);
      }
    }

    // 存档完成后保留 currentPlan，仅标记为已存档，确保采购清单仍可使用
    set({ isArchived: true });

    // 刷新历史记录
    await useHistoryStore.getState().loadArchives();
  },
}));
