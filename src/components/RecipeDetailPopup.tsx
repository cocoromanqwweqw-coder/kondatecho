import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { DishRole, Recipe } from '../types'
import { DAYS, DISH_ROLE_EMOJI } from '../types'
import { RecipePhoto } from './RecipePhoto'
import { RecipeLinks } from './RecipeLinks'
import { HealthTagBadges } from './HealthTagBadges'
import { hapticTap } from '../lib/haptic'

interface Props {
  recipe: Recipe
  dayIndex: number
  dishRole: DishRole
  isFavorite: boolean
  onClose: () => void
  onToggleFavorite?: (recipeId: string) => void
  onClear?: () => void
  onPlace?: () => void
  onEdit?: (recipe: Recipe) => void
}

export function RecipeDetailPopup({
  recipe,
  dayIndex,
  dishRole,
  isFavorite,
  onClose,
  onToggleFavorite,
  onClear,
  onPlace,
  onEdit,
}: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4"
      role="presentation"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="recipe-detail-title"
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 max-h-[88vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl sm:rounded-2xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-orange-100 bg-white/95 px-4 py-2.5 backdrop-blur">
          <p className="text-xs font-medium text-orange-600">
            {DAYS[dayIndex]}曜 · {DISH_ROLE_EMOJI[dishRole]} {dishRole}
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        <div className="space-y-3 px-4 pt-3">
          <div className="flex gap-3">
            <RecipePhoto recipe={recipe} size="md" />
            <div className="min-w-0 flex-1">
              <div className="flex items-start gap-2">
                <h2
                  id="recipe-detail-title"
                  className="min-w-0 flex-1 text-lg font-bold leading-snug text-gray-800"
                >
                  {recipe.name}
                </h2>
                {onToggleFavorite && (
                  <button
                    type="button"
                    onClick={() => {
                      hapticTap()
                      onToggleFavorite(recipe.id)
                    }}
                    title={isFavorite ? 'お気に入り解除' : 'お気に入りに追加'}
                    className={`shrink-0 text-xl leading-none ${isFavorite ? '' : 'opacity-40'}`}
                  >
                    {isFavorite ? '⭐' : '☆'}
                  </button>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {recipe.custom
                  ? '手入力'
                  : `${recipe.genre} · ${recipe.difficulty} · ⏱ ${recipe.cookingTime}分`}
              </p>
              <HealthTagBadges tags={recipe.healthTags} className="mt-1.5" max={6} />
            </div>
          </div>

          {recipe.description && (
            <p className="text-sm leading-relaxed text-gray-600">{recipe.description}</p>
          )}

          {recipe.ingredients.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-semibold text-gray-500">材料</p>
              <div className="flex flex-wrap gap-1">
                {recipe.ingredients.map((ing) => (
                  <span
                    key={ing}
                    className="rounded-full bg-orange-50 px-2 py-0.5 text-xs text-gray-700"
                  >
                    {ing}
                  </span>
                ))}
              </div>
            </div>
          )}

          {!recipe.custom && <RecipeLinks recipe={recipe} />}

          <div className="flex gap-2 pt-1">
            {recipe.custom && onEdit && (
              <button
                type="button"
                onClick={() => {
                  onEdit(recipe)
                  onClose()
                }}
                className="flex-1 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2.5 text-sm font-medium text-orange-800 hover:bg-orange-100"
              >
                編集
              </button>
            )}
            {onPlace && (
              <button
                type="button"
                onClick={() => {
                  hapticTap('success')
                  onPlace()
                  onClose()
                }}
                className="flex-1 rounded-xl bg-orange-500 px-3 py-2.5 text-sm font-semibold text-orange-950 hover:bg-orange-600"
              >
                このマスに追加
              </button>
            )}
            {onClear && (
              <button
                type="button"
                onClick={() => {
                  onClear()
                  onClose()
                }}
                className="flex-1 rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
              >
                このマスから外す
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-medium ${
                onPlace
                  ? 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                  : 'bg-orange-500 text-orange-950 hover:bg-orange-600'
              }`}
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
