import { useMemo, useState } from 'react'
import type { useAppState } from '../hooks/useAppState'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { searchRecipes } from '../data/recipes'
import { DISH_ROLE_EMOJI, GENRES } from '../types'
import { getInventoryUsageCount, getMissingIngredients } from '../lib/mealPlanner'
import { matchesIngredientSearch } from '../lib/japaneseText'
import { enrichDishRole } from '../lib/dishRole'

type App = ReturnType<typeof useAppState>

interface Props {
  app: App
  initialQuery?: string
  onBackToPlan?: () => void
}

function sortRecipes(
  recipes: ReturnType<typeof searchRecipes>,
  inventoryNames: string[],
  favoriteRecipeIds: string[]
) {
  return [...recipes].sort((a, b) => {
    const scoreA =
      getInventoryUsageCount(a, inventoryNames) * 10 +
      (favoriteRecipeIds.includes(a.id) ? 100 : 0)
    const scoreB =
      getInventoryUsageCount(b, inventoryNames) * 10 +
      (favoriteRecipeIds.includes(b.id) ? 100 : 0)
    if (scoreB !== scoreA) return scoreB - scoreA
    return a.name.localeCompare(b.name, 'ja')
  })
}

export function RecipeSearch({
  app,
  initialQuery = '',
  onBackToPlan,
}: Props) {
  const { state, toggleFavorite, togglePreferredGenre, addToStaging } = app
  const [genre, setGenre] = useState<string>('すべて')
  const [query, setQuery] = useState(initialQuery)
  const [ingredientFilter, setIngredientFilter] = useState('')
  const debouncedQuery = useDebouncedValue(query)
  const debouncedIngredient = useDebouncedValue(ingredientFilter)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [lastStagedId, setLastStagedId] = useState<string | null>(null)

  const inventoryNames = useMemo(
    () => state.inventory.map((i) => i.name),
    [state.inventory]
  )

  const results = useMemo(
    () =>
      searchRecipes({
        genre: genre === 'すべて' ? undefined : genre,
        query: debouncedQuery || undefined,
        ingredient: debouncedIngredient || undefined,
      }),
    [genre, debouncedQuery, debouncedIngredient]
  )

  const sorted = useMemo(
    () => sortRecipes(results, inventoryNames, state.favoriteRecipeIds),
    [results, inventoryNames, state.favoriteRecipeIds]
  )

  const handleAddToStaging = (recipe: ReturnType<typeof searchRecipes>[number]) => {
    const enriched = enrichDishRole(recipe)
    addToStaging(recipe.id, enriched.dishRole ?? '主菜')
    setLastStagedId(recipe.id)
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-amber-900">
              📦 一時置き場
            </p>
            <p className="mt-0.5 text-xs text-amber-800/90">
              選んだレシピを週間献立の一時置き場へ送れます（{state.stagedRecipes.length}件）
            </p>
          </div>
          {onBackToPlan && (
            <button
              type="button"
              onClick={onBackToPlan}
              className="shrink-0 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-orange-600 transition"
            >
              週間献立へ戻る
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm border border-orange-100">
        <h2 className="text-base font-bold text-gray-800 mb-0.5">レシピ検索</h2>
        <p className="text-xs text-gray-500 mb-3">
          レシピを選んで一時置き場へ送ってから、週間献立で配置できます。❤️で献立優先
        </p>

        <div className="space-y-2.5">
          <div>
            <label className="text-[10px] font-medium text-gray-500 mb-1 block">ジャンル</label>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setGenre('すべて')}
                className={`px-2.5 py-1 text-xs rounded-full border transition ${
                  genre === 'すべて'
                    ? 'bg-orange-500 text-white border-orange-500'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'
                }`}
              >
                すべて
              </button>
              {GENRES.map((g) => (
                <button
                  key={g}
                  onClick={() => setGenre(g)}
                  className={`px-2.5 py-1 text-xs rounded-full border transition ${
                    genre === g
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-medium text-gray-500 mb-1 block">
              好みジャンル（自動生成時優先）
            </label>
            <div className="flex flex-wrap gap-1.5">
              {GENRES.map((g) => (
                <button
                  key={g}
                  onClick={() => togglePreferredGenre(g)}
                  className={`px-2.5 py-1 text-xs rounded-full border transition ${
                    state.preferredGenres.includes(g)
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                  }`}
                >
                  {state.preferredGenres.includes(g) ? '✓' : ''}{g}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-1.5">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="料理名"
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
            <input
              type="text"
              value={ingredientFilter}
              onChange={(e) => setIngredientFilter(e.target.value)}
              placeholder="食材（スペース区切りで全部含む）"
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-500 px-1">{sorted.length} 件</p>

      <div className="space-y-1">
        {sorted.map((recipe) => {
          const enriched = enrichDishRole(recipe)
          const usage = getInventoryUsageCount(recipe, inventoryNames)
          const missing = getMissingIngredients(recipe, inventoryNames)
          const isWant = state.favoriteRecipeIds.includes(recipe.id)
          const expanded = expandedId === recipe.id
          const justStaged = lastStagedId === recipe.id

          return (
            <div
              key={recipe.id}
              className={`bg-white rounded-xl border transition ${
                justStaged
                  ? 'border-amber-400 bg-amber-50/40'
                  : isWant
                    ? 'border-green-300 bg-green-50/30'
                    : 'border-orange-100'
              }`}
            >
              <div className="flex items-center gap-2 px-2.5 py-2">
                <button
                  type="button"
                  onClick={() => toggleFavorite(recipe.id)}
                  className={`text-base shrink-0 leading-none ${isWant ? '' : 'opacity-30 grayscale'}`}
                  title="お気に入り"
                >
                  ❤️
                </button>
                <button
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : recipe.id)}
                  className="flex-1 min-w-0 text-left"
                >
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-medium text-gray-800 truncate">{recipe.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded shrink-0">
                      {recipe.genre}
                    </span>
                    <span className="text-[10px] text-gray-400 shrink-0">
                      {recipe.cookingTime}分
                    </span>
                    {usage > 0 && inventoryNames.length > 0 && (
                      <span className="text-[10px] text-green-600 shrink-0">
                        在庫{usage}/{recipe.ingredients.length}
                      </span>
                    )}
                    {justStaged && (
                      <span className="text-[10px] text-amber-700 shrink-0">✓ 置き場へ追加</span>
                    )}
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddToStaging(recipe)}
                  className="shrink-0 rounded-lg border border-amber-300 bg-amber-50 px-2 py-1 text-[10px] font-medium text-amber-900 hover:bg-amber-100 transition"
                  title={`${DISH_ROLE_EMOJI[enriched.dishRole ?? '主菜']} ${enriched.dishRole ?? '主菜'}として一時置き場へ`}
                >
                  📦 置き場へ
                </button>
                <button
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : recipe.id)}
                  className="text-gray-400 text-xs shrink-0 w-5"
                  aria-label={expanded ? '閉じる' : '詳細'}
                >
                  {expanded ? '▲' : '▼'}
                </button>
              </div>

              {expanded && (
                <div className="px-2.5 pb-2.5 pt-0 border-t border-gray-50 ml-8">
                  <p className="text-xs text-gray-500 mb-1.5">{recipe.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {recipe.ingredients.map((ing) => {
                      const inStock = inventoryNames.some(
                        (s) =>
                          matchesIngredientSearch(s, ing) ||
                          matchesIngredientSearch(ing, s)
                      )
                      return (
                        <span
                          key={ing}
                          className={`text-[10px] px-1.5 py-0.5 rounded ${
                            inStock
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {inStock ? '✓' : ''}{ing}
                        </span>
                      )
                    })}
                  </div>
                  {missing.length > 0 && inventoryNames.length > 0 && (
                    <p className="text-[10px] text-amber-600 mt-1.5">
                      不足: {missing.join('、')}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => handleAddToStaging(recipe)}
                    className="mt-2 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-600 transition"
                  >
                    📦 一時置き場へ送る（{DISH_ROLE_EMOJI[enriched.dishRole ?? '主菜']}{' '}
                    {enriched.dishRole ?? '主菜'}）
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
