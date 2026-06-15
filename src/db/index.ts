import Dexie, { type Table } from 'dexie';
import type { Recipe } from '@/types/recipe';
import type { WeeklyMenuPlan } from '@/types/menu';
import type { HistoryArchive } from '@/types/history';
import { SEED_RECIPES } from './seed';

export class MemuDatabase extends Dexie {
  recipes!: Table<Recipe, number>;
  menuPlans!: Table<WeeklyMenuPlan, number>;
  historyArchives!: Table<HistoryArchive, number>;

  constructor() {
    super('MemuDB');
    this.version(1).stores({
      recipes: '++id, name, category, rating',
      menuPlans: '++id, weekStart',
      historyArchives: '++id, weekId, weekStart',
    });
  }
}

export const db = new MemuDatabase();

/**
 * 种子数据版本号。每次更新 seed.ts 内容时递增，
 * 浏览器中旧版本的 IndexedDB 数据将被自动清空并重新导入。
 */
export const SEED_VERSION = 6;
const SEED_VERSION_KEY = 'memu_seed_version';

/**
 * 初始化数据库:
 * - 首次启动 (count===0): 直接导入种子数据
 * - 版本升级 (localStorage 中版本号 < SEED_VERSION): 清空 recipes 表并重新导入
 * - 版本一致: 不做任何处理
 *
 * 防重复机制：使用 module 级别的 Promise 缓存，确保即使被并发调用 (例如 React
 * StrictMode 下 useEffect 触发两次) 也只会真正执行一次种子导入逻辑。
 */
let initPromise: Promise<void> | null = null;

export async function initDatabase(): Promise<void> {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const storedVersionRaw = localStorage.getItem(SEED_VERSION_KEY);
    const storedVersion = storedVersionRaw ? parseInt(storedVersionRaw, 10) : 0;

    // 版本一致且已存在数据：跳过
    if (storedVersion === SEED_VERSION) {
      const count = await db.recipes.count();
      if (count > 0) return;
    }

    // 使用事务保证 clear + bulkAdd 的原子性，避免中途被读取到中间态
    await db.transaction('rw', db.recipes, async () => {
      await db.recipes.clear();
      await db.recipes.bulkAdd(SEED_RECIPES as Recipe[]);
    });
    localStorage.setItem(SEED_VERSION_KEY, String(SEED_VERSION));

    if (storedVersion === 0) {
      console.log(`[seed v${SEED_VERSION}] 已导入 ${SEED_RECIPES.length} 道初始菜谱`);
    } else {
      console.log(
        `[seed v${storedVersion} → v${SEED_VERSION}] 已重置并重新导入 ${SEED_RECIPES.length} 道菜谱`
      );
    }
  })();

  try {
    await initPromise;
  } catch (err) {
    // 失败后清掉缓存，允许下次重试
    initPromise = null;
    throw err;
  }
}

/**
 * 手动重置菜谱库为最新种子数据 (供调试或"恢复默认"功能调用)
 */
export async function resetRecipesToSeed(): Promise<void> {
  await db.recipes.clear();
  await db.recipes.bulkAdd(SEED_RECIPES as Recipe[]);
  localStorage.setItem(SEED_VERSION_KEY, String(SEED_VERSION));
  console.log(`[seed v${SEED_VERSION}] 已手动重置菜谱库`);
}
