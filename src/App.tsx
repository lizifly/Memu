import { useEffect, useRef } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useAppStore, useRecipeStore } from '@/store';
import type { TabKey } from '@/store';
import { initDatabase } from '@/db';
import { MenuPlanner } from '@/components/Menu/MenuPlanner';
import { ShoppingList } from '@/components/Shopping/ShoppingList';
import { RecipeManager } from '@/components/Recipe/RecipeManager';
import { HistoryTimeline } from '@/components/History/HistoryTimeline';

function App() {
  const { activeTab, setActiveTab, isInitialized, setInitialized } = useAppStore();
  const { loadRecipes } = useRecipeStore();
  const initStartedRef = useRef(false);

  useEffect(() => {
    // 防止 StrictMode 下 useEffect 执行两次导致重复初始化
    if (initStartedRef.current) return;
    initStartedRef.current = true;

    async function init() {
      await initDatabase();
      await loadRecipes();
      setInitialized(true);
    }
    init();
  }, [loadRecipes, setInitialized]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-pulse">🍽️</div>
          <p className="text-xl text-gray-500">正在初始化...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部标题栏 */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            🍽️ 家庭智能菜单管家
          </h1>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabKey)}>
          <TabsList className="w-full h-12 grid grid-cols-4 mb-6">
            <TabsTrigger value="menu" className="text-base sm:text-lg py-2">
              📅 本周排餐
            </TabsTrigger>
            <TabsTrigger value="shopping" className="text-base sm:text-lg py-2">
              🛒 采购清单
            </TabsTrigger>
            <TabsTrigger value="recipes" className="text-base sm:text-lg py-2">
              📚 菜谱管理
            </TabsTrigger>
            <TabsTrigger value="history" className="text-base sm:text-lg py-2">
              🕰️ 历史记录
            </TabsTrigger>
          </TabsList>

          <TabsContent value="menu">
            <MenuPlanner />
          </TabsContent>
          <TabsContent value="shopping">
            <ShoppingList />
          </TabsContent>
          <TabsContent value="recipes">
            <RecipeManager />
          </TabsContent>
          <TabsContent value="history">
            <HistoryTimeline />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

export default App;
