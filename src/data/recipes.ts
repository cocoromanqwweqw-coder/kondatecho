import type { DishRole, HealthTag, Recipe } from '../types'
import { HEALTH_TAGS } from '../types'
import { RECIPES_EXTRA } from './recipesExtra'
import { RECIPES_TRENDING } from './recipesTrending'
import { RECIPES_HEALTH } from './recipesHealth'
import { RECIPES_BULK } from './recipesBulk'
import {
  enrichRecipeHealth,
  isHealthRecipe,
  matchesHealthFilter,
} from '../lib/recipeHealth'
import { enrichDishRole } from '../lib/dishRole'
import {
  buildRecipeSearchIndex,
  filterIndexedRecipes,
  type RecipeSearchIndexEntry,
} from '../lib/recipeSearchIndex'
import { getLiveIndex, getLiveRecipes } from '../lib/recipeCatalogState'

const BASE_RECIPES: Recipe[] = [
  // 和食
  { id: 'w1', name: '肉じゃが', genre: '和食', ingredients: ['牛肉', 'じゃがいも', '玉ねぎ', 'にんじん', 'だし', '醤油'], cookingTime: 40, difficulty: '普通', description: '定番の煮物' },
  { id: 'w2', name: '豚の生姜焼き', genre: '和食', ingredients: ['豚肉', '玉ねぎ', '生姜', '醤油', 'みりん', 'ご飯'], cookingTime: 20, difficulty: '簡単', description: '生姜たっぷり' },
  { id: 'w3', name: '鮭の塩焼き', genre: '和食', ingredients: ['鮭', '塩', 'レモン', '大根', 'ご飯'], cookingTime: 15, difficulty: '簡単', description: 'シンプルな焼き魚' },
  { id: 'w4', name: '味噌汁', genre: '和食', ingredients: ['味噌', '豆腐', 'わかめ', 'だし', '長ねぎ'], cookingTime: 10, difficulty: '簡単', description: '毎日の定番汁物' },
  { id: 'w5', name: '筑前煮', genre: '和食', ingredients: ['鶏もも肉', 'れんこん', 'にんじん', 'ごぼう', 'だし', '醤油'], cookingTime: 35, difficulty: '普通', description: '根菜たっぷり煮物' },
  { id: 'w6', name: '親子丼', genre: '和食', ingredients: ['鶏もも肉', '卵', '玉ねぎ', 'だし', '醤油', 'ご飯'], cookingTime: 20, difficulty: '簡単', description: '鶏と卵の丼' },
  { id: 'w7', name: '天ぷら', genre: '和食', ingredients: ['エビ', 'なす', 'かぼちゃ', '小麦粉', '卵', '揚げ油'], cookingTime: 30, difficulty: 'やや手間', description: '揚げ物の定番' },
  { id: 'w8', name: '焼きさば', genre: '和食', ingredients: ['サバ', '塩', '大根', 'レモン', 'ご飯'], cookingTime: 15, difficulty: '簡単', description: 'さばの塩焼き' },
  { id: 'w9', name: 'おでん', genre: '和食', ingredients: ['大根', '卵', 'こんにゃく', 'ちくわ', 'だし', '醤油'], cookingTime: 45, difficulty: '普通', description: '冬の定番鍋' },
  { id: 'w10', name: 'きんぴらごぼう', genre: '和食', ingredients: ['ごぼう', 'にんじん', '醤油', 'みりん', 'ごま', '唐辛子'], cookingTime: 15, difficulty: '簡単', description: 'ごぼうの副菜' },
  { id: 'w11', name: '鯖の味噌煮', genre: '和食', ingredients: ['サバ', '味噌', '生姜', '玉ねぎ', 'みりん', 'ご飯'], cookingTime: 25, difficulty: '普通', description: '味噌の煮魚' },
  { id: 'w12', name: '卵焼き', genre: '和食', ingredients: ['卵', 'だし', '醤油', 'みりん', '砂糖'], cookingTime: 10, difficulty: '簡単', description: '甘めの卵焼き' },
  { id: 'w13', name: '野菜炒め', genre: '和食', ingredients: ['キャベツ', 'にんじん', 'ピーマン', 'もやし', '醤油', 'ごま油'], cookingTime: 15, difficulty: '簡単', description: '冷蔵庫の野菜消費' },
  { id: 'w14', name: '豚汁', genre: '和食', ingredients: ['豚肉', '大根', 'ごぼう', '味噌', 'ごま', 'ご飯'], cookingTime: 30, difficulty: '普通', description: '根菜たっぷり汁物' },
  { id: 'w15', name: '照り焼きチキン', genre: '和食', ingredients: ['鶏もも肉', '醤油', 'みりん', '酒', 'ご飯', 'キャベツ'], cookingTime: 25, difficulty: '普通', description: '甘辛照り焼き' },

  // 洋食
  { id: 'y1', name: 'ハンバーグ', genre: '洋食', ingredients: ['合い挽き肉', '玉ねぎ', '卵', 'パン', 'ソース', 'じゃがいも'], cookingTime: 30, difficulty: '普通', description: '定番洋食' },
  { id: 'y2', name: 'オムライス', genre: '洋食', ingredients: ['ご飯', '卵', '鶏もも肉', 'ケチャップ', '玉ねぎ', 'バター'], cookingTime: 25, difficulty: '普通', description: 'ふわとろ卵の定番' },
  { id: 'y3', name: 'グラタン', genre: '洋食', ingredients: ['マカロニ', 'ベーコン', '玉ねぎ', 'チーズ', '牛乳', 'バター'], cookingTime: 35, difficulty: '普通', description: 'チーズたっぷり' },
  { id: 'y4', name: 'ビーフシチュー', genre: '洋食', ingredients: ['牛肉', '玉ねぎ', 'にんじん', 'じゃがいも', '赤ワイン', 'トマト'], cookingTime: 90, difficulty: 'やや手間', description: 'じっくり煮込み' },
  { id: 'y5', name: 'スクランブルエッグ', genre: '洋食', ingredients: ['卵', 'バター', '牛乳', '塩', 'こしょう', 'パン'], cookingTime: 10, difficulty: '簡単', description: '朝食にも' },
  { id: 'y6', name: 'フライドチキン', genre: '洋食', ingredients: ['鶏もも肉', '小麦粉', '卵', 'スパイス', '揚げ油', 'レモン'], cookingTime: 30, difficulty: '普通', description: 'カリッと揚げ' },
  { id: 'y7', name: 'コロッケ', genre: '洋食', ingredients: ['じゃがいも', '合い挽き肉', '玉ねぎ', '卵', 'パン', '揚げ油'], cookingTime: 40, difficulty: 'やや手間', description: 'じゃがいも消費' },
  { id: 'y8', name: 'トマトスープ', genre: '洋食', ingredients: ['トマト', '玉ねぎ', 'にんにく', 'バター', '牛乳', 'パン'], cookingTime: 25, difficulty: '簡単', description: 'トマト缶で手軽に' },
  { id: 'y9', name: 'フィッシュフライ', genre: '洋食', ingredients: ['白身魚', '小麦粉', '卵', 'レモン', 'タルタル', 'じゃがいも'], cookingTime: 25, difficulty: '普通', description: '白身魚のフライ' },
  { id: 'y10', name: 'ミートローフ', genre: '洋食', ingredients: ['合い挽き肉', '玉ねぎ', '卵', 'パン', 'ケチャップ', 'にんじん'], cookingTime: 50, difficulty: '普通', description: 'オーブンで焼く' },
  { id: 'y11', name: 'カレーライス', genre: '洋食', ingredients: ['鶏もも肉', '玉ねぎ', 'にんじん', 'じゃがいも', 'カレールー', 'ご飯'], cookingTime: 35, difficulty: '普通', description: '家庭の定番' },
  { id: 'y12', name: 'ペペロンチーノ風', genre: '洋食', ingredients: ['スパゲッティ', 'にんにく', '唐辛子', 'オリーブオイル', 'パセリ'], cookingTime: 15, difficulty: '簡単', description: 'シンプルパスタ' },
  { id: 'y13', name: 'クラムチャウダー', genre: '洋食', ingredients: ['あさり', 'じゃがいも', '玉ねぎ', '牛乳', 'バター', 'パン'], cookingTime: 30, difficulty: '普通', description: 'クリーミーなスープ' },
  { id: 'y14', name: 'ロールキャベツ', genre: '洋食', ingredients: ['キャベツ', '合い挽き肉', '玉ねぎ', 'トマト', 'コンソメ', 'ご飯'], cookingTime: 45, difficulty: 'やや手間', description: '巻いて煮込む' },
  { id: 'y15', name: 'シーザーサラダ', genre: '洋食', ingredients: ['レタス', '鶏もも肉', 'パン', 'チーズ', 'レモン', 'オリーブオイル'], cookingTime: 20, difficulty: '簡単', description: '定番サラダ' },

  // 中華
  { id: 'c1', name: '麻婆豆腐', genre: '中華', ingredients: ['豆腐', '豚ひき肉', '長ねぎ', '豆板醤', 'にんにく', 'ご飯'], cookingTime: 20, difficulty: '普通', description: '辛旨定番' },
  { id: 'c2', name: '回鍋肉', genre: '中華', ingredients: ['豚肉', 'キャベツ', 'ピーマン', '長ねぎ', '豆板醤', 'ご飯'], cookingTime: 20, difficulty: '普通', description: '豚肉の炒め物' },
  { id: 'c3', name: '青椒肉絲', genre: '中華', ingredients: ['豚肉', 'ピーマン', 'たけのこ', '醤油', 'にんにく', 'ご飯'], cookingTime: 20, difficulty: '普通', description: 'ピーマンたっぷり' },
  { id: 'c4', name: 'エビチリ', genre: '中華', ingredients: ['エビ', 'ケチャップ', '豆板醤', 'にんにく', '長ねぎ', 'ご飯'], cookingTime: 20, difficulty: '普通', description: '甘辛エビ' },
  { id: 'c5', name: '餃子', genre: '中華', ingredients: ['豚ひき肉', 'キャベツ', 'にら', '餃子の皮', 'にんにく', '醤油'], cookingTime: 30, difficulty: '普通', description: '手作り餃子' },
  { id: 'c6', name: 'チャーハン', genre: '中華', ingredients: ['ご飯', '卵', 'ハム', '長ねぎ', 'にんにく', '醤油'], cookingTime: 15, difficulty: '簡単', description: '余りご飯で' },
  { id: 'c7', name: '酸辣湯', genre: '中華', ingredients: ['豆腐', 'きのこ', '卵', '酢', '唐辛子', '長ねぎ'], cookingTime: 20, difficulty: '普通', description: '酸っぱ辛いスープ' },
  { id: 'c8', name: '八宝菜', genre: '中華', ingredients: ['豚肉', 'キャベツ', 'にんじん', 'きのこ', 'もやし', 'ご飯'], cookingTime: 25, difficulty: '普通', description: '野菜たっぷり炒め' },
  { id: 'c9', name: '酢豚', genre: '中華', ingredients: ['豚肉', 'ピーマン', '玉ねぎ', 'パイン', '酢', 'ご飯'], cookingTime: 25, difficulty: '普通', description: '甘酢あん' },
  { id: 'c10', name: 'ラーメン', genre: '中華', ingredients: ['ラーメン', '豚肉', 'もやし', '長ねぎ', 'にんにく', '卵'], cookingTime: 20, difficulty: '普通', description: '手軽な一杯' },
  { id: 'c11', name: '春巻き', genre: '中華', ingredients: ['豚ひき肉', 'キャベツ', 'もやし', '春巻きの皮', 'にんにく', '揚げ油'], cookingTime: 30, difficulty: '普通', description: '揚げ春巻き' },
  { id: 'c12', name: '麻婆茄子', genre: '中華', ingredients: ['なす', '豚ひき肉', '長ねぎ', '豆板醤', 'にんにく', 'ご飯'], cookingTime: 20, difficulty: '普通', description: 'なすの麻婆' },
  { id: 'c13', name: '中華丼', genre: '中華', ingredients: ['ご飯', '豚肉', 'キャベツ', 'にんじん', 'きのこ', '醤油'], cookingTime: 20, difficulty: '簡単', description: 'あんかけ丼' },
  { id: 'c14', name: '焼きそば', genre: '中華', ingredients: ['焼きそば麺', '豚肉', 'キャベツ', 'もやし', 'ソース', 'にんにく'], cookingTime: 15, difficulty: '簡単', description: 'ソース焼きそば' },
  { id: 'c15', name: 'ワンタンスープ', genre: '中華', ingredients: ['ワンタン', '長ねぎ', 'にんにく', '醤油', 'ごま油', '白菜'], cookingTime: 20, difficulty: '普通', description: 'スープ付きワンタン' },

  // イタリアン
  { id: 'i1', name: 'カルボナーラ', genre: 'イタリアン', ingredients: ['スパゲッティ', 'ベーコン', '卵', 'チーズ', 'にんにく', '黒胡椒'], cookingTime: 20, difficulty: '普通', description: 'パスタと卵の定番' },
  { id: 'i2', name: 'ペペロンチーノ', genre: 'イタリアン', ingredients: ['スパゲッティ', 'にんにく', '唐辛子', 'オリーブオイル', 'パセリ'], cookingTime: 15, difficulty: '簡単', description: 'シンプルイタリアン' },
  { id: 'i3', name: 'ミートソース', genre: 'イタリアン', ingredients: ['合い挽き肉', 'トマト', '玉ねぎ', 'にんにく', 'スパゲッティ', 'チーズ'], cookingTime: 40, difficulty: '普通', description: 'トマト缶消費に' },
  { id: 'i4', name: 'マルゲリータピザ', genre: 'イタリアン', ingredients: ['ピザ生地', 'トマト', 'モッツァレラ', 'バジル', 'オリーブオイル'], cookingTime: 25, difficulty: '普通', description: '手作りピザの定番' },
  { id: 'i5', name: 'リゾット', genre: 'イタリアン', ingredients: ['米', 'きのこ', '玉ねぎ', '白ワイン', 'チーズ', 'バター'], cookingTime: 35, difficulty: 'やや手間', description: 'きのこを使い切り' },
  { id: 'i6', name: 'アラビアータ', genre: 'イタリアン', ingredients: ['スパゲッティ', 'トマト', 'にんにく', '唐辛子', 'オリーブオイル'], cookingTime: 20, difficulty: '簡単', description: 'トマト缶1つで完成' },
  { id: 'i7', name: 'カプレーゼ', genre: 'イタリアン', ingredients: ['トマト', 'モッツァレラ', 'バジル', 'オリーブオイル'], cookingTime: 10, difficulty: '簡単', description: '前菜・副菜にも' },
  { id: 'i8', name: 'ラザニア', genre: 'イタリアン', ingredients: ['ラザニアシート', '合い挽き肉', 'トマト', 'チーズ', '玉ねぎ', 'にんにく'], cookingTime: 60, difficulty: 'やや手間', description: '週末の本格イタリアン' },
  { id: 'i9', name: 'ボロネーゼ', genre: 'イタリアン', ingredients: ['合い挽き肉', 'トマト', '玉ねぎ', 'にんにく', 'スパゲッティ', 'チーズ'], cookingTime: 35, difficulty: '普通', description: '本格ミートソース' },
  { id: 'i10', name: 'ジェノベーゼ', genre: 'イタリアン', ingredients: ['スパゲッティ', 'バジル', 'にんにく', 'オリーブオイル', 'チーズ', '松の実'], cookingTime: 20, difficulty: '普通', description: 'バジルソースパスタ' },
  { id: 'i11', name: 'トマト煮込み', genre: 'イタリアン', ingredients: ['鶏もも肉', 'トマト', '玉ねぎ', 'にんにく', 'オリーブオイル', 'バジル'], cookingTime: 40, difficulty: '普通', description: 'トマト缶で煮込み' },
  { id: 'i12', name: 'フリッタータ', genre: 'イタリアン', ingredients: ['卵', 'じゃがいも', '玉ねぎ', 'チーズ', 'オリーブオイル'], cookingTime: 25, difficulty: '普通', description: '卵とじゃがいものイタリアン' },
  { id: 'i13', name: 'ミネストローネ', genre: 'イタリアン', ingredients: ['トマト', 'にんじん', '玉ねぎ', 'キャベツ', '豆', 'オリーブオイル'], cookingTime: 35, difficulty: '普通', description: '野菜たっぷりスープ' },
  { id: 'i14', name: 'チーズリゾット', genre: 'イタリアン', ingredients: ['米', 'チーズ', '玉ねぎ', '白ワイン', 'バター', 'にんにく'], cookingTime: 35, difficulty: 'やや手間', description: 'クリーミーなリゾット' },
  { id: 'i15', name: 'ブルスケッタ', genre: 'イタリアン', ingredients: ['パン', 'トマト', 'バジル', 'にんにく', 'オリーブオイル'], cookingTime: 10, difficulty: '簡単', description: 'トマトとパンの前菜' },

  // 韓国料理
  { id: 'k1', name: 'ビビンバ', genre: '韓国料理', ingredients: ['ご飯', '牛肉', 'にんじん', 'ほうれん草', 'もやし', 'コチュジャン', '卵'], cookingTime: 35, difficulty: 'やや手間', description: '彩り野菜を使い切り' },
  { id: 'k2', name: 'プルコギ', genre: '韓国料理', ingredients: ['牛肉', '玉ねぎ', 'にんにく', 'ごま油', '醤油', 'ご飯'], cookingTime: 25, difficulty: '普通', description: '牛肉の韓国風焼き' },
  { id: 'k3', name: 'チゲ鍋', genre: '韓国料理', ingredients: ['豆腐', 'キムチ', '豚肉', 'もやし', '長ねぎ', 'コチュジャン'], cookingTime: 30, difficulty: '普通', description: 'キムチ消費の定番' },
  { id: 'k4', name: 'サムギョプサル', genre: '韓国料理', ingredients: ['豚バラ肉', 'レタス', 'にんにく', 'コチュジャン', 'ごま油'], cookingTime: 25, difficulty: '普通', description: '豚バラ肉の韓国風' },
  { id: 'k5', name: 'チヂミ', genre: '韓国料理', ingredients: ['キムチ', '小麦粉', '卵', 'もやし', '長ねぎ', 'ごま油'], cookingTime: 20, difficulty: '普通', description: 'キムチでおつまみも' },
  { id: 'k6', name: 'ヤンニョムチキン', genre: '韓国料理', ingredients: ['鶏もも肉', 'コチュジャン', 'にんにく', 'ごま', '醤油'], cookingTime: 35, difficulty: '普通', description: '鶏肉の韓国風揚げ' },
  { id: 'k7', name: 'スンドゥブ', genre: '韓国料理', ingredients: ['豆腐', 'キムチ', '卵', '長ねぎ', 'コチュジャン', 'ごま油'], cookingTime: 20, difficulty: '簡単', description: '豆腐とキムチの鍋' },
  { id: 'k8', name: 'ナムル和え定食', genre: '韓国料理', ingredients: ['ほうれん草', 'もやし', 'にんじん', 'ごま油', 'ご飯', 'コチュジャン'], cookingTime: 25, difficulty: '普通', description: '野菜の和え物たっぷり' },
  { id: 'k9', name: 'トッポギ', genre: '韓国料理', ingredients: ['トッポキ', 'キムチ', '長ねぎ', 'コチュジャン', 'ごま油'], cookingTime: 20, difficulty: '普通', description: 'キムチと餅の煮物' },
  { id: 'k10', name: 'カルビ丼', genre: '韓国料理', ingredients: ['牛肉', '玉ねぎ', 'ごま', '醤油', 'ご飯', 'コチュジャン'], cookingTime: 20, difficulty: '普通', description: '牛肉の甘辛丼' },
  { id: 'k11', name: 'キムチスープ', genre: '韓国料理', ingredients: ['キムチ', '豆腐', '豚肉', '長ねぎ', 'コチュジャン', 'ごま油'], cookingTime: 25, difficulty: '簡単', description: 'キムチの古い分に' },
  { id: 'k12', name: '海苔巻きごはん', genre: '韓国料理', ingredients: ['ご飯', 'のり', 'ほうれん草', 'にんじん', '卵', 'ごま油'], cookingTime: 30, difficulty: '普通', description: '彩りキンパ風' },
  { id: 'k13', name: 'ジャージャー麺風', genre: '韓国料理', ingredients: ['中華麺', '豚ひき肉', 'キュウリ', '長ねぎ', 'コチュジャン', 'ごま'], cookingTime: 20, difficulty: '普通', description: '肉味噌麺アレンジ' },
  { id: 'k14', name: '韓国風チヂミ', genre: '韓国料理', ingredients: ['キムチ', 'もやし', '小麦粉', '卵', '長ねぎ', 'ごま油'], cookingTime: 20, difficulty: '普通', description: 'もやし入りチヂミ' },
  { id: 'k15', name: 'コングクス', genre: '韓国料理', ingredients: ['中華麺', 'きゅうり', 'ごま', '酢', '氷'], cookingTime: 15, difficulty: '簡単', description: '夏向け冷たい麺' },

  // エスニック
  { id: 'e1', name: 'グリーンカレー', genre: 'エスニック', ingredients: ['鶏もも肉', 'なす', 'たけのこ', 'ココナッツミルク', 'バジル', 'ご飯'], cookingTime: 30, difficulty: '普通', description: 'タイ風カレー' },
  { id: 'e2', name: 'タコス', genre: 'エスニック', ingredients: ['合い挽き肉', 'トルティーヤ', 'トマト', 'レタス', 'チーズ', 'アボカド'], cookingTime: 20, difficulty: '簡単', description: 'メキシカンな一皿' },
  { id: 'e3', name: 'ガパオライス', genre: 'エスニック', ingredients: ['鶏ひき肉', 'バジル', 'にんにく', '唐辛子', 'ご飯', '卵'], cookingTime: 20, difficulty: '普通', description: 'タイの定番丼' },
  { id: 'e4', name: 'フォー', genre: 'エスニック', ingredients: ['フォー麺', '牛肉', 'もやし', 'バジル', 'ライム', '長ねぎ'], cookingTime: 25, difficulty: '普通', description: 'ベトナム風麺' },
  { id: 'e5', name: 'バターチキン', genre: 'エスニック', ingredients: ['鶏もも肉', 'トマト', 'バター', 'ヨーグルト', 'ご飯', 'にんにく'], cookingTime: 40, difficulty: '普通', description: 'インド風クリームチキン' },
  { id: 'e6', name: 'ナシゴレン', genre: 'エスニック', ingredients: ['ご飯', 'エビ', '卵', '長ねぎ', 'にんにく', 'ソース'], cookingTime: 15, difficulty: '簡単', description: 'インドネシア風チャーハン' },
  { id: 'e7', name: 'パッタイ', genre: 'エスニック', ingredients: ['ライスヌードル', 'エビ', 'もやし', '卵', 'ピーナッツ', 'ライム'], cookingTime: 25, difficulty: '普通', description: 'タイ風焼きそば' },
  { id: 'e8', name: 'サテー', genre: 'エスニック', ingredients: ['鶏もも肉', 'ピーナッツ', 'ココナッツミルク', 'にんにく', 'ライム'], cookingTime: 30, difficulty: '普通', description: 'ピーナッツソースの焼き串' },
  { id: 'e9', name: 'レッドカレー', genre: 'エスニック', ingredients: ['鶏もも肉', 'なす', 'ココナッツミルク', 'バジル', 'ご飯', 'にんにく'], cookingTime: 30, difficulty: '普通', description: '辛めのタイカレー' },
  { id: 'e10', name: 'ブリトー', genre: 'エスニック', ingredients: ['トルティーヤ', '合い挽き肉', 'トマト', 'レタス', 'チーズ', 'アボカド'], cookingTime: 20, difficulty: '簡単', description: 'メキシカンラップ' },
  { id: 'e11', name: 'ドールマ', genre: 'エスニック', ingredients: ['合い挽き肉', 'トマト', '玉ねぎ', 'ライム', 'ヨーグルト', 'ごま'], cookingTime: 45, difficulty: 'やや手間', description: 'トマトの肉詰め' },
  { id: 'e12', name: 'ケバブ風', genre: 'エスニック', ingredients: ['鶏もも肉', 'ヨーグルト', 'にんにく', 'レタス', 'トマト', 'パン'], cookingTime: 25, difficulty: '普通', description: 'ヨーグルト漬けチキン' },
  { id: 'e13', name: 'パッラックパニール', genre: 'エスニック', ingredients: ['ほうれん草', '豆腐', 'トマト', 'にんにく', 'ごま', 'ご飯'], cookingTime: 25, difficulty: '普通', description: 'ほうれん草とチーズカレー' },
  { id: 'e14', name: 'シュワルマ', genre: 'エスニック', ingredients: ['鶏もも肉', 'パン', 'ヨーグルト', 'トマト', 'レタス', 'にんにく'], cookingTime: 25, difficulty: '普通', description: '中東風サンド' },
  { id: 'e15', name: 'トムヤムクン', genre: 'エスニック', ingredients: ['エビ', 'きのこ', 'トマト', 'ライム', 'レモングラス', '唐辛子'], cookingTime: 25, difficulty: '普通', description: '酸っぱ辛いタイスープ' },
]

