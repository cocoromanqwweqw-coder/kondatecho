const KATAKANA_START = 0x30a1
const HIRAGANA_START = 0x3041

/** 検索用に日本語テキストを正規化（NFKC・カタカナ→ひらがな・全角英数→半角） */
export function normalizeJapaneseText(text: string): string {
  return text
    .normalize('NFKC')
    .replace(/[\u30a1-\u30f6]/g, (ch) =>
      String.fromCharCode(ch.charCodeAt(0) - (KATAKANA_START - HIRAGANA_START))
    )
    .replace(/[\uff01-\uff5e]/g, (ch) =>
      String.fromCharCode(ch.charCodeAt(0) - 0xfee0)
    )
    .replace(/\u3000/g, ' ')
    .replace(/\s+/g, '')
    .toLowerCase()
}

function normalizeProlongedSound(text: string): string {
  return text.replace(/[ー−-]/g, 'ー')
}

export { normalizeProlongedSound }

const COMPOUND_READINGS: readonly [string, string][] = [
  ['豚の生姜焼き', 'ぶたのしょうがやき'],
  ['鮭の塩焼き', 'さけのしおやき'],
  ['鯖の味噌煮', 'さばのみそに'],
  ['照り焼きチキン', 'てりやきちきん'],
  ['合い挽き肉', 'あいびきにく'],
  ['鶏もも肉', 'とりももにく'],
  ['鶏胸肉', 'とりむねにく'],
  ['鶏ひき肉', 'とりひきにく'],
  ['豚ひき肉', 'ぶたひきにく'],
  ['豚バラ肉', 'ぶたばらにく'],
  ['大根おろし', 'だいこんおろし'],
  ['ロールキャベツ', 'ろーるきゃべつ'],
  ['クラムチャウダー', 'くらむちゃうだー'],
  ['フィッシュフライ', 'ふぃっしゅふらい'],
  ['スクランブルエッグ', 'すくらんぶるえっぐ'],
  ['ワンタンスープ', 'わんたんすーぷ'],
  ['マルゲリータピザ', 'まるげりーたぴざ'],
  ['チーズリゾット', 'ちーずりぞっと'],
  ['ミネストローネ', 'みねすとろーね'],
  ['ペペロンチーノ風', 'ぺぺろんちーのふう'],
  ['肉じゃが', 'にくじゃが'],
  ['親子丼', 'おやこどん'],
  ['生姜焼き', 'しょうがやき'],
  ['筑前煮', 'ちくぜんに'],
  ['きんぴらごぼう', 'きんぴらごぼう'],
  ['味噌汁', 'みそしる'],
  ['卵焼き', 'たまごやき'],
  ['野菜炒め', 'やさいいため'],
  ['照り焼き', 'てりやき'],
  ['焼きさば', 'やきさば'],
  ['天ぷら', 'てんぷら'],
  ['ハンバーグ', 'はんばーぐ'],
  ['オムライス', 'おむらいす'],
  ['カレーライス', 'かれーらいす'],
  ['麻婆豆腐', 'まーぼうどうふ'],
  ['麻婆茄子', 'まーぼなす'],
  ['回鍋肉', 'ほいこーろー'],
  ['青椒肉絲', 'チンジャオロース'],
  ['八宝菜', 'はっぽうさい'],
  ['春巻き', 'はるまき'],
  ['中華丼', 'ちゅうかどん'],
  ['焼きそば', 'やきそば'],
  ['冷やし中華', 'ひやしちゅうか'],
  ['冷やしうどん', 'ひやしうどん'],
  ['牛丼', 'ぎゅうどん'],
  ['カツ丼', 'かつどん'],
  ['シーザーサラダ', 'しーざーさらだ'],
  ['トマトスープ', 'とまとすーぷ'],
  ['ビーフシチュー', 'びーふしちゅー'],
  ['フライドチキン', 'ふらいどちきん'],
  ['カルボナーラ', 'かるぼなーら'],
  ['ペペロンチーノ', 'ぺぺろんちーの'],
  ['ミートソース', 'みーとそーす'],
  ['ボロネーゼ', 'ぼろねーぜ'],
  ['ジェノベーゼ', 'じぇのべーぜ'],
  ['ミートローフ', 'みーとろーふ'],
  ['茶碗蒸し', 'ちゃわんむし'],
  ['豚汁', 'とんじる'],
  ['生姜', 'しょうが'],
  ['玉ねぎ', 'たまねぎ'],
  ['長ねぎ', 'ながねぎ'],
  ['白身魚', 'しろみざかな'],
  ['唐揚げ', 'からあげ'],
  ['チャーハン', 'ちゃーはん'],
  ['餃子', 'ぎょうざ'],
  ['酢豚', 'すぶた'],
  ['酸辣湯', 'サンラータン'],
  ['エビチリ', 'えびちり'],
  ['牛肉', 'ぎゅうにく'],
  ['豚肉', 'ぶたにく'],
  ['鶏肉', 'とりにく'],
  ['豆腐', 'とうふ'],
  ['味噌', 'みそ'],
  ['醤油', 'しょうゆ'],
  ['鮭', 'さけ'],
  ['鯖', 'さば'],
  ['サーモン', 'さーもん'],
  ['カレー', 'かれー'],
  ['スパゲッティ', 'すぱげってぃ'],
  ['ラーメン', 'らーめん'],
  ['じゃがいも', 'じゃがいも'],
  ['ほうれん草', 'ほうれんそう'],
  ['キャベツ', 'きゃべつ'],
  ['ピーマン', 'ぴーまん'],
  ['大根', 'だいこん'],
  ['にんじん', 'にんじん'],
  ['にんにく', 'にんにく'],
  ['グラタン', 'ぐらたん'],
  ['コロッケ', 'ころっけ'],
  ['リゾット', 'りぞっと'],
  ['アラビアータ', 'あらびあーた'],
  ['カプレーゼ', 'かぷれーぜ'],
  ['ラザニア', 'らざにあ'],
  ['おでん', 'おでん'],
  ['豚の生姜', 'ぶたのしょうが'],
]

