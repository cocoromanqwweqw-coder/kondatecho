import type { Genre, Recipe } from '../types'

/** Unsplash（無料・food系）— ジャンルごとの写真プール */
const GENRE_IMAGES: Record<Genre, string[]> = {
  和食: [
    'photo-1553621042-f6e147245754',
    'photo-1569058242253-acd38cba84a2',
    'photo-1582450871972-8d25c48af214',
    'photo-1617093727343-374698b0c822',
    'photo-1547592166-23ac45744acd',
    'photo-1569718212165-3a8278dfe5fb',
    'photo-1574484789858-47e2728861b6',
    'photo-1590301157899-4810a221a407',
  ],
  洋食: [
    'photo-1546833999-b9f581a1996d',
    'photo-1568901346375-23c9450c58cd',
    'photo-1550547660-d9450f859349',
    'photo-1606755962773-d324e0a15888',
    'photo-1565299624946-b28f40a0ae38',
    'photo-1476224203421-9ac39bcb3297',
    'photo-1563379926898-05f4575a442d',
    'photo-1600891964092-4316c288032e',
  ],
  中華: [
    'photo-1525755662778-989dbe755a9f',
    'photo-1563245372-f21724e3856d',
    'photo-1582878826629-29b7ad1cdc43',
    'photo-1617093727343-374698b0c822',
    'photo-1585038898411-5d499824495f',
    'photo-1626804475297-41608ea09ae5',
    'photo-1569718212165-3a8278dfe5fb',
    'photo-1526318896980-cf48c2471429',
  ],
  イタリアン: [
    'photo-1565299624946-b28f40a0ae38',
    'photo-1473093290777-49205db8607d',
    'photo-1574071318508-1cdbab80d002',
    'photo-1598866598160-d340a410ae9a',
    'photo-1621996346565-e3dbc646d9a9',
    'photo-1608897013137-62e0688141f9',
    'photo-1563379926898-05f4575a442d',
    'photo-1551183053-bf91a1d81141',
  ],
  韓国料理: [
    'photo-1498654200943-1108d77728f8',
    'photo-1590301157899-4810a221a407',
    'photo-1626804475297-41608ea09ae5',
    'photo-1582878826629-29b7ad1cdc43',
    'photo-1546833999-b9f581a1996d',
    'photo-1563245372-f21724e3856d',
    'photo-1553621042-f6e147245754',
    'photo-1617093727343-374698b0c822',
  ],
  エスニック: [
    'photo-1565557623262-b51c2513a641',
    'photo-1512058564366-18510be2db19',
    'photo-1565299624946-b28f40a0ae38',
    'photo-1563379926898-05f4575a442d',
    'photo-1555939594-58d7cb561ad1',
    'photo-1504674900247-0877df9cc836',
    'photo-1567620905732-2d1ec7ab7445',
    'photo-1540189549336-e6e99c3679fe',
  ],
}

export const GENRE_EMOJI: Record<Genre, string> = {
  和食: '🍱',
  洋食: '🍽️',
  中華: '🥟',
  イタリアン: '🍝',
  韓国料理: '🌶️',
  エスニック: '🌮',
}

function hashId(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) >>> 0
  }
  return h
}

export function getRecipeImageUrl(recipe: Pick<Recipe, 'id' | 'genre'>, width = 200): string {
  const pool = GENRE_IMAGES[recipe.genre]
  const photoId = pool[hashId(recipe.id) % pool.length]
  return `https://images.unsplash.com/${photoId}?w=${width}&h=${width}&fit=crop&auto=format&q=80`
}
