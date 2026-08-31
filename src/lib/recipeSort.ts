import type { Recipe } from '../types'
import { getInventoryUsageCount } from './mealPlanner'

export type SortMode = 'recommend' | 'trending' | 'inventory' | 'quick'

export const SORT_LABELS: Record<SortMode, string> = {
  recommend: '⭐ おすすめ',
  trending: '🔥 人気順',
  inventory: '🥬 在庫マッチ',
  quick: '⏱ 短時間',
}

function recommendScore(
  recipe: Recipe,
  inventoryNames: string[],
  wantToUseRecipeIds: string[]
): number {
  let score = 0
  if (recipe.trending) score += 1000
  if (wantToUseRecipeIds.includes(recipe.id)) score += 500
  score += getInventoryUsageCount(recipe, inventoryNames) * 80
  if (recipe.difficulty === '簡単') score += 30
  if (recipe.cookingTime <= 15) score += 20
  else if (recipe.cookingTime <= 25) score += 10
  if (recipe.cookingTime >= 60) score -= 40
  return score
}

export function sortRecipesByMode(
  recipes: Recipe[],
  mode: SortMode,
  inventoryNames: string[],
  wantToUseRecipeIds: string[]
): Recipe[] {
  return [...recipes].sort((a, b) => {
    switch (mode) {
      case 'trending': {
        const ta = a.trending ? 1 : 0
        const tb = b.trending ? 1 : 0
        if (tb !== ta) return tb - ta
        return recommendScore(b, inventoryNames, wantToUseRecipeIds) -
          recommendScore(a, inventoryNames, wantToUseRecipeIds)
      }
      case 'inventory': {
        const ia = getInventoryUsageCount(a, inventoryNames)
        const ib = getInventoryUsageCount(b, inventoryNames)
        if (ib !== ia) return ib - ia
        return recommendScore(b, inventoryNames, wantToUseRecipeIds) -
          recommendScore(a, inventoryNames, wantToUseRecipeIds)
      }
      case 'quick': {
        if (a.cookingTime !== b.cookingTime) return a.cookingTime - b.cookingTime
        return recommendScore(b, inventoryNames, wantToUseRecipeIds) -
          recommendScore(a, inventoryNames, wantToUseRecipeIds)
      }
      case 'recommend':
      default: {
        const sa = recommendScore(a, inventoryNames, wantToUseRecipeIds)
        const sb = recommendScore(b, inventoryNames, wantToUseRecipeIds)
        if (sb !== sa) return sb - sa
        return a.name.localeCompare(b.name, 'ja')
      }
    }
  })
}
