import { Star, Ban } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { Recipe } from '@/types/recipe';

interface RatingWidgetProps {
  recipe: Recipe;
  onRate: (rating: number) => void;
}

export function RatingWidget({ recipe, onRate }: RatingWidgetProps) {
  const canRate = recipe.history_dates && recipe.history_dates.length > 0;
  const currentRating = recipe.rating;

  if (!canRate) {
    return (
      <div className="flex items-center gap-2 text-gray-400 text-sm">
        <Star className="h-4 w-4" />
        <span>需要先品尝才能评分</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onRate(star)}
            className="p-0.5 hover:scale-110 transition-transform"
            aria-label={`${star}星`}
          >
            <Star
              className={cn(
                'h-6 w-6 transition-colors',
                currentRating !== null && currentRating >= star
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'fill-none text-gray-300'
              )}
            />
          </button>
        ))}
        {currentRating !== null && currentRating > 0 && (
          <span className="ml-2 text-sm text-gray-500">{currentRating}星</span>
        )}
      </div>
      <div>
        <Button
          variant={currentRating === 0 ? 'destructive' : 'outline'}
          size="sm"
          onClick={() => onRate(0)}
          className="text-xs gap-1"
        >
          <Ban className="h-3 w-3" />
          {currentRating === 0 ? '已拉黑' : '拉黑此菜'}
        </Button>
      </div>
    </div>
  );
}
