import type { DayPlan } from '@/types/menu';
import type { Recipe } from '@/types/recipe';

/**
 * 根据选中的天数, 合并提取所有食材并去重
 *
 * - 提取所选天数中所有菜品的 ingredients 数组
 * - 字符串级别去重(空白后相同名称视为同一食材)
 * - 按字母/拼音排序便于查看
 */
export function generateShoppingList(days: DayPlan[]): string[] {
  const set = new Set<string>();

  for (const day of days) {
    const recipes: Recipe[] = [
      day.breakfast.dry,
      day.breakfast.egg,
      day.breakfast.wet_adult,
      day.breakfast.wet_kid,
      ...day.dinner.dishes.map((d) => d.recipe),
    ];
    for (const recipe of recipes) {
      if (!recipe || !Array.isArray(recipe.ingredients)) continue;
      for (const ing of recipe.ingredients) {
        const name = (ing ?? '').trim();
        if (name) set.add(name);
      }
    }
  }

  return Array.from(set).sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'));
}
