import type { AppState, DishRole, Recipe } from '../types'
import { DAYS, DISH_ROLES } from '../types'
import { classifyIngredient, SHOPPING_CATEGORIES, type ShoppingCategory } from './ingredientCategory'
import { getSlot, ingredientMatch } from './mealPlanner'
import { resolveRecipe } from './recipeResolver'
import { formatDate, getWeekDates } from './storage'

export type WeekDayMenu = {
  dayIndex: number
  dateLabel: string
  weekday: string
  slots: { role: DishRole; recipe: Recipe | undefined }[]
  filled: number
}

export type PlanShoppingItem = {
  name: string
  count: number
  days: number[]
  recipeNames: string[]
}

export function buildWeekMenus(state: AppState): WeekDayMenu[] {
  const dates = getWeekDates(state.weekStartDate)
  return DAYS.map((weekday, dayIndex) => {
    const slots = DISH_ROLES.map((role) => {
      const slot = getSlot(state.weeklyPlan, dayIndex, '夜', role)
      const recipe = slot
        ? resolveRecipe(slot.recipeId, state.customRecipes)
        : undefined
      return { role, recipe }
    })
    return {
      dayIndex,
      dateLabel: formatDate(dates[dayIndex]),
      weekday,
      slots,
      filled: slots.filter((s) => s.recipe).length,
    }
  })
}

export function buildPlanShoppingItems(state: AppState): PlanShoppingItem[] {
  const inventoryNames = state.inventory.map((i) => i.name)
  const groups: PlanShoppingItem[] = []

  for (const meal of state.weeklyPlan) {
    const recipe = resolveRecipe(meal.recipeId, state.customRecipes)
    if (!recipe) continue
    for (const ing of recipe.ingredients) {
      if (inventoryNames.some((stock) => ingredientMatch(ing, stock))) continue
      const existing = groups.find((g) => ingredientMatch(g.name, ing))
      if (existing) {
        existing.count += 1
        if (!existing.days.includes(meal.dayIndex)) existing.days.push(meal.dayIndex)
        if (!existing.recipeNames.includes(recipe.name)) {
          existing.recipeNames.push(recipe.name)
        }
      } else {
        groups.push({
          name: ing,
          count: 1,
          days: [meal.dayIndex],
          recipeNames: [recipe.name],
        })
      }
    }
  }

  for (const g of groups) g.days.sort((a, b) => a - b)
  groups.sort((a, b) => {
    const cat =
      SHOPPING_CATEGORIES.indexOf(classifyIngredient(a.name)) -
      SHOPPING_CATEGORIES.indexOf(classifyIngredient(b.name))
    if (cat !== 0) return cat
    return a.name.localeCompare(b.name, 'ja')
  })
  return groups
}

export type ShoppingItemGroup = {
  category: ShoppingCategory
  items: PlanShoppingItem[]
}

export function groupPlanShoppingItems(items: PlanShoppingItem[]): ShoppingItemGroup[] {
  const buckets = new Map<ShoppingCategory, PlanShoppingItem[]>()
  for (const category of SHOPPING_CATEGORIES) buckets.set(category, [])
  for (const item of items) {
    buckets.get(classifyIngredient(item.name))!.push(item)
  }
  return SHOPPING_CATEGORIES.map((category) => ({
    category,
    items: buckets.get(category) ?? [],
  })).filter((group) => group.items.length > 0)
}

export function isShoppingChecked(name: string, checkedNames: string[]): boolean {
  return checkedNames.some((c) => ingredientMatch(c, name))
}

export function toggleCheckedName(name: string, checkedNames: string[]): string[] {
  if (isShoppingChecked(name, checkedNames)) {
    return checkedNames.filter((c) => !ingredientMatch(c, name))
  }
  return [...checkedNames, name]
}
