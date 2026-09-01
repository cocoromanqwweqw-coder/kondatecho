import type {
  AppState,
  ExtraShoppingItem,
  InventoryItem,
  PlannedMeal,
  Recipe,
  StagedRecipe,
} from '../types'

const STORAGE_KEY = 'weekly-menu-app'
/** 手入力は公開更新で本体が壊れても残す */
const CUSTOM_RECIPES_KEY = 'weekly-menu-custom-recipes'
const INVENTORY_KEY = 'weekly-menu-inventory'
const PLAN_KEY = 'weekly-menu-plan'
const SHOPPING_KEY = 'weekly-menu-shopping'
const FAVORITES_KEY = 'weekly-menu-favorites'
const IDB_NAME = 'kondatecho'
const IDB_STORE = 'kv'

const defaultState: AppState = {
  inventory: [],
  favoriteRecipeIds: [],
  weeklyPlan: [],
  stagedRecipes: [],
  preferredGenres: [],
  dayDisabledGenres: {},
  weekStartDate: formatLocalDateKey(getSunday(new Date())),
  dayShoppingNotes: {},
  shoppingCheckedNames: [],
  extraShoppingItems: [],
  shoppingFreeMemo: '',
  dayPrepNotes: {},
  dayRiceIncluded: {},
  customRecipes: [],
}

/** その週の日曜日（週の始まり） */
function getSunday(d: Date): Date {
  const date = new Date(d)
  const day = date.getDay() // 0=日
  date.setDate(date.getDate() - day)
  date.setHours(0, 0, 0, 0)
  return date
}

/** ローカル日付を YYYY-MM-DD に（UTC ずれを避ける） */
function formatLocalDateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** YYYY-MM-DD をローカル日付として解釈 */
function parseLocalDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d, 0, 0, 0, 0)
}

function isTodayInWeek(weekStartKey: string, today = new Date()): boolean {
  const start = parseLocalDateKey(weekStartKey)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  const t = new Date(today)
  t.setHours(0, 0, 0, 0)
  return t >= start && t <= end
}

/** 旧・月曜始まり dayIndex(0=月…6=日) → 日曜始まり(0=日…6=土) */
function toSundayFirstIndex(mondayFirstIndex: number): number {
  return (mondayFirstIndex + 1) % 7
}

function sanitizeCustomRecipes(raw: unknown): Recipe[] {
  if (!Array.isArray(raw)) return []
  const result: Recipe[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const row = item as Partial<Recipe>
    if (typeof row.id !== 'string' || !row.id.trim()) continue
    if (typeof row.name !== 'string' || !row.name.trim()) continue
    result.push({
      ...(row as Recipe),
      id: row.id,
      name: row.name.trim(),
      custom: true,
    })
  }
  return result
}

function loadCustomRecipes(): Recipe[] | null {
  try {
    const raw = localStorage.getItem(CUSTOM_RECIPES_KEY)
    if (raw === null) return null
    return sanitizeCustomRecipes(JSON.parse(raw) as unknown)
  } catch {
    return null
  }
}

function saveCustomRecipes(recipes: Recipe[]): void {
  writeJson(CUSTOM_RECIPES_KEY, recipes)
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // quota など
  }
}

function readJson(key: string): unknown | null {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return null
    return JSON.parse(raw) as unknown
  } catch {
    return null
  }
}

function unionById<T extends { id: string }>(a: T[], b: T[]): T[] {
  const map = new Map<string, T>()
  for (const item of a) map.set(item.id, item)
  for (const item of b) map.set(item.id, item)
  return [...map.values()]
}

function sanitizeInventory(raw: unknown): InventoryItem[] {
  if (!Array.isArray(raw)) return []
  const result: InventoryItem[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const row = item as Partial<InventoryItem>
    if (typeof row.id !== 'string' || !row.id.trim()) continue
    if (typeof row.name !== 'string' || !row.name.trim()) continue
    result.push({
      id: row.id,
      name: row.name.trim(),
      quantity: typeof row.quantity === 'string' ? row.quantity : undefined,
      wantToUse: Boolean(row.wantToUse),
    })
  }
  return result
}

