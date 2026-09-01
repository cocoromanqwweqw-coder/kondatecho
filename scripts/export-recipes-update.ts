import { writeFileSync } from 'node:fs'
import path from 'node:path'
import { RECIPES_EXTRA } from '../src/data/recipesExtra'
import { RECIPES_HEALTH } from '../src/data/recipesHealth'
import { RECIPES_TRENDING } from '../src/data/recipesTrending'

const recipes = [...RECIPES_EXTRA, ...RECIPES_TRENDING, ...RECIPES_HEALTH]
writeFileSync(
  path.join(process.cwd(), 'public', 'recipes-update.json'),
  `${JSON.stringify({
    version: 1,
    updatedAt: new Date().toISOString(),
    recipes,
  })}\n`
)
console.log(`wrote public/recipes-update.json (${recipes.length} recipes)`)
