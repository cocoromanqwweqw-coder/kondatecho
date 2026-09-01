import type { Recipe } from '../types'
import type { RecipeSearchIndexEntry } from './recipeSearchIndex'

let liveRecipes: Recipe[] | null = null
let liveIndex: RecipeSearchIndexEntry[] | null = null
let revision = 0
const listeners = new Set<() => void>()

export function getLiveRecipes(): Recipe[] | null {
  return liveRecipes
}

export function getLiveIndex(): RecipeSearchIndexEntry[] | null {
  return liveIndex
}

export function getRecipeCatalogRevision(): number {
  return revision
}

export function setLiveCatalog(
  recipes: Recipe[],
  index: RecipeSearchIndexEntry[]
): void {
  liveRecipes = recipes
  liveIndex = index
  revision += 1
  listeners.forEach((fn) => fn())
}

export function subscribeRecipeCatalog(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange)
  return () => {
    listeners.delete(onStoreChange)
  }
}
