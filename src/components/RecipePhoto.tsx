import { useState } from 'react'
import type { Recipe } from '../types'
import { GENRE_EMOJI, getRecipeImageUrl } from '../lib/recipeImages'

type Size = 'xs' | 'sm' | 'md' | 'lg'

const SIZE_CLASS: Record<Size, string> = {
  xs: 'w-9 h-9',
  sm: 'w-12 h-12',
  md: 'w-[4.5rem] h-[4.5rem]',
  lg: 'w-full h-40',
}

const WIDTH: Record<Size, number> = {
  xs: 80,
  sm: 96,
  md: 144,
  lg: 480,
}

interface Props {
  recipe: Pick<Recipe, 'id' | 'name' | 'genre'>
  size?: Size
  className?: string
}

export function RecipePhoto({ recipe, size = 'sm', className = '' }: Props) {
  const [failed, setFailed] = useState(false)
  const box = `${SIZE_CLASS[size]} rounded-lg shrink-0 overflow-hidden ${className}`

  if (failed) {
    return (
      <div
        className={`${box} bg-gradient-to-br from-orange-100 to-amber-200 flex items-center justify-center`}
        aria-hidden
      >
        <span className={size === 'xs' ? 'text-base' : size === 'lg' ? 'text-4xl' : 'text-xl'}>
          {GENRE_EMOJI[recipe.genre]}
        </span>
      </div>
    )
  }

  return (
    <img
      src={getRecipeImageUrl(recipe, WIDTH[size])}
      alt={recipe.name}
      className={`${box} object-cover bg-gray-100`}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  )
}
