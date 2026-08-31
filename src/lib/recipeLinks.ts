import type { Recipe, RecipeLink } from '../types'

export function getRecipeLinks(recipe: Pick<Recipe, 'name' | 'links'>): RecipeLink[] {
  if (recipe.links && recipe.links.length > 0) {
    return recipe.links
  }

  const name = encodeURIComponent(recipe.name)
  const howTo = encodeURIComponent(`${recipe.name} 作り方`)

  return [
    { label: 'クックパッド', url: `https://cookpad.com/search/${name}` },
    { label: 'YouTube', url: `https://www.youtube.com/results?search_query=${howTo}` },
    { label: 'Google', url: `https://www.google.com/search?q=${howTo}` },
  ]
}

/** 人気レシピ用：同名検索に加え、よく見られるキーワード付きリンク */
export function withTrendingLinks<T extends Pick<Recipe, 'name' | 'links'>>(
  recipe: T
): T & { links: RecipeLink[] } {
  const name = encodeURIComponent(recipe.name)
  const howTo = encodeURIComponent(`${recipe.name} 作り方 人気`)

  return {
    ...recipe,
    links: [
      { label: 'クックパッド', url: `https://cookpad.com/search/${name}` },
      { label: 'YouTube', url: `https://www.youtube.com/results?search_query=${howTo}` },
      { label: 'DELISH', url: `https://delishkitchen.tv/search?q=${name}` },
    ],
  }
}
