import { useEffect, useState } from 'react';
import { Dices, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMenuStore, useRecipeStore } from '@/store';
import { DayCard } from './DayCard';
import { SeasonToggle } from './SeasonToggle';
import { ReplaceDishDialog, type ReplaceTarget } from './ReplaceDishDialog';
import type { Recipe } from '@/types/recipe';
import type { DayPlan } from '@/types/menu';

function resolveCurrentRecipe(
  day: DayPlan,
  mealType: 'breakfast' | 'dinner',
  dishIndex: number,
  role?: string
): Recipe | null {
  if (mealType === 'breakfast') {
    const slot = (role ?? 'dry') as 'dry' | 'egg' | 'wet_adult' | 'wet_kid';
    return day.breakfast[slot] ?? null;
  }
  return day.dinner.dishes[dishIndex]?.recipe ?? null;
}

export function MenuPlanner() {
  const { currentPlan, isGenerating, generateMenu, loadCurrentPlan, archivePlan } = useMenuStore();
  const loadRecipes = useRecipeStore((s) => s.loadRecipes);

  const [replaceTarget, setReplaceTarget] = useState<ReplaceTarget | null>(null);
  const [replaceOpen, setReplaceOpen] = useState(false);

  useEffect(() => {
    loadCurrentPlan();
    // 确保菜谱列表已经加载，供换菜对话框筛选使用
    loadRecipes();
  }, [loadCurrentPlan, loadRecipes]);

  const handleReplace = (
    dayIndex: number,
    mealType: 'breakfast' | 'dinner',
    dishIndex: number,
    role?: string
  ) => {
    if (!currentPlan) return;
    const day = currentPlan.days[dayIndex];
    if (!day) return;
    const current = resolveCurrentRecipe(day, mealType, dishIndex, role);
    if (!current) return;
    setReplaceTarget({ dayIndex, mealType, dishIndex, role, current });
    setReplaceOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* 控制栏 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Button
          onClick={generateMenu}
          disabled={isGenerating}
          className="h-12 px-6 text-lg font-semibold"
        >
          <Dices className="h-5 w-5 mr-2" />
          {isGenerating ? '生成中...' : '🎲 生成下周菜单'}
        </Button>
        <SeasonToggle />
      </div>

      {/* 周视图 */}
      {currentPlan ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
            {currentPlan.days.map((day, index) => (
              <DayCard
                key={day.day}
                day={day}
                dayIndex={index}
                onReplaceDish={handleReplace}
              />
            ))}
          </div>

          {/* 存档按钮 */}
          <div className="flex justify-center pt-4">
            <Button
              variant="secondary"
              onClick={archivePlan}
              className="h-12 px-8 text-lg font-semibold"
            >
              <Save className="h-5 w-5 mr-2" />
              💾 保存并存档本周计划
            </Button>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-6xl mb-4">🍽️</div>
          <h3 className="text-2xl font-semibold text-gray-600 mb-2">暂无排餐计划</h3>
          <p className="text-lg text-gray-400">点击上方按钮生成下周菜单</p>
        </div>
      )}

      <ReplaceDishDialog
        open={replaceOpen}
        onOpenChange={setReplaceOpen}
        target={replaceTarget}
      />
    </div>
  );
}
