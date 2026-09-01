import { getRecipes, getRecipeSearchIndex } from '../data/recipes'
import { matchesIngredientSearch } from './japaneseText'
import {
  buildRecipeSearchIndex,
  indexMatchesIngredient,
  indexMatchesText,
} from './recipeSearchIndex'
import type { AppState, DishRole, Genre, MealType, PlannedMeal, Recipe } from '../types'
import { DAYS, DISH_ROLES, MEAL_TYPES } from '../types'

interface ScoreContext {
  inventoryNames: string[]
  wantToUseInventory: string[]
  favoriteRecipeIds: string[]
  usedRecipeIds: Set<string>
  usedDuplicateKeys: Set<string>
  preferredGenres: Genre[]
  dayIndex: number
}

function ingredientMatch(recipeIng: string, stockName: string): boolean {
  return (
    matchesIngredientSearch(recipeIng, stockName) ||
    matchesIngredientSearch(stockName, recipeIng)
  )
}

function scoreRecipe(recipe: Recipe, ctx: ScoreContext): number {
  let score = 0

  for (const ing of recipe.ingredients) {
    for (const stock of ctx.inventoryNames) {
      if (ingredientMatch(ing, stock)) {
        score += 10
        if (ctx.wantToUseInventory.some((w) => ingredientMatch(ing, w))) {
          score += 25
        }
      }
    }
  }

  if (ctx.favoriteRecipeIds.includes(recipe.id)) score += 50
  if (recipe.trending) score += 40
  if (recipe.difficulty === '簡単') score += 12
  if (recipe.cookingTime <= 20) score += 8
  if (ctx.preferredGenres.length > 0 && ctx.preferredGenres.includes(recipe.genre)) score += 15
  if (ctx.usedRecipeIds.has(recipe.id) || ctx.usedDuplicateKeys.has(duplicateKeyForRecipe(recipe)))
    score -= 200

  const sameGenreCount = [...ctx.usedRecipeIds].filter((id) => {
    const r = getRecipes().find((x) => x.id === id)
    return r?.genre === recipe.genre
  }).length
  if (sameGenreCount >= 2) score -= 10

  if (ctx.dayIndex >= 5 && recipe.difficulty === 'やや手間') score += 5
  if (ctx.dayIndex < 5 && recipe.cookingTime <= 20) score += 8

  score += Math.random() * 5
  return score
}

function pickForRole(
  role: DishRole,
  candidates: Recipe[],
  ctx: ScoreContext
): Recipe | undefined {
  const pool = candidates.filter((r) => r.dishRole === role)
  const list = pool.length > 0 ? pool : candidates
  const unused = list.filter((r) => !isDuplicateRecipe(r, ctx))
  if (unused.length === 0) return undefined

  const scored = unused
    .map((recipe) => ({ recipe, score: scoreRecipe(recipe, ctx) }))
    .sort((a, b) => b.score - a.score)
  const topN = scored.slice(0, 8)
  return topN[Math.floor(Math.random() * Math.min(4, topN.length))]?.recipe
}

function mealSlotKey(dayIndex: number, mealType: MealType, dishRole: DishRole): string {
  return `${dayIndex}-${mealType}-${dishRole}`
}

/** 「マッシュポテト（ピリ辛）」→「マッシュポテト」のようにバリエーションを同一視 */
export function getRecipeDuplicateKey(name: string): string {
  return name.replace(/[（(][^）)]*[）)]/g, '').trim()
}

function duplicateKeyForRecipe(recipe: Recipe): string {
  return getRecipeDuplicateKey(recipe.name)
}

function duplicateKeyForRecipeId(recipeId: string): string {
  const recipe = getRecipes().find((r) => r.id === recipeId)
  return recipe ? duplicateKeyForRecipe(recipe) : recipeId
}

function isDuplicateRecipe(recipe: Recipe, ctx: ScoreContext): boolean {
  return (
    ctx.usedRecipeIds.has(recipe.id) ||
    ctx.usedDuplicateKeys.has(duplicateKeyForRecipe(recipe))
  )
}

