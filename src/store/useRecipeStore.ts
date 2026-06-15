import { create } from 'zustand';
import { db } from '@/db';
import type { Recipe, RecipeCategory } from '@/types/recipe';

interface RecipeFilters {
  category: RecipeCategory | 'all';
  searchText: string;
  tags: string[];
}

interface RecipeState {
  recipes: Recipe[];
  filteredRecipes: Recipe[];
  filters: RecipeFilters;

  // Actions
  loadRecipes: () => Promise<void>;
  addRecipe: (recipe: Omit<Recipe, 'id'>) => Promise<void>;
  updateRecipe: (id: number, updates: Partial<Recipe>) => Promise<void>;
  deleteRecipe: (id: number) => Promise<void>;
  rateRecipe: (id: number, rating: number) => Promise<void>;
  recordUsageDates: (recipeIds: number[], date: string) => Promise<void>;
  setFilters: (filters: Partial<RecipeFilters>) => void;
  applyFilters: () => void;
}

function filterRecipes(recipes: Recipe[], filters: RecipeFilters): Recipe[] {
  const keyword = filters.searchText.trim().toLowerCase();
  return recipes.filter((r) => {
    if (filters.category !== 'all' && r.category !== filters.category) return false;
    if (filters.tags.length > 0) {
      const ok = filters.tags.every((t) => r.tags.includes(t));
      if (!ok) return false;
    }
    if (keyword.length > 0) {
      const haystack = [
        r.name,
        ...r.ingredients,
        ...r.tags,
      ]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(keyword)) return false;
    }
    return true;
  });
}

export const useRecipeStore = create<RecipeState>((set, get) => ({
  recipes: [],
  filteredRecipes: [],
  filters: {
    category: 'all',
    searchText: '',
    tags: [],
  },

  loadRecipes: async () => {
    const recipes = await db.recipes.toArray();
    set({
      recipes,
      filteredRecipes: filterRecipes(recipes, get().filters),
    });
  },

  addRecipe: async (recipe) => {
    await db.recipes.add(recipe as Recipe);
    await get().loadRecipes();
  },

  updateRecipe: async (id, updates) => {
    await db.recipes.update(id, updates);
    await get().loadRecipes();
  },

  deleteRecipe: async (id) => {
    await db.recipes.delete(id);
    await get().loadRecipes();
  },

  rateRecipe: async (id, rating) => {
    const recipe = await db.recipes.get(id);
    if (!recipe) return;
    // 仅 history_dates 不为空时允许评分
    if (!recipe.history_dates || recipe.history_dates.length === 0) {
      throw new Error('该菜品尚未被使用过，无法评分');
    }
    await db.recipes.update(id, { rating });
    await get().loadRecipes();
  },

  recordUsageDates: async (recipeIds, date) => {
    if (recipeIds.length === 0) return;
    const uniqueIds = Array.from(new Set(recipeIds));
    await db.transaction('rw', db.recipes, async () => {
      for (const id of uniqueIds) {
        const recipe = await db.recipes.get(id);
        if (!recipe) continue;
        const dates = recipe.history_dates ?? [];
        if (dates.includes(date)) continue;
        await db.recipes.update(id, {
          history_dates: [...dates, date],
        });
      }
    });
    await get().loadRecipes();
  },

  setFilters: (partial) => {
    const filters: RecipeFilters = { ...get().filters, ...partial };
    set({
      filters,
      filteredRecipes: filterRecipes(get().recipes, filters),
    });
  },

  applyFilters: () => {
    set({ filteredRecipes: filterRecipes(get().recipes, get().filters) });
  },
}));
