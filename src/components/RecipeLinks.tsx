import type { Recipe } from '../types'
import { getRecipeLinks } from '../lib/recipeLinks'

interface Props {
  recipe: Pick<Recipe, 'name' | 'links'>
  className?: string
}

export function RecipeLinks({ recipe, className = '' }: Props) {
  const links = getRecipeLinks(recipe)

  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {links.map((link) => (
        <a
          key={link.label}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs sm:text-sm text-orange-700 bg-white border border-orange-200 rounded-lg hover:bg-orange-50 transition"
          onClick={(e) => e.stopPropagation()}
        >
          🔗 {link.label}
        </a>
      ))}
    </div>
  )
}