/** 主食・主菜・副菜の3スロット×夜×7日を自動生成（手動スロットは維持・週内重複なし） */
export function generateWeeklyPlan(state: AppState): PlannedMeal[] {
  const manualSlots = state.weeklyPlan.filter((p) => p.manual)
  const lockedKeys = new Set(
    manualSlots.map((p) => mealSlotKey(p.dayIndex, p.mealType, p.dishRole))
  )

  const inventoryNames = state.inventory.map((i) => i.name)
  const wantToUseInventory = state.inventory.filter((i) => i.wantToUse).map((i) => i.name)

  const plan: PlannedMeal[] = manualSlots.map((p) => ({ ...p }))
  const usedRecipeIds = new Set(manualSlots.map((p) => p.recipeId))
  const usedDuplicateKeys = new Set(manualSlots.map((p) => duplicateKeyForRecipeId(p.recipeId)))

  for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
    for (const mealType of MEAL_TYPES) {
      let candidates = getRecipes()
      const disabledGenres = state.dayDisabledGenres[dayIndex] ?? []
      if (disabledGenres.length > 0) {
        const filtered = candidates.filter((r) => !disabledGenres.includes(r.genre))
        if (filtered.length > 0) candidates = filtered
      }
      if (state.preferredGenres.length > 0) {
        const filtered = candidates.filter((r) => state.preferredGenres.includes(r.genre))
        if (filtered.length >= 21) candidates = filtered
      }

      for (const dishRole of DISH_ROLES) {
        if (lockedKeys.has(mealSlotKey(dayIndex, mealType, dishRole))) continue

        const ctx: ScoreContext = {
          inventoryNames,
          wantToUseInventory,
          favoriteRecipeIds: state.favoriteRecipeIds,
          usedRecipeIds,
          usedDuplicateKeys,
          preferredGenres: state.preferredGenres,
          dayIndex,
        }
        const pick = pickForRole(dishRole, candidates, ctx)
        if (pick) {
          plan.push({ dayIndex, mealType, dishRole, recipeId: pick.id })
          usedRecipeIds.add(pick.id)
          usedDuplicateKeys.add(duplicateKeyForRecipe(pick))
        }
      }
    }
  }

  return plan
}

function getCustomRecipesForRole(state: AppState, role: DishRole): Recipe[] {
  return (state.customRecipes ?? []).filter((r) => (r.dishRole ?? '主菜') === role)
}

/** 候補をシャッフルして指定役割のレシピを返す（手動選び用） */
export function getCandidateRecipes(
  role: DishRole,
  state: AppState,
  dayIndex: number,
  limit = 24
): Recipe[] {
  let list = [
    ...getCustomRecipesForRole(state, role),
    ...getRecipes().filter((r) => r.dishRole === role),
  ]
  const disabled = state.dayDisabledGenres[dayIndex] ?? []
  if (disabled.length > 0) {
    const filtered = list.filter((r) => !disabled.includes(r.genre))
    if (filtered.length > 0) list = filtered
  }

  const inventoryNames = state.inventory.map((i) => i.name)
  const wantToUseInventory = state.inventory.filter((i) => i.wantToUse).map((i) => i.name)
  const ctx: ScoreContext = {
    inventoryNames,
    wantToUseInventory,
    favoriteRecipeIds: state.favoriteRecipeIds,
    // 手動候補では配置済みペナルティを付けない（ドロップ後もリストに残す）
    usedRecipeIds: new Set(),
    usedDuplicateKeys: new Set(),
    preferredGenres: state.preferredGenres,
    dayIndex,
  }

  const scored = [...list]
    .map((recipe) => ({ recipe, score: scoreRecipe(recipe, ctx) }))
    .sort((a, b) => b.score - a.score)

  const result: Recipe[] = []
  const seen = new Set<string>()
  for (const { recipe } of scored) {
    if (result.length >= limit) break
    if (seen.has(recipe.id)) continue
    seen.add(recipe.id)
    result.push(recipe)
  }

  // お気に入りは件数制限後も候補に残す
  for (const favId of state.favoriteRecipeIds) {
    if (seen.has(favId)) continue
    const fav =
      list.find((r) => r.id === favId) ??
      (state.customRecipes ?? []).find((r) => r.id === favId)
    if (fav && (fav.dishRole ?? '主菜') === role) {
      seen.add(favId)
      result.push(fav)
    }
  }

  return result
}

