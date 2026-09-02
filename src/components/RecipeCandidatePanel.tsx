import { useEffect, useMemo, useRef, useState } from 'react'
import type { AppState, DishRole, Genre, Recipe } from '../types'
import { DAYS, DISH_ROLE_EMOJI, DISH_ROLES, GENRES } from '../types'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { hapticTap } from '../lib/haptic'
import { getCandidateRecipesMulti, searchCandidateRecipes } from '../lib/mealPlanner'
import { RecipePhoto } from './RecipePhoto'

const CANDIDATE_ROW_CLASS = 'h-[3.25rem] shrink-0 snap-start'
const CANDIDATE_ROW_PX = 56
const CANDIDATE_SLIDER_VIEW_CLASS = 'h-[27.75rem]'

export interface RecipeCandidatePanelProps {
  state: AppState
  dayIndex: number
  targetRole: DishRole
  onQuickAdd: (recipeId: string) => void
  onToggleFavorite: (recipeId: string) => void
  onOpenDetail: (recipe: Recipe) => void
  onOpenCustom?: () => void
  listHeightClass?: string
  className?: string
  variant?: 'page' | 'sheet'
}

function CandidateCard({
  recipe,
  isFavorite,
  compact = false,
  onQuickAdd,
  onToggleFavorite,
  onOpenDetail,
}: {
  recipe: Recipe
  isFavorite: boolean
  compact?: boolean
  onQuickAdd: () => void
  onToggleFavorite: () => void
  onOpenDetail: () => void
}) {
  return (
    <div
      data-no-swipe
      role="button"
      tabIndex={0}
      aria-label={`${recipe.name}の詳細`}
      onClick={() => {
        hapticTap()
        onOpenDetail()
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpenDetail()
        }
      }}
      className={`flex cursor-pointer items-center rounded-lg border bg-orange-50 hover:border-orange-200 ${
        compact ? 'h-full gap-1.5 p-1.5' : 'gap-2 p-2 rounded-xl'
      } ${isFavorite ? 'border-neutral-400' : recipe.custom ? 'border-neutral-300' : 'border-gray-100'}`}
    >
      <RecipePhoto recipe={recipe} size={compact ? 'xs' : 'sm'} />
      <div className="min-w-0 flex-1">
        <p className={`font-medium text-gray-800 line-clamp-1 ${compact ? 'text-xs' : 'text-sm'}`}>
          {recipe.name}
        </p>
        <p className={`text-gray-500 ${compact ? 'text-[10px]' : 'text-xs'}`}>
          {recipe.custom ? '手入力' : `${recipe.genre} · ⏱ ${recipe.cookingTime}分`}
        </p>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          hapticTap()
          onToggleFavorite()
        }}
        className={`shrink-0 leading-none ${compact ? 'text-base' : 'text-lg'} ${isFavorite ? '' : 'opacity-40'}`}
        title={isFavorite ? 'お気に入り解除' : 'お気に入りに追加'}
      >
        {isFavorite ? '⭐' : '☆'}
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          hapticTap('success')
          onQuickAdd()
        }}
        className={`shrink-0 rounded-lg bg-orange-500 font-semibold text-orange-950 hover:bg-orange-600 ${
          compact ? 'px-2.5 py-1 text-sm' : 'px-3 py-1.5 text-sm'
        }`}
      >
        追加
      </button>
    </div>
  )
}

