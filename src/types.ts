export type Genre =
  | '和食'
  | '洋食'
  | '中華'
  | 'イタリアン'
  | '韓国料理'
  | 'エスニック'

export type MealType = '夜'

/** 献立の役割 */
export type DishRole = '主食' | '主菜' | '副菜'

export const DISH_ROLES: DishRole[] = ['主食', '主菜', '副菜']

export const DISH_ROLE_SHORT: Record<DishRole, string> = {
  '主食': '主食',
  '主菜': '主菜',
  '副菜': '副菜',
}

export const DISH_ROLE_EMOJI: Record<DishRole, string> = {
  '主食': '🍚',
  '主菜': '🍖',
  '副菜': '🥗',
}

/** @deprecated alias */
export const DISH_ROLES_ALIAS = DISH_ROLES

/** 健康・食事方針タグ */
export type HealthTag =
  | 'グルテンフリー'
  | '添加物なし'
  | '低糖質'
  | '低カロリー'
  | '野菜多め'
  | '高タンパク'
  | 'オイル控えめ'

export const HEALTH_TAGS: HealthTag[] = [
  'グルテンフリー',
  '添加物なし',
  '低糖質',
  '低カロリー',
  '野菜多め',
  '高タンパク',
  'オイル控えめ',
]

export const HEALTH_TAG_SHORT: Record<HealthTag, string> = {
  'グルテンフリー': 'GF',
  '添加物なし': '無添加',
  '低糖質': '低糖',
  '低カロリー': '低カロ',
  '野菜多め': '野菜',
  '高タンパク': 'タンパク',
  'オイル控えめ': '低油',
}

export interface RecipeLink {
  label: string
  url: string
}

export interface Recipe {
  id: string
  name: string
  genre: Genre
  ingredients: string[]
  cookingTime: number
  difficulty: '簡単' | '普通' | 'やや手間'
  description: string
  /** 主食・主菜・副菜 */
  dishRole?: DishRole
  /** SNS・家庭で最近よく作られる人気レシピ */
  trending?: boolean
  /** レシピ参考リンク（未設定時は自動生成） */
  links?: RecipeLink[]
  /** 健康・食事方針タグ（自動判定＋手動） */
  healthTags?: HealthTag[]
  /** ユーザーが手入力したレシピ */
  custom?: boolean
}

export interface InventoryItem {
  id: string
  name: string
  quantity?: string
  wantToUse: boolean
}

/** 1スロット＝曜日×食事×役割 */
export interface PlannedMeal {
  dayIndex: number
  mealType: MealType
  dishRole: DishRole
  recipeId: string
  /** 手動配置（自動配置で上書きしない） */
  manual?: boolean
}

/** 曜日未割り当ての一時置きレシピ */
export interface StagedRecipe {
  id: string
  recipeId: string
  dishRole: DishRole
}

export interface AppState {
  inventory: InventoryItem[]
  /** お気に入りレシピID */
  favoriteRecipeIds: string[]
  weeklyPlan: PlannedMeal[]
  /** 一時置き（曜日未定） */
  stagedRecipes: StagedRecipe[]
  preferredGenres: Genre[]
  /** 曜日ごとにオフにしたジャンル（dayIndex 0=日 … 6=土） */
  dayDisabledGenres: Partial<Record<number, Genre[]>>
  weekStartDate: string
  /** 曜日ごとの買い物メモ */
  dayShoppingNotes: Partial<Record<number, string>>
  /** 曜日ごとの下ごしらえ・作り置きメモ */
  dayPrepNotes: Partial<Record<number, string>>
  /** 曜日ごとのご飯をカロリーに含めるか（未設定時は献立から自動判定） */
  dayRiceIncluded: Partial<Record<number, boolean>>
  /** 手入力レシピ */
  customRecipes: Recipe[]
}

export const GENRES: Genre[] = [
  '和食',
  '洋食',
  '中華',
  'イタリアン',
  '韓国料理',
  'エスニック',
]

/** dayIndex 0=日 … 6=土（日曜始まり） */
export const DAYS = ['日', '月', '火', '水', '木', '金', '土'] as const

export const MEAL_TYPES: MealType[] = ['夜']

/** マトリクス表示用の短いジャンル名 */
export const GENRE_SHORT: Record<Genre, string> = {
  '和食': '和',
  '洋食': '洋',
  '中華': '中',
  'イタリアン': '伊',
  '韓国料理': '韓',
  'エスニック': 'エ',
}

export function isDayGenreEnabled(
  dayIndex: number,
  genre: Genre,
  dayDisabledGenres: Partial<Record<number, Genre[]>>
): boolean {
  return !(dayDisabledGenres[dayIndex] ?? []).includes(genre)
}

export function getEnabledGenresForDay(
  dayIndex: number,
  dayDisabledGenres: Partial<Record<number, Genre[]>>
): Genre[] {
  return GENRES.filter((g) => isDayGenreEnabled(dayIndex, g, dayDisabledGenres))
}