export function enrichRecipe(recipe: Recipe): Recipe {
  return enrichDishRole(enrichRecipeHealth(recipe))
}

export function mergeRecipes(...sources: Recipe[][]): Recipe[] {
  const seen = new Set<string>()
  const merged: Recipe[] = []
  for (const source of sources) {
    for (const recipe of source) {
      if (seen.has(recipe.id)) continue
      seen.add(recipe.id)
      merged.push(enrichRecipe(recipe))
    }
  }
  return merged
}

export const CURATED_RECIPES: Recipe[] = mergeRecipes(
  BASE_RECIPES,
  RECIPES_EXTRA,
  RECIPES_TRENDING,
  RECIPES_HEALTH
)

export const RECIPES: Recipe[] = mergeRecipes(CURATED_RECIPES, RECIPES_BULK)

const RECIPE_SEARCH_INDEX: RecipeSearchIndexEntry[] = buildRecipeSearchIndex(RECIPES)

function activeRecipes(): Recipe[] {
  return getLiveRecipes() ?? RECIPES
}

function activeIndex(): RecipeSearchIndexEntry[] {
  return getLiveIndex() ?? RECIPE_SEARCH_INDEX
}

export function getRecipes(): Recipe[] {
  return activeRecipes()
}

export function getRecipeSearchIndex(): RecipeSearchIndexEntry[] {
  return activeIndex()
}

