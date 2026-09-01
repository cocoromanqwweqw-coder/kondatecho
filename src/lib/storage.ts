import type { AppState, Recipe } from '../types'

const STORAGE_KEY = 'weekly-menu-app'
/** 手入力は公開更新で本体が壊れても残す */
const CUSTOM_RECIPES_KEY = 'weekly-menu-custom-recipes'

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
  try {
    localStorage.setItem(CUSTOM_RECIPES_KEY, JSON.stringify(recipes))
  } catch {
    // quota など。本体保存は別途試す
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

export function loadState(): AppState {
  const storedCustom = loadCustomRecipes()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return {
        ...defaultState,
        customRecipes: storedCustom ?? [],
      }
    }
    return normalizeState(JSON.parse(raw) as StoredState, storedCustom)
  } catch {
    return {
      ...defaultState,
      customRecipes: storedCustom ?? [],
    }
  }
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
  saveCustomRecipes(state.customRecipes ?? [])
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // quota など。手入力は上で保存済み
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
    !state.shoppingFreeMemo
  )
}

export function saveState(state: AppState): void {
  const custom = state.customRecipes ?? []
  const storedCustom = loadCustomRecipes()
  const hydrationRace = isBareState(state) && (storedCustom?.length ?? 0) > 0
  if (!hydrationRace) {
    saveCustomRecipes(custom)
  }

  try {
    const existing = localStorage.getItem(STORAGE_KEY)
    if (isBareState(state) && existing && existing.length > 20) {
      return
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // quota など。手入力は上で保存済み
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
