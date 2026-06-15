import type { Recipe, RecipeCategory } from '@/types/recipe';
import type {
  DayPlan,
  WeeklyMenuPlan,
  SeasonMode,
  BreakfastPlan,
  DinnerPlan,
  DinnerDish,
} from '@/types/menu';
import { DAYS_OF_WEEK } from '@/types/menu';
import {
  MANDATORY_MILK_OATMEAL_DAYS,
  MAX_PORRIDGE_DAYS_PER_WEEK,
  FORMAL_DINNER_CONFIG,
  FIVE_STAR_MAX_REPEAT,
  TAGS,
} from '@/config/constants';
import { calculateWeight, weightedRandomSelect } from './scoring';

const MILK_OATMEAL_NAME = '牛奶燕麦片';

type UsageMap = Map<string, number>;

interface PickContext {
  lastWeekIds: Set<number>;
  twoWeeksAgoIds: Set<number>;
  season: SeasonMode;
}

function recipeKey(r: Recipe): string {
  return r.id !== undefined ? `id:${r.id}` : `name:${r.name}`;
}

function collectLastWeekIds(plan: WeeklyMenuPlan | null): Set<number> {
  const ids = new Set<number>();
  if (!plan) return ids;
  for (const day of plan.days) {
    const list: Array<Recipe | undefined> = [
      day.breakfast?.dry,
      day.breakfast?.egg,
      day.breakfast?.wet_adult,
      day.breakfast?.wet_kid,
      ...(day.dinner?.dishes?.map((d) => d.recipe) ?? []),
    ];
    for (const r of list) {
      if (r?.id !== undefined) ids.add(r.id);
    }
  }
  return ids;
}

function groupByCategory(recipes: Recipe[]): Map<RecipeCategory, Recipe[]> {
  const map = new Map<RecipeCategory, Recipe[]>();
  for (const r of recipes) {
    const arr = map.get(r.category);
    if (arr) arr.push(r);
    else map.set(r.category, [r]);
  }
  return map;
}

function makePlaceholder(category: RecipeCategory, name: string): Recipe {
  return {
    name,
    category,
    tags: [],
    ingredients: [],
    instructions: '',
    rating: null,
    history_dates: [],
  };
}

/**
 * 从 pool 中按权重随机选一个菜品, 遵循:
 * - 拉黑过滤 (rating=0 直接排除)
 * - 使用次数限制 (普通菜 1 次, 5 星菜 FIVE_STAR_MAX_REPEAT 次)
 * - 选择优先级:
 *   1) 严格候选: 未超过使用上限 + 权重>0
 *   2) 软候选: 未超过使用上限 (权重兌底 0.001)
 *   3) 兑底低优先: 允许重复 (仅在池子耗尽时才会出现重复)
 */
function pickRecipe(
  pool: Recipe[],
  used: UsageMap,
  ctx: PickContext
): Recipe | null {
  if (pool.length === 0) return null;

  const strict: Array<{ recipe: Recipe; weight: number }> = [];
  const unused: Array<{ recipe: Recipe; weight: number }> = [];

  for (const recipe of pool) {
    if (recipe.rating === 0) continue; // 拉黑

    const key = recipeKey(recipe);
    const usageCount = used.get(key) ?? 0;
    const overUsed =
      usageCount > 0 && (recipe.rating !== 5 || usageCount >= FIVE_STAR_MAX_REPEAT);
    if (overUsed) continue;

    const weight = calculateWeight(recipe, ctx.lastWeekIds, ctx.twoWeeksAgoIds, ctx.season);
    unused.push({ recipe, weight: Math.max(0.001, weight) });
    if (weight > 0) strict.push({ recipe, weight });
  }

  if (strict.length > 0) return weightedRandomSelect(strict).recipe;
  if (unused.length > 0) return weightedRandomSelect(unused).recipe;

  // 兑底: 本周内未使用的候选全部耗尽, 此时才允许重复 (例如 bf_wet_kid 只有2项)
  const fallback = pool.filter((r) => r.rating !== 0);
  if (fallback.length === 0) return null;
  const fallbackWeighted = fallback.map((r) => ({
    recipe: r,
    weight: Math.max(0.001, calculateWeight(r, ctx.lastWeekIds, ctx.twoWeeksAgoIds, ctx.season)),
  }));
  return weightedRandomSelect(fallbackWeighted).recipe;
}

