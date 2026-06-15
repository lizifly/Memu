import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { TagBadge } from '@/components/Common/TagBadge';
import { ConfirmDialog } from '@/components/Common/ConfirmDialog';
import { RatingWidget } from './RatingWidget';
import { useRecipeStore } from '@/store/useRecipeStore';
import { CATEGORY_LABELS } from '@/config/constants';
import { Pencil, Trash2 } from 'lucide-react';
import type { Recipe, RecipeCategory } from '@/types/recipe';

interface RecipeDetailDialogProps {
  recipe: Recipe | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CATEGORIES: { value: RecipeCategory; label: string }[] = Object.entries(
  CATEGORY_LABELS
).map(([value, label]) => ({ value: value as RecipeCategory, label }));

export function RecipeDetailDialog({ recipe, open, onOpenChange }: RecipeDetailDialogProps) {
  const { rateRecipe, updateRecipe, deleteRecipe } = useRecipeStore();
  const [isEditing, setIsEditing] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Edit form states
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState<RecipeCategory>('meat');
  const [editIngredients, setEditIngredients] = useState('');
  const [editInstructions, setEditInstructions] = useState('');
  const [tagElderly, setTagElderly] = useState(false);
  const [tagSummer, setTagSummer] = useState(false);
  const [tagColdDish, setTagColdDish] = useState(false);
  const [tagSpicy, setTagSpicy] = useState(false);
  const [tagPorridge, setTagPorridge] = useState(false);
  const [saving, setSaving] = useState(false);

  // Reset editing state when dialog closes or recipe changes
  useEffect(() => {
    if (!open) {
      setIsEditing(false);
      setConfirmDeleteOpen(false);
    }
  }, [open]);

  const handleDelete = async () => {
    if (!recipe || recipe.id == null) return;
    setDeleting(true);
    try {
      await deleteRecipe(recipe.id);
      setConfirmDeleteOpen(false);
      onOpenChange(false);
    } finally {
      setDeleting(false);
    }
  };

  // Populate form when entering edit mode
  const enterEditMode = () => {
    if (!recipe) return;
    setEditName(recipe.name);
    setEditCategory(recipe.category);
    setEditIngredients(recipe.ingredients.join('、'));
    setEditInstructions(recipe.instructions || '');
    setTagElderly(recipe.tags.includes('适宜老人'));
    setTagSummer(recipe.tags.includes('夏季推荐'));
    setTagColdDish(recipe.tags.includes('凉菜'));
    setTagSpicy(recipe.tags.includes('辣'));
    setTagPorridge(recipe.tags.includes('粥类'));
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!recipe || recipe.id == null) return;
    if (!editName.trim()) return;
    setSaving(true);
    try {
      const tags: string[] = [];
      if (tagElderly) tags.push('适宜老人');
      if (tagSummer) tags.push('夏季推荐');
      if (tagColdDish) tags.push('凉菜');
      if (tagSpicy) tags.push('辣');
      if (tagPorridge && editCategory === 'bf_wet_adult') tags.push('粥类');

      const ingredientList = editIngredients
        .split(/[,，、]/)
        .map((s) => s.trim())
        .filter(Boolean);

      await updateRecipe(recipe.id, {
        name: editName.trim(),
        category: editCategory,
        tags,
        ingredients: ingredientList,
        instructions: editInstructions.trim(),
      });
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  };

  if (!recipe) return null;

  const handleRate = async (rating: number) => {
    if (recipe.id != null) {
      await rateRecipe(recipe.id, rating);
    }
  };

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
  if (recipe.tags.includes('粥类')) {
    tagLabels.push({ text: '🥣 粥类', className: 'bg-amber-50 text-amber-700 border-amber-200' });
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {isEditing ? '✏️ 编辑菜品' : recipe.name}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {isEditing ? '编辑菜品信息' : '菜品详情'}
            </DialogDescription>
          </DialogHeader>

          {isEditing ? (
            /* ========== 编辑模式 ========== */
            <div className="space-y-4">
              {/* 菜名 */}
              <div>
                <label className="block text-base font-medium text-gray-700 mb-1">
                  菜名 *
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="请输入菜名"
                  className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* 分类 */}
              <div>
                <label className="block text-base font-medium text-gray-700 mb-1">
                  分类 *
                </label>
                <Select value={editCategory} onValueChange={(v) => setEditCategory(v as RecipeCategory)}>
                  <SelectTrigger className="w-full text-lg h-11">
                    <SelectValue placeholder="选择分类" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value} className="text-base">
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 食材 */}
              <div>
                <label className="block text-base font-medium text-gray-700 mb-1">
                  食材（逗号分隔）
                </label>
                <input
                  type="text"
                  value={editIngredients}
                  onChange={(e) => setEditIngredients(e.target.value)}
                  placeholder="如：猪肉、豆腐、葱"
                  className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* 做法 */}
              <div>
                <label className="block text-base font-medium text-gray-700 mb-1">
                  做法
                </label>
                <textarea
                  value={editInstructions}
                  onChange={(e) => setEditInstructions(e.target.value)}
                  placeholder="请输入做法步骤..."
                  rows={4}
                  className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-y"
                />
              </div>

