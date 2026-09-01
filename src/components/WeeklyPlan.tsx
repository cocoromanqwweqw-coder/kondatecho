import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { useAppState } from '../hooks/useAppState'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { resolveRecipe } from '../lib/recipeResolver'
import {
  DAYS,
  DISH_ROLE_EMOJI,
  DISH_ROLES,
  GENRES,
  type DishRole,
  type Genre,
  type MealType,
  type Recipe,
  type StagedRecipe,
} from '../types'
import { formatDate, getWeekDates } from '../lib/storage'
import { getCandidateRecipesMulti, getPlanSummary, searchCandidateRecipes } from '../lib/mealPlanner'
import { RecipePhoto } from './RecipePhoto'
import { DayDetailPanel } from './DayDetailPanel'
import { WeekAtGlanceBoard } from './WeekAtGlanceBoard'
import { CustomRecipePanel } from './CustomRecipePanel'
import { RecipeDetailPopup } from './RecipeDetailPopup'
import { type DragPayload, STAGING_DROP_KEY } from '../lib/weeklyPlanDrag'

type App = ReturnType<typeof useAppState>

interface Props {
  app: App
  customEditorId?: string
  onCustomEditorConsumed?: () => void
}

const MEAL: MealType = '夜'

const CANDIDATE_ROW_CLASS = 'h-[3.25rem] shrink-0 snap-start'
/** 行高 3.25rem + gap 0.25rem（16px基準） */
const CANDIDATE_ROW_PX = 56
/** 候補リストの表示高さ（8行分） */
const CANDIDATE_SLIDER_VIEW_CLASS = 'h-[27.75rem]'

