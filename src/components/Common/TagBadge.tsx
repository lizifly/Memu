import { Badge } from '@/components/ui/badge';
import { CATEGORY_LABELS } from '@/config/constants';
import type { RecipeCategory } from '@/types/recipe';

interface TagBadgeProps {
  category: RecipeCategory;
  label?: string;
}

const categoryVariantMap: Record<string, 'meat' | 'veg' | 'soup' | 'staple'> = {
  meat: 'meat',
  veg: 'veg',
  soup: 'soup',
  bf_dry: 'staple',
  bf_wet_adult: 'staple',
  bf_wet_kid: 'staple',
  staple_normal: 'staple',
  staple_onepot: 'staple',
};

export function TagBadge({ category, label }: TagBadgeProps) {
  const variant = categoryVariantMap[category] ?? 'default';
  const text = label ?? CATEGORY_LABELS[category] ?? category;

  return (
    <Badge variant={variant} className="text-xs">
      {text}
    </Badge>
  );
}
