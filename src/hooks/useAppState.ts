import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import type { AppState, DishRole, ExtraShoppingItem, Genre, InventoryItem, MealType, Recipe } from '../types'
import { DISH_ROLES, GENRES } from '../types'
import { loadState, saveState } from '../lib/storage'
import { resolveRecipe } from '../lib/recipeResolver'
import { generateWeeklyPlan, getCandidateRecipes, getRecipeDuplicateKey, ingredientMatch } from '../lib/mealPlanner'
import { buildPlanShoppingItems, isShoppingChecked, toggleCheckedName } from '../lib/shoppingList'
import {
  getRecipeCatalogRevision,
  subscribeRecipeCatalog,
} from '../lib/recipeCatalogState'

export function useAppState() {
  const [state, setState] = useState<AppState>(() => loadState())
  const catalogRevision = useSyncExternalStore(
    subscribeRecipeCatalog,
    getRecipeCatalogRevision,
    getRecipeCatalogRevision
  )
  void catalogRevision

  useEffect(() => {
    saveState(state)
  }, [state])

  const update = useCallback((patch: Partial<AppState>) => {
    setState((prev) => ({ ...prev, ...patch }))
  }, [])

  const addInventoryItem = useCallback((name: string, quantity?: string) => {
    const item: InventoryItem = {
      id: crypto.randomUUID(),
      name: name.trim(),
      quantity,
      wantToUse: false,
    }
    setState((prev) => ({ ...prev, inventory: [...prev.inventory, item] }))
  }, [])

  const removeInventoryItem = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      inventory: prev.inventory.filter((i) => i.id !== id),
    }))
  }, [])

  const toggleInventoryWantToUse = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      inventory: prev.inventory.map((i) =>
        i.id === id ? { ...i, wantToUse: !i.wantToUse } : i
      ),
    }))
  }, [])

  const toggleShoppingChecked = useCallback((name: string) => {
    setState((prev) => ({
      ...prev,
      shoppingCheckedNames: toggleCheckedName(name, prev.shoppingCheckedNames),
    }))
  }, [])

  const addExtraShoppingItem = useCallback((name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return
    setState((prev) => {
      const planItems = buildPlanShoppingItems(prev)
      if (planItems.some((item) => ingredientMatch(item.name, trimmed))) return prev
      if (prev.extraShoppingItems.some((item) => ingredientMatch(item.name, trimmed))) {
        return prev
      }
      const item: ExtraShoppingItem = {
        id: crypto.randomUUID(),
        name: trimmed,
        checked: false,
      }
      return { ...prev, extraShoppingItems: [...prev.extraShoppingItems, item] }
    })
  }, [])

  const toggleExtraShoppingChecked = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      extraShoppingItems: prev.extraShoppingItems.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      ),
    }))
  }, [])

  const removeExtraShoppingItem = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      extraShoppingItems: prev.extraShoppingItems.filter((item) => item.id !== id),
    }))
  }, [])

  const moveCheckedShoppingToInventory = useCallback(() => {
    setState((prev) => {
      const inventory = [...prev.inventory]
      const addIfMissing = (name: string) => {
        if (inventory.some((i) => ingredientMatch(i.name, name))) return
        inventory.push({
          id: crypto.randomUUID(),
          name,
          wantToUse: false,
        })
      }

      for (const item of buildPlanShoppingItems(prev)) {
        if (isShoppingChecked(item.name, prev.shoppingCheckedNames)) {
          addIfMissing(item.name)
        }
      }

      const extraShoppingItems = prev.extraShoppingItems.filter((item) => {
        if (!item.checked) return true
        addIfMissing(item.name)
        return false
      })

      return {
        ...prev,
        inventory,
        extraShoppingItems,
        shoppingCheckedNames: [],
      }
    })
  }, [])

  const toggleFavorite = useCallback((recipeId: string) => {
    setState((prev) => {
      const ids = prev.favoriteRecipeIds.includes(recipeId)
        ? prev.favoriteRecipeIds.filter((r) => r !== recipeId)
        : [...prev.favoriteRecipeIds, recipeId]
      return { ...prev, favoriteRecipeIds: ids }
    })
  }, [])

  const togglePreferredGenre = useCallback((genre: Genre) => {
    setState((prev) => {
      const genres = prev.preferredGenres.includes(genre)
        ? prev.preferredGenres.filter((g) => g !== genre)
        : [...prev.preferredGenres, genre]
      return { ...prev, preferredGenres: genres }
    })
  }, [])

  const toggleDayGenre = useCallback((dayIndex: number, genre: Genre) => {
    setState((prev) => {
      const current = prev.dayDisabledGenres[dayIndex] ?? []
      const disabled = current.includes(genre)
        ? current.filter((g) => g !== genre)
        : [...current, genre]

      const next = { ...prev.dayDisabledGenres }
      if (disabled.length === 0) {
        delete next[dayIndex]
      } else {
        next[dayIndex] = disabled
      }
      return { ...prev, dayDisabledGenres: next }
    })
  }, [])

  const setAllDayGenres = useCallback((dayIndex: number, enabled: boolean) => {
    setState((prev) => {
      const next = { ...prev.dayDisabledGenres }
      if (enabled) {
        delete next[dayIndex]
      } else {
        next[dayIndex] = [...GENRES]
      }
      return { ...prev, dayDisabledGenres: next }
    })
  }, [])

  const autoGenerate = useCallback(() => {
    setState((prev) => ({
      ...prev,
      weeklyPlan: generateWeeklyPlan(prev),
    }))
  }, [])

  const setSlot = useCallback(
    (dayIndex: number, mealType: MealType, dishRole: DishRole, recipeId: string) => {
      setState((prev) => {
        const filtered = prev.weeklyPlan.filter(
          (p) =>
            !(p.dayIndex === dayIndex && p.mealType === mealType && p.dishRole === dishRole)
        )
        return {
          ...prev,
          weeklyPlan: [...filtered, { dayIndex, mealType, dishRole, recipeId, manual: true }],
        }
      })
    },
    []
  )

  const clearSlot = useCallback(
    (dayIndex: number, mealType: MealType, dishRole: DishRole) => {
      setState((prev) => ({
        ...prev,
        weeklyPlan: prev.weeklyPlan.filter(
          (p) =>
            !(p.dayIndex === dayIndex && p.mealType === mealType && p.dishRole === dishRole)
        ),
      }))
    },
    []
  )

  const moveSlot = useCallback(
    (
      from: { dayIndex: number; mealType: MealType; dishRole: DishRole } | null,
      to: { dayIndex: number; mealType: MealType; dishRole: DishRole },
      recipeId?: string
    ) => {
      setState((prev) => {
        let plan = [...prev.weeklyPlan]
        const toIdx = plan.findIndex(
          (p) =>
            p.dayIndex === to.dayIndex &&
            p.mealType === to.mealType &&
            p.dishRole === to.dishRole
        )
        const toRecipeId = toIdx >= 0 ? plan[toIdx].recipeId : undefined

        if (from) {
          const fromIdx = plan.findIndex(
            (p) =>
              p.dayIndex === from.dayIndex &&
              p.mealType === from.mealType &&
              p.dishRole === from.dishRole
          )
          if (fromIdx < 0) return prev
          const fromRecipeId = plan[fromIdx].recipeId

          if (from.dishRole === to.dishRole) {
            plan = plan.filter((_, i) => i !== fromIdx && i !== toIdx)
            plan.push({ ...to, recipeId: fromRecipeId, manual: true })
            if (toRecipeId) {
              plan.push({ ...from, recipeId: toRecipeId, manual: true })
            }
          } else {
            plan = plan.filter((_, i) => i !== fromIdx && i !== toIdx)
            plan.push({ ...to, recipeId: fromRecipeId, manual: true })
          }
        } else if (recipeId) {
          plan = plan.filter(
            (p) =>
              !(
                p.dayIndex === to.dayIndex &&
                p.mealType === to.mealType &&
                p.dishRole === to.dishRole
              )
          )
          plan.push({ ...to, recipeId, manual: true })
        }

        return { ...prev, weeklyPlan: plan }
      })
    },
    []
  )

  const moveSlotToStaging = useCallback(
    (dayIndex: number, mealType: MealType, dishRole: DishRole) => {
      setState((prev) => {
        const slot = prev.weeklyPlan.find(
          (p) =>
            p.dayIndex === dayIndex && p.mealType === mealType && p.dishRole === dishRole
        )
        if (!slot) return prev
        const recipe = resolveRecipe(slot.recipeId, prev.customRecipes)
        return {
          ...prev,
          weeklyPlan: prev.weeklyPlan.filter(
            (p) =>
              !(
                p.dayIndex === dayIndex &&
                p.mealType === mealType &&
                p.dishRole === dishRole
              )
          ),
          stagedRecipes: [
            ...prev.stagedRecipes,
            {
              id: crypto.randomUUID(),
              recipeId: slot.recipeId,
              dishRole: recipe?.dishRole ?? dishRole,
            },
          ],
        }
      })
    },
    []
  )

  const addToStaging = useCallback((recipeId: string, dishRole: DishRole) => {
    setState((prev) => ({
      ...prev,
      stagedRecipes: [
        ...prev.stagedRecipes,
        { id: crypto.randomUUID(), recipeId, dishRole },
      ],
    }))
  }, [])

  const removeFromStaging = useCallback((stagedId: string) => {
    setState((prev) => ({
      ...prev,
      stagedRecipes: prev.stagedRecipes.filter((s) => s.id !== stagedId),
    }))
  }, [])

  const clearStaging = useCallback(() => {
    setState((prev) => ({ ...prev, stagedRecipes: [] }))
  }, [])

  const moveFromStagingToSlot = useCallback(
    (
      stagedId: string,
      to: { dayIndex: number; mealType: MealType; dishRole: DishRole }
    ) => {
      setState((prev) => {
        const staged = prev.stagedRecipes.find((s) => s.id === stagedId)
        if (!staged) return prev

        const existing = prev.weeklyPlan.find(
          (p) =>
            p.dayIndex === to.dayIndex &&
            p.mealType === to.mealType &&
            p.dishRole === to.dishRole
        )

        let plan = prev.weeklyPlan.filter(
          (p) =>
            !(
              p.dayIndex === to.dayIndex &&
              p.mealType === to.mealType &&
              p.dishRole === to.dishRole
            )
        )
        plan.push({
          dayIndex: to.dayIndex,
          mealType: to.mealType,
          dishRole: to.dishRole,
          recipeId: staged.recipeId,
          manual: true,
        })

        let stagedRecipes = prev.stagedRecipes.filter((s) => s.id !== stagedId)
        if (existing) {
          const displaced = resolveRecipe(existing.recipeId, prev.customRecipes)
          stagedRecipes = [
            ...stagedRecipes,
            {
              id: crypto.randomUUID(),
              recipeId: existing.recipeId,
              dishRole: displaced?.dishRole ?? to.dishRole,
            },
          ]
        }

        return { ...prev, weeklyPlan: plan, stagedRecipes }
      })
    },
    []
  )

  const addCustomRecipe = useCallback((name: string, dishRole: DishRole) => {
    const trimmed = name.trim()
    if (!trimmed) return null

    const recipe: Recipe = {
      id: `custom-${crypto.randomUUID()}`,
      name: trimmed,
      genre: '和食',
      ingredients: [],
      cookingTime: 0,
      difficulty: '普通',
      description: '手入力レシピ',
      dishRole,
      custom: true,
    }

    setState((prev) => ({
      ...prev,
      customRecipes: [...prev.customRecipes, recipe],
    }))
    return recipe.id
  }, [])

  const clearPlan = useCallback(() => {
    setState((prev) => ({ ...prev, weeklyPlan: [] }))
  }, [])

  const clearDay = useCallback((dayIndex: number) => {
    setState((prev) => ({
      ...prev,
      weeklyPlan: prev.weeklyPlan.filter((p) => p.dayIndex !== dayIndex),
    }))
  }, [])

  const fillDayEmpty = useCallback((dayIndex: number) => {
    setState((prev) => {
      const usedIds = new Set(prev.weeklyPlan.map((p) => p.recipeId))
      const usedDuplicateKeys = new Set(
        prev.weeklyPlan
          .map((p) => resolveRecipe(p.recipeId, prev.customRecipes))
          .filter((r): r is NonNullable<typeof r> => !!r)
          .map((r) => getRecipeDuplicateKey(r.name))
      )
      let plan = [...prev.weeklyPlan]
      for (const dishRole of DISH_ROLES) {
        const exists = plan.some(
          (p) => p.dayIndex === dayIndex && p.mealType === '夜' && p.dishRole === dishRole
        )
        if (exists) continue
        const candidates = getCandidateRecipes(dishRole, prev, dayIndex, 20).filter(
          (r) =>
            !usedIds.has(r.id) && !usedDuplicateKeys.has(getRecipeDuplicateKey(r.name))
        )
        const pick = candidates[0]
        if (!pick) continue
        usedIds.add(pick.id)
        usedDuplicateKeys.add(getRecipeDuplicateKey(pick.name))
        plan.push({ dayIndex, mealType: '夜', dishRole, recipeId: pick.id })
      }
      return { ...prev, weeklyPlan: plan }
    })
  }, [])

  const favoriteDayRecipes = useCallback((dayIndex: number) => {
    setState((prev) => {
      const ids = prev.weeklyPlan
        .filter((p) => p.dayIndex === dayIndex)
        .map((p) => p.recipeId)
      if (ids.length === 0) return prev
      const next = new Set(prev.favoriteRecipeIds)
      for (const id of ids) next.add(id)
      return { ...prev, favoriteRecipeIds: [...next] }
    })
  }, [])

  const setShoppingFreeMemo = useCallback((note: string) => {
    setState((prev) =>
      prev.shoppingFreeMemo === note ? prev : { ...prev, shoppingFreeMemo: note }
    )
  }, [])

  const setDayRiceIncluded = useCallback((dayIndex: number, included: boolean) => {
    setState((prev) => ({
      ...prev,
      dayRiceIncluded: { ...prev.dayRiceIncluded, [dayIndex]: included },
    }))
  }, [])

  return {
    state,
    update,
    addInventoryItem,
    removeInventoryItem,
    toggleInventoryWantToUse,
    toggleShoppingChecked,
    addExtraShoppingItem,
    toggleExtraShoppingChecked,
    removeExtraShoppingItem,
    moveCheckedShoppingToInventory,
    toggleFavorite,
    togglePreferredGenre,
    toggleDayGenre,
    setAllDayGenres,
    autoGenerate,
    setSlot,
    clearSlot,
    moveSlot,
    moveSlotToStaging,
    addToStaging,
    removeFromStaging,
    clearStaging,
    moveFromStagingToSlot,
    addCustomRecipe,
    clearPlan,
    clearDay,
    fillDayEmpty,
    favoriteDayRecipes,
    setShoppingFreeMemo,
    setDayRiceIncluded,
  }
}
