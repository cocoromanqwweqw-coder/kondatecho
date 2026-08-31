import type { AppState } from '../types'

const STORAGE_KEY = 'weekly-menu-app'

const defaultState: AppState = {
  inventory: [],
  favoriteRecipeIds: [],
  weeklyPlan: [],
  stagedRecipes: [],
  preferredGenres: [],
  dayDisabledGenres: {},
  weekStartDate: formatLocalDateKey(getSunday(new Date())),
  dayShoppingNotes: {},
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

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...defaultState }
    const parsedRaw = JSON.parse(raw) as Partial<AppState> & {
      wantToUseRecipeIds?: string[]
      weekStartsOnMonday?: boolean
    }
    const parsed: AppState = { ...defaultState, ...parsedRaw }
    // 旧フィールド wantToUseRecipeIds → favoriteRecipeIds へ移行
    if (
      (!parsed.favoriteRecipeIds || parsed.favoriteRecipeIds.length === 0) &&
      parsedRaw.wantToUseRecipeIds &&
      parsedRaw.wantToUseRecipeIds.length > 0
    ) {
      parsed.favoriteRecipeIds = [...parsedRaw.wantToUseRecipeIds]
    }
    parsed.favoriteRecipeIds = parsed.favoriteRecipeIds ?? []
    parsed.stagedRecipes = (parsed.stagedRecipes ?? []).filter(
      (s) => s && typeof s === 'object' && 'id' in s && 'recipeId' in s && 'dishRole' in s
    )
    parsed.dayShoppingNotes = parsed.dayShoppingNotes ?? {}
    parsed.dayPrepNotes = parsed.dayPrepNotes ?? {}
    parsed.dayRiceIncluded = parsed.dayRiceIncluded ?? {}
    parsed.customRecipes = (parsed.customRecipes ?? []).filter(
      (r) =>
        r &&
        typeof r === 'object' &&
        typeof r.id === 'string' &&
        typeof r.name === 'string' &&
        r.name.trim().length > 0
    )
    // 旧データ（dishRoleなし / 昼ごはん）は破棄
    parsed.weeklyPlan = (parsed.weeklyPlan ?? []).filter(
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
  } catch {
    return { ...defaultState }
  }
}

export function saveState(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
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
