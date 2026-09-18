import type { DishRole, Recipe } from '../types'
import { detectDishRole } from './dishRole'

/** 料理の見た目の型。キーワードで当て、だめなら役割へ落とす */
export type DishIllustKind =
  | 'fish'
  | 'meat'
  | 'stirfry'
  | 'nimono'
  | 'fried'
  | 'don'
  | 'noodle'
  | 'pasta'
  | 'rice'
  | 'soup'
  | 'salad'
  | 'curry'
  | 'egg'
  | 'tofu'
  | 'nabe'
  | 'steam'
  | 'aemono'
  | 'dumpling'
  | 'bread'
  | 'veggie'
  | 'staple'
  | 'main'
  | 'side'

type Rule = { kind: DishIllustKind; words: string[] }

/** 先に当たった型を採用。具体的なものほど上 */
const NAME_RULES: Rule[] = [
  { kind: 'curry', words: ['カレー', 'キーマ', 'スパイスカレー'] },
  { kind: 'pasta', words: ['パスタ', 'スパゲッ', 'ペンネ', 'ラザニア', 'カルボナーラ', 'ボロネーゼ'] },
  { kind: 'noodle', words: ['うどん', 'そば', 'そうめん', 'ラーメン', '焼きそば', 'フォー', '麺'] },
  { kind: 'don', words: ['丼', 'どんぶり', '親子丼', '牛丼', 'カツ丼', '天丼', '海鮮丼'] },
  { kind: 'soup', words: ['味噌汁', '豚汁', 'スープ', 'ポタージュ', 'お澄まし', '具沢山汁'] },
  { kind: 'nabe', words: ['鍋', 'おでん', 'しゃぶしゃぶ', 'すき焼き', 'キムチチゲ', 'チゲ'] },
  { kind: 'salad', words: ['サラダ', 'カプレーゼ', 'コールスロー', 'ポテサラ'] },
  { kind: 'fried', words: ['唐揚', 'からあげ', '天ぷら', 'フライ', '揚げ', 'トンカツ', 'カツ'] },
  { kind: 'dumpling', words: ['餃子', 'シュウマイ', '焼売', '春巻き', 'ワンタン', '小籠包'] },
  { kind: 'bread', words: ['パン', 'トースト', 'サンド', 'ハンバーガー', 'ホットドッグ', 'ナン'] },
  { kind: 'steam', words: ['蒸し', 'ホイル焼き', 'せいろ', 'シュウマイ'] },
  { kind: 'egg', words: ['卵焼き', 'オムレツ', 'オムライス', 'だし巻き', 'スクランブル', 'ポーチド'] },
  { kind: 'tofu', words: ['豆腐', '冷奴', '厚揚げ', '麻婆', '湯豆腐'] },
  { kind: 'aemono', words: ['和え', 'おひたし', 'ナムル', '胡麻和え', '酢の物'] },
  { kind: 'nimono', words: ['煮', '筑前', '肉じゃが', '煮付け', '煮物', '含め煮'] },
  { kind: 'stirfry', words: ['炒め', 'ソテー', '野菜炒め', '回鍋', '青椒'] },
  { kind: 'fish', words: ['鮭', 'サバ', '鯖', 'ぶり', 'アジ', 'さんま', 'サンマ', '魚', '塩焼き', '焼き魚'] },
  { kind: 'meat', words: ['生姜焼き', 'ステーキ', '焼肉', 'グリル', 'ロースト', '照り焼き', 'ハンバーグ'] },
  { kind: 'rice', words: ['ごはん', 'ご飯', 'おにぎり', 'チャーハン', '炒飯', 'ピラフ', 'リゾット', 'おかゆ', '雑炊'] },
  { kind: 'veggie', words: ['きんぴら', 'ナムル', 'ブロッコリー', '野菜', 'きのこ'] },
]

const ING_RULES: Rule[] = [
  { kind: 'fish', words: ['鮭', 'サバ', '鯖', 'ぶり', 'アジ', 'さんま', 'サーモン', '白身魚', 'サケ'] },
  { kind: 'meat', words: ['鶏もも', '鶏むね', '豚肉', '牛肉', '合い挽き', 'ひき肉'] },
  { kind: 'tofu', words: ['豆腐', '厚揚げ', '木綿豆腐', '絹豆腐'] },
  { kind: 'egg', words: ['卵'] },
  { kind: 'noodle', words: ['うどん', 'そば', '中華麺', '焼きそば麺', 'フォー麺'] },
  { kind: 'pasta', words: ['パスタ', 'スパゲッティ', 'マカロニ'] },
  { kind: 'bread', words: ['パン', '食パン'] },
  { kind: 'rice', words: ['ご飯', '米'] },
]

const ROLE_FALLBACK: Record<DishRole, DishIllustKind> = {
  主食: 'staple',
  主菜: 'main',
  副菜: 'side',
}

function textHits(text: string, words: string[]): boolean {
  return words.some((w) => text.includes(w))
}

export function detectDishIllustKind(
  recipe: Pick<Recipe, 'name' | 'ingredients' | 'dishRole'>
): DishIllustKind {
  const name = recipe.name
  for (const rule of NAME_RULES) {
    if (textHits(name, rule.words)) return rule.kind
  }

  const ings = recipe.ingredients.join(' ')
  for (const rule of ING_RULES) {
    if (textHits(ings, rule.words) || textHits(name, rule.words)) return rule.kind
  }

  const role = recipe.dishRole ?? detectDishRole(recipe)
  return ROLE_FALLBACK[role]
}

export const DISH_ILLUST_LABEL: Record<DishIllustKind, string> = {
  fish: '魚',
  meat: '肉',
  stirfry: '炒め',
  nimono: '煮物',
  fried: '揚げ',
  don: '丼',
  noodle: '麺',
  pasta: 'パスタ',
  rice: 'ご飯',
  soup: '汁',
  salad: 'サラダ',
  curry: 'カレー',
  egg: '卵',
  tofu: '豆腐',
  nabe: '鍋',
  steam: '蒸し',
  aemono: '和え',
  dumpling: '点心',
  bread: 'パン',
  veggie: '野菜',
  staple: '主食',
  main: '主菜',
  side: '副菜',
}
