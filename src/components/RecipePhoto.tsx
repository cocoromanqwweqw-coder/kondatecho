import type { Recipe } from '../types'
import { detectDishIllustKind } from '../lib/dishIllust'
import { DishIllustIcon } from './DishIllustIcon'

type Size = 'xs' | 'sm' | 'md' | 'lg'

const SIZE_CLASS: Record<Size, string> = {
  xs: 'w-9 h-9',
  sm: 'w-12 h-12',
  md: 'w-[4.5rem] h-[4.5rem]',
  lg: 'w-full h-40',
}

interface Props {
  recipe: Pick<Recipe, 'id' | 'name' | 'genre' | 'ingredients' | 'dishRole'>
  size?: Size
  className?: string
}

export function RecipePhoto({ recipe, size = 'sm', className = '' }: Props) {
  const kind = detectDishIllustKind(recipe)
  const box = `${SIZE_CLASS[size]} rounded-lg shrink-0 overflow-hidden ${className}`

  return (
    <DishIllustIcon
      kind={kind}
      className={`${box} block`}
    />
  )
}
