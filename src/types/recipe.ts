export type RecipeCategory =
  | 'meat'           // 荤菜
  | 'veg'            // 素菜
  | 'soup'           // 汤
  | 'bf_dry'         // 早餐干食(面食/主食类)
  | 'bf_egg'         // 早餐蛋类(全家共享)
  | 'bf_wet_adult'   // 早餐稀制(成人/老人)
  | 'bf_wet_kid'     // 早餐稀制(儿童)
  | 'staple_normal'  // 常规主食
  | 'staple_onepot'; // 一锅出简餐

export interface Recipe {
  id?: number;
  name: string;
  category: RecipeCategory;
  tags: string[];        // 如 ['适宜老人', '辣', '夏季推荐', '凉菜']
  ingredients: string[]; // 食材数组
  instructions: string;  // 做法
  rating: number | null; // null=未品尝, 0=拉黑, 1-5=评分
  history_dates: string[]; // 历史食用日期 ["2023-10-12"]
}