function markUsed(used: UsageMap, recipe: Recipe): void {
  const key = recipeKey(recipe);
  used.set(key, (used.get(key) ?? 0) + 1);
}

/**
 * 主食材: 取 ingredients 数组前 2 项, 用于晚餐同日食材去重
 */
function getMainIngredients(recipe: Recipe): string[] {
  return recipe.ingredients.slice(0, 2);
}

function hasIngredientConflict(recipe: Recipe, usedIngredients: Set<string>): boolean {
  const mainIngredients = getMainIngredients(recipe);
  return mainIngredients.some((ing) => usedIngredients.has(ing));
}

/**
 * 在候选池中过滤掉与已用主食材冲突的菜; 若过滤后为空则返回原池(降级)
 */
function filterPoolByIngredients(pool: Recipe[], usedIngredients: Set<string>): Recipe[] {
  if (usedIngredients.size === 0) return pool;
  const filtered = pool.filter((r) => !hasIngredientConflict(r, usedIngredients));
  return filtered.length > 0 ? filtered : pool;
}

function addMainIngredients(recipe: Recipe, usedIngredients: Set<string>): void {
  for (const ing of getMainIngredients(recipe)) {
    usedIngredients.add(ing);
  }
}

function unmarkUsed(used: UsageMap, recipe: Recipe): void {
  const key = recipeKey(recipe);
  const cnt = used.get(key) ?? 0;
  if (cnt <= 1) used.delete(key);
  else used.set(key, cnt - 1);
}

/**
 * 生成一周菜单(周一到周五, 共10顿: 早餐+晚餐)
 */
export function generateWeeklyMenu(
  allRecipes: Recipe[],
  lastWeekPlan: WeeklyMenuPlan | null,
  season: SeasonMode
): DayPlan[] {
  const ctx: PickContext = {
    lastWeekIds: collectLastWeekIds(lastWeekPlan),
    twoWeeksAgoIds: new Set<number>(),
    season,
  };

  const byCategory = groupByCategory(allRecipes);
  const get = (c: RecipeCategory): Recipe[] => byCategory.get(c) ?? [];

  // 各类型独立的使用计数
  const usedDry: UsageMap = new Map();
  const usedEgg: UsageMap = new Map();
  const usedWetAdult: UsageMap = new Map();
  const usedWetKid: UsageMap = new Map();
  const usedMeat: UsageMap = new Map();
  const usedVeg: UsageMap = new Map();
  const usedSoup: UsageMap = new Map();
  const usedStaple: UsageMap = new Map();
  const usedOnepot: UsageMap = new Map();
  const usedColdDish: UsageMap = new Map();

  let porridgeCount = 0;

  // 简餐日: 周二到周五随机一天 (避开周一)
  const simpleDayIndex = 1 + Math.floor(Math.random() * (DAYS_OF_WEEK.length - 1));

  // 名称匹配的牛奶燕麦片(可能不存在, 不存在则降级)
  const milkOatmeal = allRecipes.find((r) => r.name === MILK_OATMEAL_NAME) ?? null;

  const result: DayPlan[] = [];

  for (let i = 0; i < DAYS_OF_WEEK.length; i++) {
    const { key: day, label } = DAYS_OF_WEEK[i];

    // ----- 早餐 -----
    // 干食
    const dry =
      pickRecipe(get('bf_dry'), usedDry, ctx) ?? makePlaceholder('bf_dry', '主食(待补充)');
    markUsed(usedDry, dry);

    // 蛋类
    const eggPool = get('bf_egg').filter((r) => {
      // 周一/三/五(成人稀食为牛奶燕麦片的日子)排除蒸水蛋
      if (MANDATORY_MILK_OATMEAL_DAYS.includes(day) && r.name === '蒸水蛋') return false;
      return true;
    });
    const eggPicked = pickRecipe(eggPool, usedEgg, ctx);
    const egg = eggPicked ?? makePlaceholder('bf_egg', '蛋类(待补充)');
    if (eggPicked) markUsed(usedEgg, eggPicked);

    // 成人稀食
    let wetAdult: Recipe;
    if (MANDATORY_MILK_OATMEAL_DAYS.includes(day) && milkOatmeal) {
      wetAdult = milkOatmeal;
      // 牛奶燕麦片为硬规则, 不计入互斥, 但仍记录用于查看(对其他天没有约束作用因为已经过滤)
    } else {
      const adultPool = get('bf_wet_adult').filter((r) => {
        if (r.name === MILK_OATMEAL_NAME) return false; // 非强制日, 排除以保持多样性
        if (r.tags.includes(TAGS.PORRIDGE) && porridgeCount >= MAX_PORRIDGE_DAYS_PER_WEEK) {
          return false;
        }
        return true;
      });
      const picked = pickRecipe(adultPool, usedWetAdult, ctx);
      wetAdult = picked ?? makePlaceholder('bf_wet_adult', '稀食(待补充)');
      if (picked) {
        markUsed(usedWetAdult, picked);
        if (picked.tags.includes(TAGS.PORRIDGE)) porridgeCount++;
      }
    }

    // 儿童稀食(牛奶/豆浆类, 数据源应为 bf_wet_kid 分类)
    const wetKidPicked = pickRecipe(get('bf_wet_kid'), usedWetKid, ctx);
    const wetKid = wetKidPicked ?? makePlaceholder('bf_wet_kid', '牛奶/豆浆(待补充)');
    if (wetKidPicked) markUsed(usedWetKid, wetKidPicked);

    const breakfast: BreakfastPlan = { dry, egg, wet_adult: wetAdult, wet_kid: wetKid };

    // ----- 晚餐 -----
    let dinner: DinnerPlan;
    if (i === simpleDayIndex) {
      dinner = buildSimpleDinner(get, usedOnepot, usedWetAdult, ctx);
    } else {
      dinner = buildFormalDinner(
        get,
        allRecipes,
        usedMeat,
        usedVeg,
        usedSoup,
        usedStaple,
        usedColdDish,
        ctx
      );
    }

    result.push({
      day,
      dayLabel: label,
      breakfast,
      dinner,
    });
  }

  return result;
}

