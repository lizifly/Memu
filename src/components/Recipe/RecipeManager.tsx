import { useEffect, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { useRecipeStore } from '@/store/useRecipeStore';
import { CATEGORY_LABELS } from '@/config/constants';
import { RecipeCard } from './RecipeCard';
import { AddRecipeDialog } from './AddRecipeDialog';
import { RecipeDetailDialog } from './RecipeDetailDialog';
import type { Recipe, RecipeCategory } from '@/types/recipe';

const ALL_CATEGORIES: { value: RecipeCategory | 'all'; label: string }[] = [
  { value: 'all', label: '全部分类' },
  ...Object.entries(CATEGORY_LABELS).map(([value, label]) => ({
    value: value as RecipeCategory,
    label,
  })),
];

export function RecipeManager() {
  const { filteredRecipes, loadRecipes, filters, setFilters } = useRecipeStore();
  const [addOpen, setAddOpen] = useState(false);
  const [detailRecipe, setDetailRecipe] = useState<Recipe | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    loadRecipes();
  }, [loadRecipes]);

  const handleCardClick = (recipe: Recipe) => {
    setDetailRecipe(recipe);
    setDetailOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">🍳 菜谱管理</h2>
        <Button onClick={() => setAddOpen(true)} className="text-base gap-1" size="lg">
          <Plus className="h-5 w-5" />
          录入新菜品
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Select
          value={filters.category}
          onValueChange={(v) => setFilters({ category: v as RecipeCategory | 'all' })}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="选择分类" />
          </SelectTrigger>
          <SelectContent>
            {ALL_CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={filters.searchText}
            onChange={(e) => setFilters({ searchText: e.target.value })}
            placeholder="搜索菜名、食材..."
            className="w-full rounded-md border border-gray-300 pl-9 pr-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Recipe Grid */}
      {filteredRecipes.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">暂无菜谱</p>
          <p className="text-sm mt-1">点击上方按钮录入新菜品</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredRecipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onClick={handleCardClick}
            />
          ))}
        </div>
      )}

      {/* Dialogs */}
      <AddRecipeDialog open={addOpen} onOpenChange={setAddOpen} />
      <RecipeDetailDialog
        recipe={detailRecipe}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
}
