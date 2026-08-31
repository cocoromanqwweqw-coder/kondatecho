import type { DishRole, MealType } from '../types'

export type DragPayload =
  | {
      source: 'slot'
      dayIndex: number
      mealType: MealType
      dishRole: DishRole
      recipeId: string
    }
  | { source: 'candidate'; recipeId: string; dishRole: DishRole }
  | {
      source: 'staging'
      stagedId: string
      recipeId: string
      dishRole: DishRole
    }

export const STAGING_DROP_KEY = '__staging__'

export function slotKey(dayIndex: number, mealType: MealType, dishRole: DishRole) {
  return `${dayIndex}-${mealType}-${dishRole}`
}