/**
 * 简餐: 1 道一锅出, 不配炒菜不配汤
 * 夏季模式 + 凉面(夏季推荐) → 额外搭配稀饭(从 bf_wet_adult 中带粥类标签)
 */
function buildSimpleDinner(
  get: (c: RecipeCategory) => Recipe[],
  usedOnepot: UsageMap,
  usedWetAdult: UsageMap,
  ctx: PickContext
): DinnerPlan {
  const dishes: DinnerDish[] = [];
  const onepot = pickRecipe(get('staple_onepot'), usedOnepot, ctx);
  if (onepot) {
    markUsed(usedOnepot, onepot);
    dishes.push({ recipe: onepot, role: 'onepot' });

    if (ctx.season === 'summer' && onepot.tags.includes(TAGS.SUMMER_RECOMMENDED)) {
      const congeePool = get('bf_wet_adult').filter((r) => r.tags.includes(TAGS.PORRIDGE));
      const congee = pickRecipe(congeePool, usedWetAdult, ctx);
      if (congee) {
        markUsed(usedWetAdult, congee);
        dishes.push({ recipe: congee, role: 'staple' });
      }
    }
  }
  return { type: 'simple', dishes };
}

/**
 * 正餐: 按季节模式组合 荤/素/汤/主食/(凉菜)
 * 健康兜底: 至少 1 道带"适宜老人"标签, 否则替换其中一道荤菜
 */
