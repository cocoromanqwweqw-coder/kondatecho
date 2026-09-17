import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { DishRole, MealType, Recipe } from '../types'
import { DAYS } from '../types'
import type { useAppState } from '../hooks/useAppState'
import { useLongPress } from '../hooks/useLongPress'
import { useDoubleTap } from '../hooks/useDoubleTap'
import { hapticTap } from '../lib/haptic'
import { getPlanSummary } from '../lib/mealPlanner'
import { getDayGapMarks } from '../lib/dayInsights'
import { formatDate, getWeekDates } from '../lib/storage'
import {
  buildPlanShoppingItems,
  buildWeekMenus,
  groupPlanShoppingItems,
  isShoppingChecked,
} from '../lib/shoppingList'
import { InventoryPanel } from './InventoryPanel'
import { RecipeDetailPopup } from './RecipeDetailPopup'
import { RecipeCandidateSheet } from './RecipeCandidateSheet'
import { DayDetailSheet } from './DayDetailSheet'
import { WeekNutritionSheet } from './WeekNutritionSheet'
import { DayRiceToggle } from './DayRiceToggle'
import { CustomRecipePanel } from './CustomRecipePanel'
import { useDisplayMode } from '../hooks/useDisplayMode'

type App = ReturnType<typeof useAppState>

const MEAL: MealType = '夜'

interface Props {
  app: App
  customEditorId?: string
  onCustomEditorConsumed?: () => void
}

type Detail = {
  recipe: Recipe
  dayIndex: number
  dishRole: DishRole
}

type PickerTarget = {
  dayIndex: number
  dishRole: DishRole
}

type MoveSelection = {
  recipeId: string
  recipeName: string
  fromDay: number
  fromRole: DishRole
}

function UndoIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 7 4 12l5 5" />
      <path d="M4 12h11a6 6 0 1 1 0 12" />
    </svg>
  )
}

/** 枠幅に収まるよう文字サイズを自動調整（省略記号なし） */
function FitLabel({ text }: { text: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [fontSize, setFontSize] = useState(14)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    const fit = () => {
      const max = 14
      const min = 9
      let size = max
      el.style.fontSize = `${size}px`
      while (size > min && el.scrollWidth > el.clientWidth + 0.5) {
        size -= 0.5
        el.style.fontSize = `${size}px`
      }
      setFontSize(size)
    }

    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [text])

  return (
    <span
      ref={ref}
      className="block w-full overflow-hidden whitespace-nowrap text-left leading-none"
      style={{ fontSize }}
    >
      {text}
    </span>
  )
}

