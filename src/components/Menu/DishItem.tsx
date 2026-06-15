import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import type { DinnerDish } from '@/types/menu';
import type { Recipe } from '@/types/recipe';

type RoleVariant = 'meat' | 'veg' | 'staple' | 'soup';

const ROLE_LABELS: Record<string, string> = {
  meat: '荤',
  veg: '素',
  soup: '汤',
  staple: '主食',
  cold_dish: '凉菜',
  onepot: '一锅出',
};

function getRoleVariant(role: DinnerDish['role']): RoleVariant {
  switch (role) {
    case 'meat':
      return 'meat';
    case 'veg':
    case 'cold_dish':
      return 'veg';
    case 'soup':
      return 'soup';
    case 'staple':
    case 'onepot':
      return 'staple';
    default:
      return 'meat';
  }
}

interface DishItemProps {
  recipe: Recipe;
  role?: DinnerDish['role'];
  showBadge?: boolean;
  onReplace?: () => void;
}

export function DishItem({ recipe, role, showBadge = true, onReplace }: DishItemProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [hovered, setHovered] = useState(false);

  return (
    <>
      <div
        className="relative flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-gray-50 group"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <button
          className="text-base text-gray-800 hover:text-primary-600 hover:underline cursor-pointer truncate text-left flex-1"
          onClick={() => setShowDialog(true)}
        >
          {recipe.name}
        </button>

        {showBadge && role && (
          <Badge variant={getRoleVariant(role)} className="text-xs shrink-0">
            {ROLE_LABELS[role] || role}
          </Badge>
        )}

        {hovered && onReplace && (
          <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-1 bg-white shadow rounded-md p-0.5">
            <button
              onClick={(e) => { e.stopPropagation(); onReplace(); }}
              className="p-1 rounded hover:bg-primary-50 text-primary-600"
              title="换一个"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">{recipe.name}</DialogTitle>
            <DialogDescription className="text-base">
              {role && <Badge variant={getRoleVariant(role)} className="mr-2">{ROLE_LABELS[role]}</Badge>}
              {recipe.tags.join(' · ')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <h4 className="font-semibold text-base mb-1">🥬 食材</h4>
              <p className="text-base text-gray-700">{recipe.ingredients.join('、')}</p>
            </div>
            {recipe.instructions && (
              <div>
                <h4 className="font-semibold text-base mb-1">👨‍🍳 做法</h4>
                <p className="text-base text-gray-700 whitespace-pre-wrap">{recipe.instructions}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
