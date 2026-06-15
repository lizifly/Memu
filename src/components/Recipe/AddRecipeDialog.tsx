import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { CATEGORY_LABELS } from '@/config/constants';
import type { RecipeCategory } from '@/types/recipe';
import { useRecipeStore } from '@/store/useRecipeStore';

interface AddRecipeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CATEGORIES: { value: RecipeCategory; label: string }[] = Object.entries(
  CATEGORY_LABELS
).map(([value, label]) => ({ value: value as RecipeCategory, label }));

export function AddRecipeDialog({ open, onOpenChange }: AddRecipeDialogProps) {
  const { addRecipe } = useRecipeStore();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<RecipeCategory>('meat');
  const [ingredients, setIngredients] = useState('');
  const [instructions, setInstructions] = useState('');
  const [tagElderly, setTagElderly] = useState(false);
  const [tagSummer, setTagSummer] = useState(false);
  const [tagColdDish, setTagColdDish] = useState(false);
  const [tagSpicy, setTagSpicy] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setName('');
    setCategory('meat');
    setIngredients('');
    setInstructions('');
    setTagElderly(false);
    setTagSummer(false);
    setTagColdDish(false);
    setTagSpicy(false);
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const tags: string[] = [];
      if (tagElderly) tags.push('适宜老人');
      if (tagSummer) tags.push('夏季推荐');
      if (tagColdDish) tags.push('凉菜');
      if (tagSpicy) tags.push('辣');

      const ingredientList = ingredients
        .split(/[,，、]/)
        .map((s) => s.trim())
        .filter(Boolean);

      await addRecipe({
        name: name.trim(),
        category,
        tags,
        ingredients: ingredientList,
        instructions: instructions.trim(),
        rating: null,
        history_dates: [],
      });

      resetForm();
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">➕ 录入新菜品</DialogTitle>
          <DialogDescription>填写菜品信息后点击保存</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 菜名 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              菜名 *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="请输入菜名"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* 分类 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              分类 *
            </label>
            <Select value={category} onValueChange={(v) => setCategory(v as RecipeCategory)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="选择分类" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 食材 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              食材（逗号分隔）
            </label>
            <input
              type="text"
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              placeholder="如：猪肉, 豆腐, 葱"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* 做法 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              做法
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="请输入做法步骤..."
              rows={4}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-primary-500 resize-y"
            />
          </div>

          {/* 标签 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              标签
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={tagElderly} onCheckedChange={(v) => setTagElderly(!!v)} />
                <span className="text-sm">👴 适宜老人/健康</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={tagSummer} onCheckedChange={(v) => setTagSummer(!!v)} />
                <span className="text-sm">🌞 标记为夏季专属</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={tagColdDish} onCheckedChange={(v) => setTagColdDish(!!v)} />
                <span className="text-sm">🥗 标记为凉菜</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={tagSpicy} onCheckedChange={(v) => setTagSpicy(!!v)} />
                <span className="text-sm">🌶️ 辣</span>
              </label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!name.trim() || submitting}
            className="text-base"
          >
            {submitting ? '保存中...' : '保存菜品'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
