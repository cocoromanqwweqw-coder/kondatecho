import { resolveRecipe } from './recipeResolver'
import type { AppState, DishRole, HealthTag, Recipe } from '../types'
import { DAYS, DISH_ROLES } from '../types'
import {
  getCandidateRecipes,
  getMissingIngredients,
  getRecipeDuplicateKey,
  getSlot,
  ingredientMatch,
} from './mealPlanner'
import { enrichRecipeHealth } from './recipeHealth'
import { getRecipeLinks } from './recipeLinks'

const MEAL = '夜' as const

export type NutrientKey =
  | 'たんぱく質'
  | '野菜・食物繊維'
  | 'カルシウム'
  | '鉄分'
  | 'ビタミンC'
  | '炭水化物'

export interface NutritionEstimate {
  calories: number
  proteinG: number
  fatG: number
  carbsG: number
  saltG: number
  sugarG: number
  fiberHint: number
  calciumHint: number
  ironHint: number
  vitaminCHint: number
}

export interface DayInsight {
  recipes: { role: DishRole; recipe: Recipe | undefined }[]
  filled: number
  emptyRoles: DishRole[]
  totalMinutes: number
  parallelHint: string
  difficultyBias: string | null
  nutrition: NutritionEstimate
  pfc: { proteinPct: number; fatPct: number; carbsPct: number }
  /** カロリー計算にご飯を含めているか */
  riceIncluded: boolean
  /** ご飯分を加算したか */
  riceAddedToNutrition: boolean
  missingNutrients: NutrientKey[]
  healthTags: HealthTag[]
  missingIngredients: string[]
  wantToUseHits: { name: string; inRecipes: string[] }[]
  genreBias: string | null
  duplicateRecipes: { recipeId: string; name: string; otherDays: number[] }[]
  prepTips: string[]
  suggestFill: { role: DishRole; recipe: Recipe }[]
  links: { recipeName: string; label: string; url: string }[]
}

const PROTEIN_KW = [
  '鶏', '豚', '牛', '卵', '豆腐', '厚揚げ', 'エビ', 'サーモン', 'サバ', 'イワシ',
  'ツナ', '白身魚', '合い挽き', '納豆', 'チーズ', 'ヨーグルト', '牛乳',
]
const VEG_KW = [
  '玉ねぎ', 'にんじん', 'キャベツ', 'ピーマン', 'トマト', 'なす', '白菜',
  'ほうれん草', 'もやし', 'ブロッコリー', 'きゅうり', '大根', 'ごぼう', 'レタス',
  'きのこ', 'わかめ', 'ねぎ', 'パプリカ', 'オクラ', 'アスパラ', '小松菜',
]
const CARB_KW = ['ご飯', '米', 'パン', 'パスタ', 'うどん', 'ラーメン', 'そば', 'じゃがいも', '餅', '麺']
const FAT_KW = ['油', 'バター', 'アボカド', 'ナッツ', 'チーズ', 'ごま油', 'マヨ', '生クリーム']
const CALCIUM_KW = ['牛乳', 'ヨーグルト', 'チーズ', '小松菜', '豆腐', 'しらす', 'わかめ', 'ごま']
const IRON_KW = ['レバー', 'ほうれん草', 'あさり', '牛肉', '納豆', 'ひじき']
const VITC_KW = ['レモン', 'オレンジ', 'ブロッコリー', 'ピーマン', 'キウイ', 'いちご', 'キャベツ']
const SALT_KW = ['醤油', '塩', '味噌', 'めんつゆ', 'コンソメ', 'ケチャップ', 'ソース', 'ハム']
const SUGAR_KW = ['砂糖', 'みりん', 'はちみつ', 'ケチャップ', 'あん', 'ジャム']

/** 茶碗1杯（約150g）の目安 */
export const RICE_BOWL_NUTRITION: NutritionEstimate = {
  calories: 250,
  proteinG: 4,
  fatG: 1,
  carbsG: 55,
  saltG: 0,
  sugarG: 0,
  fiberHint: 0,
  calciumHint: 0,
  ironHint: 0,
  vitaminCHint: 0,
}

