import { TagBadge } from '@/components/Common/TagBadge';
import type { WeeklyMenuPlan, DayPlan } from '@/types/menu';

interface WeekDetailProps {
  plan: WeeklyMenuPlan;
}

function DaySection({ day }: { day: DayPlan }) {
  return (
    <div className="py-2 border-b border-gray-100 last:border-b-0">
      <h4 className="font-semibold text-base text-gray-800 mb-1.5">{day.dayLabel}</h4>

      {/* 早餐 */}
      <div className="ml-2 mb-1.5">
        <span className="text-xs font-medium text-gray-500 mr-2">🌅 早餐:</span>
        <span className="text-sm">
          {day.breakfast.dry.name}
          <span className="text-gray-400 mx-1">/</span>
          {day.breakfast.egg.name}
          <span className="text-gray-400 mx-1">/</span>
          {day.breakfast.wet_adult.name}
          <span className="text-gray-400 mx-1">/</span>
          {day.breakfast.wet_kid.name}
        </span>
      </div>

      {/* 晚餐 */}
      <div className="ml-2">
        <span className="text-xs font-medium text-gray-500 mr-2">🌙 晚餐:</span>
        <div className="inline-flex flex-wrap gap-1.5">
          {day.dinner.dishes.map((dish, idx) => (
            <span key={idx} className="inline-flex items-center gap-1 text-sm">
              <span>{dish.recipe.name}</span>
              <TagBadge category={dish.recipe.category} />
            </span>
          ))}
        </div>
        {day.dinner.type === 'simple' && (
          <span className="ml-2 text-xs text-orange-500 font-medium">(简餐)</span>
        )}
      </div>
    </div>
  );
}

export function WeekDetail({ plan }: WeekDetailProps) {
  return (
    <div className="space-y-1 py-2">
      <div className="flex items-center gap-2 mb-2 text-xs text-gray-500">
        <span>模式: {plan.season === 'summer' ? '🌞 夏季' : plan.season === 'winter' ? '❄️ 冬季' : '🍂 默认'}</span>
      </div>
      {plan.days.map((day) => (
        <DaySection key={day.day} day={day} />
      ))}
    </div>
  );
}
