import type { Recipe } from '../types'
import { GENRES } from '../types'
import { RECIPES, enrichRecipe, mergeRecipes } from '../data/recipes'
import { buildRecipeSearchIndex } from './recipeSearchIndex'
import { setLiveCatalog } from './recipeCatalogState'

const OVERLAY_KEY = 'weekly-menu-recipe-overlay'
const FETCHED_AT_KEY = 'weekly-menu-recipe-fetched-at'
const UPDATED_AT_KEY = 'weekly-menu-recipe-updated-at'
const DAY_MS = 24 * 60 * 60 * 1000
const UPDATE_URL = '/recipes-update.json'

const DIFFICULTIES = new Set(['簡単', '普通', 'やや手間'])

function isGenre(value: unknown): value is Recipe['genre'] {
  return typeof value === 'string' && (GENRES as string[]).includes(value)
}

function parseOverlayRecipes(raw: unknown): Recipe[] {
  if (!Array.isArray(raw)) return []
  const parsed: Recipe[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const row = item as Record<string, unknown>
    if (typeof row.id !== 'string' || !row.id.trim()) continue
    if (typeof row.name !== 'string' || !row.name.trim()) continue
    if (!isGenre(row.genre)) continue
    if (!Array.isArray(row.ingredients) || !row.ingredients.every((x) => typeof x === 'string')) {
      continue
    }
    if (typeof row.cookingTime !== 'number' || !Number.isFinite(row.cookingTime)) continue
    if (typeof row.difficulty !== 'string' || !DIFFICULTIES.has(row.difficulty)) continue
    if (typeof row.description !== 'string') continue
    parsed.push(enrichRecipe(row as unknown as Recipe))
  }
  return parsed
}

function loadOverlay(): Recipe[] {
  try {
    const raw = localStorage.getItem(OVERLAY_KEY)
    if (!raw) return []
    return parseOverlayRecipes(JSON.parse(raw) as unknown)
  } catch {
    return []
  }
}

function saveOverlay(recipes: Recipe[]): void {
  try {
    localStorage.setItem(OVERLAY_KEY, JSON.stringify(recipes))
  } catch {
    // quota など
  }
}

function loadFetchedAt(): number {
  try {
    const raw = localStorage.getItem(FETCHED_AT_KEY)
    const n = raw ? Number(raw) : 0
    return Number.isFinite(n) ? n : 0
  } catch {
    return 0
  }
}

function saveFetchedAt(at: number): void {
  try {
    localStorage.setItem(FETCHED_AT_KEY, String(at))
  } catch {
    // ignore
  }
}

function loadUpdatedAt(): string {
  try {
    return localStorage.getItem(UPDATED_AT_KEY) ?? ''
  } catch {
    return ''
  }
}

function saveUpdatedAt(value: string): void {
  try {
    localStorage.setItem(UPDATED_AT_KEY, value)
  } catch {
    // ignore
  }
}

function bundleBuiltAt(): number {
  const raw = import.meta.env.VITE_APP_BUILD_TIME
  const n = typeof raw === 'string' ? Number(raw) : Number(raw)
  return Number.isFinite(n) ? n : 0
}

function shouldUseOverlay(overlay: Recipe[]): boolean {
  if (overlay.length === 0) return false
  const fetchedAt = loadFetchedAt()
  const builtAt = bundleBuiltAt()
  if (!builtAt) return true
  return fetchedAt >= builtAt
}

function overlayAddsSomething(overlay: Recipe[]): boolean {
  const bundled = new Map(RECIPES.map((r) => [r.id, r]))
  for (const recipe of overlay) {
    const current = bundled.get(recipe.id)
    if (!current) return true
    if (current.name !== recipe.name) return true
    if (current.ingredients.join('\0') !== recipe.ingredients.join('\0')) return true
  }
  return false
}

function applyOverlay(overlay: Recipe[]): void {
  if (overlay.length === 0 || !overlayAddsSomething(overlay)) return
  const merged = mergeRecipes(overlay, RECIPES)
  setLiveCatalog(merged, buildRecipeSearchIndex(merged))
}

let inFlight: Promise<void> | null = null

/** 前回成功から1日以上なら更新ファイルを取りにいく。失敗したら今の一覧のまま */
export async function refreshRecipesIfDue(): Promise<void> {
  if (typeof fetch === 'undefined' || typeof localStorage === 'undefined') return
  const lastOk = loadFetchedAt()
  if (Date.now() - lastOk < DAY_MS) return
  if (inFlight) return inFlight

  inFlight = (async () => {
    try {
      const res = await fetch(`${UPDATE_URL}?t=${Date.now()}`, { cache: 'no-store' })
      if (!res.ok) return
      const data = (await res.json()) as { recipes?: unknown; updatedAt?: unknown }
      const stamp = typeof data.updatedAt === 'string' ? data.updatedAt : ''
      if (stamp && stamp === loadUpdatedAt()) {
        saveFetchedAt(Date.now())
        return
      }
      const overlay = parseOverlayRecipes(data.recipes)
      if (overlay.length === 0) return
      if (stamp) saveUpdatedAt(stamp)
      saveFetchedAt(Date.now())
      if (overlayAddsSomething(overlay)) {
        saveOverlay(overlay)
        applyOverlay(overlay)
      }
    } catch {
      // 今の一覧のまま
    } finally {
      inFlight = null
    }
  })()

  return inFlight
}

/** 画面を出してから空いた時間に確認する（起動を重くしない） */
export function scheduleRecipeRefresh(): void {
  const run = () => {
    if (typeof localStorage !== 'undefined') {
      const overlay = loadOverlay()
      if (shouldUseOverlay(overlay)) applyOverlay(overlay)
    }
    void refreshRecipesIfDue()
  }

  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(run, { timeout: 4000 })
    return
  }
  setTimeout(run, 1200)
}
