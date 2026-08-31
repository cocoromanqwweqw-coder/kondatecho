import type { Recipe } from '../types'
import {
  buildJapaneseSearchVariants,
  expandIngredientQuery,
  normalizeProlongedSound,
} from './japaneseText'

export interface RecipeSearchIndexEntry {
  recipe: Recipe
  textVariants: string[]
  ingredientVariantGroups: string[][]
}

function variantsForText(text: string): string[] {
  return buildJapaneseSearchVariants(text)
    .map(normalizeProlongedSound)
    .filter((v): v is string => Boolean(v))
}

export function buildRecipeSearchIndex(recipes: Recipe[]): RecipeSearchIndexEntry[] {
  return recipes.map((recipe) => {
    const textVariants = new Set<string>()
    for (const field of [recipe.name, recipe.description]) {
      for (const v of variantsForText(field)) {
        if (v) textVariants.add(v)
      }
    }
    const ingredientVariantGroups = recipe.ingredients.map((ing) =>
      variantsForText(ing).filter(Boolean)
    )
    for (const group of ingredientVariantGroups) {
      for (const v of group) textVariants.add(v)
    }
    return {
      recipe,
      textVariants: [...textVariants],
      ingredientVariantGroups,
    }
  })
}

function queryVariants(query: string): string[] {
  return expandIngredientQuery(query)
    .map(normalizeProlongedSound)
    .filter((v): v is string => Boolean(v))
}

function splitSearchTerms(query: string): string[] {
  return query
    .trim()
    .split(/[\s,、，+/／]+/)
    .map((term) => term.trim())
    .filter(Boolean)
}

function entryMatchesIngredientTerm(
  entry: RecipeSearchIndexEntry,
  term: string
): boolean {
  const qs = queryVariants(term)
  if (qs.length === 0) return true
  return entry.ingredientVariantGroups.some((group) =>
    qs.some((q) => group.some((v) => v.includes(q)))
  )
}

export function indexMatchesText(entry: RecipeSearchIndexEntry, query: string): boolean {
  const terms = splitSearchTerms(query)
  if (terms.length === 0) return true
  return terms.every((term) => {
    const qs = queryVariants(term)
    return qs.some((q) => entry.textVariants.some((v) => v.includes(q)))
  })
}

export function indexMatchesIngredient(entry: RecipeSearchIndexEntry, query: string): boolean {
  const terms = splitSearchTerms(query)
  if (terms.length === 0) return true
  return terms.every((term) => entryMatchesIngredientTerm(entry, term))
}

export function filterIndexedRecipes(
  index: RecipeSearchIndexEntry[],
  options: { query?: string; ingredient?: string }
): Recipe[] {
  return index
    .filter((entry) => {
      if (options.query && !indexMatchesText(entry, options.query)) return false
      if (options.ingredient && !indexMatchesIngredient(entry, options.ingredient)) {
        return false
      }
      return true
    })
    .map((entry) => entry.recipe)
}
