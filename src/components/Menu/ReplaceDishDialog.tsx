import { useMemo } from 'react';
import { Dices, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRecipeStore } from '@/store/useRecipeStore';
import { useMenuStore } from '@/store/useMenuStore';
import { TAGS, CATEGORY_LABELS } from '@/config/constants';
import { cn } from '@/lib/utils';
import type { Recipe, RecipeCategory } from '@/types/recipe';
import type { DinnerDish } from '@/types/menu';

type MealType = 'breakfast' | 'dinner';
type DinnerRole = DinnerDish['role'];

export interface ReplaceTarget {
  dayIndex: number;
  mealType: MealType;
  dishIndex: number;
  role?: string;
  current: Recipe;
}

interface ReplaceDishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: ReplaceTarget | null;
}

const ROLE_LABELS: Record<string, string> = {
  meat: '荤菜',
  veg: '素菜',
  soup: '汤',
  staple: '主食',
  cold_dish: '凉菜',
  onepot: '一锅出',
  dry: '早餐干食',
  egg: '早餐蛋类',
  wet_adult: '早餐稀食(成人)',
  wet_kid: '早餐稀食(儿童)',
};

function getCategoryForBreakfast(role: string): RecipeCategory {
  if (role === 'dry') return 'bf_dry';
  if (role === 'egg') return 'bf_egg';
  if (role === 'wet_adult') return 'bf_wet_adult';
  return 'bf_wet_kid';
}

function getDinnerCategory(role: DinnerRole): RecipeCategory | null {
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
    default:
      return null;
  }
}

function buildCandidatePool(
  recipes: Recipe[],
  mealType: MealType,
  role: string | undefined
): { pool: Recipe[]; label: string } {
  if (mealType === 'breakfast') {
    const slot = role ?? 'dry';
    const cat = getCategoryForBreakfast(slot);
    return {
      pool: recipes.filter((r) => r.category === cat),
      label: CATEGORY_LABELS[cat] ?? ROLE_LABELS[slot] ?? '同类',
    };
  }
  const r = role as DinnerRole | undefined;
  if (r === 'cold_dish') {
    return {
      pool: recipes.filter((rec) => rec.tags.includes(TAGS.COLD_DISH)),
      label: '凉菜',
    };
  }
  const cat = r ? getDinnerCategory(r) : null;
  if (!cat) {
    return { pool: recipes, label: '全部' };
  }
  return {
    pool: recipes.filter((rec) => rec.category === cat),
    label: CATEGORY_LABELS[cat] ?? '同类',
  };
}

function ratingTag(recipe: Recipe): { text: string; className: string } | null {
  if (recipe.rating === 0) {
    return {
      text: '已拉黑',
      className: 'bg-red-50 text-red-600 border-red-200',
    };
  }
  if (recipe.rating === null) return null;
  return {
    text: `${recipe.rating}★`,
    className: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  };
}

export function ReplaceDishDialog({
  open,
  onOpenChange,
  target,
}: ReplaceDishDialogProps) {
  const recipes = useRecipeStore((s) => s.recipes);
  const replaceDish = useMenuStore((s) => s.replaceDish);
  const replaceDishWith = useMenuStore((s) => s.replaceDishWith);

  const { pool, label } = useMemo(() => {
    if (!target) return { pool: [] as Recipe[], label: '' };
    return buildCandidatePool(recipes, target.mealType, target.role);
  }, [recipes, target]);

  // 当前选中放最前，其余按名称排序
  const sortedPool = useMemo(() => {
    if (!target) return pool;
    const currentId = target.current.id;
    const head = pool.filter((r) => r.id === currentId);
    const rest = pool
      .filter((r) => r.id !== currentId)
      .sort((a, b) => a.name.localeCompare(b.name, 'zh'));
    return [...head, ...rest];
  }, [pool, target]);

  if (!target) return null;

  const handleRandom = async () => {
    await replaceDish(
      target.dayIndex,
      target.mealType,
      target.dishIndex,
      target.role
    );
    onOpenChange(false);
  };

  const handlePick = async (recipe: Recipe) => {
    if (recipe.id === target.current.id) {
      onOpenChange(false);
      return;
    }
    await replaceDishWith(
      target.dayIndex,
      target.mealType,
      target.dishIndex,
      target.role,
      recipe
    );
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-gray-100">
          <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2 pr-8">
            <span className="text-2xl">🔄</span>
            换菜
          </DialogTitle>
          <DialogDescription className="text-base text-gray-600 mt-1">
            当前：
            <span className="font-medium text-gray-900">
              {target.current.name}
            </span>
            <Badge variant="outline" className="ml-2 text-xs">
              {label}
            </Badge>
          </DialogDescription>
        </DialogHeader>

        {/* 随机换一个 */}
        <div className="px-5 py-4">
          <Button
            onClick={handleRandom}
            className="w-full h-12 text-base font-semibold gap-2"
          >
            <Dices className="h-5 w-5" />
            🎲 随机换一个
          </Button>
        </div>

        {/* 分隔 */}
        <div className="px-5 flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-sm text-gray-400">或从以下菜品中选择</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* 列表 */}
        <div className="flex-1 overflow-y-auto px-5 py-3 min-h-0">
          {sortedPool.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p className="text-base">暂无同类菜品</p>
            </div>
          ) : (
            <ul className="space-y-1.5">
              {sortedPool.map((recipe) => {
                const isCurrent = recipe.id === target.current.id;
                const isBlacklisted = recipe.rating === 0;
                const tag = ratingTag(recipe);
                return (
                  <li key={recipe.id ?? recipe.name}>
                    <button
                      type="button"
                      onClick={() => handlePick(recipe)}
                      disabled={isBlacklisted}
                      className={cn(
                        'w-full flex items-center justify-between gap-2 rounded-md px-3 py-2.5 text-left text-base transition-colors border',
                        isCurrent
                          ? 'bg-primary-50 border-primary-300 text-primary-800'
                          : 'border-transparent hover:bg-gray-50 hover:border-gray-200',
                        isBlacklisted && 'opacity-40 cursor-not-allowed'
                      )}
                    >
                      <span className="flex items-center gap-2 truncate">
                        {isCurrent ? (
                          <Check className="h-4 w-4 text-primary-600 shrink-0" />
                        ) : (
                          <span className="h-4 w-4 shrink-0" />
                        )}
                        <span className="truncate">{recipe.name}</span>
                      </span>
                      <span className="flex items-center gap-1 shrink-0">
                        {tag && (
                          <span
                            className={cn(
                              'inline-flex items-center rounded-full border px-1.5 py-0.5 text-xs',
                              tag.className
                            )}
                          >
                            {tag.text}
                          </span>
                        )}
                        {isCurrent && (
                          <span className="text-xs text-primary-600 font-medium">
                            当前
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-400 text-center">
          共 {sortedPool.length} 道{label}菜 · 点击即替换
        </div>
      </DialogContent>
    </Dialog>
  );
}
