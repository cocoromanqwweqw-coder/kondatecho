import { useMemo } from 'react'
import type { useAppState } from '../hooks/useAppState'
import { useDisplayMode } from '../hooks/useDisplayMode'
import { DAYS, DISH_ROLE_EMOJI, HEALTH_TAG_SHORT } from '../types'
import { buildDayInsight, formatOtherDays } from '../lib/dayInsights'
import { RecipePhoto } from './RecipePhoto'

type App = ReturnType<typeof useAppState>

interface Props {
  app: App
  dayIndex: number
}

export function DayDetailPanel({ app, dayIndex }: Props) {
  const {
    state,
    fillDayEmpty,
    clearDay,
    favoriteDayRecipes,
    setDayRiceIncluded,
    setSlot,
  } = app
  const { isDesktopLayout } = useDisplayMode()

  const insight = useMemo(() => buildDayInsight(state, dayIndex), [state, dayIndex])
  const n = insight.nutrition

  return (
    <div className="bg-white rounded-xl p-2.5 shadow-sm border border-orange-200/80 space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-1.5">
        <div>
          <h3 className="text-sm font-bold text-gray-800">{DAYS[dayIndex]}曜の詳細</h3>
          <p className="text-[10px] text-gray-500 mt-0.5">
            {insight.filled}/3 品配置
            {insight.genreBias ? ` · ${insight.genreBias}中心` : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-1">
          {insight.emptyRoles.length > 0 && (
            <button
              type="button"
              onClick={() => fillDayEmpty(dayIndex)}
              className="text-[10px] px-2 py-1 rounded-md bg-orange-500 text-orange-950 hover:bg-orange-600 transition"
            >
              空きを埋める
            </button>
          )}
          {insight.filled > 0 && (
            <button
              type="button"
              onClick={() => favoriteDayRecipes(dayIndex)}
              className="text-[10px] px-2 py-1 rounded-md border border-neutral-300 text-neutral-700 hover:bg-neutral-50 transition"
            >
              ⭐ お気に入り
            </button>
          )}
          {insight.filled > 0 && (
            <button
              type="button"
              onClick={() => clearDay(dayIndex)}
              className="text-[10px] px-2 py-1 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 transition"
            >
              クリア
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1">
        {insight.recipes.map(({ role, recipe }) => (
          <div
            key={role}
            className={`min-w-0 rounded-md border px-1 py-1 ${
              recipe ? 'border-orange-100 bg-orange-50/40' : 'border-dashed border-gray-200 bg-gray-50/80'
            }`}
          >
            <p className="text-[9px] font-medium text-gray-500 leading-none">
              {DISH_ROLE_EMOJI[role]} {role}
            </p>
            {recipe ? (
              <div className="mt-0.5 flex items-start gap-1">
                <RecipePhoto
                  recipe={recipe}
                  size="xs"
                  className="!h-7 !w-7 shrink-0 !rounded-md"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-medium text-gray-800 line-clamp-1 leading-tight">
                    {recipe.name}
                  </p>
                  <p className="text-[8px] text-gray-400 line-clamp-1 leading-tight">
                    {recipe.custom ? '手入力' : `${recipe.genre} · ${recipe.cookingTime}分`}
                  </p>
                </div>
              </div>
            ) : (
              <p className="mt-0.5 text-[9px] text-gray-400 leading-tight">未配置</p>
            )}
          </div>
        ))}
      </div>

      {insight.filled > 0 ? (
        <div className="rounded-xl bg-orange-50/60 border border-orange-100 p-3 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <h4 className="text-sm font-bold text-gray-700 shrink-0">栄養・調理の目安</h4>
              {insight.riceAddedToNutrition && (
                <p className="text-[10px] text-amber-700 leading-snug">
                  ※ ご飯1杯（約250kcal）を含めて計算
                </p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <span className="text-[10px] text-gray-500">ご飯</span>
              <button
                type="button"
                onClick={() => setDayRiceIncluded(dayIndex, true)}
                className={`px-2 py-0.5 text-[10px] rounded-full border transition ${
                  insight.riceIncluded
                    ? 'bg-amber-500 text-white border-amber-500'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-amber-300'
                }`}
              >
                あり
              </button>
              <button
                type="button"
                onClick={() => setDayRiceIncluded(dayIndex, false)}
                className={`px-2 py-0.5 text-[10px] rounded-full border transition ${
                  !insight.riceIncluded
                    ? 'bg-gray-500 text-white border-gray-500'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                }`}
              >
                なし
              </button>
            </div>
          </div>
          <div
            className={`grid gap-2 ${
              isDesktopLayout ? 'grid-cols-4' : 'grid-cols-2'
            }`}
          >
            <Stat label="カロリー" value={`${n.calories}`} unit="kcal" />
            <Stat label="塩分" value={`${n.saltG}`} unit="g" />
            <Stat label="糖質" value={`${n.sugarG}`} unit="g" />
            <Stat label="調理時間" value={`${insight.totalMinutes}`} unit="分" />
          </div>
          <div className="space-y-1">
            <p className="text-[11px] text-gray-500">
              PFC P{insight.pfc.proteinPct}% / F{insight.pfc.fatPct}% / C{insight.pfc.carbsPct}%
              （たんぱく{n.proteinG}g · 脂質{n.fatG}g · 炭水化物{n.carbsG}g）
            </p>
            <div className="flex h-2 overflow-hidden rounded-full bg-neutral-100">
              <div className="bg-orange-500" style={{ width: `${insight.pfc.proteinPct}%` }} />
              <div className="bg-neutral-500" style={{ width: `${insight.pfc.fatPct}%` }} />
              <div className="bg-neutral-300" style={{ width: `${insight.pfc.carbsPct}%` }} />
            </div>
          </div>
          {insight.missingNutrients.length > 0 ? (
            <p className="text-xs text-red-600">
              不足しがち: {insight.missingNutrients.join(' · ')}
            </p>
          ) : (
            <p className="text-xs text-neutral-600">主要栄養の偏りは少なめです</p>
          )}
          {insight.healthTags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {insight.healthTags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] px-1.5 py-0.5 rounded-full bg-neutral-100 text-neutral-700 border border-neutral-200"
                >
                  {HEALTH_TAG_SHORT[tag]}
                </span>
              ))}
            </div>
          )}
          <p className="text-xs text-gray-600">{insight.parallelHint}</p>
          {insight.prepTips.length > 0 && (
            <ul className="text-xs text-gray-500 space-y-0.5 list-disc list-inside">
              {insight.prepTips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <p className="text-sm text-gray-400 text-center py-4">
          レシピを配置すると栄養の目安が表示されます
        </p>
      )}

      {insight.missingIngredients.length > 0 && (
        <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-3">
          <h4 className="text-sm font-bold text-gray-700 mb-1">買い足し候補</h4>
          <p className="text-xs text-gray-600">{insight.missingIngredients.join(' · ')}</p>
        </div>
      )}

      {insight.wantToUseHits.length > 0 && (
        <div className="rounded-xl border border-orange-100 bg-orange-50 p-3 space-y-1">
          <h4 className="text-sm font-bold text-gray-700">🎯 使いたい食材が入っています</h4>
          {insight.wantToUseHits.map((hit) => (
            <p key={hit.name} className="text-xs text-gray-600">
              {hit.name} → {hit.inRecipes.join('、')}
            </p>
          ))}
        </div>
      )}

      {insight.duplicateRecipes.length > 0 && (
        <div className="rounded-xl border border-orange-100 bg-orange-50 p-3 space-y-1">
          <h4 className="text-sm font-bold text-gray-700">他の日と重複</h4>
          {insight.duplicateRecipes.map((dup) => (
            <p key={dup.recipeId} className="text-xs text-gray-600">
              {dup.name}（{formatOtherDays(dup.otherDays)}）
            </p>
          ))}
        </div>
      )}

      {insight.suggestFill.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-bold text-gray-700">おすすめで埋める</h4>
          <div className="flex flex-wrap gap-2">
            {insight.suggestFill.map(({ role, recipe }) => (
              <button
                key={role}
                type="button"
                onClick={() => setSlot(dayIndex, '夜', role, recipe.id)}
                className="text-xs px-3 py-2 rounded-xl border border-orange-200 bg-white hover:bg-orange-50 transition text-left"
              >
                <span className="font-medium text-gray-800">
                  {DISH_ROLE_EMOJI[role]} {recipe.name}
                </span>
                <span className="block text-gray-500 mt-0.5">
                  {recipe.genre} · ⏱ {recipe.cookingTime}分
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {insight.links.length > 0 && (
        <div className="space-y-1.5">
          <h4 className="text-sm font-bold text-gray-700">レシピリンク</h4>
          <div className="flex flex-wrap gap-1.5">
            {insight.links.map((link) => (
              <a
                key={`${link.recipeName}-${link.label}`}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-orange-700 bg-white border border-orange-200 rounded-lg hover:bg-orange-50 transition"
              >
                🔗 {link.recipeName}（{link.label}）
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function Stat({
  label,
  value,
  unit,
}: {
  label: string
  value: string
  unit?: string
}) {
  return (
    <div className="rounded-lg bg-white px-2 py-1.5 text-center">
      <p className="text-[10px] text-gray-500">{label}</p>
      <p className="text-sm font-bold text-gray-800 tabular-nums">
        {value}
        {unit ? <span className="text-[10px] font-normal text-gray-500 ml-0.5">{unit}</span> : null}
      </p>
    </div>
  )
}