const COMPOUND_BY_LENGTH = [...COMPOUND_READINGS].sort(
  (a, b) => b[0].length - a[0].length
)

const CHAR_READINGS: Record<string, string> = {
  肉: 'にく',
  豚: 'ぶた',
  牛: 'ぎゅう',
  鶏: 'とり',
  魚: 'さかな',
  鮭: 'さけ',
  鯖: 'さば',
  鰯: 'いわし',
  鯵: 'あじ',
  鯛: 'たい',
  卵: 'たまご',
  米: 'こめ',
  飯: 'はん',
  麦: 'むぎ',
  酒: 'さけ',
  塩: 'しお',
  油: 'あぶら',
  酢: 'す',
  味: 'あじ',
  汁: 'しる',
  丼: 'どん',
  麺: 'めん',
  焼: 'や',
  煮: 'に',
  蒸: 'む',
  揚: 'あ',
  炒: 'いた',
  切: 'き',
  刺: 'さ',
  身: 'み',
  豆: 'まめ',
  腐: 'ふ',
  野: 'や',
  菜: 'さい',
  根: 'ね',
  葉: 'は',
  海: 'うみ',
  苔: 'たい',
  鰹: 'かつお',
  節: 'ぶし',
  鰤: 'ぶり',
  鮪: 'まぐろ',
  鰻: 'うなぎ',
  鱈: 'たら',
}

function isKanji(ch: string): boolean {
  const code = ch.codePointAt(0)!
  return (
    (code >= 0x4e00 && code <= 0x9fff) ||
    (code >= 0x3400 && code <= 0x4dbf)
  )
}

function isKana(ch: string): boolean {
  const code = ch.codePointAt(0)!
  return (
    (code >= 0x3040 && code <= 0x309f) ||
    (code >= 0x30a0 && code <= 0x30ff)
  )
}

/** 漢字混じり文字列のひらがな読みを推定 */
export function toHiraganaReading(text: string): string {
  let rest = text
  let reading = ''

  while (rest.length > 0) {
    let matched = false
    for (const [word, yomi] of COMPOUND_BY_LENGTH) {
      if (rest.startsWith(word)) {
        reading += yomi
        rest = rest.slice(word.length)
        matched = true
        break
      }
    }
    if (matched) continue

    const ch = rest[0]
    if (isKanji(ch) && CHAR_READINGS[ch]) {
      reading += CHAR_READINGS[ch]
    } else if (isKana(ch)) {
      reading += normalizeJapaneseText(ch)
    } else {
      reading += ch
    }
    rest = rest.slice(1)
  }

  return reading
}

const variantCache = new Map<string, string[]>()
const queryExpandCache = new Map<string, string[]>()

