import { useState } from 'react'
import type { DragPayload } from '../lib/weeklyPlanDrag'
import { resolveRecipe } from '../lib/recipeResolver'
import {
  DAYS,
  DISH_ROLE_EMOJI,
  DISH_ROLES,
  type DishRole,
  type MealType,
  type PlannedMeal,
  type Recipe,
} from '../types'
import { formatDate } from '../lib/storage'
import { hapticTap } from '../lib/haptic'
import { getSlot } from '../lib/mealPlanner'
import { slotKey as planSlotKey } from '../lib/weeklyPlanDrag'
import { RecipeDetailPopup } from './RecipeDetailPopup'

const MEAL: MealType = '夜'

function slotKey(dayIndex: number, dishRole: DishRole) {
  return planSlotKey(dayIndex, MEAL, dishRole)
}

function getFilledCount(
  weeklyPlan: PlannedMeal[],
  customRecipes: Recipe[],
  dayIndex: number
): number {
  return DISH_ROLES.filter((role) => {
    const slot = getSlot(weeklyPlan, dayIndex, MEAL, role)
    return slot && resolveRecipe(slot.recipeId, customRecipes)
  }).length
}

function DayRiceToggle({
  dayIndex,
  riceIncluded,
  onToggle,
}: {
  dayIndex: number
  riceIncluded: boolean
  onToggle: (dayIndex: number, included: boolean) => void
}) {
  return (
    <button
      type="button"
      aria-label={riceIncluded ? 'ご飯あり' : 'ご飯なし'}
      title={riceIncluded ? 'ご飯1杯をカロリーに含める' : 'ご飯なし'}
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
        onToggle(dayIndex, !riceIncluded)
      }}
      className={`inline-flex h-5 w-5 items-center justify-center rounded-full border text-[10px] leading-none transition ${
        riceIncluded
          ? 'border-amber-400 bg-amber-100 shadow-sm'
          : 'border-gray-200 bg-gray-50 opacity-40 grayscale'
      }`}
    >
      🍚
    </button>
  )
}

function MealSlotCell({
  dayIndex,
  dishRole,
  recipe,
  isSelected,
  isOver,
  onSelect,
  onDrop,
  onClear,
  onDragStart,
  setDragOverKey,
}: {
  dayIndex: number
  dishRole: DishRole
  recipe?: Recipe
  isSelected: boolean
  isOver: boolean
  onSelect: () => void
  onDrop: (e: React.DragEvent) => void
  onClear: () => void
  onDragStart: (e: React.DragEvent, payload: DragPayload) => void
  setDragOverKey: (key: string | null) => void
}) {
  const key = slotKey(dayIndex, dishRole)

  return (
    <div
      data-no-swipe
      data-pressable
      onDragOver={(e) => {
        e.preventDefault()
        setDragOverKey(key)
      }}
      onDragLeave={() => setDragOverKey(null)}
      onDrop={onDrop}
      onClick={() => {
        hapticTap()
        onSelect()
      }}
      aria-label={recipe ? `${recipe.name}の詳細` : `${dishRole}を選択`}
      className={`relative min-h-[2.5rem] cursor-pointer rounded-md border border-dashed p-1 transition-colors ${
        isOver
          ? 'border-orange-400 bg-orange-100/90'
          : recipe
            ? 'border-orange-200/90 bg-white'
            : isSelected
              ? 'border-amber-400 bg-amber-50/90 ring-1 ring-amber-300/60'
              : 'border-orange-100 bg-orange-50/40'
      }`}
    >
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
            onClear()
          }}
          className="absolute -right-0.5 -top-0.5 z-10 flex h-4 w-4 items-center justify-center rounded-full border border-gray-200 bg-white text-[9px] font-bold text-gray-400 hover:bg-red-500 hover:text-white"
        >
          ×
        </button>
      )}

      <p className="text-[9px] font-medium text-gray-400 leading-none">
        {DISH_ROLE_EMOJI[dishRole]}
      </p>

      {recipe ? (
        <div
          draggable
          onDragStart={(e) =>
            onDragStart(e, {
              source: 'slot',
              dayIndex,
              mealType: MEAL,
              dishRole,
              recipeId: recipe.id,
            })
          }
          className="mt-0.5 cursor-grab active:cursor-grabbing"
        >
          <p className="line-clamp-1 text-sm font-medium leading-tight text-gray-800">
            {recipe.name}
          </p>
        </div>
      ) : (
        <p className="mt-0.5 text-center text-[9px] text-gray-300">
          {isSelected ? '選択' : '—'}
        </p>
      )}
    </div>
  )
}

