import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { DishRole, MealType, Recipe } from '../types'
import { DAYS } from '../types'
import type { useAppState } from '../hooks/useAppState'
import { useLongPress } from '../hooks/useLongPress'
import { useDoubleTap } from '../hooks/useDoubleTap'
import { hapticTap } from '../lib/haptic'
import { getPlanSummary } from '../lib/mealPlanner'
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

type Clipboard = {
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

function WeekRecipeSlot({
  dayIndex,
  dishRole,
  recipe,
  clipboard,
  setClipboard,
  onOpenDetail,
  onOpenPicker,
  onPaste,
  onClear,
}: {
  dayIndex: number
  dishRole: DishRole
  recipe?: Recipe
  clipboard: Clipboard | null
  setClipboard: (next: Clipboard | null) => void
  onOpenDetail: () => void
  onOpenPicker: () => void
  onPaste: (dayIndex: number, dishRole: DishRole, recipeId: string) => void
  onClear: () => void
}) {
  const skipClickRef = useRef(false)
  const isClipboardSource =
    clipboard?.fromDay === dayIndex && clipboard?.fromRole === dishRole
  const isPasteTarget = clipboard !== null && !isClipboardSource

  const longPress = useLongPress(() => {
    skipClickRef.current = true
    onOpenPicker()
  })

  const handleSingle = () => {
    if (recipe) onOpenDetail()
  }

  const handleDouble = () => {
    if (!recipe) return
    setClipboard({
      recipeId: recipe.id,
      recipeName: recipe.name,
      fromDay: dayIndex,
      fromRole: dishRole,
    })
    hapticTap('success')
  }

  const tapHandler = useDoubleTap(handleSingle, handleDouble)

  const onClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (skipClickRef.current) {
      skipClickRef.current = false
      return
    }
    hapticTap()
    if (clipboard) {
      if (isClipboardSource) {
        setClipboard(null)
        return
      }
      onPaste(dayIndex, dishRole, clipboard.recipeId)
      return
    }
    tapHandler()
  }

  const slotClass = recipe
    ? isClipboardSource
      ? 'border border-amber-400 bg-amber-50 font-medium text-gray-800'
      : isPasteTarget
        ? 'border border-dashed border-orange-200 bg-white font-normal text-gray-700'
        : 'bg-orange-50 font-medium text-gray-800 hover:bg-orange-100 active:bg-orange-100'
    : isPasteTarget
      ? 'border border-dashed border-orange-200 bg-white font-normal text-gray-400'
      : 'bg-gray-50 text-gray-300 active:bg-orange-50 active:text-orange-400'

  const title = recipe
    ? `${recipe.name}（タップで詳細・ダブルタップでコピー・長押しで変更・×で削除）`
    : clipboard
      ? `${dishRole}にコピー`
      : `${dishRole}を長押しで追加`

  return (
    <span className="relative inline-flex max-w-full shrink-0">
      {recipe && (
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
            if (isClipboardSource) setClipboard(null)
            onClear()
          }}
          className="absolute -right-1 -top-1 z-10 flex h-4 w-4 items-center justify-center rounded-full border border-gray-200 bg-white text-[9px] font-bold text-gray-400 hover:bg-red-500 hover:text-white"
        >
          ×
        </button>
      )}
      <button
        type="button"
        data-no-swipe
        title={title}
        {...longPress}
        onClick={onClick}
        className={`max-w-full select-none truncate whitespace-nowrap rounded-md px-1.5 py-0.5 text-sm ${slotClass}`}
      >
        {recipe ? recipe.name : isPasteTarget ? `${dishRole}へ` : dishRole}
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
    setDayRiceIncluded,
    toggleFavorite,
    toggleShoppingChecked,
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
  const [clipboard, setClipboard] = useState<Clipboard | null>(null)
  const [dayDetail, setDayDetail] = useState<number | null>(null)
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

  const removeFromPlan = (dayIndex: number, dishRole: DishRole) => {
    clearSlot(dayIndex, MEAL, dishRole)
    if (clipboard?.fromDay === dayIndex && clipboard?.fromRole === dishRole) {
      setClipboard(null)
    }
    setDetail((current) =>
      current && current.dayIndex === dayIndex && current.dishRole === dishRole
        ? null
        : current
    )
  }

  const handlePaste = (dayIndex: number, dishRole: DishRole, recipeId: string) => {
    setSlot(dayIndex, MEAL, dishRole, recipeId)
    setClipboard(null)
    hapticTap('success')
  }

  const handleUndo = () => {
    if (!undoWeeklyPlan()) return
    setClipboard(null)
    hapticTap()
  }

  return (
    <div className="space-y-3">
      <div className="relative rounded-2xl border border-orange-200/80 bg-white p-3.5 shadow-sm">
        <button
          type="button"
          onClick={handleUndo}
          disabled={planUndoCount === 0}
          aria-label={planUndoCount > 0 ? '直前の操作を戻す' : '戻せる操作はありません'}
          title={planUndoCount > 0 ? '直前の操作を戻す' : '戻せる操作はありません'}
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-35 disabled:shadow-none disabled:hover:bg-white"
        >
          <UndoIcon />
        </button>

        <div className="mb-2 flex flex-wrap items-start justify-between gap-2 pr-9">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-gray-800">今週のレシピ</h2>
            <p className="text-xs text-gray-500">
              {formatDate(weekDates[0])} 〜 {formatDate(weekDates[6])}
            </p>
            <p className="text-[10px] text-gray-400">
              長押しで追加 · ダブルタップでコピー · 曜日タップで詳細
            </p>
          </div>
          <div className="flex shrink-0 gap-1.5">
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
          </div>
        </div>
        <p className="mb-2 text-[10px] text-gray-500">{getPlanSummary(state.weeklyPlan)}</p>

        {clipboard && (
          <div className="mb-2 rounded-lg border border-amber-200 bg-amber-50/50 px-2.5 py-1.5">
            <p className="truncate text-[11px] text-amber-900/80">
              <span className="font-medium">{clipboard.recipeName}</span> をコピー中。貼り付け先をタップ
            </p>
          </div>
        )}

        <div className="space-y-2">
          {menus.map((day) => (
            <div
              key={day.dayIndex}
              className="flex items-start gap-1.5 rounded-lg border border-orange-200 bg-white px-2 py-2"
            >
              <button
                type="button"
                onClick={() => {
                  hapticTap()
                  setDayDetail(day.dayIndex)
                }}
                title={`${day.weekday}曜の詳細`}
                className="w-7 shrink-0 rounded-md bg-orange-100 py-1 text-center text-sm font-bold leading-none text-orange-800 hover:bg-orange-200"
              >
                {day.weekday}
              </button>
              <DayRiceToggle
                dayIndex={day.dayIndex}
                riceIncluded={state.dayRiceIncluded[day.dayIndex] !== false}
                onToggle={setDayRiceIncluded}
              />
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
                {day.slots.map((slot) => (
                  <WeekRecipeSlot
                    key={slot.role}
                    dayIndex={day.dayIndex}
                    dishRole={slot.role}
                    recipe={slot.recipe}
                    clipboard={clipboard}
                    setClipboard={setClipboard}
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
                    onPaste={handlePaste}
                    onClear={() => removeFromPlan(day.dayIndex, slot.role)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-orange-200/80 bg-white p-3.5 shadow-sm">
        <h2 className="text-base font-bold text-gray-800">買い物メモ</h2>
        <p className="text-xs text-gray-500">在庫にない材料。チェックして在庫へ</p>

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
