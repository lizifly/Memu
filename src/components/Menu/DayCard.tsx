import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DishItem } from './DishItem';
import type { DayPlan } from '@/types/menu';

interface DayCardProps {
  day: DayPlan;
  dayIndex: number;
  onReplaceDish: (dayIndex: number, mealType: 'breakfast' | 'dinner', dishIndex: number, role?: string) => void;
}

export function DayCard({ day, dayIndex, onReplaceDish }: DayCardProps) {
  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-xl text-center font-bold text-gray-800">
          {day.dayLabel}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3 pb-4 flex-1 space-y-3">
        {/* 早餐区域 */}
        <div className="rounded-lg bg-amber-50 p-3">
          <h4 className="text-base font-semibold text-amber-800 mb-2">🌅 早餐</h4>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-sm text-amber-600 shrink-0">干食:</span>
              <div className="flex-1 min-w-0">
                <DishItem
                  recipe={day.breakfast.dry}
                  showBadge={false}
                  onReplace={() => onReplaceDish(dayIndex, 'breakfast', 0, 'dry')}
                />
              </div>
            </div>
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-sm text-amber-600 shrink-0">蛋类:</span>
              <div className="flex-1 min-w-0">
                <DishItem
                  recipe={day.breakfast.egg}
                  showBadge={false}
                  onReplace={() => onReplaceDish(dayIndex, 'breakfast', 1, 'egg')}
                />
              </div>
            </div>
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-sm text-amber-600 shrink-0">成人稀食:</span>
              <div className="flex-1 min-w-0">
                <DishItem
                  recipe={day.breakfast.wet_adult}
                  showBadge={false}
                  onReplace={() => onReplaceDish(dayIndex, 'breakfast', 2, 'wet_adult')}
                />
              </div>
            </div>
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-sm text-purple-600 shrink-0">儿童稀食:</span>
              <div className="flex-1 min-w-0">
                <DishItem
                  recipe={day.breakfast.wet_kid}
                  showBadge={false}
                  onReplace={() => onReplaceDish(dayIndex, 'breakfast', 3, 'wet_kid')}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 晚餐区域 */}
        <div className="rounded-lg bg-white border border-gray-100 p-3">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="text-base font-semibold text-gray-800">🌙 晚餐</h4>
            {day.dinner.type === 'simple' && (
              <Badge variant="staple" className="text-xs">简餐</Badge>
            )}
          </div>
          <div className="space-y-0.5">
            {day.dinner.dishes.map((dish, idx) => (
              <DishItem
                key={idx}
                recipe={dish.recipe}
                role={dish.role}
                showBadge={true}
                onReplace={() => onReplaceDish(dayIndex, 'dinner', idx, dish.role)}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
