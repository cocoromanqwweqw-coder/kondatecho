import type { HealthTag, Recipe } from '../types'

const GLUTEN = [
  '小麦粉', 'パン', 'パスタ', 'スパゲッティ', 'うどん', 'ラーメン', '焼きそば', 'ピザ',
  '春巻き', 'トルティーヤ', '餃子', 'マカロニ', 'ラザニア', '中華麺', 'フォー麺',
  'ビーフン', '春巻きの皮', 'ピザ生地', 'ラザニアシート', '焼きそば麺', 'ライスペーパー',
]

const PROCESSED = [
  'カレールー', 'ソーセージ', 'スパム', 'ソース', 'ケチャップ', 'ハム', 'ベーコン',
  'マヨネーズ', 'チューブ', '素', 'インスタント', '缶', '加工',
]

const CARBS = [
  'ご飯', 'パン', 'パスタ', 'スパゲッティ', 'うどん', 'ラーメン', 'マカロニ',
  'トルティーヤ', 'トッポキ', '餅', 'ピザ', '春巻きの皮', '中華麺', 'フォー麺',
]

const PROTEIN = [
  '鶏', '豚', '牛', '卵', '豆腐', '厚揚げ', 'エビ', 'サーモン', 'サバ', 'イワシ',
  'ツナ', '白身魚', '合い挽き', '鶏ひき', '鶏もも', '鶏胸', 'さけ', '鮭',
]

const VEGETABLES = [
  '玉ねぎ', 'にんじん', 'じゃがいも', 'キャベツ', 'ピーマン', 'トマト', 'なす',
  '白菜', 'ほうれん草', 'もやし', 'ブロッコリー', 'きゅうり', '大根', 'ごぼう',
  'れんこん', 'アスパラ', 'レタス', 'アボカド', 'きのこ', 'しいたけ', 'わかめ',
  '長ねぎ', 'ねぎ', 'パプリカ', 'ズッキーニ', '豆', 'コーン',
]

const OIL_HEAVY = ['揚げ', 'フライ', '唐揚', '天ぷら', 'からあげ']

function countMatch(ingredients: string[], keywords: string[]): number {
  return ingredients.filter((ing) => keywords.some((k) => ing.includes(k))).length
}

/** 材料から健康タグを自動判定（元データ全件に適用） */
export function detectHealthTags(recipe: Pick<Recipe, 'name' | 'ingredients' | 'cookingTime' | 'difficulty'>): HealthTag[] {
  const tags: HealthTag[] = []
  const ings = recipe.ingredients
  const text = `${recipe.name} ${ings.join(' ')}`

  const hasGluten = ings.some((i) => GLUTEN.some((g) => i.includes(g)))
  if (!hasGluten) tags.push('グルテンフリー')

  const hasProcessed = ings.some((i) => PROCESSED.some((p) => i.includes(p)))
  if (!hasProcessed) tags.push('添加物なし')

  const hasCarbs = ings.some((i) => CARBS.some((c) => i.includes(c)))
  if (!hasCarbs) tags.push('低糖質')

  if (recipe.cookingTime <= 20 && recipe.difficulty === '簡単') {
    tags.push('低カロリー')
  }

  if (countMatch(ings, VEGETABLES) >= 3) tags.push('野菜多め')

  if (ings.some((i) => PROTEIN.some((p) => i.includes(p)))) tags.push('高タンパク')

  if (!OIL_HEAVY.some((o) => text.includes(o)) && !ings.includes('揚げ油')) {
    tags.push('オイル控えめ')
  }

  return tags
}

export function enrichRecipeHealth(recipe: Recipe): Recipe {
  const auto = detectHealthTags(recipe)
  const merged = [...new Set([...(recipe.healthTags ?? []), ...auto])]
  return { ...recipe, healthTags: merged }
}

export function isHealthRecipe(recipe: Recipe): boolean {
  return (recipe.healthTags?.length ?? 0) >= 2 || recipe.id.startsWith('h')
}

export function matchesHealthFilter(recipe: Recipe, tags: HealthTag[]): boolean {
  if (tags.length === 0) return isHealthRecipe(recipe)
  const recipeTags = recipe.healthTags ?? []
  return tags.every((t) => recipeTags.includes(t))
}

export function getHealthScore(recipe: Recipe): number {
  return recipe.healthTags?.length ?? 0
}
