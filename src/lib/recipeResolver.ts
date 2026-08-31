import { getRecipeById as getBuiltinRecipeById } from '../data/recipes'
import type { Recipe } from '../types'

export function resolveRecipe(id: string, customRecipes: Recipe[] = []): Recipe | undefined {
  return customRecipes.find((r) => r.id === id) ?? getBuiltinRecipeById(id)
}
