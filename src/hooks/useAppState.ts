import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import type { AppState, DishRole, ExtraShoppingItem, Genre, InventoryItem, MealType, PlannedMeal, Recipe } from '../types'
import { DISH_ROLES, GENRES } from '../types'
import { loadState, saveState, forceSaveState, requestPersistentStorage, readIdbState, isBareUserData } from '../lib/storage'
import { createId } from '../lib/id'
import { resolveRecipe } from '../lib/recipeResolver'
import { generateWeeklyPlan, getCandidateRecipes, getRecipeDuplicateKey, ingredientMatch } from '../lib/mealPlanner'
import { buildPlanShoppingItems, isShoppingChecked, toggleCheckedName } from '../lib/shoppingList'
import {
  getRecipeCatalogRevision,
  subscribeRecipeCatalog,
} from '../lib/recipeCatalogState'

function cloneWeeklyPlan(plan: PlannedMeal[]): PlannedMeal[] {
  return plan.map((p) => ({ ...p }))
}

export function useAppState() {
  const [state, setState] = useState<AppState>(() => loadState())
  const [hydrated, setHydrated] = useState(false)
  const planUndoStackRef = useRef<PlannedMeal[][]>([])
  const skipPlanUndoRef = useRef(false)
  const [planUndoCount, setPlanUndoCount] = useState(0)

  const recordWeeklyPlanUndo = useCallback((plan: PlannedMeal[]) => {
    if (skipPlanUndoRef.current) return
    planUndoStackRef.current.push(cloneWeeklyPlan(plan))
    setPlanUndoCount(planUndoStackRef.current.length)
  }, [])

  const undoWeeklyPlan = useCallback(() => {
    const snapshot = planUndoStackRef.current.pop()
    if (!snapshot) return false
    setPlanUndoCount(planUndoStackRef.current.length)
    skipPlanUndoRef.current = true
    setState((prev) => ({ ...prev, weeklyPlan: cloneWeeklyPlan(snapshot) }))
    skipPlanUndoRef.current = false
    return true
  }, [])
  const catalogRevision = useSyncExternalStore(
    subscribeRecipeCatalog,
    getRecipeCatalogRevision,
    getRecipeCatalogRevision
  )
  void catalogRevision

  useEffect(() => {
    let cancelled = false
    const initial = loadState()
    void (async () => {
      try {
        if (isBareUserData(initial)) {
          const fromIdb = await readIdbState()
          if (!cancelled && fromIdb && !isBareUserData(fromIdb)) {
            setState((prev) => (isBareUserData(prev) ? fromIdb : prev))
          }
        }
      } finally {
        if (!cancelled) setHydrated(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!hydrated) return
    saveState(state)
  }, [state, hydrated])

  useEffect(() => {
    requestPersistentStorage()
  }, [])

  const replaceState = useCallback((next: AppState) => {
    planUndoStackRef.current = []
    setPlanUndoCount(0)
    forceSaveState(next)
    setState(next)
  }, [])

  const update = useCallback((patch: Partial<AppState>) => {
    setState((prev) => ({ ...prev, ...patch }))
  }, [])

  const addInventoryItem = useCallback((name: string, quantity?: string) => {
    const item: InventoryItem = {
      id: createId(),
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
        id: createId(),
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
          id: createId(),
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
    setState((prev) => {
      recordWeeklyPlanUndo(prev.weeklyPlan)
      return {
        ...prev,
        weeklyPlan: generateWeeklyPlan(prev),
      }
    })
  }, [recordWeeklyPlanUndo])

  const setSlot = useCallback(
    (dayIndex: number, mealType: MealType, dishRole: DishRole, recipeId: string) => {
      setState((prev) => {
        const existing = prev.weeklyPlan.find(
          (p) =>
            p.dayIndex === dayIndex && p.mealType === mealType && p.dishRole === dishRole
        )
        if (existing?.recipeId === recipeId) return prev
        recordWeeklyPlanUndo(prev.weeklyPlan)
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
    [recordWeeklyPlanUndo]
  )

  const clearSlot = useCallback(
    (dayIndex: number, mealType: MealType, dishRole: DishRole) => {
      setState((prev) => {
        const exists = prev.weeklyPlan.some(
          (p) =>
            p.dayIndex === dayIndex && p.mealType === mealType && p.dishRole === dishRole
        )
        if (!exists) return prev
        recordWeeklyPlanUndo(prev.weeklyPlan)
        return {
          ...prev,
          weeklyPlan: prev.weeklyPlan.filter(
            (p) =>
              !(p.dayIndex === dayIndex && p.mealType === mealType && p.dishRole === dishRole)
          ),
        }
      })
    },
    [recordWeeklyPlanUndo]
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

          recordWeeklyPlanUndo(prev.weeklyPlan)

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
          recordWeeklyPlanUndo(prev.weeklyPlan)
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
    [recordWeeklyPlanUndo]
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
        recordWeeklyPlanUndo(prev.weeklyPlan)
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
              id: createId(),
              recipeId: slot.recipeId,
              dishRole: recipe?.dishRole ?? dishRole,
            },
          ],
        }
      })
    },
    [recordWeeklyPlanUndo]
  )

  const addToStaging = useCallback((recipeId: string, dishRole: DishRole) => {
    setState((prev) => ({
      ...prev,
      stagedRecipes: [
        ...prev.stagedRecipes,
        { id: createId(), recipeId, dishRole },
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

        recordWeeklyPlanUndo(prev.weeklyPlan)

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
              id: createId(),
              recipeId: existing.recipeId,
              dishRole: displaced?.dishRole ?? to.dishRole,
            },
          ]
        }

        return { ...prev, weeklyPlan: plan, stagedRecipes }
      })
    },
    [recordWeeklyPlanUndo]
  )

  const addCustomRecipe = useCallback(
    (name: string, dishRole: DishRole, ingredients: string[] = []) => {
    const trimmed = name.trim()
    if (!trimmed) return null

    const seen = new Set<string>()
    const parsed: string[] = []
    for (const raw of ingredients) {
      const token = raw.trim()
      if (!token || seen.has(token)) continue
      seen.add(token)
      parsed.push(token)
    }

    const recipe: Recipe = {
      id: `custom-${createId()}`,
      name: trimmed,
      genre: '和食',
      ingredients: parsed,
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

  const updateCustomRecipe = useCallback(
    (
      id: string,
      patch: { name?: string; dishRole?: DishRole; ingredients?: string[] }
    ) => {
      setState((prev) => ({
        ...prev,
        customRecipes: prev.customRecipes.map((r) => {
          if (r.id !== id) return r
          const name = patch.name !== undefined ? patch.name.trim() : r.name
          if (!name) return r
          const seen = new Set<string>()
          const ingredients =
            patch.ingredients !== undefined
              ? patch.ingredients.filter((raw) => {
                  const token = raw.trim()
                  if (!token || seen.has(token)) return false
                  seen.add(token)
                  return true
                })
              : r.ingredients
          return {
            ...r,
            name,
            dishRole: patch.dishRole ?? r.dishRole,
            ingredients,
          }
        }),
      }))
    },
    []
  )

  const removeCustomRecipe = useCallback((id: string) => {
    setState((prev) => {
      const removesFromPlan = prev.weeklyPlan.some((p) => p.recipeId === id)
      if (!removesFromPlan) {
        return {
          ...prev,
          customRecipes: prev.customRecipes.filter((r) => r.id !== id),
          stagedRecipes: prev.stagedRecipes.filter((s) => s.recipeId !== id),
          favoriteRecipeIds: prev.favoriteRecipeIds.filter((fid) => fid !== id),
        }
      }
      recordWeeklyPlanUndo(prev.weeklyPlan)
      return {
        ...prev,
        customRecipes: prev.customRecipes.filter((r) => r.id !== id),
        weeklyPlan: prev.weeklyPlan.filter((p) => p.recipeId !== id),
        stagedRecipes: prev.stagedRecipes.filter((s) => s.recipeId !== id),
        favoriteRecipeIds: prev.favoriteRecipeIds.filter((fid) => fid !== id),
      }
    })
  }, [recordWeeklyPlanUndo])

  const clearPlan = useCallback(() => {
    setState((prev) => {
      if (prev.weeklyPlan.length === 0) return prev
      recordWeeklyPlanUndo(prev.weeklyPlan)
      return { ...prev, weeklyPlan: [] }
    })
  }, [recordWeeklyPlanUndo])

  const clearDay = useCallback((dayIndex: number) => {
    setState((prev) => {
      const hasDay = prev.weeklyPlan.some((p) => p.dayIndex === dayIndex)
      if (!hasDay) return prev
      recordWeeklyPlanUndo(prev.weeklyPlan)
      return {
        ...prev,
        weeklyPlan: prev.weeklyPlan.filter((p) => p.dayIndex !== dayIndex),
      }
    })
  }, [recordWeeklyPlanUndo])

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
      if (plan.length === prev.weeklyPlan.length) return prev
      recordWeeklyPlanUndo(prev.weeklyPlan)
      return { ...prev, weeklyPlan: plan }
    })
  }, [recordWeeklyPlanUndo])

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
    updateCustomRecipe,
    removeCustomRecipe,
    clearPlan,
    clearDay,
    fillDayEmpty,
    favoriteDayRecipes,
    setShoppingFreeMemo,
    setDayRiceIncluded,
    replaceState,
    undoWeeklyPlan,
    planUndoCount,
  }
}