function hasAny(ings: string[], kws: string[]): boolean {
  return ings.some((i) => kws.some((k) => i.includes(k)))
}

function countAny(ings: string[], kws: string[]): number {
  return ings.filter((i) => kws.some((k) => i.includes(k))).length
}

function sumNutrition(estimates: NutritionEstimate[]): NutritionEstimate {
  const base: NutritionEstimate = {
    calories: 0,
    proteinG: 0,
    fatG: 0,
    carbsG: 0,
    saltG: 0,
    sugarG: 0,
    fiberHint: 0,
    calciumHint: 0,
    ironHint: 0,
    vitaminCHint: 0,
  }
  for (const e of estimates) {
    base.calories += e.calories
    base.proteinG += e.proteinG
    base.fatG += e.fatG
    base.carbsG += e.carbsG
    base.saltG += e.saltG
    base.sugarG += e.sugarG
    base.fiberHint += e.fiberHint
    base.calciumHint += e.calciumHint
    base.ironHint += e.ironHint
    base.vitaminCHint += e.vitaminCHint
  }
  return {
    calories: Math.round(base.calories),
    proteinG: Math.round(base.proteinG),
    fatG: Math.round(base.fatG),
    carbsG: Math.round(base.carbsG),
    saltG: Math.round(base.saltG * 10) / 10,
    sugarG: Math.round(base.sugarG),
    fiberHint: base.fiberHint,
    calciumHint: base.calciumHint,
    ironHint: base.ironHint,
    vitaminCHint: base.vitaminCHint,
  }
}

/** 献立に主食・麺類などの炭水化物が既に含まれるか */
export function planIncludesStapleCarbs(recipes: Recipe[]): boolean {
  return recipes.some((recipe) => {
    if (recipe.dishRole === '主食') return true
    return hasAny(recipe.ingredients, CARB_KW)
  })
}

/** ご飯をカロリーに含めるか（未設定時はご飯あり） */
export function resolveDayRiceIncluded(
  state: AppState,
  dayIndex: number,
  _filledRecipes: Recipe[]
): boolean {
  const explicit = state.dayRiceIncluded?.[dayIndex]
  if (explicit !== undefined) return explicit
  return true
}

export function applyRiceToNutrition(
  nutrition: NutritionEstimate,
  includeRice: boolean
): { nutrition: NutritionEstimate; riceAdded: boolean } {
  if (!includeRice) {
    return { nutrition, riceAdded: false }
  }
  return {
    nutrition: sumNutrition([nutrition, RICE_BOWL_NUTRITION]),
    riceAdded: true,
  }
}

export function estimateDayNutrition(state: AppState, dayIndex: number): NutritionEstimate {
  const filledRecipes = DISH_ROLES.flatMap((role) => {
    const slot = getSlot(state.weeklyPlan, dayIndex, MEAL, role)
    const raw = slot ? resolveRecipe(slot.recipeId, state.customRecipes) : undefined
    return raw ? [enrichRecipeHealth(raw)] : []
  })
  const base = sumNutrition(filledRecipes.map(estimateRecipeNutrition))
  const includeRice = resolveDayRiceIncluded(state, dayIndex, filledRecipes)
  return applyRiceToNutrition(base, includeRice).nutrition
}

function calcPfc(nutrition: NutritionEstimate): DayInsight['pfc'] {
  const proteinCal = nutrition.proteinG * 4
  const fatCal = nutrition.fatG * 9
  const carbsCal = nutrition.carbsG * 4
  const total = proteinCal + fatCal + carbsCal || 1
  return {
    proteinPct: Math.round((proteinCal / total) * 100),
    fatPct: Math.round((fatCal / total) * 100),
    carbsPct: Math.round((carbsCal / total) * 100),
  }
}

