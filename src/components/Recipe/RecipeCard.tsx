import { Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TagBadge } from '@/components/Common/TagBadge';
import { cn } from '@/lib/utils';
import type { Recipe } from '@/types/recipe';

interface RecipeCardProps {
  recipe: Recipe;
  onClick: (recipe: Recipe) => void;
}

function RatingDisplay({ recipe }: { recipe: Recipe }) {
  const hasHistory = recipe.history_dates && recipe.history_dates.length > 0;

  if (!hasHistory) {
    return (
      <span className="text-sm text-gray-400">未品尝</span>
    );
  }

  if (recipe.rating === null) {
    return (
      <span className="text-sm text-primary-500 font-medium cursor-pointer">
        点击评分
      </span>
    );
  }

  if (recipe.rating === 0) {
    return (
      <Badge variant="destructive" className="text-xs">已拉黑</Badge>
    );
  }

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: recipe.rating }).map((_, i) => (
        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
      ))}
    </div>
  );
}

export function RecipeCard({ recipe, onClick }: RecipeCardProps) {
  const tagLabels: { text: string; className: string }[] = [];

  if (recipe.tags.includes('适宜老人')) {
    tagLabels.push({ text: '👴 适宜老人', className: 'bg-secondary-50 text-secondary-700 border-secondary-200' });
  }
  if (recipe.tags.includes('夏季推荐')) {
    tagLabels.push({ text: '🌞 夏季推荐', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' });
  }
  if (recipe.tags.includes('凉菜')) {
    tagLabels.push({ text: '🥗 凉菜', className: 'bg-cyan-100 text-cyan-700 border-cyan-200' });
  }
  if (recipe.tags.includes('辣')) {
    tagLabels.push({ text: '🌶️ 辣', className: 'bg-red-50 text-red-600 border-red-200' });
  }

  return (
    <Card
      className={cn(
        'cursor-pointer hover:shadow-md transition-shadow hover:border-primary-300',
        recipe.rating === 0 && 'opacity-50 border-red-200'
      )}
      onClick={() => onClick(recipe)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-bold text-gray-900 leading-tight">
            {recipe.name}
          </h3>
          <TagBadge category={recipe.category} />
        </div>

        {tagLabels.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {tagLabels.map((tag) => (
              <span
                key={tag.text}
                className={cn(
                  'inline-flex items-center rounded-full border px-2 py-0.5 text-xs',
                  tag.className
                )}
              >
                {tag.text}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto pt-2 border-t border-gray-100">
          <RatingDisplay recipe={recipe} />
        </div>
      </CardContent>
    </Card>
  );
}