function WeekRecipeSlot({
  dayIndex,
  dishRole,
  recipe,
  moveMode,
  selection,
  onEnterMoveMode,
  onSelectForMove,
  onClearSelection,
  onMoveTo,
  onOpenDetail,
  onOpenPicker,
  onClear,
}: {
  dayIndex: number
  dishRole: DishRole
  recipe?: Recipe
  moveMode: boolean
  selection: MoveSelection | null
  onEnterMoveMode: (next: MoveSelection) => void
  onSelectForMove: (next: MoveSelection) => void
  onClearSelection: () => void
  onMoveTo: (dayIndex: number, dishRole: DishRole) => void
  onOpenDetail: () => void
  onOpenPicker: () => void
  onClear: () => void
}) {
  const skipClickRef = useRef(false)
  const isSelected =
    selection?.fromDay === dayIndex && selection?.fromRole === dishRole
  const isTarget = moveMode && selection !== null && !isSelected

  const longPress = useLongPress(() => {
    skipClickRef.current = true
    onOpenPicker()
  })

  const handleSingle = () => {
    if (recipe) onOpenDetail()
  }

  const handleDouble = () => {
    if (!recipe) return
    onEnterMoveMode({
      recipeId: recipe.id,
      recipeName: recipe.name,
      fromDay: dayIndex,
      fromRole: dishRole,
    })
    hapticTap('success')
  }

  const tapHandler = useDoubleTap(handleSingle, handleDouble)

  const handleMoveModeTap = () => {
    hapticTap()
    if (isSelected) {
      onClearSelection()
      return
    }
    if (selection) {
      onMoveTo(dayIndex, dishRole)
      return
    }
    if (recipe) {
      onSelectForMove({
        recipeId: recipe.id,
        recipeName: recipe.name,
        fromDay: dayIndex,
        fromRole: dishRole,
      })
    }
  }

  const slotClass = recipe
    ? isSelected
      ? 'border-sky-600 bg-sky-200 font-medium text-sky-950'
      : isTarget
        ? 'border-dashed border-sky-500 bg-sky-50 font-medium text-sky-900'
        : moveMode
          ? 'border-sky-200 bg-white font-medium text-sky-950'
          : 'border-transparent bg-orange-50 font-medium text-gray-800 hover:bg-orange-100 active:bg-orange-100'
    : isTarget
      ? 'border-dashed border-sky-500 bg-sky-50 font-normal text-sky-700'
      : moveMode
        ? 'border-sky-100 bg-white text-sky-300'
        : 'border-transparent bg-gray-50 text-gray-300 active:bg-orange-50 active:text-orange-400'

  const title = recipe
    ? moveMode
      ? `${recipe.name}（タップで選択／移動先）`
      : `${recipe.name}（タップで詳細・ダブルタップで移動モード・長押しで変更・×で削除）`
    : moveMode && selection
      ? `${dishRole}へ移動`
      : `${dishRole}を長押しで追加`

  return (
    <span className="relative block w-full min-w-0" data-move-slot>
      {recipe && !moveMode && (
        <button
          type="button"
          aria-label={`${recipe.name}を外す`}
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
            hapticTap('success')
            onClear()
          }}
          className="absolute right-0.5 top-1/2 z-10 flex h-4 w-4 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-[9px] font-bold text-gray-400 hover:bg-red-500 hover:text-white"
        >
          ×
        </button>
      )}
      <button
        type="button"
        data-no-swipe
        data-move-slot
        title={title}
        onPointerDown={(e) => {
          e.stopPropagation()
          if (moveMode) {
            // 後続の ghost click を抑止
            e.preventDefault()
            return
          }
          longPress.onPointerDown(e)
        }}
        onPointerMove={moveMode ? undefined : longPress.onPointerMove}
        onPointerUp={(e) => {
          if (moveMode) {
            e.stopPropagation()
            if (e.button !== 0 && e.pointerType === 'mouse') return
            handleMoveModeTap()
            return
          }
          longPress.onPointerUp(e)
        }}
        onPointerCancel={moveMode ? undefined : longPress.onPointerCancel}
        onContextMenu={moveMode ? undefined : longPress.onContextMenu}
        style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none' }}
        onClick={(e) => {
          e.stopPropagation()
          if (moveMode) {
            e.preventDefault()
            return
          }
          if (skipClickRef.current) {
            skipClickRef.current = false
            return
          }
          hapticTap()
          tapHandler()
        }}
        className={`box-border flex h-7 w-full min-w-0 items-center select-none rounded-md border px-1.5 ${recipe && !moveMode ? 'pr-5' : ''} ${slotClass}`}
      >
        <FitLabel text={recipe ? recipe.name : dishRole} />
      </button>
    </span>
  )
}

