import type { Recipe } from '../types'

/** 更新時に別セットとして表示する追加レシピ（各ジャンル16〜30件目） */
export const RECIPES_EXTRA: Recipe[] = [
  // 和食 w16-w30
  { id: 'w16', name: '牛丼', genre: '和食', ingredients: ['牛肉', '玉ねぎ', 'ご飯', 'だし', '醤油', 'みりん'], cookingTime: 20, difficulty: '簡単', description: '牛肉の甘辛丼' },
  { id: 'w17', name: 'カツ丼', genre: '和食', ingredients: ['豚肉', '卵', 'ご飯', '玉ねぎ', 'だし', '小麦粉'], cookingTime: 30, difficulty: '普通', description: 'カツと卵の丼' },
  { id: 'w18', name: '冷ややっこ', genre: '和食', ingredients: ['豆腐', '長ねぎ', '生姜', 'かつお節', '醤油'], cookingTime: 5, difficulty: '簡単', description: '豆腐1丁で副菜' },
  { id: 'w19', name: 'ほうれん草のおひたし', genre: '和食', ingredients: ['ほうれん草', 'かつお節', '醤油', 'ごま'], cookingTime: 10, difficulty: '簡単', description: 'ほうれん草消費' },
  { id: 'w20', name: 'さんmaの塩焼き', genre: '和食', ingredients: ['サンマ', '大根おろし', 'レモン', 'ご飯', '味噌'], cookingTime: 20, difficulty: '簡単', description: '秋の定番魚' },
  { id: 'w21', name: 'ちらし寿司', genre: '和食', ingredients: ['ご飯', 'エビ', '卵', 'きゅうり', '酢', 'ごま'], cookingTime: 30, difficulty: '普通', description: '彩り寿司' },
  { id: 'w22', name: '豆腐ハンバーグ', genre: '和食', ingredients: ['豆腐', '鶏ひき肉', '玉ねぎ', '卵', 'パン', 'ソース'], cookingTime: 25, difficulty: '普通', description: 'ヘルシー和風ハンバーグ' },
  { id: 'w23', name: 'たたきごぼう', genre: '和食', ingredients: ['ごぼう', 'ごま', '醤油', '酢', '唐辛子'], cookingTime: 15, difficulty: '簡単', description: 'ごぼうの和え物' },
  { id: 'w24', name: 'いわしの蒲焼き風', genre: '和食', ingredients: ['イワシ', '醤油', 'みりん', 'ご飯', '大根'], cookingTime: 20, difficulty: '普通', description: 'イワシ缶でも可' },
  { id: 'w25', name: 'かに玉', genre: '和食', ingredients: ['カニ', '卵', '長ねぎ', 'だし', '醤油', 'ご飯'], cookingTime: 15, difficulty: '簡単', description: 'カニと卵の炒め' },
  { id: 'w26', name: 'なす味噌炒め', genre: '和食', ingredients: ['なす', '豚肉', '味噌', 'にんにく', '長ねぎ', 'ご飯'], cookingTime: 20, difficulty: '簡単', description: 'なす消費の定番' },
  { id: 'w27', name: 'しらす丼', genre: '和食', ingredients: ['ご飯', 'しらす', 'のり', '卵', '醤油'], cookingTime: 10, difficulty: '簡単', description: 'さっと作れる丼' },
  { id: 'w28', name: 'けんちん汁', genre: '和食', ingredients: ['だし', 'ごぼう', 'にんじん', 'こんにゃく', '里芋', '醤油'], cookingTime: 30, difficulty: '普通', description: '根菜たっぷり汁物' },
  { id: 'w29', name: '鶏の唐揚げ', genre: '和食', ingredients: ['鶏もも肉', '醤油', 'にんにく', '卵', '片栗粉', 'レモン'], cookingTime: 30, difficulty: '普通', description: '定番の鶏揚げ' },
  { id: 'w30', name: '茶碗蒸し', genre: '和食', ingredients: ['卵', 'だし', '鶏もも肉', 'しいたけ', '三つ葉'], cookingTime: 25, difficulty: 'やや手間', description: '優しい和の蒸し物' },

  // 洋食 y16-y30
  { id: 'y16', name: 'ドリア', genre: '洋食', ingredients: ['ご飯', 'ベーコン', '玉ねぎ', 'チーズ', 'ホワイトソース'], cookingTime: 30, difficulty: '普通', description: '余りご飯のグラタン風' },
  { id: 'y17', name: 'ポトフ', genre: '洋食', ingredients: ['ソーセージ', 'じゃがいも', 'にんじん', '玉ねぎ', 'キャベツ'], cookingTime: 30, difficulty: '簡単', description: 'ソーセージと野菜の煮込み' },
  { id: 'y18', name: 'サーモンムニエル', genre: '洋食', ingredients: ['サーモン', 'レモン', 'バター', '小麦粉', 'パセリ'], cookingTime: 20, difficulty: '普通', description: 'サーモンのバター焼き' },
  { id: 'y19', name: 'キッシュ', genre: '洋食', ingredients: ['卵', 'ベーコン', '玉ねぎ', 'チーズ', '牛乳'], cookingTime: 40, difficulty: 'やや手間', description: '卵とベーコンのタルト' },
  { id: 'y20', name: 'ガーリックトースト', genre: '洋食', ingredients: ['パン', 'にんにく', 'バター', 'パセリ', 'チーズ'], cookingTime: 10, difficulty: '簡単', description: 'にんにくパン' },
  { id: 'y21', name: 'ラタトゥイユ', genre: '洋食', ingredients: ['トマト', 'なす', 'ズッキーニ', 'ピーマン', '玉ねぎ', 'にんにく'], cookingTime: 40, difficulty: '普通', description: '野菜たっぷり煮込み' },
  { id: 'y22', name: 'チキンカレー', genre: '洋食', ingredients: ['鶏もも肉', '玉ねぎ', 'にんじん', 'じゃがいも', 'カレールー', 'ご飯'], cookingTime: 35, difficulty: '普通', description: '家庭の定番カレー' },
  { id: 'y23', name: 'パエリア風', genre: '洋食', ingredients: ['米', 'エビ', 'イカ', 'パプリカ', 'トマト', 'にんにく'], cookingTime: 40, difficulty: 'やや手間', description: 'シーフードご飯' },
  { id: 'y24', name: 'マカロニグラタン', genre: '洋食', ingredients: ['マカロニ', 'ハム', 'チーズ', '牛乳', 'バター'], cookingTime: 30, difficulty: '普通', description: 'マカロニとチーズ' },
  { id: 'y25', name: 'ツナパスタ', genre: '洋食', ingredients: ['スパゲッティ', 'ツナ', 'にんにく', 'トマト', 'オリーブオイル'], cookingTime: 15, difficulty: '簡単', description: 'ツナ缶パスタ' },
  { id: 'y26', name: 'ステーキ', genre: '洋食', ingredients: ['牛肉', 'にんにく', 'バター', 'じゃがいも', 'ブロッコリー'], cookingTime: 25, difficulty: '普通', description: '牛肉のステーキ' },
  { id: 'y27', name: 'パンケーキ', genre: '洋食', ingredients: ['小麦粉', '卵', '牛乳', 'バター', 'はちみつ'], cookingTime: 20, difficulty: '簡単', description: '甘い朝食' },
  { id: 'y28', name: 'コーンクリームスープ', genre: '洋食', ingredients: ['コーン', '玉ねぎ', '牛乳', 'バター', 'パン'], cookingTime: 20, difficulty: '簡単', description: 'コーン缶スープ' },
  { id: 'y29', name: 'ローストチキン', genre: '洋食', ingredients: ['鶏もも肉', 'にんにく', 'ローズマリー', 'レモン', 'じゃがいも'], cookingTime: 50, difficulty: 'やや手間', description: '丸鶏風ロースト' },
  { id: 'y30', name: 'フレンチトースト', genre: '洋食', ingredients: ['パン', '卵', '牛乳', 'バター', 'はちみつ'], cookingTime: 15, difficulty: '簡単', description: '甘いパン料理' },
]