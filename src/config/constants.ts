// 强制牛奶燕麦的日子 (周一、三、五)
export const MANDATORY_MILK_OATMEAL_DAYS = ['Monday', 'Wednesday', 'Friday'];

// 粥类每周最多出现天数
export const MAX_PORRIDGE_DAYS_PER_WEEK = 1;

// 简餐每周次数
export const SIMPLE_MEAL_COUNT_PER_WEEK = 1;

// 正餐配置
export const FORMAL_DINNER_CONFIG = {
  default: { meatCount: 2, vegCount: 1, soupCount: 1, stapleCount: 1 },
  summer: { meatCount: 1, coldDishCount: 1, vegCount: 1, soupCount: 1, stapleCount: 1 },
  winter: { meatCount: 2, vegCount: 1, soupCount: 1, stapleCount: 1 }, // 先占位同默认
};

// 跨周降权系数
export const CROSS_WEEK_WEIGHT_FACTOR = 0.1;

// 5星菜周内最多出现次数
export const FIVE_STAR_MAX_REPEAT = 2;

// 标签常量
export const TAGS = {
  ELDERLY_FRIENDLY: '适宜老人',
  SUMMER_RECOMMENDED: '夏季推荐',
  COLD_DISH: '凉菜',
  WINTER_RECOMMENDED: '冬季推荐',
  PORRIDGE: '粥类',
  SPICY: '辣',
};

// 常见调料/配料白名单（家中常备，无需每周采购）
export const COMMON_SEASONINGS: string[] = [
  '盐', '生抽', '老抽', '料酒', '醋', '白醋', '香醋',
  '酱油', '蚝油', '味精', '鸡精', '白糖', '冰糖', '红糖',
  '胡椒粉', '花椒', '花椒粉', '五香粉', '十三香', '八角', '桂皮',
  '辣椒', '干辣椒', '辣椒粉', '辣椒面', '豆瓣酱', '甜面酱', '番茄酱',
  '食用油', '花生油', '橄榄油', '芝麻油', '香油',
  '淀粉', '生粉', '面粉', '玉米淀粉',
  '蒜', '大蒜', '蒜末', '蒜头', '蒜瓣', '蒜片',
  '姜', '生姜', '姜片', '姜丝',
  '葱', '小葱', '葱花', '大葱', '香葱',
  '香菜', '芝麻', '白芝麻',
  '豆豉', '腐乳', '黄酒', '白酒',
  '水', '清水', '开水', '温水', '高汤',
];

// 分类中文映射
export const CATEGORY_LABELS: Record<string, string> = {
  meat: '荤菜',
  veg: '素菜',
  soup: '汤',
  bf_dry: '早餐干食',
  bf_egg: '早餐蛋类',
  bf_wet_adult: '早餐稀食(成人)',
  bf_wet_kid: '早餐稀食(儿童)',
  staple_normal: '主食',
  staple_onepot: '简餐(一锅出)',
};