function CandidateSlider({
  candidates,
  favoritesOnly,
  favoriteIds,
  listHeightClass,
  className = '',
  onQuickAdd,
  onToggleFavorite,
  onOpenDetail,
}: {
  candidates: Recipe[]
  favoritesOnly: boolean
  favoriteIds: string[]
  listHeightClass: string
  className?: string
  onQuickAdd: (recipeId: string) => void
  onToggleFavorite: (recipeId: string) => void
  onOpenDetail: (recipe: Recipe) => void
}) {
  const listRef = useRef<HTMLDivElement>(null)
  const [canScrollUp, setCanScrollUp] = useState(false)
  const [canScrollDown, setCanScrollDown] = useState(false)
  const [windowStart, setWindowStart] = useState(0)
  const [windowEnd, setWindowEnd] = useState(16)

  const updateScrollState = () => {
    const el = listRef.current
    if (!el) return
    setCanScrollUp(el.scrollTop > 2)
    setCanScrollDown(el.scrollTop + el.clientHeight < el.scrollHeight - 2)

    const overscan = 8
    const visible = Math.ceil(el.clientHeight / CANDIDATE_ROW_PX) + overscan * 2
    const start = Math.max(0, Math.floor(el.scrollTop / CANDIDATE_ROW_PX) - overscan)
    const end = Math.min(candidates.length, start + visible)
    setWindowStart(start)
    setWindowEnd(end)
  }

  useEffect(() => {
    const el = listRef.current
    if (!el) return
    el.scrollTo({ top: 0 })
    updateScrollState()
  }, [candidates, favoritesOnly])

  const scrollByRow = (direction: -1 | 1) => {
    const el = listRef.current
    if (!el) return
    el.scrollBy({ top: direction * CANDIDATE_ROW_PX, behavior: 'smooth' })
  }

  const showScrollButtons = candidates.length > 0 && (canScrollUp || canScrollDown)
  const visible = candidates.slice(windowStart, windowEnd)

  return (
    <div className={`relative flex min-h-0 flex-col ${className}`}>
      {showScrollButtons && (
        <div className="absolute right-0 top-1/2 z-10 flex -translate-y-1/2 flex-col items-center gap-1 pr-0.5">
          <button
            type="button"
            aria-label="1件上へ"
            disabled={!canScrollUp}
            onClick={() => scrollByRow(-1)}
            className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-50 text-xs text-gray-600 shadow-sm transition hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-30"
          >
            ↑
          </button>
          <button
            type="button"
            aria-label="1件下へ"
            disabled={!canScrollDown}
            onClick={() => scrollByRow(1)}
            className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-50 text-xs text-gray-600 shadow-sm transition hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-30"
          >
            ↓
          </button>
        </div>
      )}

      <div
        ref={listRef}
        onScroll={updateScrollState}
        className={`min-h-0 overflow-y-auto overscroll-contain pr-7 snap-y snap-mandatory ${listHeightClass}`}
      >
        {candidates.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-400">
            {favoritesOnly ? 'お気に入りに該当する候補がありません' : '候補がありません'}
          </p>
        ) : (
          <div
            style={{
              height: candidates.length * CANDIDATE_ROW_PX,
              paddingTop: windowStart * CANDIDATE_ROW_PX,
            }}
          >
            <div className="flex flex-col">
              {visible.map((recipe) => (
                <div
                  key={recipe.id}
                  data-candidate-row
                  className={`${CANDIDATE_ROW_CLASS} mb-1 overflow-hidden`}
                >
                  <CandidateCard
                    recipe={recipe}
                    isFavorite={favoriteIds.includes(recipe.id)}
                    compact
                    onQuickAdd={() => onQuickAdd(recipe.id)}
                    onToggleFavorite={() => onToggleFavorite(recipe.id)}
                    onOpenDetail={() => onOpenDetail(recipe)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function RecipeCandidatePanel({
  state,
  dayIndex,
  targetRole,
  onQuickAdd,
  onToggleFavorite,
  onOpenDetail,
  onOpenCustom,
  listHeightClass = CANDIDATE_SLIDER_VIEW_CLASS,
  className = '',
  variant = 'page',
}: RecipeCandidatePanelProps) {
  const [candidateRoles, setCandidateRoles] = useState<DishRole[]>(() => [...DISH_ROLES])
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [candidateGenre, setCandidateGenre] = useState<'すべて' | Genre>('すべて')
  const [query, setQuery] = useState('')
  const [ingredientQuery, setIngredientQuery] = useState('')
  const debouncedQuery = useDebouncedValue(query)
  const debouncedIngredient = useDebouncedValue(ingredientQuery)

  const isSearching =
    debouncedQuery.trim().length > 0 || debouncedIngredient.trim().length > 0

  const toggleCandidateRole = (role: DishRole) => {
    if (isSearching) return
    setCandidateRoles((prev) => {
      if (prev.includes(role)) {
        if (prev.length <= 1) return prev
        return prev.filter((r) => r !== role)
      }
      return DISH_ROLES.filter((r) => prev.includes(r) || r === role)
    })
  }

  const candidateRoleLabel =
    isSearching
      ? '検索（全役割）'
      : candidateRoles.length === DISH_ROLES.length
        ? '全役割'
        : candidateRoles.join('・')

  const candidates = useMemo(() => {
    let list = isSearching
      ? searchCandidateRecipes(debouncedQuery, state, dayIndex, undefined, debouncedIngredient)
      : getCandidateRecipesMulti(candidateRoles, state, dayIndex)
    if (favoritesOnly) {
      list = list.filter((r) => state.favoriteRecipeIds.includes(r.id))
    }
    if (candidateGenre !== 'すべて') {
      list = list.filter((r) => r.genre === candidateGenre)
    }
    return list
  }, [
    candidateRoles,
    state,
    dayIndex,
    debouncedQuery,
    debouncedIngredient,
    favoritesOnly,
    isSearching,
    candidateGenre,
  ])

  return (
    <div className={`flex flex-col ${className}`}>
      {variant === 'page' ? (
        <div className="mb-2 flex shrink-0 flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-gray-800">
            候補から選ぶ
            <span className="ml-1.5 text-xs font-normal text-gray-500">
              → {DAYS[dayIndex]}・{targetRole}へ配置
              <span className="text-gray-400"> · 表示:{candidateRoleLabel}</span>
              {candidates.length > 0 && (
                <span className="text-gray-400"> · {candidates.length}件</span>
              )}
            </span>
          </h3>
        </div>
      ) : (
        <p className="mb-2 shrink-0 text-[10px] text-gray-400">
          表示:{candidateRoleLabel}
          {candidates.length > 0 && ` · ${candidates.length}件`}
        </p>
      )}
      <div className="mb-2 flex flex-wrap gap-1 shrink-0">
        {DISH_ROLES.map((role) => (
          <button
            key={role}
            type="button"
            disabled={isSearching}
            onClick={() => toggleCandidateRole(role)}
            title={isSearching ? '検索中は役割フィルターを変更できません' : undefined}
            className={`px-2 py-1 text-xs rounded-full border transition ${
              isSearching ? 'cursor-not-allowed opacity-40' : ''
            } ${
              candidateRoles.includes(role)
                ? 'bg-orange-500 text-orange-950 border-orange-500'
                : 'bg-white text-gray-600 border-gray-200 hover:border-neutral-400'
            }`}
          >
            {DISH_ROLE_EMOJI[role]} {role}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setFavoritesOnly((v) => !v)}
          className={`px-2 py-1 text-xs rounded-full border transition ${
            favoritesOnly
              ? 'bg-orange-500 text-orange-950 border-orange-500'
              : 'bg-white text-gray-600 border-gray-200 hover:border-neutral-400'
          }`}
        >
          ⭐お気に入り
          {state.favoriteRecipeIds.length > 0 ? ` (${state.favoriteRecipeIds.length})` : ''}
        </button>
      </div>
      <div className="mb-2 flex flex-wrap gap-1.5 shrink-0">
        <button
          type="button"
          onClick={() => setCandidateGenre('すべて')}
          className={`px-2.5 py-1 text-xs rounded-full border transition ${
            candidateGenre === 'すべて'
              ? 'bg-orange-500 text-orange-950 border-orange-500'
              : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'
          }`}
        >
          すべて
        </button>
        {GENRES.map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setCandidateGenre(g)}
            className={`px-2.5 py-1 text-xs rounded-full border transition ${
              candidateGenre === g
                ? 'bg-orange-500 text-orange-950 border-orange-500'
                : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'
            }`}
          >
            {g}
          </button>
        ))}
      </div>
      <div className="mb-2 flex gap-1.5 shrink-0">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="料理名で絞り込み…"
          className="min-w-0 flex-1 px-2.5 py-1.5 border border-gray-200 rounded-lg text-base focus:outline-none focus:ring-1 focus:ring-orange-300"
        />
        <input
          type="text"
          value={ingredientQuery}
          onChange={(e) => setIngredientQuery(e.target.value)}
          placeholder="材料でも探す"
          className="min-w-0 flex-1 px-2.5 py-1.5 border border-gray-200 rounded-lg text-base focus:outline-none focus:ring-1 focus:ring-orange-300"
        />
      </div>
      <CandidateSlider
        candidates={candidates}
        favoritesOnly={favoritesOnly}
        favoriteIds={state.favoriteRecipeIds}
        listHeightClass={listHeightClass}
        onQuickAdd={onQuickAdd}
        onToggleFavorite={onToggleFavorite}
        onOpenDetail={onOpenDetail}
        className="min-h-0 flex-1"
      />
      {onOpenCustom && (
        <button
          type="button"
          onClick={onOpenCustom}
          className="mt-2 w-full shrink-0 rounded-lg border border-dashed border-orange-200 bg-orange-50/50 px-3 py-2 text-sm font-medium text-orange-800 hover:bg-orange-50"
        >
          手入力を登録・探す
        </button>
      )}
    </div>
  )
}
