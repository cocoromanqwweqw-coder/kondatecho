import { useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import type { useAppState } from '../hooks/useAppState'
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'
import { DAYS } from '../types'
import { getWeekNutritionSummary } from '../lib/dayInsights'
import { formatDate, getWeekDates } from '../lib/storage'

type App = ReturnType<typeof useAppState>

interface Props {
  app: App
  onClose: () => void
}

export function WeekNutritionSheet({ app, onClose }: Props) {
  useBodyScrollLock()
  const summary = useMemo(
    () => getWeekNutritionSummary(app.state),
    [app.state]
  )
  const weekDates = getWeekDates(app.state.weekStartDate)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return createPortal(
    <div
      className="fixed inset-0 z-[55] flex flex-col items-start justify-start sm:items-center sm:justify-center sm:p-4"
      role="presentation"
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="week-nutrition-title"
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 flex h-[100lvh] max-h-[100lvh] w-full max-w-md flex-col overflow-hidden bg-white shadow-2xl sm:h-auto sm:max-h-[92vh] sm:rounded-2xl"
      >
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-orange-100 px-3 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <div className="min-w-0">
            <h2 id="week-nutrition-title" className="text-base font-bold text-gray-800">
              今週の栄養
            </h2>
            <p className="text-[11px] text-gray-500">
              {formatDate(weekDates[0])} 〜 {formatDate(weekDates[6])}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xl text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            ×
          </button>
        </div>
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {summary.plannedDays === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">
              献立を入れると、足りない栄養が出ます
            </p>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2">
                <Stat label="入っている日" value={`${summary.plannedDays}/7`} />
                <Stat label="品数" value={`${summary.filledSlots}/21`} />
                <Stat
                  label="不足が少ない日"
                  value={`${summary.balancedDays.length}`}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Stat
                  label="1日のカロリー目安"
                  value={summary.avgCalories != null ? `${summary.avgCalories}` : '—'}
                  unit="kcal"
                />
                <Stat
                  label="たんぱく質の目安"
                  value={summary.avgProteinG != null ? `${summary.avgProteinG}` : '—'}
                  unit="g"
                />
              </div>

              <section className="rounded-xl border border-orange-100 bg-orange-50/40 p-3">
                <h3 className="text-sm font-bold text-gray-800">足りないもの</h3>
                {summary.gaps.length === 0 ? (
                  <p className="mt-2 text-xs text-gray-600">主な不足は見当たりません</p>
                ) : (
                  <ul className="mt-2 space-y-2.5">
                    {summary.gaps.map((gap) => {
                      const width = Math.round((gap.days.length / summary.plannedDays) * 100)
                      return (
                        <li key={gap.label}>
                          <div className="flex items-baseline justify-between gap-2 text-sm text-gray-800">
                            <span>
                              <span aria-hidden>{gap.emoji}</span> {gap.label}
                            </span>
                            <span className="shrink-0 text-xs text-gray-500">
                              {gap.days.length}/{summary.plannedDays}日
                            </span>
                          </div>
                          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white">
                            <div className="h-full bg-orange-500" style={{ width: `${width}%` }} />
                          </div>
                          <p className="mt-0.5 text-[11px] text-gray-500">
                            {gap.days.map((day) => DAYS[day]).join('・')}
                          </p>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

function Stat({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 px-2.5 py-2">
      <p className="text-[10px] text-gray-500">{label}</p>
      <p className="mt-0.5 text-base font-bold leading-none text-gray-800">
        {value}
        {unit && <span className="ml-0.5 text-[10px] font-normal text-gray-500">{unit}</span>}
      </p>
    </div>
  )
}
