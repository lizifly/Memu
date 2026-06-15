import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, ClipboardList, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMenuStore } from '@/store';
import { generateShoppingList } from '@/algorithms/shoppingList';
import { DAYS_OF_WEEK } from '@/types/menu';
import { COMMON_SEASONINGS } from '@/config/constants';
import { cn } from '@/lib/utils';

/**
 * 判断一个食材名称是否属于"调料/配料"。
 * 采用模糊匹配：食材名包含调料关键词，或调料关键词包含食材名（处理"蒜末""姜片"等带量词/形态的情形）。
 */
function isSeasoning(ingredientName: string): boolean {
  const name = ingredientName.trim();
  if (!name) return false;
  return COMMON_SEASONINGS.some((s) => name.includes(s) || s.includes(name));
}

export function ShoppingList() {
  const [selectedDays, setSelectedDays] = useState<boolean[]>([false, false, false, false, false]);

  const allDaysSelected = selectedDays.every((v) => v);
  const toggleAllDays = () => {
    setSelectedDays(allDaysSelected ? [false, false, false, false, false] : [true, true, true, true, true]);
  };
  const [shoppingItems, setShoppingItems] = useState<string[]>([]);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [seasoningExpanded, setSeasoningExpanded] = useState(false);
  const { currentPlan } = useMenuStore();

  const handleDayToggle = (index: number) => {
    setSelectedDays((prev) => prev.map((v, i) => (i === index ? !v : v)));
  };

  const handleGenerate = () => {
    if (!currentPlan) return;
    const selectedDayPlans = currentPlan.days.filter((_, i) => selectedDays[i]);
    const items = generateShoppingList(selectedDayPlans);
    setShoppingItems(items);
    setCheckedItems(new Set());
  };

  const handleItemCheck = (item: string) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(item)) {
        next.delete(item);
      } else {
        next.add(item);
      }
      return next;
    });
  };

  // 拆分为主食材 与 调料/配料
  const { mainItems, seasoningItems } = useMemo(() => {
    const mains: string[] = [];
    const seasonings: string[] = [];
    for (const item of shoppingItems) {
      if (isSeasoning(item)) seasonings.push(item);
      else mains.push(item);
    }
    return { mainItems: mains, seasoningItems: seasonings };
  }, [shoppingItems]);

  // 全选/取消全选 仅作用于"需购主食材"
  const allMainChecked = mainItems.length > 0 && mainItems.every((i) => checkedItems.has(i));
  const toggleAllMain = () => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (allMainChecked) {
        for (const i of mainItems) next.delete(i);
      } else {
        for (const i of mainItems) next.add(i);
      }
      return next;
    });
  };

  const mainBought = mainItems.filter((i) => checkedItems.has(i)).length;
  const totalCount = shoppingItems.length;
  const totalBought = checkedItems.size;

  return (
    <div className="space-y-6">
      {/* 天数选择区 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-xl flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary-500" />
            选择采购天数
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 flex-wrap mb-4">
            {DAYS_OF_WEEK.map((d, index) => (
              <label
                key={d.key}
                className="flex items-center gap-2 cursor-pointer select-none"
              >
                <Checkbox
                  checked={selectedDays[index]}
                  onCheckedChange={() => handleDayToggle(index)}
                  className="h-5 w-5"
                />
                <span className="text-base font-medium">{d.label}</span>
              </label>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="h-9"
              onClick={toggleAllDays}
            >
              {allDaysSelected ? '取消全选' : '全选'}
            </Button>
          </div>
          <Button
            onClick={handleGenerate}
            disabled={!currentPlan || selectedDays.every((v) => !v)}
            className="h-12 px-6 text-lg font-semibold"
          >
            <ClipboardList className="h-5 w-5 mr-2" />
            📋 生成清单
          </Button>
          {!currentPlan && (
            <p className="text-base text-gray-400 mt-2">请先在"本周排餐"中生成菜单</p>
          )}
        </CardContent>
      </Card>

      {/* 食材清单 */}
      {shoppingItems.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xl flex items-center justify-between">
              <span>🛒 食材清单</span>
              <span className="text-base font-normal text-gray-500">
                已购 {totalBought}/{totalCount}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 主食材区域 —— 默认展开 */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <span>📋 需购食材</span>
                  <span className="text-sm font-normal text-gray-500">
                    ({mainBought}/{mainItems.length})
                  </span>
                </h3>
                {mainItems.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={toggleAllMain}
                  >
                    {allMainChecked ? '取消全选' : '全选'}
                  </Button>
                )}
              </div>
              {mainItems.length === 0 ? (
                <p className="text-sm text-gray-400">无主食材</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {mainItems.map((item) => {
                    const isChecked = checkedItems.has(item);
                    return (
                      <label
                        key={item}
                        className={cn(
                          'flex items-center gap-3 p-2.5 rounded-lg cursor-pointer select-none transition-colors',
                          isChecked ? 'bg-gray-100' : 'hover:bg-gray-50'
                        )}
                      >
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => handleItemCheck(item)}
                          className="h-5 w-5"
                        />
                        <span
                          className={cn(
                            'text-base transition-all',
                            isChecked && 'line-through text-gray-400'
                          )}
                        >
                          {item}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </section>

            {/* 调料/配料区域 —— 默认折叠 */}
            {seasoningItems.length > 0 && (
              <section className="border-t pt-4">
                <button
                  type="button"
                  onClick={() => setSeasoningExpanded((v) => !v)}
                  className="flex items-center justify-between w-full text-left mb-3 group"
                >
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    {seasoningExpanded ? (
                      <ChevronDown className="h-5 w-5 text-gray-500 group-hover:text-gray-700" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-500 group-hover:text-gray-700" />
                    )}
                    <span>🧂 调料/配料</span>
                    <span className="text-sm font-normal text-gray-500">
                      （家中常备 · {seasoningItems.length}项）
                    </span>
                  </h3>
                </button>
                {seasoningExpanded && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {seasoningItems.map((item) => {
                      const isChecked = checkedItems.has(item);
                      return (
                        <label
                          key={item}
                          className={cn(
                            'flex items-center gap-3 p-2.5 rounded-lg cursor-pointer select-none transition-colors',
                            isChecked ? 'bg-gray-100' : 'hover:bg-gray-50'
                          )}
                        >
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={() => handleItemCheck(item)}
                            className="h-5 w-5"
                          />
                          <span
                            className={cn(
                              'text-base transition-all',
                              isChecked && 'line-through text-gray-400'
                            )}
                          >
                            {item}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </section>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
