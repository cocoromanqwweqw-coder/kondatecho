import type { Recipe } from '../types'

/** 小麦・植物油・乳製品・砂糖。みりん・醤油は調味料なので数えない */
export type ShidokuHit = '小麦' | '植物油' | '乳製品' | '甘いもの'

/** 乳製品・甘いものはこれ以下なら残す。小麦と植物油は0以外不可 */
export const SHIDOKU_SOFT_ALLOW = 1

const HIT_SHORT: Record<ShidokuHit, string> = {
  小麦: '小麦',
  植物油: '油',
  乳製品: '乳',
  甘いもの: '甘',
}

const WHEAT = [
  '小麦',
  'パン',
  'パスタ',
  'スパゲ',
  'うどん',
  'ラーメン',
  'そうめん',
  'そう麺',
  '中華麺',
  '餃子',
  '春巻き',
  'ピザ',
  'マカロニ',
  'ラザニア',
  'トルティーヤ',
  'ナン',
  'クッキー',
  'ケーキ',
  'ドーナツ',
  '天ぷら粉',
  'ホットケーキ',
  'ライ麦',
]

const OILS = [
  'サラダ油',
  '揚げ油',
  'ごま油',
  'ゴマ油',
  'オリーブオイル',
  'オリーブ油',
  '植物油',
  'コーン油',
  'キャノーラ',
  'なたね油',
  '菜種油',
  'ラー油',
  '天ぷら油',
  '炒め油',
  'マーガリン',
  'ショートニング',
]

const FRIED = ['揚げ', 'フライ', '唐揚', '天ぷら', 'からあげ', 'カラアゲ']

const DAIRY = [
  '牛乳',
  'チーズ',
  'バター',
  'ヨーグルト',
  '生クリーム',
  'クリーム',
  'ミルク',
  '練乳',
  '生乳',
]

const SWEET = [
  '砂糖',
  '上白糖',
  'グラニュー',
  'きび糖',
  '黒糖',
  'はちみつ',
  '蜂蜜',
  'シロップ',
  'チョコレート',
  'チョコ',
  'ジャム',
  'あんこ',
  '餡',
]

function includesAny(text: string, words: string[]): boolean {
  return words.some((word) => text.includes(word))
}

function hasPlantOil(name: string, ingredients: string[]): boolean {
  const joined = `${name} ${ingredients.join(' ')}`
  if (includesAny(joined, OILS) || includesAny(name, FRIED)) return true
  return ingredients.some((ing) => {
    if (!ing.includes('油')) return false
    if (ing.includes('醤油') || ing.includes('しょうゆ') || ing.includes('醬油')) {
      return includesAny(ing, OILS)
    }
    return true
  })
}

export function shidokuHits(recipe: Pick<Recipe, 'name' | 'ingredients'>): ShidokuHit[] {
  const text = `${recipe.name} ${recipe.ingredients.join(' ')}`
  const hits: ShidokuHit[] = []
  if (includesAny(text, WHEAT)) hits.push('小麦')
  if (hasPlantOil(recipe.name, recipe.ingredients)) hits.push('植物油')
  if (includesAny(text, DAIRY)) hits.push('乳製品')
  if (includesAny(text, SWEET)) hits.push('甘いもの')
  return hits
}

export function isShidokuAcceptable(recipe: Pick<Recipe, 'name' | 'ingredients'>): boolean {
  const hits = shidokuHits(recipe)
  if (hits.includes('小麦') || hits.includes('植物油')) return false
  const soft = hits.filter((hit) => hit === '乳製品' || hit === '甘いもの')
  return soft.length <= SHIDOKU_SOFT_ALLOW
}

export function shidokuNote(recipe: Pick<Recipe, 'name' | 'ingredients'>): string {
  const hits = shidokuHits(recipe)
  if (hits.length === 0) return ''
  return hits.map((hit) => HIT_SHORT[hit]).join('・')
}
