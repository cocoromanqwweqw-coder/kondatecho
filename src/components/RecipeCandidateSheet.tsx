import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { AppState, DishRole, Recipe } from '../types'
import { DAYS, DISH_ROLE_EMOJI } from '../types'
import { hapticTap } from '../lib/haptic'
import { RecipeCandidatePanel } from './RecipeCandidatePanel'
import { RecipeDetailPopup } from './RecipeDetailPopup'

interface Props {
  dayIndex: number
  dishRole: DishRole
  state: AppState
  onSelect: (recipeId: string) => void
  onClose: () => void
  onToggleFavorite: (recipeId: string) => void
  onOpenCustom?: () => void
}

export function RecipeCandidateSheet({
  dayIndex,
  dishRole,
  state,
  onSelect,
  onClose,
  onToggleFavorite,
  onOpenCustom,
}: Props) {
  const [candidateDetail, setCandidateDetail] = useState<Recipe | null>(null)

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

  const handleQuickAdd = (recipeId: string) => {
    hapticTap('success')
    onSelect(recipeId)
    onClose()
  }

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[55] flex flex-col justify-end sm:items-center sm:justify-center sm:p-4"
        role="presentation"
      >
        <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="recipe-candidate-title"
          onClick={(e) => e.stopPropagation()}
          className="relative z-10 flex w-full max-w-md flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-h-[92vh] sm:rounded-2xl"
          style={{
            height: 'min(96dvh, calc(100dvh - env(safe-area-inset-top) - 0.5rem))',
            maxHeight: 'min(96dvh, calc(100dvh - env(safe-area-inset-top) - 0.5rem))',
          }}
        >
          <div className="shrink-0 border-b border-orange-100 bg-white px-3 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-medium text-orange-600">
                  {DAYS[dayIndex]}曜 · {DISH_ROLE_EMOJI[dishRole]} {dishRole}
                </p>
                <h2 id="recipe-candidate-title" className="text-base font-bold text-gray-800">
                  候補から選ぶ
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="閉じる"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xl text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                ×
              </button>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-3 py-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <RecipeCandidatePanel
              variant="sheet"
              state={state}
              dayIndex={dayIndex}
              targetRole={dishRole}
              listHeightClass="min-h-0 flex-1"
              className="flex min-h-0 flex-1 flex-col"
              onQuickAdd={handleQuickAdd}
              onToggleFavorite={onToggleFavorite}
              onOpenDetail={setCandidateDetail}
              onOpenCustom={onOpenCustom}
            />
          </div>
        </div>
      </div>

      {candidateDetail && (
        <RecipeDetailPopup
          recipe={candidateDetail}
          dayIndex={dayIndex}
          dishRole={candidateDetail.dishRole ?? dishRole}
          isFavorite={state.favoriteRecipeIds.includes(candidateDetail.id)}
          onClose={() => setCandidateDetail(null)}
          onToggleFavorite={onToggleFavorite}
          onPlace={() => handleQuickAdd(candidateDetail.id)}
        />
      )}
    </>,
    document.body
  )
}