function FreeMemoField({
  value,
  onCommit,
}: {
  value: string
  onCommit: (note: string) => void
}) {
  const ref = useRef<HTMLTextAreaElement>(null)
  const composingRef = useRef(false)
  const timerRef = useRef(0)
  const onCommitRef = useRef(onCommit)
  onCommitRef.current = onCommit

  const flush = () => {
    window.clearTimeout(timerRef.current)
    const next = ref.current?.value ?? ''
    onCommitRef.current(next)
  }

  const scheduleFlush = () => {
    window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(flush, 500)
  }

  useEffect(() => () => window.clearTimeout(timerRef.current), [])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (composingRef.current) return
    if (document.activeElement === el) return
    if (el.value !== value) el.value = value
  }, [value])

  return (
    <label className="mt-2 block border-t border-gray-100 pt-2">
      <span className="mb-1 block text-[11px] font-medium text-gray-500">フリーメモ</span>
      <textarea
        ref={ref}
        defaultValue={value}
        onCompositionStart={() => {
          composingRef.current = true
          window.clearTimeout(timerRef.current)
        }}
        onCompositionEnd={() => {
          composingRef.current = false
          scheduleFlush()
        }}
        onChange={() => {
          if (composingRef.current) return
          scheduleFlush()
        }}
        onBlur={flush}
        placeholder="店・予算・忘れものなど、自由に…"
        rows={4}
        className="w-full resize-y rounded-lg border border-gray-200 px-3 py-1.5 text-base leading-snug focus:outline-none focus:ring-2 focus:ring-orange-300"
      />
    </label>
  )
}