export function getRecipeById(id: string): Recipe | undefined {
  return activeRecipes().find((r) => r.id === id)
}

export function searchRecipes(options: {
  genre?: string
  query?: string
  ingredient?: string
  dishRole?: DishRole
  trending?: boolean
  health?: boolean
  healthTags?: HealthTag[]
  favoriteIds?: string[]
}): Recipe[] {
  const recipes = activeRecipes()
  let list = options.query || options.ingredient
    ? filterIndexedRecipes(activeIndex(), {
        query: options.query,
        ingredient: options.ingredient,
      })
    : recipes

  return list.filter((r) => {
    if (options.genre && options.genre !== 'すべて' && r.genre !== options.genre) return false
    if (options.dishRole && r.dishRole !== options.dishRole) return false
    if (options.trending && !r.trending) return false
    if (options.health && !isHealthRecipe(r)) return false
    if (options.healthTags && options.healthTags.length > 0 && !matchesHealthFilter(r, options.healthTags)) {
      return false
    }
    if (options.favoriteIds && options.favoriteIds.length > 0 && !options.favoriteIds.includes(r.id)) {
      return false
    }
    return true
  })
}

export function getTrendingRecipes(): Recipe[] {
  return activeRecipes().filter((r) => r.trending)
}

export function getHealthRecipes(tags?: HealthTag[]): Recipe[] {
  const recipes = activeRecipes()
  if (tags && tags.length > 0) {
    return recipes.filter((r) => matchesHealthFilter(r, tags))
  }
  return recipes.filter(isHealthRecipe)
}

export function countByHealthTag(): Record<HealthTag, number> {
  const counts = Object.fromEntries(HEALTH_TAGS.map((tag) => [tag, 0])) as Record<
    HealthTag,
    number
  >
  for (const recipe of activeRecipes()) {
    for (const tag of recipe.healthTags ?? []) {
      if (tag in counts) counts[tag] += 1
    }
  }
  return counts
}

export function getRecipesByDishRole(role: DishRole): Recipe[] {
  return activeRecipes().filter((r) => r.dishRole === role)
}

export function getRecipeCount(): number {
  return activeRecipes().length
}