/** 複数役割の候補をマージして返す（手動選び用。limit 未指定なら該当レシピを全部） */
export function getCandidateRecipesMulti(
  roles: DishRole[],
  state: AppState,
  dayIndex: number,
  limit = Number.POSITIVE_INFINITY
): Recipe[] {
  if (roles.length === 0) return []
  if (roles.length === 1) return getCandidateRecipes(roles[0], state, dayIndex, limit)

  const orderedRoles = DISH_ROLES.filter((role) => roles.includes(role))
  const perRole = Number.isFinite(limit) ? Math.ceil(limit / orderedRoles.length) : Number.POSITIVE_INFINITY
  const result: Recipe[] = []
  const seen = new Set<string>()

  for (const role of orderedRoles) {
    for (const recipe of getCandidateRecipes(role, state, dayIndex, perRole)) {
      if (seen.has(recipe.id)) continue
      seen.add(recipe.id)
      result.push(recipe)
      if (result.length >= limit) return result
    }
  }

  return result
}

/** 料理名・材料で全レシピから候補を返す（役割フィルターは無視） */
export function searchCandidateRecipes(
  query: string,
  state: AppState,
  dayIndex: number,
  limit = Number.POSITIVE_INFINITY,
  ingredient = ''
): Recipe[] {
  const q = query.trim()
  const ing = ingredient.trim()
  if (!q && !ing) return []

  const searchIndex = [
    ...getRecipeSearchIndex(),
    ...buildRecipeSearchIndex(state.customRecipes ?? []),
  ]

  const seen = new Set<string>()
  let list: Recipe[] = []
  for (const entry of searchIndex) {
    const recipe = entry.recipe
    if (seen.has(recipe.id)) continue
    if (q && !indexMatchesText(entry, q)) continue
    if (ing && !indexMatchesIngredient(entry, ing)) continue
    seen.add(recipe.id)
    list.push(recipe)
  }

  const disabled = state.dayDisabledGenres[dayIndex] ?? []
  if (disabled.length > 0) {
    const filtered = list.filter((r) => !disabled.includes(r.genre))
    if (filtered.length > 0) list = filtered
  }

  const inventoryNames = state.inventory.map((i) => i.name)
  const wantToUseInventory = state.inventory.filter((i) => i.wantToUse).map((i) => i.name)
  const ctx: ScoreContext = {
    inventoryNames,
    wantToUseInventory,
    favoriteRecipeIds: state.favoriteRecipeIds,
    usedRecipeIds: new Set(),
    usedDuplicateKeys: new Set(),
    preferredGenres: state.preferredGenres,
    dayIndex,
  }

  return [...list]
    .map((recipe) => ({ recipe, score: scoreRecipe(recipe, ctx) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ recipe }) => recipe)
}

export function getMissingIngredients(
  recipe: Recipe,
  inventoryNames: string[]
): string[] {
  return recipe.ingredients.filter(
    (ing) => !inventoryNames.some((stock) => ingredientMatch(ing, stock))
  )
}

export function getInventoryUsageCount(recipe: Recipe, inventoryNames: string[]): number {
  return recipe.ingredients.filter((ing) =>
    inventoryNames.some((stock) => ingredientMatch(ing, stock))
  ).length
}

export function getPlanSummary(plan: PlannedMeal[]): string {
  const meals = new Set(plan.map((p) => `${p.dayIndex}-${p.mealType}`)).size
  const unique = new Set(plan.map((p) => p.recipeId)).size
  return `${DAYS.length}日分 ${meals}食・${plan.length}品（${unique}種）`
}

export function getSlot(
  plan: PlannedMeal[],
  dayIndex: number,
  mealType: MealType,
  dishRole: DishRole
): PlannedMeal | undefined {
  return plan.find(
    (p) => p.dayIndex === dayIndex && p.mealType === mealType && p.dishRole === dishRole
  )
}

export { ingredientMatch }
