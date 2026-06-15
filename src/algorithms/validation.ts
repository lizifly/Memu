import type { DayPlan, SeasonMode } from '@/types/menu';
import type { Recipe } from '@/types/recipe';
import {
  MANDATORY_MILK_OATMEAL_DAYS,
  MAX_PORRIDGE_DAYS_PER_WEEK,
  SIMPLE_MEAL_COUNT_PER_WEEK,
  FORMAL_DINNER_CONFIG,
  FIVE_STAR_MAX_REPEAT,
  TAGS,
} from '@/config/constants';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

const MILK_OATMEAL_NAME = '牛奶燕麦片';

function recipeKey(r: Recipe): string {
  return r.id !== undefined ? `id:${r.id}` : `name:${r.name}`;
}

/**
 * 验证生成的菜单是否符合所有规则
 */
export function validateWeeklyMenu(menu: DayPlan[], season: SeasonMode): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. 早餐结构完整性
  for (const day of menu) {
    if (!day.breakfast || !day.breakfast.dry || !day.breakfast.egg || !day.breakfast.wet_adult || !day.breakfast.wet_kid) {
      errors.push(`${day.dayLabel}早餐结构不完整(缺少dry/egg/wet_adult/wet_kid)`);
    }
  }

  // 2. 周一三五成人稀食必须为牛奶燕麦片
  for (const day of menu) {
    if (MANDATORY_MILK_OATMEAL_DAYS.includes(day.day)) {
      if (day.breakfast?.wet_adult?.name !== MILK_OATMEAL_NAME) {
        errors.push(`${day.dayLabel}成人稀食必须为${MILK_OATMEAL_NAME}`);
      }
    }
  }

  // 3. 粥类出现次数 ≤ MAX_PORRIDGE_DAYS_PER_WEEK
  let porridgeCount = 0;
  for (const day of menu) {
    if (day.breakfast?.wet_adult?.tags?.includes(TAGS.PORRIDGE)) {
      porridgeCount++;
    }
  }
  if (porridgeCount > MAX_PORRIDGE_DAYS_PER_WEEK) {
    errors.push(`粥类出现 ${porridgeCount} 次, 超过周限额 ${MAX_PORRIDGE_DAYS_PER_WEEK}`);
  }

  // 4. 简餐天数
  const simpleCount = menu.filter((d) => d.dinner?.type === 'simple').length;
  if (simpleCount !== SIMPLE_MEAL_COUNT_PER_WEEK) {
    errors.push(`简餐天数为 ${simpleCount}, 期望 ${SIMPLE_MEAL_COUNT_PER_WEEK}`);
  }

  // 5. 正餐配菜数量是否符合季节模式
  const cfg = FORMAL_DINNER_CONFIG[season];
  const expectedColdDish = season === 'summer' ? FORMAL_DINNER_CONFIG.summer.coldDishCount : 0;
  for (const day of menu) {
    if (day.dinner?.type !== 'formal') continue;
    const counts = { meat: 0, veg: 0, soup: 0, staple: 0, cold_dish: 0, onepot: 0 };
    for (const dish of day.dinner.dishes) {
      if (dish.role in counts) {
        counts[dish.role as keyof typeof counts]++;
      }
    }
    if (counts.meat !== cfg.meatCount) {
      errors.push(`${day.dayLabel}荤菜数 ${counts.meat}, 期望 ${cfg.meatCount}`);
    }
    if (counts.veg !== cfg.vegCount) {
      errors.push(`${day.dayLabel}素菜数 ${counts.veg}, 期望 ${cfg.vegCount}`);
    }
    if (counts.soup !== cfg.soupCount) {
      errors.push(`${day.dayLabel}汤数 ${counts.soup}, 期望 ${cfg.soupCount}`);
    }
    if (counts.staple !== cfg.stapleCount) {
      errors.push(`${day.dayLabel}主食数 ${counts.staple}, 期望 ${cfg.stapleCount}`);
    }
    if (counts.cold_dish !== expectedColdDish) {
      errors.push(`${day.dayLabel}凉菜数 ${counts.cold_dish}, 期望 ${expectedColdDish}`);
    }

    // 6. 健康兜底: 至少1道适宜老人
    const hasElderly = day.dinner.dishes.some((d) => d.recipe.tags?.includes(TAGS.ELDERLY_FRIENDLY));
    if (!hasElderly) {
      warnings.push(`${day.dayLabel}正餐缺少"${TAGS.ELDERLY_FRIENDLY}"标签的菜品`);
    }
  }

  // 7. 周内重复检测(以分类+菜品为粒度), 5星允许最多 FIVE_STAR_MAX_REPEAT 次
  type Counter = { count: number; rating: number | null; name: string };
  const groupCounters = new Map<string, Counter>();
  const trackBreakfast = (slot: string, recipe: Recipe | undefined) => {
    if (!recipe) return;
    const key = `${slot}::${recipeKey(recipe)}`;
    const c = groupCounters.get(key) ?? { count: 0, rating: recipe.rating, name: recipe.name };
    c.count++;
    groupCounters.set(key, c);
  };
  const trackDinner = (role: string, recipe: Recipe | undefined) => {
    if (!recipe) return;
    const key = `dinner-${role}::${recipeKey(recipe)}`;
    const c = groupCounters.get(key) ?? { count: 0, rating: recipe.rating, name: recipe.name };
    c.count++;
    groupCounters.set(key, c);
  };

  for (const day of menu) {
    trackBreakfast('bf_dry', day.breakfast?.dry);
    trackBreakfast('bf_egg', day.breakfast?.egg);
    trackBreakfast('bf_wet_adult', day.breakfast?.wet_adult);
    trackBreakfast('bf_wet_kid', day.breakfast?.wet_kid);
    if (day.dinner?.dishes) {
      for (const d of day.dinner.dishes) {
        trackDinner(d.role, d.recipe);
      }
    }
  }

  for (const [key, info] of groupCounters) {
    if (info.count <= 1) continue;
    // 牛奶燕麦片的硬规则豁免
    if (key.startsWith('bf_wet_adult::') && info.name === MILK_OATMEAL_NAME) continue;
    // 5星特权
    if (info.rating === 5 && info.count <= FIVE_STAR_MAX_REPEAT) continue;
    warnings.push(`菜品"${info.name}"在 ${key.split('::')[0]} 中出现 ${info.count} 次, 超出限制`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