export function WeeklyPlan({ app, customEditorId, onCustomEditorConsumed }: Props) {
  const {
    state,
    autoGenerate,
    clearPlan,
    setSlot,
    clearSlot,
    moveSlot,
    moveSlotToStaging,
    addToStaging,
    removeFromStaging,
    clearStaging,
    moveFromStagingToSlot,
    toggleFavorite,
    setDayRiceIncluded,
  } = app
  const weekDates = getWeekDates(state.weekStartDate)
  const [activeDay, setActiveDay] = useState(0)
  const [targetRole, setTargetRole] = useState<DishRole>('主菜')
  const [candidateRoles, setCandidateRoles] = useState<DishRole[]>(() => [...DISH_ROLES])
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [candidateGenre, setCandidateGenre] = useState<'すべて' | Genre>('すべて')
  const [dragOverKey, setDragOverKey] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [ingredientQuery, setIngredientQuery] = useState('')
  const [customOpen, setCustomOpen] = useState(false)
  const [customEditId, setCustomEditId] = useState<string | null>(null)
  const [candidateDetail, setCandidateDetail] = useState<Recipe | null>(null)
  const debouncedQuery = useDebouncedValue(query)
  const debouncedIngredient = useDebouncedValue(ingredientQuery)

  const openCustomPanel = useCallback((recipeId: string | null = null) => {
    setCustomEditId(recipeId)
    setCustomOpen(true)
  }, [])

  useEffect(() => {
    if (!customEditorId) return
    openCustomPanel(customEditorId)
    onCustomEditorConsumed?.()
  }, [customEditorId, onCustomEditorConsumed, openCustomPanel])

  const toggleCandidateRole = (role: DishRole) => {
    if (debouncedQuery.trim() || debouncedIngredient.trim()) return
    setCandidateRoles((prev) => {
      if (prev.includes(role)) {
        if (prev.length <= 1) return prev
        return prev.filter((r) => r !== role)
      }
      return DISH_ROLES.filter((r) => prev.includes(r) || r === role)
    })
  }

  const candidateRoleLabel =
    debouncedQuery.trim() || debouncedIngredient.trim()
      ? '検索（全役割）'
      : candidateRoles.length === DISH_ROLES.length
        ? '全役割'
        : candidateRoles.join('・')

  const uniqueRecipeCount = useMemo(
    () => new Set(state.weeklyPlan.map((p) => p.recipeId)).size,
    [state.weeklyPlan]
  )

  const isSearching =
    debouncedQuery.trim().length > 0 || debouncedIngredient.trim().length > 0

  const candidates = useMemo(() => {
    let list = isSearching
      ? searchCandidateRecipes(debouncedQuery, state, activeDay, undefined, debouncedIngredient)
      : getCandidateRecipesMulti(candidateRoles, state, activeDay)
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
    activeDay,
    debouncedQuery,
    debouncedIngredient,
    favoritesOnly,
    isSearching,
    candidateGenre,
  ])

  const handleDragStart = (e: React.DragEvent, payload: DragPayload) => {
    e.dataTransfer.setData('application/json', JSON.stringify(payload))
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDrop = (e: React.DragEvent, dayIndex: number, dishRole: DishRole) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverKey(null)
    try {
      const payload = JSON.parse(e.dataTransfer.getData('application/json')) as DragPayload
      if (payload.source === 'staging') {
        moveFromStagingToSlot(payload.stagedId, {
          dayIndex,
          mealType: MEAL,
          dishRole,
        })
      } else if (payload.source === 'candidate') {
        moveSlot(null, { dayIndex, mealType: MEAL, dishRole }, payload.recipeId)
      } else {
        moveSlot(
          {
            dayIndex: payload.dayIndex,
            mealType: payload.mealType,
            dishRole: payload.dishRole,
          },
          { dayIndex, mealType: MEAL, dishRole }
        )
      }
      setActiveDay(dayIndex)
      setTargetRole(dishRole)
    } catch {
      /* ignore malformed drag payload */
    }
  }

  const handleDropOnStaging = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverKey(null)
    try {
      const payload = JSON.parse(e.dataTransfer.getData('application/json')) as DragPayload
      if (payload.source === 'slot') {
        moveSlotToStaging(payload.dayIndex, payload.mealType, payload.dishRole)
      } else if (payload.source === 'candidate') {
        addToStaging(payload.recipeId, payload.dishRole)
      }
    } catch {
      /* ignore malformed drag payload */
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl px-3.5 py-2.5 shadow-sm border border-orange-200/80">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <h2 className="text-base font-bold text-gray-800">今週の夜ごはん</h2>
              <p className="text-xs text-gray-500">
                {formatDate(weekDates[0])} 〜 {formatDate(weekDates[6])}
              </p>
            </div>
            <p className="mt-0.5 text-[11px] text-gray-500 leading-snug">
              {getPlanSummary(state.weeklyPlan)}
              <span className="ml-1.5 text-orange-600 font-medium">
                ユニーク {uniqueRecipeCount} 種
              </span>
            </p>
            <p className="mt-0.5 text-[10px] text-gray-400 leading-snug">
              1週間を一覧で確認。スロットをタップして候補から
              <strong className="font-medium text-gray-600">追加</strong>
              、またはドラッグ＆ドロップ。
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={clearPlan}
              className="px-2.5 py-1.5 text-xs text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
            >
              クリア
            </button>
            <button
              type="button"
              onClick={autoGenerate}
              className="px-3 py-1.5 text-xs font-medium text-orange-950 bg-orange-500 rounded-lg hover:bg-orange-600 shadow-sm transition"
            >
              ✨ 候補を自動配置
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-orange-200/80 bg-white p-2.5 shadow-sm">
          <div className="mb-1 shrink-0 px-0.5">
            <h3 className="text-sm font-bold tracking-wide text-gray-800">1週間の夜ごはん</h3>
            <p className="text-[10px] text-orange-400/80">
              {DAYS[activeDay]}・{targetRole} · タップで選択
            </p>
          </div>
          <WeekAtGlanceBoard
            weekDates={weekDates}
            weeklyPlan={state.weeklyPlan}
            customRecipes={state.customRecipes}
            dayRiceIncluded={state.dayRiceIncluded}
            activeDay={activeDay}
            targetRole={targetRole}
            dragOverKey={dragOverKey}
            setActiveDay={setActiveDay}
            setTargetRole={setTargetRole}
            setDragOverKey={setDragOverKey}
            onDrop={handleDrop}
            onClear={clearSlot}
            onDragStart={handleDragStart}
            onToggleRice={setDayRiceIncluded}
            favoriteIds={state.favoriteRecipeIds}
            onToggleFavorite={toggleFavorite}
            onEditCustom={(recipe) => openCustomPanel(recipe.id)}
          />
          <RecipeStagingPanel
            stagedRecipes={state.stagedRecipes}
            customRecipes={state.customRecipes}
            activeDayLabel={DAYS[activeDay]}
            targetRole={targetRole}
            dragOverKey={dragOverKey}
            setDragOverKey={setDragOverKey}
            onDrop={handleDropOnStaging}
            onDragStart={handleDragStart}
            onPlace={(stagedId) =>
              moveFromStagingToSlot(stagedId, {
                dayIndex: activeDay,
                mealType: MEAL,
                dishRole: targetRole,
              })
            }
            onRemove={removeFromStaging}
            onClear={clearStaging}
          />
        </div>

        <div className="flex flex-col bg-white rounded-2xl p-3 shadow-sm border border-orange-200/80">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2 shrink-0">
            <h3 className="text-sm font-bold text-gray-800">
              候補から選ぶ
              <span className="ml-1.5 text-xs font-normal text-gray-500">
                → {DAYS[activeDay]}・{targetRole}へ配置
                <span className="text-gray-400"> · 表示:{candidateRoleLabel}</span>
                {candidates.length > 0 && (
                  <span className="text-gray-400"> · {candidates.length}件</span>
                )}
              </span>
            </h3>
          </div>
          <div className="flex flex-wrap gap-1 mb-2 shrink-0">
            {DISH_ROLES.map((role) => (
              <button
                key={role}
                type="button"
                disabled={isSearching}
                onClick={() => toggleCandidateRole(role)}
                title={isSearching ? '検索中は役割フィルターを変更できません' : undefined}
                className={`px-2 py-1 text-xs rounded-full border transition ${
                  isSearching
                    ? 'cursor-not-allowed opacity-40'
                    : ''
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
            onDragStart={handleDragStart}
            onQuickAdd={(recipeId) => {
              setSlot(activeDay, MEAL, targetRole, recipeId)
            }}
            onStage={(recipeId) => {
              const recipe = resolveRecipe(recipeId, state.customRecipes)
              addToStaging(recipeId, recipe?.dishRole ?? targetRole)
            }}
            onToggleFavorite={toggleFavorite}
            onOpenDetail={setCandidateDetail}
          />
          <button
            type="button"
            onClick={() => openCustomPanel(null)}
            className="mt-2 w-full shrink-0 rounded-lg border border-dashed border-orange-200 bg-orange-50/50 px-3 py-2 text-sm font-medium text-orange-800 hover:bg-orange-50"
          >
            手入力を登録・探す
          </button>
        </div>
      </div>

      <DayDetailPanel app={app} dayIndex={activeDay} />
      {candidateDetail && (
        <RecipeDetailPopup
          recipe={candidateDetail}
          dayIndex={activeDay}
          dishRole={candidateDetail.dishRole ?? targetRole}
          isFavorite={state.favoriteRecipeIds.includes(candidateDetail.id)}
          onClose={() => setCandidateDetail(null)}
          onToggleFavorite={toggleFavorite}
          onPlace={() => {
            setSlot(activeDay, MEAL, targetRole, candidateDetail.id)
          }}
          onEdit={
            candidateDetail.custom
              ? (recipe) => {
                  setCandidateDetail(null)
                  openCustomPanel(recipe.id)
                }
              : undefined
          }
        />
      )}
      <CustomRecipePanel
        app={app}
        open={customOpen}
        initialRecipeId={customEditId}
        onClose={() => {
          setCustomOpen(false)
          setCustomEditId(null)
        }}
        onPlace={(recipe) => {
          setSlot(activeDay, MEAL, recipe.dishRole ?? targetRole, recipe.id)
          setCustomOpen(false)
          setCustomEditId(null)
        }}
      />
    </div>
  )
}

function RecipeStagingPanel({
  stagedRecipes,
  customRecipes,
  activeDayLabel,
  targetRole,
  dragOverKey,
  setDragOverKey,
  onDrop,
  onDragStart,
  onPlace,
  onRemove,
  onClear,
}: {
  stagedRecipes: StagedRecipe[]
  customRecipes: Recipe[]
  activeDayLabel: string
  targetRole: DishRole
  dragOverKey: string | null
  setDragOverKey: (key: string | null) => void
  onDrop: (e: React.DragEvent) => void
  onDragStart: (e: React.DragEvent, payload: DragPayload) => void
  onPlace: (stagedId: string) => void
  onRemove: (stagedId: string) => void
  onClear: () => void
}) {
  const isOver = dragOverKey === STAGING_DROP_KEY

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        setDragOverKey(STAGING_DROP_KEY)
      }}
      onDragLeave={() => setDragOverKey(null)}
      onDrop={onDrop}
      className={`mt-1.5 w-full min-w-0 shrink-0 overflow-hidden rounded-lg border border-dashed px-2 py-1.5 transition-colors ${
        isOver
          ? 'border-orange-400 bg-orange-100/60'
          : 'border-orange-200/70 bg-orange-50/25'
      }`}
    >
      <div className="mb-1 flex min-w-0 items-center gap-2">
        <span className="shrink-0 text-[10px] font-semibold text-gray-600">一時置き場</span>
        <span className="min-w-0 flex-1 truncate text-[10px] text-orange-500">
          → {activeDayLabel}・{DISH_ROLE_EMOJI[targetRole]} {targetRole}へ
        </span>
        {stagedRecipes.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="shrink-0 text-[10px] text-gray-400 hover:text-gray-600"
          >
            全解除
          </button>
        )}
      </div>
      {stagedRecipes.length > 0 ? (
        <div className="flex min-w-0 flex-wrap gap-1">
          {stagedRecipes.map((staged) => {
            const recipe = resolveRecipe(staged.recipeId, customRecipes)
            if (!recipe) return null

            return (
              <div
                key={staged.id}
                draggable
                onDragStart={(e) =>
                  onDragStart(e, {
                    source: 'staging',
                    stagedId: staged.id,
                    recipeId: staged.recipeId,
                    dishRole: staged.dishRole,
                  })
                }
                className="flex max-w-[7rem] shrink-0 cursor-grab items-center gap-0.5 rounded-full border border-orange-200/80 bg-white/95 py-0.5 pl-1 pr-0.5 active:cursor-grabbing"
              >
                <p className="min-w-0 flex-1 line-clamp-1 text-[9px] font-medium text-gray-700">
                  <span className="opacity-60">{DISH_ROLE_EMOJI[staged.dishRole]}</span>{' '}
                  {recipe.name}
                </p>
                <button
                  type="button"
                  onPointerDown={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onPlace(staged.id)
                  }}
                  className="shrink-0 rounded-full bg-orange-500 px-1.5 py-0.5 text-[10px] font-semibold text-orange-950 hover:bg-orange-600"
                >
                  追加
                </button>
                <button
                  type="button"
                  aria-label={`${recipe.name}を一時置き場から外す`}
                  title="外す"
                  onPointerDown={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onRemove(staged.id)
                  }}
                  className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full text-[8px] font-bold text-gray-400 hover:bg-red-500 hover:text-white"
                >
                  ×
                </button>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="text-[10px] text-gray-400">
          曜日のマスを選んでから、候補の「置き場へ」→ ここで「追加」
        </p>
      )}
    </div>
  )
}

function CandidateCard({
  recipe,
  isFavorite,
  compact = false,
  onDragStart,
  onQuickAdd,
  onStage,
  onToggleFavorite,
  onOpenDetail,
}: {
  recipe: Recipe
  isFavorite: boolean
  compact?: boolean
  onDragStart: (e: React.DragEvent) => void
  onQuickAdd: () => void
  onStage: () => void
  onToggleFavorite: () => void
  onOpenDetail: () => void
}) {
  const skipClickRef = useRef(false)

  return (
    <div
      draggable
      data-no-swipe
      role="button"
      tabIndex={0}
      aria-label={`${recipe.name}の詳細`}
      onDragStart={(e) => {
        skipClickRef.current = true
        onDragStart(e)
      }}
      onClick={() => {
        if (skipClickRef.current) {
          skipClickRef.current = false
          return
        }
        onOpenDetail()
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpenDetail()
        }
      }}
      className={`flex cursor-grab active:cursor-grabbing items-center rounded-lg border bg-orange-50 hover:border-orange-200 ${
        compact ? 'h-full gap-1.5 p-1.5' : 'gap-2 p-2 rounded-xl'
      } ${isFavorite ? 'border-neutral-400' : recipe.custom ? 'border-neutral-300' : 'border-gray-100'}`}
    >
      <RecipePhoto recipe={recipe} size={compact ? 'xs' : 'sm'} />
      <div className="min-w-0 flex-1">
        <p className={`font-medium text-gray-800 line-clamp-1 ${compact ? 'text-xs' : 'text-sm'}`}>
          {recipe.name}
        </p>
        <p className={`text-gray-500 ${compact ? 'text-[10px]' : 'text-xs'}`}>
          {recipe.custom
            ? '手入力'
            : `${recipe.genre} · ⏱ ${recipe.cookingTime}分`}
        </p>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
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
          onStage()
        }}
        title="一時置き場へ"
        className={`shrink-0 rounded-lg border border-amber-300 bg-amber-50 font-medium text-amber-900 hover:bg-amber-100 ${
          compact ? 'px-1.5 py-1 text-[11px]' : 'px-2.5 py-1.5 text-sm'
        }`}
      >
        置き場へ
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
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
  onDragStart,
  onQuickAdd,
  onStage,
  onToggleFavorite,
  onOpenDetail,
}: {
  candidates: Recipe[]
  favoritesOnly: boolean
  favoriteIds: string[]
  onDragStart: (e: React.DragEvent, payload: DragPayload) => void
  onQuickAdd: (recipeId: string) => void
  onStage: (recipeId: string) => void
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
    <div className="relative shrink-0 flex flex-col">
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
        className={`overflow-y-auto overscroll-contain pr-7 snap-y snap-mandatory ${CANDIDATE_SLIDER_VIEW_CLASS}`}
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
                    onDragStart={(e) =>
                      onDragStart(e, {
                        source: 'candidate',
                        recipeId: recipe.id,
                        dishRole: recipe.dishRole ?? '主菜',
                      })
                    }
                    onQuickAdd={() => onQuickAdd(recipe.id)}
                    onStage={() => onStage(recipe.id)}
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