type PlanSlice = {
  weeklyPlan: PlannedMeal[]
  weekStartDate: string
  stagedRecipes: StagedRecipe[]
  dayRiceIncluded: AppState['dayRiceIncluded']
  dayDisabledGenres: AppState['dayDisabledGenres']
  preferredGenres: AppState['preferredGenres']
  dayPrepNotes: AppState['dayPrepNotes']
}

type ShoppingSlice = {
  shoppingCheckedNames: string[]
  extraShoppingItems: ExtraShoppingItem[]
  shoppingFreeMemo: string
  dayShoppingNotes: AppState['dayShoppingNotes']
}

function persistSlices(state: AppState, mirrorIdb = true): void {
  saveCustomRecipes(state.customRecipes ?? [])
  writeJson(INVENTORY_KEY, state.inventory ?? [])
  writeJson(PLAN_KEY, {
    weeklyPlan: state.weeklyPlan ?? [],
    weekStartDate: state.weekStartDate,
    stagedRecipes: state.stagedRecipes ?? [],
    dayRiceIncluded: state.dayRiceIncluded ?? {},
    dayDisabledGenres: state.dayDisabledGenres ?? {},
    preferredGenres: state.preferredGenres ?? [],
    dayPrepNotes: state.dayPrepNotes ?? {},
  } satisfies PlanSlice)
  writeJson(SHOPPING_KEY, {
    shoppingCheckedNames: state.shoppingCheckedNames ?? [],
    extraShoppingItems: state.extraShoppingItems ?? [],
    shoppingFreeMemo: state.shoppingFreeMemo ?? '',
    dayShoppingNotes: state.dayShoppingNotes ?? {},
  } satisfies ShoppingSlice)
  writeJson(FAVORITES_KEY, state.favoriteRecipeIds ?? [])
  if (mirrorIdb && !isBareState(state)) void writeIdb(state)
}

function applySlices(parsed: AppState): AppState {
  const inventory = sanitizeInventory(readJson(INVENTORY_KEY))
  if (inventory.length > 0) parsed.inventory = unionById(inventory, parsed.inventory ?? [])

  const favoritesRaw = readJson(FAVORITES_KEY)
  if (Array.isArray(favoritesRaw)) {
    const favorites = favoritesRaw.filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
    if (favorites.length > 0) {
      parsed.favoriteRecipeIds = [...new Set([...favorites, ...parsed.favoriteRecipeIds])]
    }
  }

  const planRaw = readJson(PLAN_KEY)
  if (planRaw && typeof planRaw === 'object') {
    const plan = planRaw as Partial<PlanSlice>
    if (Array.isArray(plan.weeklyPlan) && plan.weeklyPlan.length > 0 && parsed.weeklyPlan.length === 0) {
      parsed.weeklyPlan = plan.weeklyPlan
      if (typeof plan.weekStartDate === 'string' && plan.weekStartDate.trim()) {
        parsed.weekStartDate = plan.weekStartDate
      }
    }
    if (Array.isArray(plan.stagedRecipes) && plan.stagedRecipes.length > 0 && parsed.stagedRecipes.length === 0) {
      parsed.stagedRecipes = plan.stagedRecipes
    }
    if (Array.isArray(plan.preferredGenres) && plan.preferredGenres.length > 0 && parsed.preferredGenres.length === 0) {
      parsed.preferredGenres = plan.preferredGenres
    }
    if (plan.dayRiceIncluded && Object.keys(parsed.dayRiceIncluded).length === 0) {
      parsed.dayRiceIncluded = plan.dayRiceIncluded
    }
    if (plan.dayDisabledGenres && Object.keys(parsed.dayDisabledGenres).length === 0) {
      parsed.dayDisabledGenres = plan.dayDisabledGenres
    }
    if (plan.dayPrepNotes && Object.keys(parsed.dayPrepNotes).length === 0) {
      parsed.dayPrepNotes = plan.dayPrepNotes
    }
  }

  const shoppingRaw = readJson(SHOPPING_KEY)
  if (shoppingRaw && typeof shoppingRaw === 'object') {
    const shopping = shoppingRaw as Partial<ShoppingSlice>
    if (Array.isArray(shopping.extraShoppingItems) && shopping.extraShoppingItems.length > 0) {
      parsed.extraShoppingItems = unionById(shopping.extraShoppingItems, parsed.extraShoppingItems)
    }
    if (
      Array.isArray(shopping.shoppingCheckedNames) &&
      shopping.shoppingCheckedNames.length > 0 &&
      parsed.shoppingCheckedNames.length === 0
    ) {
      parsed.shoppingCheckedNames = shopping.shoppingCheckedNames
    }
    if (shopping.shoppingFreeMemo && !parsed.shoppingFreeMemo) {
      parsed.shoppingFreeMemo = shopping.shoppingFreeMemo
    }
    if (shopping.dayShoppingNotes && Object.keys(parsed.dayShoppingNotes).length === 0) {
      parsed.dayShoppingNotes = shopping.dayShoppingNotes
    }
  }

  return parsed
}

