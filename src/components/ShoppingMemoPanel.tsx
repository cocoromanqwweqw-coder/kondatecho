import { useEffect, useMemo, useRef, useState } from 'react'
import type { DishRole, Recipe } from '../types'
import { DAYS } from '../types'
import type { useAppState } from '../hooks/useAppState'
import {
  buildPlanShoppingItems,
  buildWeekMenus,
  groupPlanShoppingItems,
  isShoppingChecked,
} from '../lib/shoppingList'
import { InventoryPanel } from './InventoryPanel'
import { RecipeDetailPopup } from './RecipeDetailPopup'
import { useDisplayMode } from '../hooks/useDisplayMode'

type App = ReturnType<typeof useAppState>

interface Props {
  app: App
  onGoPlan: () => void
  onOpenCustomPanel?: (recipeId: string) => void
}

type Detail = {
  recipe: Recipe
  dayIndex: number
  dishRole: DishRole
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

export function ShoppingMemoPanel({ app, onGoPlan, onOpenCustomPanel }: Props) {
  const {
    state,
    toggleFavorite,
    toggleShoppingChecked,
    moveCheckedShoppingToInventory,
    setShoppingFreeMemo,
  } = app
  const { isDesktopLayout } = useDisplayMode()
  const [detail, setDetail] = useState<Detail | null>(null)

  const menus = useMemo(() => buildWeekMenus(state), [state])
  const planItems = useMemo(() => buildPlanShoppingItems(state), [state])
  const shoppingGroups = useMemo(() => groupPlanShoppingItems(planItems), [planItems])

  const checkedCount = planItems.filter((item) =>
    isShoppingChecked(item.name, state.shoppingCheckedNames)
  ).length
  const listCount = planItems.length

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-orange-200/80 bg-white p-3.5 shadow-sm">
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <h2 className="text-base font-bold text-gray-800">今週のレシピ</h2>
          <button
            type="button"
            onClick={onGoPlan}
            className="shrink-0 text-xs font-medium text-orange-600 hover:text-orange-700"
          >
            週間献立へ
          </button>
        </div>

        <div className="space-y-2">
          {menus.map((day) => (
            <div
              key={day.dayIndex}
              className="flex items-start gap-2 rounded-lg border border-orange-200 bg-white px-2 py-2"
            >
              <p className="w-7 shrink-0 rounded-md bg-orange-100 py-1 text-center text-sm font-bold leading-none text-orange-800">
                {day.weekday}
              </p>
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
                {day.slots.map((slot) =>
                  slot.recipe ? (
                    <button
                      key={slot.role}
                      type="button"
                      onClick={() =>
                        setDetail({
                          recipe: slot.recipe!,
                          dayIndex: day.dayIndex,
                          dishRole: slot.role,
                        })
                      }
                      title={slot.recipe.name}
                      className="max-w-full shrink-0 truncate whitespace-nowrap rounded-md bg-orange-50 px-1.5 py-0.5 text-sm font-medium text-gray-800 hover:bg-orange-100"
                    >
                      {slot.recipe.name}
                    </button>
                  ) : (
                    <span
                      key={slot.role}
                      className="shrink-0 rounded-md bg-gray-50 px-1.5 py-0.5 text-sm text-gray-400"
                    >
                      {slot.role}
                    </span>
                  )
                )}
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
          onEdit={
            detail.recipe.custom && onOpenCustomPanel
              ? (recipe) => onOpenCustomPanel(recipe.id)
              : undefined
          }
        />
      )}
    </div>
  )
}
