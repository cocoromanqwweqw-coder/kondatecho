import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import type { useAppState } from '../hooks/useAppState'
import {
  matchesIngredientSearchAny,
  matchesJapaneseSearch,
} from '../lib/japaneseText'
import { DISH_ROLE_EMOJI, DISH_ROLES, type DishRole, type Recipe } from '../types'

type App = ReturnType<typeof useAppState>

type View = 'list' | 'form'

function splitIngredients(raw: string): string[] {
  return raw
    .split(/[,，、\n]+/)
    .map((part) => part.trim())
    .filter(Boolean)
}

function splitSearchTerms(query: string): string[] {
  return query
    .trim()
    .split(/[\s,、，+/／]+/)
    .map((term) => term.trim())
    .filter(Boolean)
}

function recipeMatchesQuery(recipe: Recipe, query: string): boolean {
  const terms = splitSearchTerms(query)
  if (terms.length === 0) return true
  return terms.every(
    (term) =>
      matchesJapaneseSearch(recipe.name, term) ||
      matchesIngredientSearchAny(term, recipe.ingredients)
  )
}

interface Props {
  app: App
  open: boolean
  initialRecipeId?: string | null
  onClose: () => void
  onPlace: (recipe: Recipe) => void
}

export function CustomRecipePanel({
  app,
  open,
  initialRecipeId = null,
  onClose,
  onPlace,
}: Props) {
  const { state, addCustomRecipe, updateCustomRecipe, removeCustomRecipe } = app
  const [view, setView] = useState<View>('list')
  const [query, setQuery] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [dishRole, setDishRole] = useState<DishRole>('主菜')
  const [ingredients, setIngredients] = useState<string[]>([])
  const [ingredientDraft, setIngredientDraft] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const customRecipes = state.customRecipes ?? []

  useEffect(() => {
    if (!open) return
    const startId = initialRecipeId ?? null
    setQuery('')
    setConfirmDeleteId(null)
    if (startId) {
      const recipe = customRecipes.find((r) => r.id === startId)
      if (recipe) {
        fillForm(recipe)
        setView('form')
        return
      }
    }
    setView(customRecipes.length > 0 ? 'list' : 'form')
    resetForm()
  }, [open, initialRecipeId])

  const filtered = useMemo(
    () => customRecipes.filter((r) => recipeMatchesQuery(r, query)),
    [customRecipes, query]
  )

  const fillForm = (recipe: Recipe) => {
    setEditingId(recipe.id)
    setName(recipe.name)
    setDishRole(recipe.dishRole ?? '主菜')
    setIngredients([...recipe.ingredients])
    setIngredientDraft('')
  }

  const resetForm = () => {
    setEditingId(null)
    setName('')
    setDishRole('主菜')
    setIngredients([])
    setIngredientDraft('')
  }

  const addDraftIngredients = () => {
    const next = splitIngredients(ingredientDraft)
    if (next.length === 0) return
    setIngredients((prev) => {
      const seen = new Set(prev)
      const merged = [...prev]
      for (const item of next) {
        if (seen.has(item)) continue
        seen.add(item)
        merged.push(item)
      }
      return merged
    })
    setIngredientDraft('')
  }

  const collectIngredients = () => {
    const leftover = splitIngredients(ingredientDraft)
    const seen = new Set(ingredients)
    const all = [...ingredients]
    for (const item of leftover) {
      if (seen.has(item)) continue
      seen.add(item)
      all.push(item)
    }
    return all
  }

  const save = (placeAfter: boolean) => {
    const trimmed = name.trim()
    if (!trimmed) return
    const all = collectIngredients()
    if (editingId) {
      updateCustomRecipe(editingId, { name: trimmed, dishRole, ingredients: all })
      const updated = {
        ...(customRecipes.find((r) => r.id === editingId) as Recipe),
        name: trimmed,
        dishRole,
        ingredients: all,
      }
      if (placeAfter) onPlace(updated)
    } else {
      const id = addCustomRecipe(trimmed, dishRole, all)
      if (id && placeAfter) {
        onPlace({
          id,
          name: trimmed,
          genre: '和食',
          ingredients: all,
          cookingTime: 0,
          difficulty: '普通',
          description: '手入力レシピ',
          dishRole,
          custom: true,
        })
      }
    }
    resetForm()
    setView('list')
  }

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-4"
      role="presentation"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="custom-recipe-title"
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 flex max-h-[88vh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl bg-white pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl sm:rounded-2xl"
      >
        <div className="sticky top-0 z-10 border-b border-orange-100 bg-white/95 px-4 py-2.5 backdrop-blur">
          <div className="flex items-center justify-between">
            <h2 id="custom-recipe-title" className="text-base font-bold text-gray-800">
              手入力メニュー
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="閉じる"
              className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            >
              ×
            </button>
          </div>
          <div className="mt-2 flex gap-1 rounded-lg bg-orange-50 p-0.5">
            <button
              type="button"
              onClick={() => {
                setView('list')
                setConfirmDeleteId(null)
              }}
              className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium ${
                view === 'list'
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-500'
              }`}
            >
              探す（{customRecipes.length}）
            </button>
            <button
              type="button"
              onClick={() => {
                if (view === 'form' && editingId) return
                resetForm()
                setView('form')
              }}
              className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium ${
                view === 'form' && !editingId
                  ? 'bg-white text-gray-800 shadow-sm'
                  : view === 'form'
                    ? 'bg-white text-gray-800 shadow-sm'
                    : 'text-gray-500'
              }`}
            >
              {editingId ? '編集' : '登録'}
            </button>
          </div>
        </div>

        {view === 'list' ? (
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="料理名・材料をまとめて検索"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-base focus:outline-none focus:ring-1 focus:ring-orange-300"
            />
            <p className="mt-1 text-[10px] text-gray-400">
              スペース区切りで全部含む。材料でもヒットします
            </p>
            {filtered.length === 0 ? (
              <p className="mt-6 text-center text-sm text-gray-400">
                {customRecipes.length === 0
                  ? 'まだ手入力がありません'
                  : '一致するメニューがありません'}
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {filtered.map((recipe) => (
                  <li
                    key={recipe.id}
                    className="rounded-xl border border-orange-100 bg-orange-50/40 px-3 py-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-800">
                          {DISH_ROLE_EMOJI[recipe.dishRole ?? '主菜']} {recipe.name}
                        </p>
                        <p className="mt-0.5 text-[11px] text-gray-500">
                          {recipe.ingredients.length > 0
                            ? recipe.ingredients.join('、')
                            : '材料未入力'}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => onPlace(recipe)}
                        className="rounded-lg bg-orange-500 px-2 py-1 text-[11px] font-medium text-orange-950 hover:bg-orange-600"
                      >
                        配置
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          fillForm(recipe)
                          setView('form')
                        }}
                        className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-[11px] text-gray-700 hover:bg-gray-50"
                      >
                        編集
                      </button>
                      {confirmDeleteId === recipe.id ? (
                        <button
                          type="button"
                          onClick={() => {
                            removeCustomRecipe(recipe.id)
                            setConfirmDeleteId(null)
                          }}
                          className="rounded-lg bg-red-500 px-2 py-1 text-[11px] font-medium text-white"
                        >
                          削除する
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(recipe.id)}
                          className="rounded-lg px-2 py-1 text-[11px] text-gray-400 hover:text-red-500"
                        >
                          削除
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <form
            className="min-h-0 flex-1 overflow-y-auto px-4 py-3"
            onSubmit={(e) => {
              e.preventDefault()
              save(false)
            }}
          >
            <label className="block text-[11px] font-medium text-gray-500">料理名</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例：残り物カレー"
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-base focus:outline-none focus:ring-1 focus:ring-orange-300"
            />
            <p className="mt-3 text-[11px] font-medium text-gray-500">役割</p>
            <div className="mt-1 flex gap-1.5">
              {DISH_ROLES.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setDishRole(role)}
                  className={`rounded-full border px-2.5 py-1 text-xs ${
                    dishRole === role
                      ? 'border-orange-500 bg-orange-500 text-orange-950'
                      : 'border-gray-200 bg-white text-gray-600'
                  }`}
                >
                  {DISH_ROLE_EMOJI[role]} {role}
                </button>
              ))}
            </div>
            <label className="mt-3 block text-[11px] font-medium text-gray-500">材料</label>
            <div className="mt-1 flex gap-1.5">
              <input
                type="text"
                value={ingredientDraft}
                onChange={(e) => setIngredientDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== 'Enter') return
                  e.preventDefault()
                  addDraftIngredients()
                }}
                placeholder="にんじん、玉ねぎ"
                className="min-w-0 flex-1 rounded-lg border border-gray-200 px-3 py-2 text-base focus:outline-none focus:ring-1 focus:ring-orange-300"
              />
              <button
                type="button"
                onClick={addDraftIngredients}
                disabled={!ingredientDraft.trim()}
                className="shrink-0 rounded-lg border border-gray-200 bg-white px-2 py-2 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-40"
              >
                追加
              </button>
            </div>
            {ingredients.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {ingredients.map((ing) => (
                  <span
                    key={ing}
                    className="inline-flex items-center gap-0.5 rounded-full bg-orange-50 px-2 py-0.5 text-xs text-gray-700"
                  >
                    {ing}
                    <button
                      type="button"
                      aria-label={`${ing}を外す`}
                      onClick={() => setIngredients((prev) => prev.filter((x) => x !== ing))}
                      className="text-gray-400 hover:text-gray-700"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="mt-4 flex gap-2">
              <button
                type="submit"
                disabled={!name.trim()}
                className="flex-1 rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40"
              >
                {editingId ? '保存' : '登録'}
              </button>
              <button
                type="button"
                disabled={!name.trim()}
                onClick={() => save(true)}
                className="flex-1 rounded-xl bg-orange-500 px-3 py-2.5 text-sm font-medium text-orange-950 hover:bg-orange-600 disabled:opacity-40"
              >
                {editingId ? '保存して配置' : '登録して配置'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  )
}