function writeIdb(state: AppState): Promise<void> {
  if (typeof indexedDB === 'undefined') return Promise.resolve()
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(IDB_NAME, 1)
      req.onerror = () => resolve()
      req.onupgradeneeded = () => {
        const db = req.result
        if (!db.objectStoreNames.contains(IDB_STORE)) db.createObjectStore(IDB_STORE)
      }
      req.onsuccess = () => {
        try {
          const db = req.result
          const tx = db.transaction(IDB_STORE, 'readwrite')
          tx.objectStore(IDB_STORE).put(state, 'app')
          tx.oncomplete = () => {
            db.close()
            resolve()
          }
          tx.onerror = () => {
            db.close()
            resolve()
          }
        } catch {
          resolve()
        }
      }
    } catch {
      resolve()
    }
  })
}

export function readIdbState(): Promise<AppState | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null)
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(IDB_NAME, 1)
      req.onerror = () => resolve(null)
      req.onupgradeneeded = () => {
        const db = req.result
        if (!db.objectStoreNames.contains(IDB_STORE)) db.createObjectStore(IDB_STORE)
      }
      req.onsuccess = () => {
        try {
          const db = req.result
          const tx = db.transaction(IDB_STORE, 'readonly')
          const get = tx.objectStore(IDB_STORE).get('app')
          get.onsuccess = () => {
            db.close()
            const value = get.result
            if (!value || typeof value !== 'object') {
              resolve(null)
              return
            }
            const custom = sanitizeCustomRecipes((value as AppState).customRecipes)
            resolve(applySlices(normalizeState(value as StoredState, custom, false)))
          }
          get.onerror = () => {
            db.close()
            resolve(null)
          }
        } catch {
          resolve(null)
        }
      }
    } catch {
      resolve(null)
    }
  })
}

export function isBareUserData(state: AppState): boolean {
  return isBareState(state)
}

export function snapshotForBackup(live: AppState): AppState {
  const storedCustom = loadCustomRecipes() ?? []
  const storedInventory = sanitizeInventory(readJson(INVENTORY_KEY))
  const merged: AppState = {
    ...live,
    customRecipes: unionById(storedCustom, live.customRecipes ?? []),
    inventory: unionById(storedInventory, live.inventory ?? []),
  }
  return applySlices(merged)
}

export function backupCounts(state: AppState): {
  plan: number
  custom: number
  inventory: number
  favorites: number
  shopping: number
} {
  return {
    plan: state.weeklyPlan?.length ?? 0,
    custom: state.customRecipes?.length ?? 0,
    inventory: state.inventory?.length ?? 0,
    favorites: state.favoriteRecipeIds?.length ?? 0,
    shopping:
      (state.extraShoppingItems?.length ?? 0) +
      (state.shoppingFreeMemo?.trim() ? 1 : 0),
  }
}

type StoredState = Partial<AppState> & {
  wantToUseRecipeIds?: string[]
  weekStartsOnMonday?: boolean
}

