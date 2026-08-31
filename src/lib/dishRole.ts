import type { DishRole, Recipe } from '../types'

const STAPLE_NAME = [
  'ごはん', 'ご飯', '丼', 'おにぎり', 'おかゆ', '雑炊', 'お茶漬け',
  'うどん', 'そば', 'そうめん', 'パン', 'トースト', 'サンド', 'ベーグル',
  'パスタ', 'スパゲッ', 'ペンネ', 'リゾット', 'チャーハン', '炒飯',
  'ラーメン', '麺', '焼きそば', 'フォー', 'クスクス', 'ドリア', 'ピラフ',
  'ナン', 'タコス', 'ブリトー', 'ガパオライス',
]

const SIDE_NAME = [
  '味噌汁', 'スープ', 'サラダ', 'おひたし', 'ナムル', '和え', 'きんぴら',
  '冷奴', '漬け', 'ピクルス', '煮卵', 'ひじき', 'コールスロー', 'カプレーゼ',
  'ポテサラ', 'ポテトサラダ', '副菜', '付け合わせ', '小鉢', '椀',
]

const STAPLE_ING = ['米', 'ご飯', 'うどん', 'そば', 'そうめん', 'パン', 'パスタ', 'スパゲッティ', '中華麺', 'フォー麺', 'トルティーヤ', 'クスクス', '焼きそば麺']

const MAIN_ING = [
  '鶏', '豚', '牛', '肉', '鮭', 'サバ', '鯖', 'ぶり', 'アジ', 'エビ', '魚',
  'ハンバーグ', '豆腐', '卵',
]

/** 材料・料理名から主食/主菜/副菜を推定 */
export function detectDishRole(recipe: Pick<Recipe, 'name' | 'ingredients'>): DishRole {
  const name = recipe.name
  if (SIDE_NAME.some((k) => name.includes(k))) return '副菜'
  if (STAPLE_NAME.some((k) => name.includes(k))) return '主食'

  const ings = recipe.ingredients
  const hasStaple = ings.some((i) => STAPLE_ING.some((k) => i.includes(k)))
  const hasMain = ings.some((i) => MAIN_ING.some((k) => i.includes(k)))
  const vegCount = ings.filter((i) =>
    ['菜', '野菜', 'きゅうり', 'もやし', 'わかめ', 'レタス', 'ほうれん草', 'キャベツ'].some((k) =>
      i.includes(k)
    )
  ).length

  if (hasStaple && !hasMain && name.includes('定食') === false) {
    // 丼・麺類は主食扱い、定食は主菜寄り
    if (['丼', '麺', 'うどん', 'そば', 'パスタ', 'ライス', 'ご飯'].some((k) => name.includes(k))) {
      return '主食'
    }
  }
  if (!hasMain && vegCount >= 2 && ings.length <= 5) return '副菜'
  if (hasMain) return '主菜'
  if (hasStaple) return '主食'
  return '主菜'
}

export function enrichDishRole(recipe: Recipe): Recipe {
  return {
    ...recipe,
    dishRole: recipe.dishRole ?? detectDishRole(recipe),
  }
}

export function recipesByRole(recipes: Recipe[], role: DishRole): Recipe[] {
  return recipes.filter((r) => (r.dishRole ?? detectDishRole(r)) === role)
}