interface Props {
  weekDates: Date[]
  weeklyPlan: PlannedMeal[]
  customRecipes: Recipe[]
  dayRiceIncluded: Partial<Record<number, boolean>>
  activeDay: number
  targetRole: DishRole
  dragOverKey: string | null
  setActiveDay: (dayIndex: number) => void
  setTargetRole: (role: DishRole) => void
  setDragOverKey: (key: string | null) => void
  onDrop: (e: React.DragEvent, dayIndex: number, dishRole: DishRole) => void
  onClear: (dayIndex: number, mealType: MealType, dishRole: DishRole) => void
  onDragStart: (e: React.DragEvent, payload: DragPayload) => void
  onToggleRice: (dayIndex: number, included: boolean) => void
  favoriteIds: string[]
  onToggleFavorite: (recipeId: string) => void
  onEditCustom?: (recipe: Recipe) => void
}

/** スマホ縦向き前提：7日分を縦リストで一覧 */
export function WeekAtGlanceBoard({
  weekDates,
  weeklyPlan,
  customRecipes,
  dayRiceIncluded,
  activeDay,
  targetRole,
  dragOverKey,
  setActiveDay,
  setTargetRole,
  setDragOverKey,
  onDrop,
  onClear,
  onDragStart,
  onToggleRice,
  favoriteIds,
  onToggleFavorite,
  onEditCustom,
}: Props) {
  const [detail, setDetail] = useState<{
    recipe: Recipe
    dayIndex: number
    dishRole: DishRole
  } | null>(null)

  const selectSlot = (dayIndex: number, role: DishRole, recipe?: Recipe) => {
    setActiveDay(dayIndex)
    setTargetRole(role)
    if (recipe) setDetail({ recipe, dayIndex, dishRole: role })
  }

  return (
    <div className="space-y-1">
      {DAYS.map((day, dayIndex) => {
        const filled = getFilledCount(weeklyPlan, customRecipes, dayIndex)
        const riceIncluded = dayRiceIncluded[dayIndex] !== false
        const isActiveDay = activeDay === dayIndex

        return (
          <div
            key={day}
            className={`rounded-lg border p-1.5 transition ${
              isActiveDay
                ? 'border-orange-300 bg-orange-50/50 shadow-sm'
                : 'border-orange-100/80 bg-white/80'
            }`}
          >
            <div className="mb-1 flex items-center justify-between gap-1 px-0.5">
              <button
                type="button"
                onClick={() => {
                  hapticTap()
                  setActiveDay(dayIndex)
                }}
                className="flex min-w-0 items-center gap-1.5 text-left"
              >
                <span
                  className={`text-sm font-bold ${isActiveDay ? 'text-orange-600' : 'text-gray-700'}`}
                >
                  {day}
                </span>
                <span className="text-[10px] text-gray-400">{formatDate(weekDates[dayIndex])}</span>
                <span
                  className={`rounded-full px-1.5 py-px text-[9px] font-medium ${
                    filled === 3
                      ? 'bg-orange-500 text-orange-950'
                      : filled > 0
                        ? 'bg-neutral-200 text-neutral-700'
                        : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {filled}/3
                </span>
              </button>
              <DayRiceToggle
                dayIndex={dayIndex}
                riceIncluded={riceIncluded}
                onToggle={onToggleRice}
              />
            </div>
            <div className="grid grid-cols-3 gap-1">
              {DISH_ROLES.map((role) => {
                const slot = getSlot(weeklyPlan, dayIndex, MEAL, role)
                const recipe = slot ? resolveRecipe(slot.recipeId, customRecipes) : undefined
                const key = slotKey(dayIndex, role)
                return (
                  <MealSlotCell
                    key={key}
                    dayIndex={dayIndex}
                    dishRole={role}
                    recipe={recipe}
                    isSelected={activeDay === dayIndex && targetRole === role}
                    isOver={dragOverKey === key}
                    onSelect={() => selectSlot(dayIndex, role, recipe)}
                    onDrop={(e) => onDrop(e, dayIndex, role)}
                    onClear={() => onClear(dayIndex, MEAL, role)}
                    onDragStart={onDragStart}
                    setDragOverKey={setDragOverKey}
                  />
                )
              })}
            </div>
          </div>
        )
      })}
      {detail && (
        <RecipeDetailPopup
          recipe={detail.recipe}
          dayIndex={detail.dayIndex}
          dishRole={detail.dishRole}
          isFavorite={favoriteIds.includes(detail.recipe.id)}
          onClose={() => setDetail(null)}
          onToggleFavorite={onToggleFavorite}
          onClear={() => onClear(detail.dayIndex, MEAL, detail.dishRole)}
          onEdit={
            detail.recipe.custom && onEditCustom
              ? (recipe) => {
                  onEditCustom(recipe)
                  setDetail(null)
                }
              : undefined
          }
        />
      )}
    </div>
  )
}