function normalizeState(
  parsedRaw: StoredState,
  storedCustom: Recipe[] | null,
  migrateCustom = true
): AppState {
    const parsed: AppState = { ...defaultState, ...parsedRaw }
    // 旧フィールド wantToUseRecipeIds → favoriteRecipeIds へ移行
    if (
      (!parsed.favoriteRecipeIds || parsed.favoriteRecipeIds.length === 0) &&
      parsedRaw.wantToUseRecipeIds &&
      parsedRaw.wantToUseRecipeIds.length > 0
    ) {
      parsed.favoriteRecipeIds = [...parsedRaw.wantToUseRecipeIds]
    }
    parsed.favoriteRecipeIds = Array.isArray(parsed.favoriteRecipeIds)
      ? parsed.favoriteRecipeIds
      : []
    parsed.inventory = sanitizeInventory(parsed.inventory)
    parsed.stagedRecipes = (Array.isArray(parsed.stagedRecipes) ? parsed.stagedRecipes : []).filter(
      (s) => s && typeof s === 'object' && 'id' in s && 'recipeId' in s && 'dishRole' in s
    )
    parsed.dayShoppingNotes = parsed.dayShoppingNotes ?? {}
    parsed.shoppingCheckedNames = Array.isArray(parsed.shoppingCheckedNames)
      ? parsed.shoppingCheckedNames.filter((n) => typeof n === 'string' && n.trim())
      : []
    parsed.extraShoppingItems = (Array.isArray(parsed.extraShoppingItems)
      ? parsed.extraShoppingItems
      : [])
      .filter(
        (item) =>
          item &&
          typeof item === 'object' &&
          typeof item.id === 'string' &&
          typeof item.name === 'string' &&
          item.name.trim().length > 0
      )
      .map((item) => ({
        id: item.id,
        name: item.name.trim(),
        checked: Boolean(item.checked),
      }))
    parsed.shoppingFreeMemo =
      typeof parsed.shoppingFreeMemo === 'string' ? parsed.shoppingFreeMemo : ''
    parsed.dayPrepNotes = parsed.dayPrepNotes ?? {}
    parsed.dayRiceIncluded = parsed.dayRiceIncluded ?? {}
    const fromMain = sanitizeCustomRecipes(parsed.customRecipes)
    parsed.customRecipes = storedCustom ?? fromMain
    if (migrateCustom && storedCustom === null && fromMain.length > 0) {
      saveCustomRecipes(fromMain)
    }
    // 旧データ（dishRoleなし / 昼ごはん）は破棄
    parsed.weeklyPlan = (Array.isArray(parsed.weeklyPlan) ? parsed.weeklyPlan : []).filter(
      (m) =>
        m &&
        typeof m === 'object' &&
        'dishRole' in m &&
        'recipeId' in m &&
        m.mealType === '夜'
    )

    // 月曜始まり → 日曜始まりへ dayIndex / weekStartDate を移行（1回だけ）
    const start = parseLocalDateKey(parsed.weekStartDate || defaultState.weekStartDate)
    const needsMondayMigration = start.getDay() === 1 || parsedRaw.weekStartsOnMonday === true
    if (needsMondayMigration) {
      parsed.weeklyPlan = parsed.weeklyPlan.map((m) => ({
        ...m,
        dayIndex: toSundayFirstIndex(m.dayIndex),
      }))
      const migratedDisabled: AppState['dayDisabledGenres'] = {}
      for (const [key, genres] of Object.entries(parsed.dayDisabledGenres ?? {})) {
        const oldIdx = Number(key)
        if (!Number.isFinite(oldIdx) || !genres) continue
        migratedDisabled[toSundayFirstIndex(oldIdx)] = genres
      }
      parsed.dayDisabledGenres = migratedDisabled
      parsed.weekStartDate = formatLocalDateKey(getSunday(start))
    } else {
      parsed.weekStartDate = formatLocalDateKey(getSunday(start))
    }

    // 保存済みの週が「今週」でなければ今週の日曜に合わせる
    if (!isTodayInWeek(parsed.weekStartDate)) {
      parsed.weekStartDate = formatLocalDateKey(getSunday(new Date()))
    }

    return parsed
}

function dedicatedKeysMissing(): boolean {
  try {
    return (
      localStorage.getItem(INVENTORY_KEY) === null ||
      localStorage.getItem(PLAN_KEY) === null ||
      localStorage.getItem(SHOPPING_KEY) === null ||
      localStorage.getItem(FAVORITES_KEY) === null
    )
  } catch {
    return false
  }
}

