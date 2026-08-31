import type { Recipe } from '../types'
import { withTrendingLinks } from '../lib/recipeLinks'

const TRENDING_RAW: Omit<Recipe, 'links'>[] = [
  { id: 't1', name: '至高の豚キムチ', genre: '韓国料理', ingredients: ['豚肉', 'キムチ', '長ねぎ', 'ごま油', 'コチュジャン', 'ご飯'], cookingTime: 15, difficulty: '簡単', description: '豚肉とキムチの相性抜群。SNSで大流行', trending: true },
  { id: 't2', name: 'やみつきチキン', genre: '和食', ingredients: ['鶏もも肉', '長ねぎ', 'ごま', '醤油', '酢', 'ごま油'], cookingTime: 20, difficulty: '簡単', description: 'ごまダレが止まらない定番', trending: true },
  { id: 't3', name: 'ベイクドポテト', genre: '洋食', ingredients: ['じゃがいも', 'バター', 'ベーコン', 'チーズ', 'サワークリーム', '長ねぎ'], cookingTime: 60, difficulty: '普通', description: '丸ごとじゃがいもが話題', trending: true },
  { id: 't4', name: 'アンチョビバタートースト', genre: 'イタリアン', ingredients: ['パン', 'アンチョビ', 'バター', 'にんにく', 'オリーブオイル', 'パセリ'], cookingTime: 10, difficulty: '簡単', description: '居酒屋メニューが家庭に', trending: true },
  { id: 't5', name: 'キーマカレー', genre: 'エスニック', ingredients: ['合い挽き肉', '玉ねぎ', 'トマト', 'にんにく', 'カレー粉', 'ご飯'], cookingTime: 25, difficulty: '普通', description: 'スパイス香る本格派', trending: true },
  { id: 't6', name: '油そば', genre: '中華', ingredients: ['中華麺', '豚肉', 'もやし', '長ねぎ', 'にんにく', 'ラー油'], cookingTime: 15, difficulty: '簡単', description: '汁なし麺ブームの定番', trending: true },
  { id: 't7', name: '豚汁', genre: '和食', ingredients: ['豚肉', '大根', 'にんじん', 'ごぼう', '味噌', 'ご飯'], cookingTime: 30, difficulty: '普通', description: '根菜たっぷり汁物', trending: true },
  { id: 't8', name: '冷やしうどん', genre: '和食', ingredients: ['うどん', '卵', 'きゅうり', 'ハム', 'めんつゆ', 'ごま'], cookingTime: 10, difficulty: '簡単', description: '夏の定番が年間人気', trending: true },
  { id: 't9', name: '鶏胸肉の柔らかステーキ', genre: '洋食', ingredients: ['鶏胸肉', '塩', 'こしょう', 'バター', 'レモン', 'にんにく'], cookingTime: 15, difficulty: '簡単', description: 'ヘルシー高タンパクが続々', trending: true },
  { id: 't10', name: 'ハニーバターチキン', genre: '洋食', ingredients: ['鶏もも肉', 'はちみつ', 'バター', '醤油', 'にんにく', 'ご飯'], cookingTime: 25, difficulty: '普通', description: '甘辛ソースがやみつき', trending: true },
  { id: 't11', name: 'バズリ鍋', genre: '韓国料理', ingredients: ['キムチ', '豚肉', 'チーズ', '豆腐', 'もやし', 'コチュジャン'], cookingTime: 25, difficulty: '簡単', description: 'キムチ×チーズの鍋', trending: true },
  { id: 't12', name: 'うずらソーセージ巻き', genre: '洋食', ingredients: ['うずらの卵', 'ソーセージ', '片栗粉', 'ケチャップ', 'マヨネーズ'], cookingTime: 15, difficulty: '簡単', description: '短尺動画で拡散', trending: true },
  { id: 't13', name: 'アボカドエッグトースト', genre: '洋食', ingredients: ['パン', 'アボカド', '卵', 'レモン', '塩', 'こしょう'], cookingTime: 10, difficulty: '簡単', description: '朝ごはんの定番に', trending: true },
  { id: 't14', name: 'エアフライヤーポテト', genre: '洋食', ingredients: ['じゃがいも', 'オリーブオイル', '塩', 'こしょう', 'ローズマリー'], cookingTime: 20, difficulty: '簡単', description: 'ノンフライでカリッと', trending: true },
  { id: 't15', name: 'エアフライヤーチキン', genre: '洋食', ingredients: ['鶏もも肉', '片栗粉', '塩', 'こしょう', 'レモン', 'にんにく'], cookingTime: 25, difficulty: '簡単', description: '揚げ物を手軽に', trending: true },
  { id: 't16', name: '至高のオムライス', genre: '和食', ingredients: ['ご飯', '卵', '鶏もも肉', 'ケチャップ', 'バター', '玉ねぎ'], cookingTime: 25, difficulty: '普通', description: 'ふわとろ卵が人気', trending: true },
  { id: 't17', name: 'ナポリタン', genre: 'イタリアン', ingredients: ['スパゲッティ', 'ケチャップ', '玉ねぎ', 'ピーマン', 'ベーコン', 'バター'], cookingTime: 20, difficulty: '簡単', description: 'レトロ洋食が再注目', trending: true },
  { id: 't18', name: 'サバ缶バター', genre: '和食', ingredients: ['サバ', 'バター', '醤油', 'にんにく', 'ご飯', '長ねぎ'], cookingTime: 10, difficulty: '簡単', description: '缶詰アレンジの定番', trending: true },
  { id: 't19', name: 'チーズタッカルビ', genre: '韓国料理', ingredients: ['鶏もも肉', 'チーズ', 'コチュジャン', '玉ねぎ', 'キャベツ', 'ごま油'], cookingTime: 25, difficulty: '普通', description: 'とろけるチーズが人気', trending: true },
  { id: 't20', name: 'ガーリックシュリンプ', genre: '洋食', ingredients: ['エビ', 'にんにく', 'バター', '白ワイン', 'パセリ', 'パン'], cookingTime: 15, difficulty: '普通', description: 'ビストロ風の定番', trending: true },
  { id: 't21', name: 'スタミナ丼', genre: '和食', ingredients: ['ご飯', '豚肉', 'にんにく', '卵', '長ねぎ', '醤油'], cookingTime: 15, difficulty: '簡単', description: 'にんにくたっぷり丼', trending: true },
  { id: 't22', name: '厚揚げのあごだし煮', genre: '和食', ingredients: ['厚揚げ', 'だし', '醤油', 'みりん', '長ねぎ', 'ごま'], cookingTime: 15, difficulty: '簡単', description: '豆腐の人気レシピ', trending: true },
  { id: 't23', name: 'スパム巻き', genre: '韓国料理', ingredients: ['スパム', 'ご飯', 'のり', '卵', 'ごま油', '醤油'], cookingTime: 15, difficulty: '簡単', description: 'おにぎりアレンジ', trending: true },
  { id: 't24', name: '冷やし中華', genre: '中華', ingredients: ['中華麺', 'きゅうり', 'ハム', '卵', 'トマト', 'ごま'], cookingTime: 15, difficulty: '簡単', description: '夏の定番中華', trending: true },
  { id: 't25', name: 'エッグスラット風バーガー', genre: '洋食', ingredients: ['パン', '卵', 'バター', 'ベーコン', 'チーズ', 'ケチャップ'], cookingTime: 20, difficulty: '普通', description: 'とろとろ卵サンド', trending: true },
  { id: 't26', name: 'サーモンとサワークリーム', genre: '洋食', ingredients: ['サーモン', 'サワークリーム', '玉ねぎ', 'レモン', 'ディル', 'パン'], cookingTime: 15, difficulty: '簡単', description: 'カフェ風メニュー', trending: true },
  { id: 't27', name: '至高の豚平焼き', genre: '和食', ingredients: ['豚肉', 'キャベツ', '卵', 'ソース', 'マヨネーズ', 'ご飯'], cookingTime: 20, difficulty: '簡単', description: 'ソースたっぷり', trending: true },
  { id: 't28', name: 'レンジ茶碗蒸し', genre: '和食', ingredients: ['卵', 'だし', '鶏ひき肉', 'しいたけ', '醤油'], cookingTime: 10, difficulty: '簡単', description: 'レンジで完成', trending: true },
  { id: 't29', name: 'マーラー鍋風', genre: '中華', ingredients: ['豚肉', '豆腐', 'きのこ', '花椒', '豆板醤', '長ねぎ'], cookingTime: 30, difficulty: '普通', description: 'しびれ鍋ブーム', trending: true },
  { id: 't30', name: 'バター白滝鍋', genre: '和食', ingredients: ['鶏もも肉', '白菜', 'バター', '塩', 'こしょう', '長ねぎ'], cookingTime: 25, difficulty: '簡単', description: 'シンプル鍋が人気', trending: true },
]

/** 最近よく作られている人気レシピ（SNS・家庭料理トレンド） */
export const RECIPES_TRENDING: Recipe[] = TRENDING_RAW.map(withTrendingLinks)

export const TRENDING_COUNT = RECIPES_TRENDING.length