/** 検索用バリアント（表記・読み）を生成 */
export function buildJapaneseSearchVariants(text: string): string[] {
  const cached = variantCache.get(text)
  if (cached) return cached

  const normalized = normalizeJapaneseText(text)
  const reading = normalizeJapaneseText(toHiraganaReading(text))
  const prolonged = normalizeProlongedSound(normalized)
  const readingProlonged = normalizeProlongedSound(reading)

  const variants = new Set<string>()
  for (const v of [normalized, reading, prolonged, readingProlonged]) {
    if (v) variants.add(v)
  }
  const result = [...variants]
  variantCache.set(text, result)
  return result
}

/** 食材検索用グループ（「鶏肉」→「鶏もも肉」など） */
const INGREDIENT_GROUPS: readonly [string, string[]][] = [
  ['鶏肉', ['鶏', 'とり', 'チキン', 'chicken', '鶏もも', '鶏胸', '鶏ひき', '鶏むね', '鶏ささみ', '鶏ガラ', 'ささみ']],
  ['豚肉', ['豚', 'ぶた', 'ポーク', 'pork', '豚ひき', '豚バラ', '豚ロース']],
  ['牛肉', ['牛', 'ぎゅう', 'ビーフ', 'beef', 'ステーキ']],
  ['合い挽き肉', ['合い挽き', 'あいびき', 'ひき肉', 'ミンチ']],
  ['卵', ['たまご', 'egg', 'エッグ']],
  ['豆腐', ['とうふ', 'tofu']],
  ['じゃがいも', ['ジャガイモ', 'ポテト', 'potato']],
  ['玉ねぎ', ['たまねぎ', 'タマネギ', 'オニオン', 'onion']],
  ['にんじん', ['ニンジン', 'キャロット', 'carrot']],
  ['トマト', ['とまと', 'tomato']],
  ['キャベツ', ['きゃべつ', 'cabbage']],
  ['ピーマン', ['ぴーまん', 'paprika']],
  ['なす', ['ナス', 'eggplant']],
  ['大根', ['だいこん', 'radish']],
  ['キムチ', ['きむち', 'kimchi']],
  ['エビ', ['えび', 'shrimp', 'シュリンプ']],
  ['サーモン', ['さけ', '鮭', 'salmon', 'しゃけ']],
  ['鮭', ['さけ', 'サーモン', 'salmon', 'しゃけ']],
  ['サバ', ['さば', '鯖', 'mackerel']],
]

function expandIngredientQuery(query: string): string[] {
  const cached = queryExpandCache.get(query)
  if (cached) return cached

  const baseVariants = buildJapaneseSearchVariants(query)
  const expanded = new Set<string>(baseVariants)

  for (const [canonical, aliases] of INGREDIENT_GROUPS) {
    const groupTerms = [
      ...buildJapaneseSearchVariants(canonical),
      ...aliases.flatMap((alias) => buildJapaneseSearchVariants(alias)),
    ]
    const matchesGroup = baseVariants.some((q) =>
      groupTerms.some((term) => term.includes(q) || q.includes(term))
    )
    if (matchesGroup) {
      for (const term of groupTerms) expanded.add(term)
    }
  }

  const result = [...expanded]
  queryExpandCache.set(query, result)
  return result
}

export { expandIngredientQuery }

/** 食材名同士の部分一致（鶏肉→鶏もも肉 など） */
export function matchesIngredientSearch(ingredient: string, query: string): boolean {
  if (matchesJapaneseSearch(ingredient, query)) return true

  const queryVariants = expandIngredientQuery(query)
  const ingVariants = buildJapaneseSearchVariants(ingredient)

  return queryVariants.some((q) => {
    if (!q) return false
    const qProlonged = normalizeProlongedSound(q)
    return ingVariants.some((ing) => {
      const v = normalizeProlongedSound(ing)
      return v.includes(q) || v.includes(qProlonged)
    })
  })
}

export function matchesIngredientSearchAny(
  query: string,
  ingredients: Array<string | undefined | null>
): boolean {
  return ingredients.some((ing) => ing && matchesIngredientSearch(ing, query))
}

/** 漢字・カタカナ・ひらがなを区別せず部分一致 */
export function matchesJapaneseSearch(haystack: string, needle: string): boolean {
  const q = normalizeJapaneseText(needle.trim())
  if (!q) return true

  const qProlonged = normalizeProlongedSound(q)
  const hayVariants = buildJapaneseSearchVariants(haystack)

  return hayVariants.some((variant) => {
    const v = normalizeProlongedSound(variant)
    return v.includes(q) || v.includes(qProlonged)
  })
}

/** 複数フィールドを横断検索 */
export function matchesJapaneseSearchAny(
  needle: string,
  fields: Array<string | undefined | null>
): boolean {
  return fields.some((field) => field && matchesJapaneseSearch(field, needle))
}
