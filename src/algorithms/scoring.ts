import type { Recipe } from '@/types/recipe';
import type { SeasonMode } from '@/types/menu';
import { CROSS_WEEK_WEIGHT_FACTOR, TAGS } from '@/config/constants';

/**
 * 为菜品计算抽取权重
 *
 * 权重公式: baseScore * freshnessWeight * seasonBonus
 * - baseScore: rating为null视为3, rating/5 得到0-1之间的基础分
 * - freshnessWeight: 上周吃过 0.1 / 两周前 0.5 / 三周前及以上或从未吃过 1.0
 * - seasonBonus: 季节匹配 1.2, 否则 1.0
 * - 拉黑(rating=0): 直接返回 0
 */
export function calculateWeight(
  recipe: Recipe,
  lastWeekRecipeIds: Set<number>,
  twoWeeksAgoIds: Set<number>,
  season: SeasonMode
): number {
  if (recipe.rating === 0) return 0;

  const ratingValue = recipe.rating === null ? 3 : recipe.rating;
  const baseScore = ratingValue / 5;

  let freshnessWeight = 1.0;
  if (recipe.id !== undefined) {
    if (lastWeekRecipeIds.has(recipe.id)) {
      freshnessWeight = CROSS_WEEK_WEIGHT_FACTOR;
    } else if (twoWeeksAgoIds.has(recipe.id)) {
      freshnessWeight = 0.5;
    }
  }

  let seasonBonus = 1.0;
  if (season === 'summer' && recipe.tags.includes(TAGS.SUMMER_RECOMMENDED)) {
    seasonBonus = 1.2;
  } else if (season === 'winter' && recipe.tags.includes(TAGS.WINTER_RECOMMENDED)) {
    seasonBonus = 1.2;
  }

  return baseScore * freshnessWeight * seasonBonus;
}

/**
 * 权重随机选择 - 按权重概率抽取一个菜品
 * 当总权重为 0 时退化为均匀随机
 */
export function weightedRandomSelect<T extends { weight: number }>(items: T[]): T {
  if (items.length === 0) {
    throw new Error('weightedRandomSelect: 候选列表为空');
  }
  const totalWeight = items.reduce((sum, item) => sum + Math.max(0, item.weight), 0);
  if (totalWeight <= 0) {
    return items[Math.floor(Math.random() * items.length)];
  }
  let r = Math.random() * totalWeight;
  for (const item of items) {
    const w = Math.max(0, item.weight);
    r -= w;
    if (r <= 0) return item;
  }
  return items[items.length - 1];
}