export function estimateRecipeNutrition(recipe: Recipe): NutritionEstimate {
  const ings = recipe.ingredients
  const role = recipe.dishRole ?? '主菜'
  const tags = recipe.healthTags ?? []

  let calories = role === '主食' ? 280 : role === '主菜' ? 320 : 120
  let proteinG = role === '主菜' ? 18 : role === '主食' ? 6 : 4
  let fatG = role === '主菜' ? 14 : role === '副菜' ? 5 : 3
  let carbsG = role === '主食' ? 55 : role === '主菜' ? 12 : 10
  let saltG = 1.2
  let sugarG = 2
  let fiberHint = countAny(ings, VEG_KW)
  let calciumHint = countAny(ings, CALCIUM_KW)
  let ironHint = countAny(ings, IRON_KW)
  let vitaminCHint = countAny(ings, VITC_KW)

  if (hasAny(ings, PROTEIN_KW)) {
    proteinG += 10
    calories += 60
  }
  if (hasAny(ings, CARB_KW)) {
    carbsG += 25
    calories += 100
  }
  if (hasAny(ings, FAT_KW)) {
    fatG += 8
    calories += 70
  }
  if (hasAny(ings, VEG_KW)) {
    calories += 20
    fiberHint += 1
  }
  saltG += countAny(ings, SALT_KW) * 0.6
  sugarG += countAny(ings, SUGAR_KW) * 1.5

  if (tags.includes('低カロリー')) calories = Math.round(calories * 0.75)
  if (tags.includes('高タンパク')) proteinG += 8
  if (tags.includes('低糖質')) {
    carbsG = Math.round(carbsG * 0.55)
    sugarG = Math.round(sugarG * 0.6)
  }

  return {
    calories: Math.round(calories),
    proteinG: Math.round(proteinG),
    fatG: Math.round(fatG),
    carbsG: Math.round(carbsG),
    saltG: Math.round(saltG * 10) / 10,
    sugarG: Math.round(sugarG),
    fiberHint,
    calciumHint,
    ironHint,
    vitaminCHint,
  }
}

export function formatOtherDays(dayIndexes: number[]): string {
  const unique = [...new Set(dayIndexes)].sort((a, b) => a - b)
  return unique.map((i) => DAYS[i]).join('・')
}