export function loadState(): AppState {
  const storedCustom = loadCustomRecipes()
  let loaded: AppState
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      loaded = {
        ...defaultState,
        customRecipes: storedCustom ?? [],
      }
    } else {
      loaded = normalizeState(JSON.parse(raw) as StoredState, storedCustom)
    }
  } catch {
    loaded = {
      ...defaultState,
      customRecipes: storedCustom ?? [],
    }
  }
  loaded = applySlices(loaded)
  if (dedicatedKeysMissing() && !isBareState(loaded)) {
    persistSlices(loaded)
  }
  return loaded
}

export function stateFromBackupPayload(raw: unknown): AppState | null {
  if (!raw || typeof raw !== 'object') return null
  const row = raw as { kind?: unknown; state?: unknown }
  if (row.kind !== 'kondatecho-backup') return null
  if (!row.state || typeof row.state !== 'object') return null
  const parsed = row.state as StoredState
  const custom = sanitizeCustomRecipes(parsed.customRecipes)
  return normalizeState(parsed, custom, false)
}

export function forceSaveState(state: AppState): void {
  persistSlices(state, false)
  void writeIdb(state)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // quota など。スライスは上で保存済み
  }
}

export function requestPersistentStorage(): void {
  void navigator.storage?.persist?.()
}

function isBareState(state: AppState): boolean {
  return (
    (state.customRecipes?.length ?? 0) === 0 &&
    (state.weeklyPlan?.length ?? 0) === 0 &&
    (state.inventory?.length ?? 0) === 0 &&
    (state.favoriteRecipeIds?.length ?? 0) === 0 &&
    (state.stagedRecipes?.length ?? 0) === 0 &&
    (state.extraShoppingItems?.length ?? 0) === 0 &&
    (state.preferredGenres?.length ?? 0) === 0 &&
    !state.shoppingFreeMemo?.trim() &&
    Object.keys(state.dayShoppingNotes ?? {}).length === 0 &&
    Object.keys(state.dayPrepNotes ?? {}).length === 0 &&
    Object.keys(state.dayDisabledGenres ?? {}).length === 0 &&
    Object.keys(state.dayRiceIncluded ?? {}).length === 0
  )
}

function hasProtectedStoredData(): boolean {
  if ((loadCustomRecipes()?.length ?? 0) > 0) return true
  if (sanitizeInventory(readJson(INVENTORY_KEY)).length > 0) return true
  const favorites = readJson(FAVORITES_KEY)
  if (Array.isArray(favorites) && favorites.length > 0) return true
  const plan = readJson(PLAN_KEY)
  if (plan && typeof plan === 'object') {
    const slice = plan as Partial<PlanSlice>
    if (Array.isArray(slice.weeklyPlan) && slice.weeklyPlan.length > 0) return true
    if (Array.isArray(slice.stagedRecipes) && slice.stagedRecipes.length > 0) return true
  }
  const shopping = readJson(SHOPPING_KEY)
  if (shopping && typeof shopping === 'object') {
    const slice = shopping as Partial<ShoppingSlice>
    if (Array.isArray(slice.extraShoppingItems) && slice.extraShoppingItems.length > 0) return true
    if (typeof slice.shoppingFreeMemo === 'string' && slice.shoppingFreeMemo.trim()) return true
  }
  try {
    const existing = localStorage.getItem(STORAGE_KEY)
    if (existing && existing.length > 20) return true
  } catch {
    // ignore
  }
  return false
}

export function saveState(state: AppState): void {
  // 起動直後の空 state で、保存済みの献立・手入力・在庫を消さない
  if (isBareState(state) && hasProtectedStoredData()) {
    return
  }
  persistSlices(state)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // quota など。スライスは上で保存済み
  }
}

export function getWeekDates(weekStartDate: string): Date[] {
  const start = parseLocalDateKey(weekStartDate)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })
}

export function formatDate(d: Date): string {
  return `${d.getMonth() + 1}/${d.getDate()}`
}

export { getSunday }