              {/* 标签 */}
              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">
                  标签
                </label>
                <div className="space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox checked={tagElderly} onCheckedChange={(v) => setTagElderly(!!v)} />
                    <span className="text-base">👴 适宜老人/健康</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox checked={tagSummer} onCheckedChange={(v) => setTagSummer(!!v)} />
                    <span className="text-base">🌞 夏季推荐</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox checked={tagColdDish} onCheckedChange={(v) => setTagColdDish(!!v)} />
                    <span className="text-base">🥗 凉菜</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox checked={tagSpicy} onCheckedChange={(v) => setTagSpicy(!!v)} />
                    <span className="text-base">🌶️ 辣</span>
                  </label>
                  {editCategory === 'bf_wet_adult' && (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox checked={tagPorridge} onCheckedChange={(v) => setTagPorridge(!!v)} />
                      <span className="text-base">🥣 粥类</span>
                    </label>
                  )}
                </div>
              </div>

              {/* 编辑模式底部按钮 */}
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={cancelEdit}
                  className="text-base px-6"
                >
                  取消
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={!editName.trim() || saving}
                  className="text-base px-6 bg-green-600 hover:bg-green-700 text-white"
                >
                  {saving ? '保存中...' : '✓ 保存'}
                </Button>
              </div>
            </div>
          ) : (
            /* ========== 查看模式 ========== */
            <>
              <div className="space-y-4">
                {/* 分类和标签 */}
                <div className="flex flex-wrap items-center gap-2">
                  <TagBadge category={recipe.category} />
                  {tagLabels.map((tag) => (
                    <span
                      key={tag.text}
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${tag.className}`}
                    >
                      {tag.text}
                    </span>
                  ))}
                </div>

                {/* 食材 */}
                {recipe.ingredients.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-600 mb-2">🥬 食材</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {recipe.ingredients.map((ing) => (
                        <Badge key={ing} variant="outline" className="text-sm">
                          {ing}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* 做法 */}
                {recipe.instructions && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-600 mb-2">📝 做法</h4>
                    <div className="bg-gray-50 rounded-lg p-3 text-sm leading-relaxed whitespace-pre-wrap">
                      {recipe.instructions}
                    </div>
                  </div>
                )}

                {/* 历史足迹 */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-600 mb-2">📅 历史足迹</h4>
                  {recipe.history_dates && recipe.history_dates.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {recipe.history_dates
                        .slice()
                        .sort()
                        .reverse()
                        .map((date) => (
                          <Badge key={date} variant="outline" className="text-xs">
                            {date}
                          </Badge>
                        ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">暂无食用记录</p>
                  )}
                </div>

                {/* 评分 */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-600 mb-2">⭐ 评分</h4>
                  <RatingWidget recipe={recipe} onRate={handleRate} />
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmDeleteOpen(true)}
                  className="gap-1 border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                  删除
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={enterEditMode}
                  className="gap-1 border-orange-400 text-orange-600 hover:bg-orange-50 hover:text-orange-700"
                >
                  <Pencil className="h-4 w-4" />
                  编辑
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDeleteOpen}
        title="确定要删除这道菜吗？"
        description={`将永久从菜谱库中移除「${recipe.name}」，此操作不可恢复。`}
        confirmText={deleting ? '删除中...' : '确定删除'}
        cancelText="取消"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    </>
  );
}
