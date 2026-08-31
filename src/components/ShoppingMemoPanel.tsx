import { useMemo, useState } from 'react'
import type { DishRole, Recipe } from '../types'
import { DAYS, DISH_ROLE_EMOJI } from '../types'
import type { useAppState } from '../hooks/useAppState'
import { formatDate, getWeekDates } from '../lib/storage'
import { ingredientMatch } from '../lib/mealPlanner'
import {
  buildPlanShoppingItems,
  buildWeekMenus,
  isShoppingChecked,
} from '../lib/shoppingList'
import { InventoryPanel } from './InventoryPanel'
import { RecipeDetailPopup } from './RecipeDetailPopup'

type App = ReturnType<typeof useAppState>

interface Props {
  app: App
  onGoPlan: () => void
}

type Detail = {
  recipe: Recipe
  dayIndex: number
  dishRole: DishRole
}

export function ShoppingMemoPanel({ app, onGoPlan }: Props) {
  const {
    state,
    toggleFavorite,
    toggleShoppingChecked,
    addExtraShoppingItem,
    toggleExtraShoppingChecked,
    removeExtraShoppingItem,
    moveCheckedShoppingToInventory,
  } = app
  const [extraName, setExtraName] = useState('')
  const [detail, setDetail] = useState<Detail | null>(null)

  const weekDates = getWeekDates(state.weekStartDate)
  const menus = useMemo(() => buildWeekMenus(state), [state])
  const planItems = useMemo(() => buildPlanShoppingItems(state), [state])

  const extraItems = useMemo(
    () =>
      state.extraShoppingItems.filter(
        (item) => !planItems.some((plan) => ingredientMatch(plan.name, item.name))
      ),
    [planItems, state.extraShoppingItems]
  )
  const checkedPlanCount = planItems.filter((item) =>
    isShoppingChecked(item.name, state.shoppingCheckedNames)
  ).length
  const checkedExtraCount = extraItems.filter((item) => item.checked).length
  const checkedCount = checkedPlanCount + checkedExtraCount
  const listCount = planItems.length + extraItems.length
  const dayNotes = DAYS.map((weekday, dayIndex) => ({
    dayIndex,
    weekday,
    note: state.dayShoppingNotes[dayIndex]?.trim() ?? '',
  })).filter((row) => row.note)

  const handleAddExtra = () => {
    addExtraShoppingItem(extraName)
    setExtraName('')
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-800">今週のレシピ</h2>
            <p className="mt-0.5 text-sm text-gray-500">
              {formatDate(weekDates[0])} 〜 {formatDate(weekDates[6])} の夜ごはん
            </p>
          </div>
          <button
            type="button"
            onClick={onGoPlan}
            className="shrink-0 text-xs font-medium text-orange-600 hover:text-orange-700"
          >
            週間献立へ
          </button>
        </div>

        <div className="divide-y divide-gray-50">
          {menus.map((day) => (
            <div key={day.dayIndex} className="py-3 first:pt-0 last:pb-0">
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <p className="text-sm font-bold text-gray-700">
                  {day.weekday} {day.dateLabel}
                  <span className="ml-2 text-xs font-medium text-gray-400">
                    {day.filled}/3
                  </span>
                </p>
                {day.filled === 0 && (
                  <button
                    type="button"
                    onClick={onGoPlan}
                    className="text-xs text-orange-500 hover:text-orange-700"
                  >
                    週間献立へ
                  </button>
                )}
              </div>
              <ul className="space-y-1">
                {day.slots.map((slot) => (
                  <li key={slot.role}>
                    {slot.recipe ? (
                      <button
                        type="button"
                        onClick={() =>
                          setDetail({
                            recipe: slot.recipe!,
                            dayIndex: day.dayIndex,
                            dishRole: slot.role,
                          })
                        }
                        className="flex w-full items-center gap-2 rounded-lg px-1.5 py-1 text-left text-sm text-gray-800 hover:bg-orange-50"
                      >
                        <span className="w-10 shrink-0 text-xs text-gray-400">
                          {DISH_ROLE_EMOJI[slot.role]}
                        </span>
                        <span className="min-w-0 flex-1 truncate font-medium">
                          {slot.recipe.name}
                        </span>
                      </button>
                    ) : (
                      <p className="flex items-center gap-2 px-1.5 py-1 text-sm text-gray-400">
                        <span className="w-10 shrink-0 text-xs">
                          {DISH_ROLE_EMOJI[slot.role]}
                        </span>
                        未定
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-gray-800">買い物メモ</h2>
        <p className="mt-0.5 text-sm text-gray-500">
          献立の材料のうち、在庫にないものをまとめます。チェックして在庫へ移せます
        </p>

        <div className="mt-4 flex gap-2">
          <input
            type="text"
            value={extraName}
            onChange={(e) => setExtraName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddExtra()}
            placeholder="手で追加（例: 牛乳）"
            className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
          <button
            type="button"
            onClick={handleAddExtra}
            className="shrink-0 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-orange-600"
          >
            追加
          </button>
        </div>

        {checkedCount > 0 && (
          <button
            type="button"
            onClick={moveCheckedShoppingToInventory}
            className="mt-3 w-full rounded-xl border border-orange-200 bg-orange-50 px-4 py-2.5 text-sm font-medium text-orange-700 hover:bg-orange-100"
          >
            チェックした {checkedCount} 件を在庫へ
          </button>
        )}

        {listCount === 0 ? (
          <p className="mt-4 rounded-xl bg-gray-50 px-4 py-6 text-center text-sm text-gray-400">
            献立を入れると、足りない食材がここに出ます
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-gray-50">
            {planItems.map((item) => {
              const checked = isShoppingChecked(item.name, state.shoppingCheckedNames)
              const dayLabel = item.days.map((d) => DAYS[d]).join('・')
              return (
                <li key={`plan-${item.name}`} className="flex items-start gap-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleShoppingChecked(item.name)}
                    className="mt-1 h-4 w-4 accent-orange-500"
                    aria-label={`${item.name}を買った`}
                  />
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm font-medium ${checked ? 'text-gray-400 line-through' : 'text-gray-800'}`}
                    >
                      {item.name}
                      {item.count > 1 && (
                        <span className="ml-1.5 text-xs font-normal text-gray-400">
                          ×{item.count}
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-400">
                      {dayLabel}
                      {item.recipeNames.length > 0 ? ` · ${item.recipeNames.join('、')}` : ''}
                    </p>
                  </div>
                </li>
              )
            })}
            {extraItems.map((item) => (
              <li key={item.id} className="flex items-start gap-3 py-2.5">
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={() => toggleExtraShoppingChecked(item.id)}
                  className="mt-1 h-4 w-4 accent-orange-500"
                  aria-label={`${item.name}を買った`}
                />
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-sm font-medium ${item.checked ? 'text-gray-400 line-through' : 'text-gray-800'}`}
                  >
                    {item.name}
                    <span className="ml-1.5 text-xs font-normal text-gray-400">手入力</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeExtraShoppingItem(item.id)}
                  className="text-sm text-gray-300 transition hover:text-red-400"
                  aria-label={`${item.name}を削除`}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}

        {dayNotes.length > 0 && (
          <div className="mt-4 border-t border-gray-100 pt-4">
            <p className="mb-2 text-xs font-medium text-gray-500">曜日メモ</p>
            <ul className="space-y-1.5">
              {dayNotes.map((row) => (
                <li key={row.dayIndex} className="text-sm text-gray-600">
                  <span className="mr-2 font-medium text-gray-500">{row.weekday}</span>
                  {row.note}
                </li>
              ))}
            </ul>
          </div>
        )}
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
        />
      )}
    </div>
  )
}