function buildFormalDinner(
  get: (c: RecipeCategory) => Recipe[],
  allRecipes: Recipe[],
  usedMeat: UsageMap,
  usedVeg: UsageMap,
  usedSoup: UsageMap,
  usedStaple: UsageMap,
  usedColdDish: UsageMap,
  ctx: PickContext
): DinnerPlan {
  const cfg = FORMAL_DINNER_CONFIG[ctx.season];
  const coldDishCount =
    ctx.season === 'summer' ? FORMAL_DINNER_CONFIG.summer.coldDishCount : 0;

  const dishes: DinnerDish[] = [];
  // 同日晚餐已用主食材集合, 用于跨菜品的食材维度去重
  const dayUsedIngredients = new Set<string>();

  const pickWithIngredient = (pool: Recipe[], used: UsageMap): Recipe | null => {
    const filtered = filterPoolByIngredients(pool, dayUsedIngredients);
    return pickRecipe(filtered, used, ctx);
  };

  // 荤菜
  for (let m = 0; m < cfg.meatCount; m++) {
    const meat = pickWithIngredient(get('meat'), usedMeat);
    if (meat) {
      markUsed(usedMeat, meat);
      addMainIngredients(meat, dayUsedIngredients);
      dishes.push({ recipe: meat, role: 'meat' });
    }
  }

  // 凉菜(夏季)
  if (coldDishCount > 0) {
    const coldDishPool = allRecipes.filter((r) => r.tags.includes(TAGS.COLD_DISH));
    for (let c = 0; c < coldDishCount; c++) {
      const cold = pickWithIngredient(coldDishPool, usedColdDish);
      if (cold) {
        markUsed(usedColdDish, cold);
        addMainIngredients(cold, dayUsedIngredients);
        dishes.push({ recipe: cold, role: 'cold_dish' });
      }
    }
  }

  // 素菜
  for (let v = 0; v < cfg.vegCount; v++) {
    const veg = pickWithIngredient(get('veg'), usedVeg);
    if (veg) {
      markUsed(usedVeg, veg);
      addMainIngredients(veg, dayUsedIngredients);
      dishes.push({ recipe: veg, role: 'veg' });
    }
  }

  // 汤: 夏季选带"夏季推荐"的, 其他季节排除"夏季推荐"
  let soupPool = get('soup');
  if (ctx.season === 'summer') {
    soupPool = soupPool.filter((r) => r.tags.includes(TAGS.SUMMER_RECOMMENDED));
    if (soupPool.length === 0) soupPool = get('soup'); // 降级
  } else {
    soupPool = soupPool.filter((r) => !r.tags.includes(TAGS.SUMMER_RECOMMENDED));
    if (soupPool.length === 0) soupPool = get('soup');
  }
  for (let s = 0; s < cfg.soupCount; s++) {
    const soup = pickWithIngredient(soupPool, usedSoup);
    if (soup) {
      markUsed(usedSoup, soup);
      addMainIngredients(soup, dayUsedIngredients);
      dishes.push({ recipe: soup, role: 'soup' });
    }
  }

  // 主食
  for (let s = 0; s < cfg.stapleCount; s++) {
    const staple = pickWithIngredient(get('staple_normal'), usedStaple);
    if (staple) {
      markUsed(usedStaple, staple);
      addMainIngredients(staple, dayUsedIngredients);
      dishes.push({ recipe: staple, role: 'staple' });
    }
  }

  // 健康兜底
  ensureElderlyFriendly(dishes, get, usedMeat, dayUsedIngredients, ctx);

  return { type: 'formal', dishes };
}

/**
 * 健康兜底: 若全部菜品没有"适宜老人"标签, 替换第一道荤菜为带该标签的荤菜
 */
function ensureElderlyFriendly(
  dishes: DinnerDish[],
  get: (c: RecipeCategory) => Recipe[],
  usedMeat: UsageMap,
  dayUsedIngredients: Set<string>,
  ctx: PickContext
): void {
  const hasElderly = dishes.some((d) => d.recipe.tags.includes(TAGS.ELDERLY_FRIENDLY));
  if (hasElderly) return;

  const meatIdx = dishes.findIndex((d) => d.role === 'meat');
  if (meatIdx < 0) return;

  const original = dishes[meatIdx].recipe;
  const elderlyMeatPool = get('meat').filter((r) => r.tags.includes(TAGS.ELDERLY_FRIENDLY));
  if (elderlyMeatPool.length === 0) return;

  // 替换前先把原菜的主食材从已用集合中临时移除, 避免自身食材误判为冲突
  const originalMains = getMainIngredients(original);
  const removed: string[] = [];
  for (const ing of originalMains) {
    if (dayUsedIngredients.delete(ing)) removed.push(ing);
  }

  // 先撤销原荤菜的使用计数, 再尝试挑选适老荤菜
  unmarkUsed(usedMeat, original);
  const filteredPool = filterPoolByIngredients(elderlyMeatPool, dayUsedIngredients);
  const elderlyMeat = pickRecipe(filteredPool, usedMeat, ctx);
  if (elderlyMeat) {
    markUsed(usedMeat, elderlyMeat);
    addMainIngredients(elderlyMeat, dayUsedIngredients);
    dishes[meatIdx] = { recipe: elderlyMeat, role: 'meat' };
  } else {
    // 无候选则恢复
    markUsed(usedMeat, original);
    for (const ing of removed) dayUsedIngredients.add(ing);
  }
}