export function buildDayInsight(state: AppState, dayIndex: number): DayInsight {
  const inventoryNames = state.inventory.map((i) => i.name)

  const recipes: DayInsight['recipes'] = DISH_ROLES.map((role) => {
    const slot = getSlot(state.weeklyPlan, dayIndex, MEAL, role)
    const raw = slot ? resolveRecipe(slot.recipeId, state.customRecipes) : undefined
    const recipe = raw ? enrichRecipeHealth(raw) : undefined
    return { role, recipe }
  })

  const filledRecipes = recipes.flatMap((entry) => (entry.recipe ? [entry.recipe] : []))
  const filled = filledRecipes.length
  const emptyRoles = recipes.filter((entry) => !entry.recipe).map((entry) => entry.role)

  const totalMinutes = filledRecipes.reduce((sum, recipe) => sum + recipe.cookingTime, 0)
  const maxMinutes = filledRecipes.length > 0 ? Math.max(...filledRecipes.map((r) => r.cookingTime)) : 0
  const parallelHint =
    filled >= 2 && totalMinutes > maxMinutes + 10
      ? `並行調理なら約${maxMinutes}分`
      : filled > 0
        ? `順番に作ると約${totalMinutes}分`
        : 'レシピを選ぶと目安が出ます'

  const hardCount = filledRecipes.filter((r) => r.difficulty === 'やや手間').length
  const easyCount = filledRecipes.filter((r) => r.difficulty === '簡単').length
  let difficultyBias: string | null = null
  if (hardCount >= 2) difficultyBias = 'やや手間なメニューが多め'
  else if (filled > 0 && easyCount === filled) difficultyBias = 'さっと作れそう'

  const nutritionBase = sumNutrition(filledRecipes.map(estimateRecipeNutrition))
  const riceIncluded = resolveDayRiceIncluded(state, dayIndex, filledRecipes)
  const { nutrition, riceAdded } = applyRiceToNutrition(nutritionBase, riceIncluded)
  const pfc = calcPfc(nutrition)

  const missingNutrients: NutrientKey[] = []
  if (filled > 0) {
    if (nutrition.proteinG < 20) missingNutrients.push('たんぱく質')
    if (nutrition.fiberHint < 2) missingNutrients.push('野菜・食物繊維')
    if (nutrition.calciumHint < 1) missingNutrients.push('カルシウム')
    if (nutrition.ironHint < 1) missingNutrients.push('鉄分')
    if (nutrition.vitaminCHint < 1) missingNutrients.push('ビタミンC')
    const hasStaple = recipes.some((entry) => entry.role === '主食' && entry.recipe)
    if (!hasStaple && !riceIncluded && nutrition.carbsG < 35) {
      missingNutrients.push('炭水化物')
    }
  }

  const healthTags = [...new Set(filledRecipes.flatMap((recipe) => recipe.healthTags ?? []))]

  const missingIngredients = [
    ...new Set(filledRecipes.flatMap((recipe) => getMissingIngredients(recipe, inventoryNames))),
  ]

  const wantToUseHits = state.inventory
    .filter((item) => item.wantToUse)
    .map((item) => ({
      name: item.name,
      inRecipes: filledRecipes
        .filter((recipe) =>
          recipe.ingredients.some((ing) => ingredientMatch(ing, item.name))
        )
        .map((recipe) => recipe.name),
    }))
    .filter((hit) => hit.inRecipes.length > 0)

  const genres = filledRecipes.map((recipe) => recipe.genre)
  const genreBias =
    genres.length > 0 && genres.every((genre) => genre === genres[0]) ? genres[0] : null

  const duplicateRecipes: DayInsight['duplicateRecipes'] = []
  for (const recipe of filledRecipes) {
    const key = getRecipeDuplicateKey(recipe.name)
    const otherDays = [
      ...new Set(
        state.weeklyPlan
          .filter((slot) => {
            if (slot.dayIndex === dayIndex) return false
            const other = resolveRecipe(slot.recipeId, state.customRecipes ?? [])
            return other != null && getRecipeDuplicateKey(other.name) === key
          })
          .map((slot) => slot.dayIndex)
      ),
    ]
    if (otherDays.length > 0) {
      duplicateRecipes.push({ recipeId: recipe.id, name: recipe.name, otherDays })
    }
  }

  const prepTips: string[] = []
  if (filled >= 2 && totalMinutes > maxMinutes + 10) {
    prepTips.push('副菜や汁物は主菜と並行して進められます')
  }
  if (difficultyBias) prepTips.push(difficultyBias)
  if (totalMinutes >= 60) prepTips.push('時間に余裕のある日がおすすめです')
  const longest = filledRecipes.find((recipe) => recipe.cookingTime >= 40)
  if (longest) prepTips.push(`${longest.name}は先に下ごしらえを`)

  const usedIds = new Set(state.weeklyPlan.map((slot) => slot.recipeId))
  const usedDuplicateKeys = new Set(
    state.weeklyPlan
      .map((slot) => resolveRecipe(slot.recipeId, state.customRecipes ?? []))
      .filter((r): r is Recipe => !!r)
      .map((r) => getRecipeDuplicateKey(r.name))
  )
  const suggestFill: DayInsight['suggestFill'] = []
  for (const role of emptyRoles) {
    const candidate = getCandidateRecipes(role, state, dayIndex, 8).find(
      (recipe) =>
        !usedIds.has(recipe.id) &&
        !usedDuplicateKeys.has(getRecipeDuplicateKey(recipe.name))
    )
    if (candidate) {
      suggestFill.push({ role, recipe: enrichRecipeHealth(candidate) })
    }
  }

  const links = filledRecipes.flatMap((recipe) =>
    getRecipeLinks(recipe).map((link) => ({
      recipeName: recipe.name,
      label: link.label,
      url: link.url,
    }))
  )

  return {
    recipes,
    filled,
    emptyRoles,
    totalMinutes,
    parallelHint,
    difficultyBias,
    nutrition,
    pfc,
    riceIncluded,
    riceAddedToNutrition: riceAdded,
    missingNutrients,
    healthTags,
    missingIngredients,
    wantToUseHits,
    genreBias,
    duplicateRecipes,
    prepTips,
    suggestFill,
    links,
  }
}