export function ShoppingMemoPanel({ app, customEditorId, onCustomEditorConsumed }: Props) {
  const {
    state,
    autoGenerate,
    clearPlan,
    setSlot,
    clearSlot,
    moveSlot,
    setDayRiceIncluded,
    toggleFavorite,
    toggleShoppingChecked,
    clearShoppingChecks,
    moveCheckedShoppingToInventory,
    setShoppingFreeMemo,
    undoWeeklyPlan,
    planUndoCount,
  } = app
  const weekDates = getWeekDates(state.weekStartDate)
  const { isDesktopLayout } = useDisplayMode()
  const [detail, setDetail] = useState<Detail | null>(null)
  const [picker, setPicker] = useState<PickerTarget | null>(null)
  const [placeTarget, setPlaceTarget] = useState<PickerTarget | null>(null)
  const [moveMode, setMoveMode] = useState(false)
  const [selection, setSelection] = useState<MoveSelection | null>(null)
  const selectionRef = useRef<MoveSelection | null>(null)
  const moveLockUntilRef = useRef(0)
  const [dayDetail, setDayDetail] = useState<number | null>(null)
  const [weekStatsOpen, setWeekStatsOpen] = useState(false)
  const [customOpen, setCustomOpen] = useState(false)
  const [customEditId, setCustomEditId] = useState<string | null>(null)

  const openCustomPanel = useCallback((recipeId: string | null = null) => {
    setCustomEditId(recipeId)
    setCustomOpen(true)
  }, [])

  useEffect(() => {
    if (!customEditorId) return
    openCustomPanel(customEditorId)
    onCustomEditorConsumed?.()
  }, [customEditorId, onCustomEditorConsumed, openCustomPanel])

  const menus = useMemo(() => buildWeekMenus(state), [state])
  const planItems = useMemo(() => buildPlanShoppingItems(state), [state])
  const shoppingGroups = useMemo(() => groupPlanShoppingItems(planItems), [planItems])

  const checkedCount = planItems.filter((item) =>
    isShoppingChecked(item.name, state.shoppingCheckedNames)
  ).length
  const listCount = planItems.length

  const exitMoveMode = () => {
    setMoveMode(false)
    selectionRef.current = null
    setSelection(null)
  }

  const removeFromPlan = (dayIndex: number, dishRole: DishRole) => {
    clearSlot(dayIndex, MEAL, dishRole)
    if (selectionRef.current?.fromDay === dayIndex && selectionRef.current?.fromRole === dishRole) {
      selectionRef.current = null
      setSelection(null)
    }
    setDetail((current) =>
      current && current.dayIndex === dayIndex && current.dishRole === dishRole
        ? null
        : current
    )
  }

  const handleEnterMoveMode = (next: MoveSelection) => {
    setMoveMode(true)
    selectionRef.current = next
    setSelection(next)
    moveLockUntilRef.current = Date.now() + 400
  }

  const handleSelectForMove = (next: MoveSelection) => {
    if (Date.now() < moveLockUntilRef.current) return
    selectionRef.current = next
    setSelection(next)
  }

  const handleClearSelection = () => {
    selectionRef.current = null
    setSelection(null)
  }

  const handleMoveTo = (dayIndex: number, dishRole: DishRole) => {
    const current = selectionRef.current
    if (!current) return
    if (current.fromDay === dayIndex && current.fromRole === dishRole) {
      handleClearSelection()
      return
    }
    const now = Date.now()
    if (now < moveLockUntilRef.current) return
    moveLockUntilRef.current = now + 450

    moveSlot(
      { dayIndex: current.fromDay, mealType: MEAL, dishRole: current.fromRole },
      { dayIndex, mealType: MEAL, dishRole }
    )
    // 追いかけ選択なし。次は別レシピを選んで繰り返す
    selectionRef.current = null
    setSelection(null)
    hapticTap('success')
  }

  const handleUndo = () => {
    if (!undoWeeklyPlan()) return
    exitMoveMode()
    hapticTap()
  }

  const tryExitMoveMode = (e: React.SyntheticEvent) => {
    if (!moveMode) return
    if (Date.now() < moveLockUntilRef.current) return
    const target = e.target as HTMLElement
    if (target.closest('[data-move-slot]')) return
    exitMoveMode()
  }

  return (
    <div className="space-y-3" onPointerDown={tryExitMoveMode}>
      <div
        className={`relative rounded-2xl border p-3.5 shadow-sm ${
          moveMode ? 'border-sky-400 bg-sky-50' : 'border-orange-200/80 bg-white'
        }`}
      >
        <div className="mb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h2 className={`text-base font-bold ${moveMode ? 'text-sky-950' : 'text-gray-800'}`}>
                {moveMode ? '移動モード' : '今週のレシピ'}
              </h2>
              <p className="text-xs text-gray-500">
                {formatDate(weekDates[0])} 〜 {formatDate(weekDates[6])}
              </p>
              <p className="text-[10px] text-gray-400">
                長押しで追加 · ダブルタップで移動モード · 曜日タップで詳細
              </p>
            </div>
            <button
              type="button"
              onClick={handleUndo}
              disabled={planUndoCount === 0}
              aria-label={planUndoCount > 0 ? '直前の操作を戻す' : '戻せる操作はありません'}
              title={planUndoCount > 0 ? '直前の操作を戻す' : '戻せる操作はありません'}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-35 disabled:shadow-none disabled:hover:bg-white"
            >
              <UndoIcon />
            </button>
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            <button
              type="button"
              onClick={autoGenerate}
              className="rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-medium text-orange-950 shadow-sm transition hover:bg-orange-600"
            >
              ✨ 自動配置
            </button>
            <button
              type="button"
              onClick={clearPlan}
              className="rounded-lg bg-gray-100 px-2.5 py-1.5 text-xs text-gray-600 transition hover:bg-gray-200"
            >
              クリア
            </button>
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => {
                hapticTap()
                setWeekStatsOpen(true)
              }}
              className="ml-auto rounded-lg border border-sky-600 bg-white px-2.5 py-1.5 text-xs font-medium text-sky-800 transition hover:bg-sky-50"
            >
              今週の栄養
            </button>
          </div>
        </div>
        <p className="mb-2 text-[10px] text-gray-500">{getPlanSummary(state.weeklyPlan)}</p>

        <div className={`mb-2 min-h-[2.125rem] ${moveMode ? '' : 'hidden'}`}>
          <div className="rounded-lg border border-sky-300 bg-white px-2.5 py-1.5">
            <p className="truncate text-[11px] leading-snug text-sky-900">
              {selection ? (
                <>
                  <span className="font-medium">{selection.recipeName}</span>{' '}
                  を選択中。置きたい枠をタップ
                </>
              ) : (
                <>移動モード中。レシピをタップ → 置きたい枠をタップ（繰り返しOK）</>
              )}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {menus.map((day) => {
            const gapMarks = getDayGapMarks(state, day.dayIndex)
            return (
            <div
              key={day.dayIndex}
              className={`flex items-start gap-1.5 rounded-lg border px-2 py-2 ${
                moveMode ? 'border-sky-200 bg-sky-100/70' : 'border-orange-200 bg-white'
              }`}
            >
              <div className="flex w-7 shrink-0 flex-col items-center gap-1.5 pt-0.5">
                <button
                  type="button"
                  onClick={() => {
                    hapticTap()
                    setDayDetail(day.dayIndex)
                  }}
                  title={`${day.weekday}曜の詳細`}
                  className={`w-7 rounded-md py-1 text-center text-sm font-bold leading-none ${
                    moveMode
                      ? 'bg-sky-600 text-white'
                      : 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                  }`}
                >
                  {day.weekday}
                </button>
                <DayRiceToggle
                  dayIndex={day.dayIndex}
                  riceIncluded={state.dayRiceIncluded[day.dayIndex] !== false}
                  onToggle={setDayRiceIncluded}
                />
              </div>
              <div className="grid min-w-0 flex-1 grid-cols-2 gap-1">
                {day.slots.map((slot) => (
                  <div key={slot.role} className="min-w-0">
                    <WeekRecipeSlot
                      dayIndex={day.dayIndex}
                      dishRole={slot.role}
                      recipe={slot.recipe}
                      moveMode={moveMode}
                      selection={selection}
                      onEnterMoveMode={handleEnterMoveMode}
                      onSelectForMove={handleSelectForMove}
                      onClearSelection={handleClearSelection}
                      onMoveTo={handleMoveTo}
                      onOpenDetail={() =>
                        slot.recipe &&
                        setDetail({
                          recipe: slot.recipe,
                          dayIndex: day.dayIndex,
                          dishRole: slot.role,
                        })
                      }
                      onOpenPicker={() => {
                        const target = { dayIndex: day.dayIndex, dishRole: slot.role }
                        setPlaceTarget(target)
                        setPicker(target)
                      }}
                      onClear={() => removeFromPlan(day.dayIndex, slot.role)}
                    />
                  </div>
                ))}
                <button
                  type="button"
                  data-move-slot
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => {
                    hapticTap()
                    setDayDetail(day.dayIndex)
                  }}
                  title={
                    gapMarks.length > 0
                      ? `足りないもの: ${gapMarks.map((mark) => mark.label).join('・')}`
                      : 'タップでこの日の詳細'
                  }
                  aria-label={
                    gapMarks.length > 0
                      ? `${day.weekday}曜の足りないもの`
                      : `${day.weekday}曜の詳細を開く`
                  }
                  className={`box-border flex h-7 min-w-0 items-center justify-center gap-0.5 rounded-md border border-dashed px-1 text-base leading-none ${
                    moveMode
                      ? 'border-sky-200 bg-white/70'
                      : 'border-gray-200 bg-gray-50/60'
                  }`}
                >
                  {gapMarks.length === 0 ? (
                    <span className={moveMode ? 'text-sm text-sky-300' : 'text-sm text-gray-300'} aria-hidden>
                      —
                    </span>
                  ) : (
                    gapMarks.map((mark) => (
                      <span key={mark.label} aria-hidden>
                        {mark.emoji}
                      </span>
                    ))
                  )}
                </button>
              </div>
            </div>
            )
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-orange-200/80 bg-white p-3.5 shadow-sm">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-gray-800">買い物メモ</h2>
            <p className="text-xs text-gray-500">在庫にない材料。チェックして在庫へ</p>
          </div>
          <button
            type="button"
            onClick={clearShoppingChecks}
            disabled={checkedCount === 0}
            className="shrink-0 rounded-lg bg-gray-100 px-2.5 py-1.5 text-xs text-gray-600 transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-gray-100"
          >
            チェック解除
          </button>
        </div>

        {checkedCount > 0 && (
          <button
            type="button"
            onClick={moveCheckedShoppingToInventory}
            className="mt-2 w-full rounded-lg border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-medium text-orange-700 hover:bg-orange-100"
          >
            チェックした {checkedCount} 件を在庫へ
          </button>
        )}

        {listCount === 0 ? (
          <p className="mt-2 rounded-lg bg-gray-50 px-3 py-3 text-center text-xs text-gray-400">
            献立を入れると、足りない食材がここに出ます
          </p>
        ) : (
          <div className="mt-2 max-h-80 space-y-2.5 overflow-y-auto">
            {shoppingGroups.map((group) => (
              <section key={group.category}>
                <h3 className="mb-0.5 text-[11px] font-semibold tracking-wide text-orange-800">
                  {group.category}
                </h3>
                <ul
                  className={
                    isDesktopLayout
                      ? 'grid grid-cols-3 gap-x-3 gap-y-0.5'
                      : 'grid grid-cols-2 gap-x-2 gap-y-0.5'
                  }
                >
                  {group.items.map((item) => {
                    const checked = isShoppingChecked(item.name, state.shoppingCheckedNames)
                    const dayLabel = item.days.map((d) => DAYS[d]).join('・')
                    return (
                      <li key={`plan-${item.name}`} className="flex min-w-0 items-center gap-1.5 py-0.5">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleShoppingChecked(item.name)}
                          className="h-3.5 w-3.5 shrink-0 accent-orange-500"
                          aria-label={`${item.name}を買った`}
                        />
                        <p
                          className={`min-w-0 flex-1 truncate text-sm ${checked ? 'text-gray-400 line-through' : 'text-gray-800'}`}
                        >
                          {item.name}
                          {item.count > 1 && (
                            <span className="ml-0.5 text-xs text-gray-400">×{item.count}</span>
                          )}
                          <span className="ml-1 text-[11px] font-normal text-gray-400">
                            {dayLabel}
                          </span>
                        </p>
                      </li>
                    )
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}

        <FreeMemoField value={state.shoppingFreeMemo} onCommit={setShoppingFreeMemo} />
      </div>

      <InventoryPanel app={app} />

      {detail && (
        <RecipeDetailPopup
          recipe={detail.recipe}
          dayIndex={detail.dayIndex}
          dishRole={detail.dishRole}
          isFavorite={state.favoriteRecipeIds.includes(detail.recipe.id)}
          onClose={() => setDetail(null)}
          onToggleFavorite={toggleFavorite}
          onClear={() => removeFromPlan(detail.dayIndex, detail.dishRole)}
          onEdit={
            detail.recipe.custom
              ? (recipe) => {
                  setDetail(null)
                  openCustomPanel(recipe.id)
                }
              : undefined
          }
        />
      )}

      {dayDetail !== null && (
        <DayDetailSheet app={app} dayIndex={dayDetail} onClose={() => setDayDetail(null)} />
      )}

      {weekStatsOpen && (
        <WeekNutritionSheet app={app} onClose={() => setWeekStatsOpen(false)} />
      )}

      {picker && (
        <RecipeCandidateSheet
          dayIndex={picker.dayIndex}
          dishRole={picker.dishRole}
          state={state}
          onSelect={(recipeId) => setSlot(picker.dayIndex, MEAL, picker.dishRole, recipeId)}
          onClose={() => setPicker(null)}
          onToggleFavorite={toggleFavorite}
          onOpenCustom={() => {
            setPicker(null)
            openCustomPanel(null)
          }}
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
          const target = placeTarget ?? picker
          if (target) {
            setSlot(target.dayIndex, MEAL, recipe.dishRole ?? target.dishRole, recipe.id)
          }
          setCustomOpen(false)
          setCustomEditId(null)
          setPicker(null)
        }}
      />
    </div>
  )
}
